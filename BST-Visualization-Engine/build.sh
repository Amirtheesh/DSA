#!/bin/bash
# build.sh - Emscripten WASM Build Script
#
# Compiles the C BST engine to WebAssembly using Emscripten.
#
# PREREQUISITES:
#   1. Install Emscripten SDK:
#      git clone https://github.com/emscripten-core/emsdk.git
#      cd emsdk
#      ./emsdk install latest
#      ./emsdk activate latest
#      source ./emsdk_env.sh
#
#   2. Verify installation:
#      emcc --version
#
# USAGE:
#   chmod +x build.sh
#   ./build.sh
#
# OUTPUT:
#   wasm/bst.js   — Emscripten glue code + WASM loader
#   wasm/bst.wasm — Compiled C BST engine
#
# After running this script, open frontend/index.html in a browser
# (served via HTTP, not file://) to use the WASM-powered version.
# Use: npx serve . (or python -m http.server 8080)

set -e  # Exit on error

echo "=== BST WebAssembly Build Script ==="
echo ""

# Check Emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "ERROR: emcc not found."
    echo ""
    echo "To install Emscripten:"
    echo "  git clone https://github.com/emscripten-core/emsdk.git"
    echo "  cd emsdk"
    echo "  ./emsdk install latest"
    echo "  ./emsdk activate latest"
    echo "  source ./emsdk_env.sh"
    echo ""
    echo "The application will run with the JavaScript fallback engine"
    echo "until WASM is compiled."
    exit 1
fi

echo "Emscripten version: $(emcc --version | head -1)"
echo ""

# Create output directory
mkdir -p wasm
mkdir -p build

echo "Compiling C BST Engine to WebAssembly..."
echo ""

emcc \
    c-core/bst.c \
    c-core/traversal.c \
    c-core/analysis.c \
    c-core/api.c \
    -o wasm/bst.js \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="[
        '_api_init',
        '_api_reset',
        '_api_insert',
        '_api_search',
        '_api_delete',
        '_api_inorder',
        '_api_preorder',
        '_api_postorder',
        '_api_get_tree',
        '_api_analyze',
        '_api_validate',
        '_api_undo',
        '_api_get_height',
        '_api_get_node_count',
        '_api_get_leaf_count',
        '_api_get_min',
        '_api_get_max'
    ]" \
    -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall','UTF8ToString']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=0 \
    -s ENVIRONMENT='web' \
    -O2 \
    -Wall \
    --no-entry

echo ""
echo "=== Build Complete! ==="
echo ""
echo "Output files:"
echo "  wasm/bst.js   ($(du -sh wasm/bst.js | cut -f1) — Emscripten glue + loader)"
echo "  wasm/bst.wasm ($(du -sh wasm/bst.wasm | cut -f1) — Compiled C engine)"
echo ""
echo "To run the application:"
echo "  Method 1 (Node.js): npx serve ."
echo "  Method 2 (Python):  python -m http.server 8080"
echo "  Then open: http://localhost:8080/frontend/"
echo ""
echo "Note: The app also works with the JS fallback engine (no WASM required)."
echo "      Simply open frontend/index.html directly in your browser."
