FROM node:22-alpine AS web
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ ./cmd/
COPY internal/ ./internal/
RUN CGO_ENABLED=0 go build -trimpath -o /out/api ./cmd/api

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/api /app/api
COPY --from=web /src/web/dist /app/web/dist
RUN addgroup -S -g 10001 trama && adduser -S -D -H -u 10001 -G trama trama && \
    mkdir -p /var/lib/trama && chown trama:trama /var/lib/trama
ENV DATABASE_PATH=/var/lib/trama/trama.db PORT=8080
USER trama
EXPOSE 8080
CMD ["/app/api"]
