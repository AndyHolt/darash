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

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/backend"]
