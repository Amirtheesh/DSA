# Binary Search Tree Analysis & Visualization Engine

> **An interactive educational laboratory powered by a C DSA core compiled to WebAssembly.**

---

## 🎯 Problem Statement

Binary Search Trees are a fundamental data structure taught in every computer science DSA course. However, most learning resources are either:
- **Too abstract** — textbook diagrams without interactivity
- **Too simplified** — JavaScript toy implementations that skip real memory and pointer concepts
- **Too disconnected** — Algorithm theory separate from visual demonstration

This project solves the problem by:
1. Implementing the **actual BST algorithms in C** with real pointers, dynamic memory, and recursion
2. **Compiling C to WebAssembly** so the same C code runs in the browser at near-native speed
3. Providing a **step-by-step animated visualization** of every algorithm operation

---

## 🏆 Objective

Build an interactive educational BST application where a student can:

1. Enter matrix/array values and create a BST
2. Visually see the BST rendered as an SVG tree
3. Search for a value and see the search path highlighted step-by-step
4. Insert a new value and see where it gets placed
5. Delete a value with visual explanation of the deletion case
6. Animate inorder, preorder, and postorder traversals
7. Analyze the tree: height, node counts, balance, classification
8. Validate whether the structure is a valid BST
9. View time/space complexity with explanation
10. Undo the previous operation / Reset the tree

---

## ✨ Features

### Core BST Operations (C Engine)
- BST creation from array/matrix input
- Insertion with step-by-step path recording
- Search with path highlighting
- Deletion (all 3 cases: leaf, one child, two children with inorder successor)
- Inorder, preorder, postorder traversal with animation steps

### Tree Analysis (C Engine)
- Height, total nodes, leaf nodes, internal nodes
- Min/max value, level count, edge count
- BST validation (min/max bounds algorithm)
- Balance detection (AVL-style, checks every node)
- Tree classification: Perfect, Complete, Full, Left-Skewed, Right-Skewed

### Visualization
- Dynamic SVG tree rendering (no static images)
- Reingold-Tilford-inspired layout algorithm
- 10 visual states: normal, comparing, path, found, inserted, deleted, successor, replaced, visited, active
- Smooth CSS transitions and entrance animations
- Traversal sequence display with animated node progression

### UI/UX
- Left sidebar navigation
- Operation Steps panel with sequential step highlighting
- Tree Properties panel (live updates)
- Complexity panel for each operation
- Undo last operation / Reset tree
- Quick example loaders

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| DSA Core | **C** (bst.c, traversal.c, analysis.c, api.c) |
| Compilation | **Emscripten** (C → WebAssembly) |
| Runtime | **WebAssembly** (.wasm) |
| JS Bridge | **Vanilla JavaScript** (BSTEngine class) |
| Visualization | **SVG** (dynamically generated) |
| Animation | **JavaScript AnimationEngine** |
| Styling | **Vanilla CSS3** with custom properties |
| Fonts | **Inter** + **JetBrains Mono** (Google Fonts) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    C DSA CORE                               │
│  bst.c         - Node creation, insert, search, delete      │
│  traversal.c   - Inorder, preorder, postorder               │
│  analysis.c    - Height, count, validation, classification  │
│  api.c         - Emscripten-exported interface              │
└───────────────────────────┬─────────────────────────────────┘
                            │ emcc compiler
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  WEBASSEMBLY MODULE                         │
│  wasm/bst.wasm  - Compiled C engine (binary)               │
│  wasm/bst.js    - Emscripten loader + glue code            │
└───────────────────────────┬─────────────────────────────────┘
                            │ cwrap() / ccall()
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               JavaScript Bridge (bst-engine.js)            │
│  BSTEngine class - routes calls to WASM or JS fallback     │
│  JSBSTEngine   - exact JS mirror of C algorithms           │
│                  (used when WASM not yet compiled)          │
└───────────────────────────┬─────────────────────────────────┘
                            │ JSON results with steps[]
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Animation Engine (animation.js)              │
│  Processes operation steps sequentially                    │
│  Each step → BSTVisualizer.highlightNode()                 │
│  Controls: Play, Pause, Stop, Step Forward/Back            │
└───────────────────────────┬─────────────────────────────────┘
                            │ highlightNode(value, state)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               SVG Visualizer (visualizer.js)               │
