# Architecture Documentation
# Binary Search Tree Analysis & Visualization Engine

## Overview

This document describes the complete technical architecture of the BST Visualization Engine,
covering each layer from C source code to SVG rendering.

---

## Layer 1: C DSA Core

### Purpose
Implement all BST algorithms using actual C data structures, pointers, and recursion.
This is the authoritative source of truth for every algorithm.

### Files

#### `bst.h` — Core Header
Defines the fundamental `Node` struct:
```c
typedef struct Node {
    int data;
    struct Node *left;
    struct Node *right;
} Node;
```

Defines `OperationResult` for step recording:
```c
typedef struct OperationResult {
    int success;
    int steps_count;
    int path_count;
    int comparisons;
    int path[BST_MAX_PATH];
    OperationStep steps[MAX_STEPS];
    char summary[512];
    char deletion_case[128];
} OperationResult;
```

Defines step type constants (STEP_COMPARE, STEP_MOVE_LEFT, STEP_FOUND, etc.)

#### `bst.c` — BST Operations
- `createNode(data)` — malloc + initialize
- `insert(root, data, result)` — recursive, records each comparison
- `search(root, data, result)` — recursive, records path
- `deleteNode(root, data, result)` — recursive, handles all 3 cases
- `findMin(root)` — iterative leftmost traversal
- `freeTree(root)` — postorder recursive free
- `copyTree(root)` — deep copy for undo

#### `traversal.c` — Tree Traversals
- `inorder(root, result)` — L→Root→R, produces sorted output
- `preorder(root, result)` — Root→L→R
- `postorder(root, result)` — L→R→Root

Each traversal fills a `TraversalResult` with:
- `sequence[]` — node values in visit order
- `steps[]` — one STEP_VISIT per node for animation

#### `analysis.c` — Tree Property Analysis
- `getHeight(root)` — recursive: 1 + max(leftH, rightH)
- `getNodeCount(root)` — recursive count
- `getLeafCount(root)` — count nodes with no children
- `validateBST(root)` — min/max bounds approach (correct)
- `isBalanced(root)` — checks EVERY node (AVL condition)
- `isPerfect(root)` — node count == 2^(h+1)-1
- `isComplete(root)` — index-based check
- `isFull(root)` — every node has 0 or 2 children
- `isLeftSkewed/isRightSkewed` — all nodes have one side only
- `analyzeTree(root, result)` — master function, fills TreeAnalysis

#### `api.c` — Emscripten Export Layer
- Global state: `static Node *bst_root`
- JSON serialization: `serializeNode()`, `serializeResult()`, `serializeTraversal()`, `serializeAnalysis()`
- Exported functions: `api_insert()`, `api_search()`, `api_delete()`, etc.
- Undo support: saves copy to `undo_root` before mutations
- Standalone test: `main()` function for GCC testing

---

## Layer 2: Emscripten Compilation

### Command
```bash
emcc c-core/bst.c c-core/traversal.c c-core/analysis.c c-core/api.c \
    -o wasm/bst.js \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="['_api_insert', '_api_search', ...]" \
    -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall','UTF8ToString']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -O2 \
    --no-entry
```

### What Emscripten Does
1. Compiles C to LLVM IR
2. Links with Emscripten's C standard library (musl)
3. Optimizes IR with LLVM O2 passes
4. Translates LLVM IR to WebAssembly binary (.wasm)
5. Generates JavaScript glue code (.js) that:
   - Loads the .wasm file asynchronously
   - Sets up WebAssembly memory (managed ArrayBuffer)
   - Provides cwrap() / ccall() helpers for calling WASM from JS

### Memory Model
- C heap memory is managed inside a WebAssembly linear memory (ArrayBuffer)
- `malloc/free` in C translate to WASM memory management
- No C pointers are ever exposed to JavaScript
- String data crosses the boundary via UTF-8 encoded shared buffer

---

## Layer 3: WebAssembly Module

### Files
- `wasm/bst.wasm` — Compiled binary (typically 30-60 KB)
- `wasm/bst.js` — Emscripten loader (asynchronously fetches .wasm)

### Loading
```javascript
// Emscripten generates Module object
// When WASM is loaded, Module.asm contains the compiled functions
Module.onRuntimeInitialized = function() {
    // All exported C functions now available
    const api_insert = Module.cwrap('api_insert', 'string', ['number']);
};
```

### Data Transfer: C → JS
```
C function returns: const char* (pointer to output_buffer)
Emscripten does:    UTF8ToString(ptr) → JavaScript string
JavaScript does:    JSON.parse(string) → JavaScript object
```

---

## Layer 4: JavaScript Bridge (bst-engine.js)

### Dual-Mode Architecture
```javascript
class BSTEngine {
    async init() {
        if (typeof Module !== 'undefined' && Module.cwrap) {
            await this._initWASM();  // Use C/WASM
        } else {
            this.mode = 'JS_FALLBACK';  // Use JS mirror
        }
    }
}
```

### WASM Mode (Production)
```javascript
insert(value) {
    const raw = this._wasm_insert(value);  // Call C via WASM
    return JSON.parse(raw);                 // Parse JSON from C
}
```

