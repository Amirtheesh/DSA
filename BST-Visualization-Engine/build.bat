@echo off
REM build.bat - Windows Emscripten WASM Build Script
REM
REM Compiles the C BST engine to WebAssembly using Emscripten.
REM
REM PREREQUISITES:
REM   1. Install Emscripten SDK:
REM      git clone https://github.com/emscripten-core/emsdk.git
REM      cd emsdk
REM      emsdk install latest
REM      emsdk activate latest
REM      emsdk_env.bat
REM
REM   2. Verify installation:
REM      emcc --version
REM
REM USAGE (PowerShell):
REM   .\build.bat
REM
REM OUTPUT:
REM   wasm\bst.js   — Emscripten glue code + WASM loader
REM   wasm\bst.wasm — Compiled C BST engine

echo === BST WebAssembly Build Script (Windows) ===
echo.

REM Check if emcc exists
where emcc >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: emcc not found.
    echo.
    echo To install Emscripten on Windows:
    echo   git clone https://github.com/emscripten-core/emsdk.git
    echo   cd emsdk
    echo   emsdk install latest
    echo   emsdk activate latest
    echo   emsdk_env.bat
    echo.
    echo The application will run with the JavaScript fallback engine
    echo until WASM is compiled.
    echo.
    echo CURRENT STATUS: App is fully functional with JS fallback.
    echo Open frontend\index.html in your browser to use it now.
    pause
    exit /b 1
)

emcc --version

echo.
echo Compiling C BST Engine to WebAssembly...
echo.

if not exist wasm mkdir wasm
if not exist build mkdir build

emcc ^
    c-core\bst.c ^
    c-core\traversal.c ^
    c-core\analysis.c ^
    c-core\api.c ^
    -o wasm\bst.js ^
    -s WASM=1 ^
    -s EXPORTED_FUNCTIONS="['_api_init','_api_reset','_api_insert','_api_search','_api_delete','_api_inorder','_api_preorder','_api_postorder','_api_get_tree','_api_analyze','_api_validate','_api_undo','_api_get_height','_api_get_node_count','_api_get_leaf_count','_api_get_min','_api_get_max']" ^
    -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall','UTF8ToString']" ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -s MODULARIZE=0 ^
    -s ENVIRONMENT=web ^
    -O2 ^
    -Wall ^
    --no-entry

if %errorlevel% equ 0 (
    echo.
    echo === Build Complete! ===
    echo.
    echo Output files:
    echo   wasm\bst.js   ^(Emscripten glue + loader^)
    echo   wasm\bst.wasm ^(Compiled C engine^)
    echo.
    echo To run the application:
    echo   npx serve .   or   python -m http.server 8080
    echo   Then open: http://localhost:8080/frontend/
) else (
    echo.
    echo === Build Failed ===
    echo Check error messages above.
)

pause
