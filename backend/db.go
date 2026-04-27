package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"
	"strconv"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/rds/auth"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const rdsCACertPath = "/etc/ssl/certs/rds-ca.pem"

type ConnectionConfig struct {
	Host     string
	Port     string
	Database string
	User     string
	Password string
	SSLMode  string
	IAMAuth  bool
	Region   string
}

func (c ConnectionConfig) Config(ctx context.Context) (*pgxpool.Config, error) {
	config, err := pgxpool.ParseConfig("")
	if err != nil {
		return nil, fmt.Errorf("parse pool config: %w", err)
	}

	port, err := strconv.Atoi(c.Port)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	config.ConnConfig.Host = c.Host
	config.ConnConfig.Port = uint16(port)
	config.ConnConfig.Database = c.Database
	config.ConnConfig.User = c.User

	switch c.SSLMode {
	case "require":
		config.ConnConfig.TLSConfig = &tls.Config{
			InsecureSkipVerify: true,
		}
	case "verify-full":
		caCert, err := os.ReadFile(rdsCACertPath)
		if err != nil {
			return nil, fmt.Errorf("read RDS CA bundle: %w", err)
		}
		caPool := x509.NewCertPool()
		caPool.AppendCertsFromPEM(caCert)
		config.ConnConfig.TLSConfig = &tls.Config{
			ServerName: c.Host,
			RootCAs:    caPool,
		}
	}

	if c.IAMAuth {
		awsCfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(c.Region))
		if err != nil {
			return nil, fmt.Errorf("load AWS config: %w", err)
		}
		// pgx invokes BeforeConnect for every new connection in the pool, so
		// each connection authenticates with a freshly-minted 15-minute token.
		config.BeforeConnect = func(ctx context.Context, cc *pgx.ConnConfig) error {
			endpoint := fmt.Sprintf("%s:%d", cc.Host, cc.Port)
			token, err := auth.BuildAuthToken(ctx, endpoint, c.Region, cc.User, awsCfg.Credentials)
			if err != nil {
				return fmt.Errorf("build RDS auth token: %w", err)
			}
			cc.Password = token
			return nil
		}
	} else {
		config.ConnConfig.Password = c.Password
	}

	return config, nil
}

type PgStore struct {
	db *pgxpool.Pool
}

func NewPgStore(ctx context.Context, cfg ConnectionConfig) (*PgStore, error) {
	config, err := cfg.Config(ctx)
	if err != nil {
		return nil, fmt.Errorf("connection config: %w", err)
	}

	dbpool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := dbpool.Ping(ctx); err != nil {
		dbpool.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return &PgStore{db: dbpool}, nil
}

func (p *PgStore) Close() {
	p.db.Close()
}
