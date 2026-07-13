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

# AWS Lambda Web Adapter, loaded as a Lambda extension. On Lambda it proxies
# invoke events to the app's HTTP port (PORT, default 8080) so the net/http mux
# runs unchanged. Outside Lambda — e.g. on ECS — /opt/extensions is only read by
# the Lambda runtime, so the adapter never runs and the container is unaffected.
# One image thus serves both. Stay on x86_64 while ECS still runs it; the arm64
# flip comes after ECS is gone.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Point the adapter's readiness probe at the real 200 route (default is /,
# which the app does not serve).
ENV AWS_LWA_READINESS_CHECK_PATH=/health

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
