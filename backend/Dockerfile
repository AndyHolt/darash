# syntax=docker/dockerfile:1.7

FROM golang:1.26-alpine AS builder

RUN apk add --no-cache curl
RUN curl -sSfo /rds-ca.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /out/backend \
    ./

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /rds-ca.pem /etc/ssl/certs/rds-ca.pem
COPY --from=builder /out/backend /backend

# data.sqlite is built into the backend/ context by the deploy workflow's ingest
# step. This ENV is the single source of truth for where the file lives: the
# binary reads DATA_DB_PATH rather than compiling the location in.
#
# permissions (chmod) must be set explicitly to 0444 to allow non-root runtime
# user to read sqlite file which is created with mode 0600 by ingest.
COPY --chmod=0444 data.sqlite /data.sqlite
ENV DATA_DB_PATH=/data.sqlite

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/backend"]
