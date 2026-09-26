#!/usr/bin/env bash
set -e

# DaneshMate Rust Axum Backend - Production Release Build Script
echo "========================================="
echo " Building DaneshMate Rust Axum (--release)"
echo "========================================="

# 1. Check for Cargo availability
if ! command -v cargo &> /dev/null; then
    echo "Error: cargo is not installed or not in PATH."
    echo "Install Rust via https://rustup.rs"
    exit 1
fi

# 2. Compile release binary with Link-Time Optimization (LTO)
echo "Compiling optimized binary with LTO & symbol stripping..."
RUSTFLAGS="-C target-cpu=native" cargo build --release

# 3. Output location & binary status
BIN_PATH="target/release/daneshmate-backend"
if [ -f "$BIN_PATH" ]; then
    echo "Build succeeded!"
    echo "Release binary generated at: $BIN_PATH"
    ls -lh "$BIN_PATH"
else
    echo "Warning: Binary not found at $BIN_PATH"
fi