### JS Fallback Mode (Development)
```javascript
class JSBSTEngine {
    // Implements the same recursive algorithms as C
    // Returns the same JSON format
    // Same step-recording logic
    // Used when emcc has not been run yet
}
```

### JSON Protocol
Every operation returns:
```json
{
    "success": 1,
    "comparisons": 3,
    "summary": "45 inserted successfully.",
    "deletionCase": "",
    "path": [50, 30, 40],
    "steps": [
        { "type": 1, "nodeValue": 50, "targetValue": 45, "message": "Compare 45 with 50..." },
        { "type": 2, "nodeValue": 50, "targetValue": 45, "message": "45 < 50 → Moving left" },
        ...
    ],
    "tree": { "value": 50, "left": {...}, "right": {...} }
}
```

---

## Layer 5: Animation Engine (animation.js)

### Step Processing
```javascript
_processStep(step, index) {
    switch (step.type) {
        case STEP.COMPARE:    highlightNode(v, 'comparing', pulse=true); break;
        case STEP.FOUND:      highlightNode(v, 'found', pulse=true);     break;
        case STEP.INSERT:     highlightNode(v, 'inserted', pulse=true);  break;
        case STEP.SELECT_SUCC:highlightNode(v, 'successor', pulse=true); break;
        // ... etc
    }
    stepsPanel.highlightStep(index);
}
```

### Playback
- `playSteps(steps, onComplete)` — sequential with configurable delay
- `pause()` / `resume()` — interrupts setTimeout chain
- `stepForward()` / `stepBackward()` — manual control
- `animateTraversal()` — traversal-specific with visit callback

### Speed Control
- Slow: 1200ms per step
- Normal: 650ms per step
- Fast: 280ms per step
- Instant: 50ms per step (effectively synchronous)

---

## Layer 6: SVG Visualizer (visualizer.js)

### Node Position Algorithm
Uses a Reingold-Tilford-inspired approach:
1. Assign inorder position index (0..n-1) to each node
2. Map index to SVG x-coordinate: `x = padding + index * unitWidth`
3. Map depth to SVG y-coordinate: `y = startY + depth * levelHeight`
4. Apply minimum spacing enforcement per level

### Visual States
| State | Fill | Stroke | Use |
|-------|------|--------|-----|
| normal | navy | blue | Default |
| comparing | dark-amber | yellow | Currently comparing |
| path | dark-red-orange | orange | On search/insert path |
| found | dark-green | green | Value found |
| inserted | dark-teal | cyan | Newly inserted |
| deleted | dark-red | red | Being deleted |
| successor | dark-purple | purple | Inorder successor |
| replaced | dark-pink | magenta | Value replaced |
| visited | dark-teal | teal | Traversal visit |
| active | navy | white | Special highlight |

### SVG Structure
```svg
<g class="edges">
    <line class="bst-edge" x1="..." y1="..." x2="..." y2="..." />
    ...
</g>
<g class="nodes">
    <g class="bst-node bst-node-50" data-value="50" transform="translate(400,60)">
        <circle r="30" fill="..." stroke="..." />
        <text ...>50</text>
    </g>
    ...
</g>
```

---

## Layer 7: Application Controller (app.js)

### Responsibilities
- Navigation between sections
- Input parsing (matrix/array format with error handling)
- Operation dispatch to BSTEngine
- Post-operation tree re-render
- Steps panel building
- Tree info panel updates
- Complexity panel display
- Undo/Reset handling

### Event Flow (Example: Insert)
```
User clicks "Insert" →
    _onInsert() →
        engine.insert(value) →
            C/WASM runs insert() with step recording →
            Returns { success, steps[], tree{} } →
        visualizer.renderTree(result.tree) →
        ui.buildStepsPanel(result.steps) →
        animation.playSteps(result.steps) →
            For each step: highlightNode() →
                SVG node color changes
```

---

## Design Decisions

### Why Emscripten?
Emscripten is the standard, mature toolchain for C → WebAssembly. It handles:
- C standard library (malloc, free, string functions)
- JavaScript/WASM boundary helpers (cwrap, ccall)
- Memory management between C heap and JS ArrayBuffer

### Why JSON for data transfer?
- Simple, readable, debuggable
- No unsafe pointer access from JavaScript
- Easily extensible if more data needs to be transferred
- Self-documenting format

### Why separate Visualizer and Animation Engine?
The BST algorithm and its visual representation are different concerns:
- The C engine knows nothing about SVG
- The Visualizer knows nothing about BST algorithms
- The Animation Engine bridges them by processing steps
- This allows the C engine to be tested independently (standalone binary)
- The visualizer can be replaced with a different renderer without touching algorithms

### Why BST_MAX_PATH instead of MAX_PATH?
`MAX_PATH` is defined in Windows SDK's `stdlib.h` as 260. Renaming to `BST_MAX_PATH` avoids the conflict without needing platform-specific guards.

### Why one level of undo?
A full undo history requires storing copies of the tree after every operation. Since trees can be large and undo of undo is rarely needed in educational context, one level (undo last insert or delete) is sufficient and simpler.
