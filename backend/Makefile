.PHONY: all build build-release run test clean

all: build-release

build:
	cargo build

build-release:
	@echo "Compiling DaneshMate backend in release mode..."
	cargo build --release

run:
	cargo run

run-release:
	cargo run --release

test:
	cargo test

clean:
	cargo clean
