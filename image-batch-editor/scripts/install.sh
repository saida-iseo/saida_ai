#!/bin/bash

# Image Batch Editor - Quick Install Script

echo "🖼️  Image Batch Editor - Installation Script"
echo "=============================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first."
    echo "   Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "✅ Rust found: $(rustc --version)"

# Check pnpm (optional)
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm found: $(pnpm --version)"
    PKG_MANAGER="pnpm"
else
    echo "⚠️  pnpm not found, using npm instead"
    PKG_MANAGER="npm"
fi

echo ""
echo "📥 Installing dependencies..."
echo ""

# Install dependencies
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm install
else
    npm install
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Run: $PKG_MANAGER tauri:dev     (Development mode)"
    echo "   2. Run: $PKG_MANAGER tauri:build   (Build for production)"
    echo ""
    echo "📖 For more info, see README.md and SETUP.md"
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
