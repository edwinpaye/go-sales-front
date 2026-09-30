.PHONY: run build test

run:
	STATIC_DIR=./public STATIC_PATH=/statics ENV=dev go run ./cmd/server

build:
	CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/server ./cmd/server

test:
	go test ./...