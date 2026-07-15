# syntax=docker/dockerfile:1.7

# Pin the builder to the native build platform and cross-compile to the target
# arch (TARGETOS/TARGETARCH, supplied by buildx). CGO_ENABLED=0 makes the Go
# build a pure cross-compile, so the arm64 image is produced without emulating
# the builder under QEMU — only the runtime stage below is the target arch, and
# it does COPY-only work, which needs no emulation.
FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG TARGETOS TARGETARCH
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags="-s -w" \
    -o /out/backend \
    ./

# Root (not the :nonroot variant). AWS Lambda rejects distroless :nonroot with
# Runtime.InvalidEntrypoint ("fork/exec /backend: permission denied") even though
# the identical image runs fine as nonroot on ECS. Lambda isolates each function
# in its own microVM, so running as root in-container is standard there.
FROM gcr.io/distroless/static-debian12

# AWS Lambda Web Adapter, loaded as a Lambda extension. It proxies invoke events
# to the app's HTTP port (PORT, default 8080) so the net/http mux runs unchanged.
# The adapter image is multi-arch, so buildx pulls the arm64 variant to match the
# target platform.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Point the adapter's readiness probe at the real 200 route (default is /,
# which the app does not serve).
ENV AWS_LWA_READINESS_CHECK_PATH=/health

COPY --chmod=0555 --from=builder /out/backend /backend

# data.sqlite is built into the backend/ context by the deploy workflow's ingest
# step. This ENV is the single source of truth for where the file lives: the
# binary reads DATA_DB_PATH rather than compiling the location in.
#
# ingest writes data.sqlite 0600; the explicit 0444 keeps it world-readable
# regardless of the runtime user (harmless now the image runs as root).
COPY --chmod=0444 data.sqlite /data.sqlite
ENV DATA_DB_PATH=/data.sqlite

EXPOSE 8080

ENTRYPOINT ["/backend"]