│  renderTree()     - Full tree re-render                    │
│  drawNode()       - Circle + value text                    │
│  drawEdge()       - Parent-child connection line           │
│  highlightNode()  - Apply visual state color               │
│  calculatePositions() - Reingold-Tilford layout            │
└───────────────────────────┬─────────────────────────────────┘
                            │ DOM manipulation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  HTML/CSS Web UI                            │
│  index.html - Structure, sections, SVG container           │
│  styles.css - Dark theme, animations, components           │
│  app.js     - Main controller, event handling              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 BST Algorithms (C Implementation)

### Insertion - O(h)
```c
Node* insert(Node *root, int data, OperationResult *result) {
    if (root == NULL) {
        // Base case: empty position — create new node
        return createNode(data);
    }
    if (data < root->data)
        root->left = insert(root->left, data, result);
    else if (data > root->data)
        root->right = insert(root->right, data, result);
    // else: duplicate — ignore
    return root;
}
```

### Search - O(h)
- Compare target with current node
- If equal → FOUND
- If smaller → search left subtree
- If larger → search right subtree
- If NULL → NOT FOUND

### Deletion - O(h)
- **Case 1 (Leaf)**: Free node, return NULL
- **Case 2 (One child)**: Return the surviving child
- **Case 3 (Two children)**: Find inorder successor → copy value → delete successor

### BST Validation - O(n)
```c
// Uses min/max bounds approach (correct algorithm)
validateBSTHelper(root, min_bound, max_bound);
// When going left:  max becomes current node's value
// When going right: min becomes current node's value
```

### Balance Check - O(n)
```c
// Checks EVERY node, not just root
// Returns -1 if unbalanced, height otherwise
isBalancedHelper(root);
```

---

## 📡 C → WASM → JS Data Flow

**C to JavaScript:**
- C functions serialize results to JSON strings in a shared char buffer
- JavaScript reads the buffer: `const result = JSON.parse(api_insert(45));`
- JSON contains: `{ success, steps[], path[], comparisons, summary, tree{} }`

**JavaScript to C:**
- Integer and string arguments passed directly as WASM function arguments
- No unsafe pointer handling from JavaScript side
- All tree state managed inside C global variables

**Step-based animation protocol:**
```
C generates:  steps[0..n] with { type, nodeValue, message }
JS receives:  JSON steps array
AnimEngine:   for each step → highlightNode(value, visualState)
Visualizer:   SVG node color/glow changes
```

---

## 📊 Complexity Analysis

| Operation | Average | Worst | Space |
|-----------|---------|-------|-------|
| Search | O(log n) | O(n) | O(h) |
| Insert | O(log n) | O(n) | O(h) |
| Delete | O(log n) | O(n) | O(h) |
| Traversal | O(n) | O(n) | O(h) |

**Why worst case is O(n):**
Inserting values in sorted order creates a skewed tree where each node has only one child. This degenerates to a linked list where every operation must traverse all n nodes.

**h = height of tree:**
- Balanced tree: h = O(log n)
- Skewed tree: h = O(n)

---

## 🔨 How to Build (WASM)

### Step 1: Install Emscripten

```bash
# Clone the SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate latest version
./emsdk install latest
./emsdk activate latest

# Add to PATH (run each session, or add to .bashrc)
source ./emsdk_env.sh
```

### Step 2: Verify Installation

```bash
emcc --version
# Should print: emcc (Emscripten gcc/clang-like replacement) x.x.x
```

### Step 3: Compile C to WASM

```bash
# From the project root directory:
./build.sh          # Linux/Mac
build.bat           # Windows
```

Output: `wasm/bst.js` and `wasm/bst.wasm`

### Step 4: Test C Engine Standalone (GCC)

```bash
cd c-core
gcc -Wall -o ../build/bst_test bst.c traversal.c analysis.c api.c -DSTANDALONE_TEST -lm
../build/bst_test
```

---

## 🚀 How to Run Locally

### Without WASM (Immediate — works right now)

Simply open `frontend/index.html` in any modern browser:
```
frontend/index.html
```
The app uses the **JavaScript fallback engine** — which implements the same algorithms as the C code, in the same step-recording format, returning the same JSON. This is **not a simplified demo** — it's the same logic.

### With WASM (After building)

Must be served over HTTP (WASM requires CORS-safe loading):

```bash
# Option 1: Using Node.js
npx serve .
# Open: http://localhost:3000/frontend/

# Option 2: Using Python
python -m http.server 8080
# Open: http://localhost:8080/frontend/
```

---

## 🧪 Testing

### Test Data

```
Input: 50 30 70 20 40 60 80

Expected tree:
        50
      /    \
    30      70
   /  \    /  \
  20  40  60  80
```

### Test Cases Covered

1. Empty tree operations
2. Single-node tree
3. Right-skewed tree (ascending insertion: 10 20 30 40 50)
4. Left-skewed tree (descending insertion: 50 40 30 20 10)
5. Balanced tree (standard: 50 30 70 20 40 60 80)
6. Duplicate input rejection
7. Search: value found (60)
8. Search: value not found (99)
9. Insert: 45 (goes 50→30→40→45)
10. Delete: leaf node (20)
11. Delete: one child (e.g., 60 after inserting 55)
12. Delete: two children (30 → replaced by inorder successor 40)
13. Undo after deletion
14. Reset to empty tree
15. Analysis on all tree types
16. BST validation

---

## 📁 Folder Structure

```
BST-Visualization-Engine/
│
├── c-core/                     # C DSA implementation
│   ├── bst.h                   # Node struct + function prototypes
│   ├── bst.c                   # Insert, search, delete, memory management
│   ├── traversal.h             # Traversal function prototypes
│   ├── traversal.c             # Inorder, preorder, postorder
│   ├── analysis.h              # Analysis function prototypes
│   ├── analysis.c              # Height, count, balance, classification
│   └── api.c                   # Emscripten-exported API + JSON serialization
│
├── frontend/                   # Web Application
│   ├── index.html              # Single-page app HTML structure
│   ├── styles.css              # Complete CSS design system
│   ├── bst-engine.js           # WASM bridge + JS fallback engine
│   ├── visualizer.js           # SVG tree renderer
│   ├── animation.js            # Step-based animation controller
│   └── app.js                  # Main application controller
│
├── wasm/                       # WebAssembly output (after build)
│   ├── bst.js                  # Emscripten glue code
│   └── bst.wasm                # Compiled C binary
│
├── build/                      # Compiled test binaries
│   └── bst_test.exe            # Standalone C test binary (GCC)
│
├── docs/
│   └── architecture.md         # Detailed architecture documentation
│
├── build.sh                    # Linux/Mac build script
├── build.bat                   # Windows build script
└── README.md                   # This file
```

---

## 🎓 Academic Value

This project demonstrates:

| Concept | Where |
|---------|-------|
| **BST Data Structure** | bst.h (Node struct with left/right pointers) |
| **Dynamic Memory** | createNode() with malloc, freeTree() with free |
| **Pointers** | Node*, root->, recursive return values |
| **Recursion** | insert(), search(), deleteNode(), all traversals |
| **Insertion** | Recursive BST insertion with step tracking |
| **Search** | Path-recording binary search |
| **Deletion** | All 3 cases with inorder successor |
| **Traversal** | Inorder, preorder, postorder with O(n) analysis |
| **Tree Properties** | Height, balance, classification algorithms |
| **Complexity** | Proven O(h) per operation, worst O(n) explanation |
| **WebAssembly** | C code running natively in browser |
| **Algorithm Visualization** | Step-based animation decoupled from algorithm |

---

## 📝 License

MIT License — Free to use for educational purposes.

---

*Built as a DSA college project demonstrating Binary Search Trees through C, WebAssembly, and interactive SVG visualization.*
