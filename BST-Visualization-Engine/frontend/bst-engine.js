/**
 * bst-engine.js - WebAssembly Bridge / JavaScript BST Engine
 *
 * DUAL-MODE ARCHITECTURE:
 * ═══════════════════════════════════════════════════════════════
 *
 * MODE 1: WebAssembly (Production - after Emscripten build)
 *   C Code → emcc → bst.wasm → BSTEngine (WASM calls)
 *
 * MODE 2: JavaScript Fallback (Development - when WASM unavailable)
 *   JavaScript mirrors the EXACT C algorithms from bst.c,
 *   traversal.c, analysis.c, api.c
 *   Returns the SAME JSON format as the C/WASM version.
 *
 * IMPORTANT:
 *   The JS fallback is NOT a simplified version.
 *   It implements the same step-recording logic, same JSON
 *   output format, and same algorithms as the C code.
 *   When Emscripten is available, replace the JS engine with
 *   WASM calls and the rest of the app works unchanged.
 *
 * HOW C → JS → SVG DATA FLOWS:
 *   1. User triggers operation (e.g., insert 45)
 *   2. BSTEngine.insert(45) is called
 *   3. Engine calls C via WASM (or JS mirror) → returns JSON
 *   4. JSON parsed: { success, steps[], path[], tree{} }
 *   5. AnimationEngine.playSteps(steps) highlights nodes in SVG
 *   6. Visualizer.renderTree(tree) draws updated tree
 *
 * STEP TYPES (must match C constants in bst.h):
 *   COMPARE=1, MOVE_LEFT=2, MOVE_RIGHT=3
 *   FOUND=4, NOT_FOUND=5, INSERT=6, DELETE=7
 *   SELECT_SUCC=8, REPLACE_NODE=9, VISIT=10
 *   LEAF_DELETE=11, ONE_CHILD_DEL=12, TWO_CHILD_DEL=13
 */

'use strict';

const STEP = {
    COMPARE:       1,
    MOVE_LEFT:     2,
    MOVE_RIGHT:    3,
    FOUND:         4,
    NOT_FOUND:     5,
    INSERT:        6,
    DELETE:        7,
    SELECT_SUCC:   8,
    REPLACE_NODE:  9,
    VISIT:         10,
    LEAF_DELETE:   11,
    ONE_CHILD_DEL: 12,
    TWO_CHILD_DEL: 13,
};

/* ============================================================
 * JAVASCRIPT BST ENGINE
 * Mirrors the C implementation exactly.
 * Uses the same recursive algorithms and step-recording approach.
 * ============================================================ */

class JSBSTEngine {
    constructor() {
        this.root = null;      /* Current BST root (JS object) */
        this.undoRoot = null;  /* Saved state for undo */
        this.undoAvailable = false;
    }

    /* -------- Node Creation (mirrors createNode() in bst.c) -------- */
    _createNode(data) {
        return { data, left: null, right: null };
    }

    /* -------- Utility: Initialize result object (mirrors initResult) -------- */
    _initResult() {
        return {
            success: 0,
            comparisons: 0,
            summary: '',
            deletionCase: '',
            path: [],
            steps: [],
            tree: null,
        };
    }

    /* -------- Add a step (mirrors addStep() in bst.c) -------- */
    _addStep(result, type, nodeValue, targetValue, successorVal, message) {
        result.steps.push({ type, nodeValue, targetValue, successorVal, message });
    }

    /* -------- Deep copy a tree (mirrors copyTree() in bst.c) -------- */
    _copyTree(node) {
        if (!node) return null;
        return {
            data: node.data,
            left: this._copyTree(node.left),
            right: this._copyTree(node.right),
        };
    }

    /* -------- Find minimum node (mirrors findMin() in bst.c) -------- */
    _findMin(node) {
        if (!node) return null;
        while (node.left) node = node.left;
        return node;
    }

    /* -------- INSERTION (mirrors insert() in bst.c) -------- */
    _insertHelper(node, data, result) {
        if (!node) {
            /* Base case: empty position — insert here */
            this._addStep(result, STEP.INSERT, data, data, -1,
                `${data} inserted as a new node.`);
            result.summary = `${data} inserted successfully.`;
            result.success = 1;
            return this._createNode(data);
        }

        result.comparisons++;
        result.path.push(node.data);

        if (data < node.data) {
            this._addStep(result, STEP.COMPARE, node.data, data, -1,
                `Compare ${data} with ${node.data}: ${data} < ${node.data} → Go Left`);
            this._addStep(result, STEP.MOVE_LEFT, node.data, data, -1,
                `${data} < ${node.data} → Moving left`);
            node.left = this._insertHelper(node.left, data, result);

        } else if (data > node.data) {
            this._addStep(result, STEP.COMPARE, node.data, data, -1,
                `Compare ${data} with ${node.data}: ${data} > ${node.data} → Go Right`);
            this._addStep(result, STEP.MOVE_RIGHT, node.data, data, -1,
                `${data} > ${node.data} → Moving right`);
            node.right = this._insertHelper(node.right, data, result);

        } else {
            /* Duplicate */
            this._addStep(result, STEP.COMPARE, node.data, data, -1,
                `Duplicate value ${data} found — ignoring.`);
            result.summary = `Duplicate value ${data} ignored. BST maintains unique keys.`;
            result.success = 0;
        }
        return node;
    }

    /* -------- SEARCH (mirrors search() in bst.c) -------- */
    _searchHelper(node, data, result) {
        if (!node) {
            this._addStep(result, STEP.NOT_FOUND, -1, data, -1,
                `${data} not found in BST — search exhausted.`);
            result.summary = `${data} not found in the BST after ${result.comparisons} comparison(s).`;
            result.success = 0;
            return null;
        }

        result.path.push(node.data);
        result.comparisons++;

        this._addStep(result, STEP.COMPARE, node.data, data, -1,
            `Compare ${data} with node ${node.data}`);

        if (data === node.data) {
            this._addStep(result, STEP.FOUND, node.data, data, -1,
                `${data} Found! Search complete.`);
            result.summary = `${data} found after ${result.comparisons} comparison(s).`;
            result.success = 1;
            return node;

        } else if (data < node.data) {
            this._addStep(result, STEP.MOVE_LEFT, node.data, data, -1,
                `${data} < ${node.data} → Move Left`);
            return this._searchHelper(node.left, data, result);

        } else {
            this._addStep(result, STEP.MOVE_RIGHT, node.data, data, -1,
                `${data} > ${node.data} → Move Right`);
            return this._searchHelper(node.right, data, result);
        }
    }

    /* -------- DELETION (mirrors deleteNode() in bst.c) -------- */
    _deleteHelper(node, data, result) {
        if (!node) {
            this._addStep(result, STEP.NOT_FOUND, -1, data, -1,
                `${data} not found in BST — deletion aborted.`);
            result.summary = `${data} not found in the BST.`;
            result.success = 0;
            return null;
        }

        result.path.push(node.data);
        result.comparisons++;

        if (data < node.data) {
            this._addStep(result, STEP.COMPARE, node.data, data, -1,
                `Compare ${data} with ${node.data}: ${data} < ${node.data} → Go Left`);
            this._addStep(result, STEP.MOVE_LEFT, node.data, data, -1,
                `${data} < ${node.data} → Moving left to find deletion target`);
            node.left = this._deleteHelper(node.left, data, result);

        } else if (data > node.data) {
            this._addStep(result, STEP.COMPARE, node.data, data, -1,
                `Compare ${data} with ${node.data}: ${data} > ${node.data} → Go Right`);
            this._addStep(result, STEP.MOVE_RIGHT, node.data, data, -1,
                `${data} > ${node.data} → Moving right to find deletion target`);
            node.right = this._deleteHelper(node.right, data, result);

        } else {
            /* Found the node to delete */
            this._addStep(result, STEP.COMPARE, node.data, data, -1,
                `Found node ${data} — determining deletion case.`);

            /* Case 1: Leaf node */
            if (!node.left && !node.right) {
                this._addStep(result, STEP.LEAF_DELETE, node.data, data, -1,
                    `CASE 1 (Leaf Node): ${data} has no children. Removing directly.`);
                result.deletionCase = 'LEAF';
                result.summary = `Deletion Case 1: ${data} is a leaf node. Removed directly.`;
                result.success = 1;
                return null;
            }

            /* Case 2a: Only right child */
            if (!node.left) {
                const child = node.right;
                this._addStep(result, STEP.ONE_CHILD_DEL, node.data, data, child.data,
                    `CASE 2 (One Child): ${data} has only a right child (${child.data}). Replacing with right child.`);
                result.deletionCase = 'ONE_CHILD';
                result.summary = `Deletion Case 2: ${data} has one child (${child.data}). Child replaces deleted node.`;
                result.success = 1;
                return child;
            }

            /* Case 2b: Only left child */
            if (!node.right) {
                const child = node.left;
                this._addStep(result, STEP.ONE_CHILD_DEL, node.data, data, child.data,
                    `CASE 2 (One Child): ${data} has only a left child (${child.data}). Replacing with left child.`);
                result.deletionCase = 'ONE_CHILD';
                result.summary = `Deletion Case 2: ${data} has one child (${child.data}). Child replaces deleted node.`;
                result.success = 1;
                return child;
            }

            /* Case 3: Two children — use inorder successor */
            const successor = this._findMin(node.right);
            const successorData = successor.data; /* Capture before deletion */
            const oldData = node.data;

            this._addStep(result, STEP.TWO_CHILD_DEL, node.data, data, -1,
                `CASE 3 (Two Children): ${data} has both left and right children. Finding inorder successor (smallest in right subtree).`);
            this._addStep(result, STEP.SELECT_SUCC, successorData, data, successorData,
                `Inorder successor of ${data} is ${successorData} (leftmost node in right subtree).`);
            this._addStep(result, STEP.REPLACE_NODE, node.data, data, successorData,
                `Replacing value ${data} with successor value ${successorData}.`);

            node.data = successorData;

            this._addStep(result, STEP.DELETE, successorData, successorData, -1,
                `Deleting original successor node ${successorData} from right subtree.`);
            node.right = this._deleteHelper(node.right, successorData, result);

            result.deletionCase = 'TWO_CHILDREN';
            result.summary = `Deletion Case 3: ${oldData} has two children. Replaced with inorder successor ${successorData}.`;
            result.success = 1;
        }
        return node;
    }

    /* -------- TRAVERSALS (mirrors traversal.c) -------- */

    _inorderHelper(node, result) {
        if (!node) return;
        this._inorderHelper(node.left, result);
        result.steps.push({ type: STEP.VISIT, nodeValue: node.data,
            message: `Visit node ${node.data} [INORDER: L→Root→R]` });
        result.sequence.push(node.data);
        this._inorderHelper(node.right, result);
    }

    _preorderHelper(node, result) {
        if (!node) return;
        result.steps.push({ type: STEP.VISIT, nodeValue: node.data,
            message: `Visit node ${node.data} [PREORDER: Root→L→R]` });
        result.sequence.push(node.data);
        this._preorderHelper(node.left, result);
        this._preorderHelper(node.right, result);
    }

    _postorderHelper(node, result) {
        if (!node) return;
        this._postorderHelper(node.left, result);
        this._postorderHelper(node.right, result);
        result.steps.push({ type: STEP.VISIT, nodeValue: node.data,
            message: `Visit node ${node.data} [POSTORDER: L→R→Root]` });
        result.sequence.push(node.data);
    }

    /* -------- ANALYSIS (mirrors analysis.c) -------- */
    _getHeight(node) {
        if (!node) return -1;
        return 1 + Math.max(this._getHeight(node.left), this._getHeight(node.right));
    }

    _getNodeCount(node) {
        if (!node) return 0;
        return 1 + this._getNodeCount(node.left) + this._getNodeCount(node.right);
    }

    _getLeafCount(node) {
        if (!node) return 0;
        if (!node.left && !node.right) return 1;
        return this._getLeafCount(node.left) + this._getLeafCount(node.right);
    }

    _getInternalCount(node) {
        if (!node) return 0;
        if (!node.left && !node.right) return 0;
        return 1 + this._getInternalCount(node.left) + this._getInternalCount(node.right);
    }

    _validateBSTHelper(node, min, max) {
        if (!node) return true;
        if (node.data <= min || node.data >= max) return false;
        return this._validateBSTHelper(node.left, min, node.data) &&
               this._validateBSTHelper(node.right, node.data, max);
    }

    _isBalancedHelper(node) {
        if (!node) return 0;
        const lh = this._isBalancedHelper(node.left);
        if (lh === -1) return -1;
        const rh = this._isBalancedHelper(node.right);
        if (rh === -1) return -1;
        const diff = lh - rh;
        if (diff < -1 || diff > 1) return -1;
        return 1 + Math.max(lh, rh);
    }

    _isCompleteHelper(node, index, n) {
        if (!node) return true;
        if (index >= n) return false;
        return this._isCompleteHelper(node.left, 2 * index + 1, n) &&
               this._isCompleteHelper(node.right, 2 * index + 2, n);
    }

    _isFull(node) {
        if (!node) return true;
        if (!node.left && !node.right) return true;
        if (!node.left || !node.right) return false;
        return this._isFull(node.left) && this._isFull(node.right);
    }

    _isLeftSkewed(node) {
        if (!node) return true;
        if (node.right) return false;
        return this._isLeftSkewed(node.left);
    }

    _isRightSkewed(node) {
        if (!node) return true;
        if (node.left) return false;
        return this._isRightSkewed(node.right);
    }

    _getMin(node) {
        if (!node) return null;
        while (node.left) node = node.left;
        return node.data;
    }

    _getMax(node) {
        if (!node) return null;
        while (node.right) node = node.right;
        return node.data;
    }

    /* -------- Advanced Operations -------- */
    api_find_minimum() {
        const result = this._initResult();
        if (!this.root) {
            this._addStep(result, STEP.NOT_FOUND, -1, -1, -1, "Tree is empty, no minimum exists.");
            result.summary = "Tree is empty.";
            result.success = 0;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        let current = this.root;
        while (current.left) {
            result.path.push(current.data);
            result.comparisons++;
            this._addStep(result, STEP.MOVE_LEFT, current.data, -1, -1, `Node ${current.data} has a left child. Minimum must be smaller. Go left.`);
            current = current.left;
        }
        result.path.push(current.data);
        result.comparisons++;
        this._addStep(result, STEP.FOUND, current.data, current.data, -1, `Node ${current.data} has no left child. This is the minimum value.`);
        result.summary = `Minimum value is ${current.data}.`;
        result.success = 1;
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_find_maximum() {
        const result = this._initResult();
        if (!this.root) {
            this._addStep(result, STEP.NOT_FOUND, -1, -1, -1, "Tree is empty, no maximum exists.");
            result.summary = "Tree is empty.";
            result.success = 0;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        let current = this.root;
        while (current.right) {
            result.path.push(current.data);
            result.comparisons++;
            this._addStep(result, STEP.MOVE_RIGHT, current.data, -1, -1, `Node ${current.data} has a right child. Maximum must be larger. Go right.`);
            current = current.right;
        }
        result.path.push(current.data);
        result.comparisons++;
        this._addStep(result, STEP.FOUND, current.data, current.data, -1, `Node ${current.data} has no right child. This is the maximum value.`);
        result.summary = `Maximum value is ${current.data}.`;
        result.success = 1;
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_find_depth(data) {
        const result = this._initResult();
        if (!this.root) {
            this._addStep(result, STEP.NOT_FOUND, -1, data, -1, "Tree is empty.");
            result.summary = `Node ${data} not found (tree empty).`;
            result.success = 0;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        let depth = 0;
        let current = this.root;
        while (current) {
            result.path.push(current.data);
            result.comparisons++;
            this._addStep(result, STEP.COMPARE, current.data, data, -1, `Compare target ${data} with ${current.data}`);
            if (data === current.data) {
                this._addStep(result, STEP.FOUND, current.data, data, -1, `Node ${data} found at depth ${depth}.`);
                result.summary = `Depth of node ${data} is ${depth}.`;
                result.success = 1;
                result.tree = this._nodeToJSON(this.root);
                return result;
            } else if (data < current.data) {
                this._addStep(result, STEP.MOVE_LEFT, current.data, data, -1, `${data} < ${current.data}, Go left.`);
                current = current.left;
            } else {
                this._addStep(result, STEP.MOVE_RIGHT, current.data, data, -1, `${data} > ${current.data}, Go right.`);
                current = current.right;
            }
            depth++;
        }
        this._addStep(result, STEP.NOT_FOUND, -1, data, -1, `Node ${data} not found in the tree.`);
        result.summary = `Node ${data} not found.`;
        result.success = 0;
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_find_parent(data) {
        const result = this._initResult();
        if (!this.root) {
            result.summary = "Tree is empty.";
            result.success = 0;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        if (this.root.data === data) {
            result.path.push(this.root.data);
            result.comparisons++;
            this._addStep(result, STEP.FOUND, this.root.data, data, -1, `Node ${data} is the root. It has no parent.`);
            result.summary = `Node ${data} is the root, so it has no parent.`;
            result.success = 1;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        let current = this.root;
        let parent = null;
        while (current) {
            result.path.push(current.data);
            result.comparisons++;
            this._addStep(result, STEP.COMPARE, current.data, data, -1, `Compare target ${data} with ${current.data}`);
            if (data === current.data) {
                this._addStep(result, STEP.FOUND, current.data, data, -1, `Node ${data} found. Its parent is ${parent.data}.`);
                result.summary = `Parent of node ${data} is ${parent.data}.`;
                result.success = 1;
                result.tree = this._nodeToJSON(this.root);
                return result;
            } else if (data < current.data) {
                parent = current;
                this._addStep(result, STEP.MOVE_LEFT, current.data, data, -1, `${data} < ${current.data}, Go left.`);
                current = current.left;
            } else {
                parent = current;
                this._addStep(result, STEP.MOVE_RIGHT, current.data, data, -1, `${data} > ${current.data}, Go right.`);
                current = current.right;
            }
        }
        this._addStep(result, STEP.NOT_FOUND, -1, data, -1, `Node ${data} not found in the tree.`);
        result.summary = `Node ${data} not found.`;
        result.success = 0;
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_find_sibling(data) {
        const result = this._initResult();
        if (!this.root) {
            result.summary = "Tree is empty.";
            result.success = 0;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        if (this.root.data === data) {
            result.path.push(this.root.data);
            result.comparisons++;
            this._addStep(result, STEP.FOUND, this.root.data, data, -1, `Node ${data} is the root. It has no sibling.`);
            result.summary = `Node ${data} is the root, so it has no sibling.`;
            result.success = 1;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        let current = this.root;
        let parent = null;
        while (current) {
            result.path.push(current.data);
            result.comparisons++;
            this._addStep(result, STEP.COMPARE, current.data, data, -1, `Compare target ${data} with ${current.data}`);
            if (data === current.data) {
                let sibling = null;
                if (parent) {
                    if (parent.left === current) sibling = parent.right;
                    else sibling = parent.left;
                }
                if (sibling) {
                    this._addStep(result, STEP.FOUND, current.data, data, -1, `Node ${data} found. Its sibling is ${sibling.data}.`);
                    result.summary = `Sibling of node ${data} is ${sibling.data}.`;
                    result.success = 1;
                } else {
                    this._addStep(result, STEP.FOUND, current.data, data, -1, `Node ${data} found, but it has no sibling.`);
                    result.summary = `Node ${data} has no sibling.`;
                    result.success = 1;
                }
                result.tree = this._nodeToJSON(this.root);
                return result;
            } else if (data < current.data) {
                parent = current;
                this._addStep(result, STEP.MOVE_LEFT, current.data, data, -1, `${data} < ${current.data}, Go left.`);
                current = current.left;
            } else {
                parent = current;
                this._addStep(result, STEP.MOVE_RIGHT, current.data, data, -1, `${data} > ${current.data}, Go right.`);
                current = current.right;
            }
        }
        this._addStep(result, STEP.NOT_FOUND, -1, data, -1, `Node ${data} not found in the tree.`);
        result.summary = `Node ${data} not found.`;
        result.success = 0;
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_find_lca(data1, data2) {
        const result = this._initResult();
        if (!this.root) {
            result.summary = "Tree is empty.";
            result.success = 0;
            result.tree = this._nodeToJSON(this.root);
            return result;
        }
        let current = this.root;
        while (current) {
            result.path.push(current.data);
            result.comparisons++;
            this._addStep(result, STEP.COMPARE, current.data, -1, -1, `At node ${current.data}`);
            
            if (current.data > data1 && current.data > data2) {
                this._addStep(result, STEP.MOVE_LEFT, current.data, -1, -1, `Both ${data1} and ${data2} are less than ${current.data}. LCA must be in left subtree.`);
                current = current.left;
            } else if (current.data < data1 && current.data < data2) {
                this._addStep(result, STEP.MOVE_RIGHT, current.data, -1, -1, `Both ${data1} and ${data2} are greater than ${current.data}. LCA must be in right subtree.`);
                current = current.right;
            } else {
                this._addStep(result, STEP.FOUND, current.data, current.data, -1, `Paths split at ${current.data}. This is the Lowest Common Ancestor.`);
                result.summary = `LCA of ${data1} and ${data2} is ${current.data}.`;
                result.success = 1;
                result.tree = this._nodeToJSON(this.root);
                return result;
            }
        }
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    /* -------- Tree to serializable JSON format -------- */
    _nodeToJSON(node) {
        if (!node) return null;
        return {
            value: node.data,
            left:  this._nodeToJSON(node.left),
            right: this._nodeToJSON(node.right),
        };
    }

    /* ============================================================
     * PUBLIC API - same interface as C WASM exports
     * ============================================================ */

    api_init() {
        this.root = null;
        this.undoRoot = null;
        this.undoAvailable = false;
    }

    api_reset() {
        this.root = null;
        this.undoRoot = null;
        this.undoAvailable = false;
        return { tree: null, message: 'Tree reset to empty state.' };
    }

    api_insert(value) {
        /* Save undo state */
        this.undoRoot = this._copyTree(this.root);
        this.undoAvailable = true;

        const result = this._initResult();
        this.root = this._insertHelper(this.root, value, result);
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_search(value) {
        const result = this._initResult();
        if (!this.root) {
            result.summary = 'Cannot search: Tree is empty.';
            result.success = 0;
            result.tree = null;
            return result;
        }
        this._searchHelper(this.root, value, result);
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_delete(value) {
        if (!this.root) {
            return { success: 0, summary: 'Cannot delete: Tree is empty.',
                     steps: [], path: [], comparisons: 0,
                     deletionCase: '', tree: null };
        }
        /* Save undo state */
        this.undoRoot = this._copyTree(this.root);
        this.undoAvailable = true;

        const result = this._initResult();
        this.root = this._deleteHelper(this.root, value, result);
        result.tree = this._nodeToJSON(this.root);
        return result;
    }

    api_inorder() {
        const result = { name: 'INORDER', description: 'Inorder (Left→Root→Right): Visits nodes in sorted ascending order.', count: 0, sequence: [], steps: [] };
        if (!this.root) { result.description = 'Tree is empty. No traversal possible.'; return result; }
        this._inorderHelper(this.root, result);
        result.count = result.sequence.length;
        return result;
    }

    api_preorder() {
        const result = { name: 'PREORDER', description: 'Preorder (Root→Left→Right): Visits root first, useful for tree copying.', count: 0, sequence: [], steps: [] };
        if (!this.root) { result.description = 'Tree is empty. No traversal possible.'; return result; }
        this._preorderHelper(this.root, result);
        result.count = result.sequence.length;
        return result;
    }

    api_postorder() {
        const result = { name: 'POSTORDER', description: 'Postorder (Left→Right→Root): Visits root last, used for tree deletion.', count: 0, sequence: [], steps: [] };
        if (!this.root) { result.description = 'Tree is empty. No traversal possible.'; return result; }
        this._postorderHelper(this.root, result);
        result.count = result.sequence.length;
        return result;
    }

    api_get_tree() {
        return { tree: this._nodeToJSON(this.root) };
    }

    api_analyze() {
        const node = this.root;
        if (!node) {
            return {
                totalNodes: 0, leafNodes: 0, internalNodes: 0,
                height: -1, levels: 0, edges: 0, minValue: 0, maxValue: 0,
                isValidBST: 1, isBalanced: 1, balanceFactor: 0,
                isPerfect: 1, isComplete: 1, isFull: 1,
                isLeftSkewed: 1, isRightSkewed: 1,
                treeType: 'Empty Tree',
                validationMsg: 'Empty tree is trivially a valid BST.',
                balanceMsg: 'Empty tree is trivially balanced.',
                complexityNote: 'No operations possible on empty tree.'
            };
        }

        const totalNodes    = this._getNodeCount(node);
        const leafNodes     = this._getLeafCount(node);
        const internalNodes = this._getInternalCount(node);
        const height        = this._getHeight(node);
        const levels        = height + 1;
        const edges         = totalNodes - 1;
        const minValue      = this._getMin(node);
        const maxValue      = this._getMax(node);

        const isValidBST    = this._validateBSTHelper(node, -Infinity, Infinity) ? 1 : 0;
        const isBalanced    = this._isBalancedHelper(node) !== -1 ? 1 : 0;
        const lh = this._getHeight(node.left);
        const rh = this._getHeight(node.right);
        const balanceFactor = lh - rh;

        const n = totalNodes;
        const isPerfect  = (n === (1 << levels) - 1) ? 1 : 0;
        const isComplete = this._isCompleteHelper(node, 0, n) ? 1 : 0;
        const isFull     = this._isFull(node) ? 1 : 0;
        const isLeftSkewed  = (n > 1 && this._isLeftSkewed(node)) ? 1 : 0;
        const isRightSkewed = (n > 1 && this._isRightSkewed(node)) ? 1 : 0;

        let treeType, validationMsg, balanceMsg, complexityNote;

        validationMsg = isValidBST
            ? 'Valid BST: All nodes satisfy left < node < right property.'
            : 'Invalid BST: Some node violates the BST property.';

        balanceMsg = isBalanced
            ? `Balanced: All nodes satisfy |h(left) - h(right)| ≤ 1. Operations run in O(log n).`
            : `Unbalanced: Some node has |h(left) - h(right)| > 1. Worst-case operations may approach O(n).`;

        if (isLeftSkewed) {
            treeType = 'Left-Skewed BST';
            complexityNote = 'Left-Skewed BST: degenerates to a linked list. All operations O(n) in the worst case. Self-balancing trees (AVL, Red-Black) were invented to fix this.';
        } else if (isRightSkewed) {
            treeType = 'Right-Skewed BST';
            complexityNote = 'Right-Skewed BST: degenerates to a linked list. All operations O(n) in the worst case. Inserting values in ascending order always produces this shape.';
        } else if (isPerfect) {
            treeType = 'Perfect Binary BST';
            complexityNote = `Perfect Binary Tree: All ${leafNodes} leaf nodes at same level. Total nodes = 2^(h+1)-1. All operations O(log n). This is the ideal BST shape.`;
        } else if (isComplete && isFull) {
            treeType = 'Complete & Full BST';
            complexityNote = 'Complete & Full BST: Every node has 0 or 2 children and all levels are filled left-to-right. Operations O(log n).';
        } else if (isComplete) {
            treeType = 'Complete BST';
            complexityNote = 'Complete BST: All levels filled except possibly the last (filled left to right). Operations O(log n).';
        } else if (isFull) {
            treeType = 'Full BST';
            complexityNote = 'Full BST: Every node has exactly 0 or 2 children. Leaf nodes = internal nodes + 1.';
        } else if (isBalanced) {
            treeType = 'Balanced BST';
            complexityNote = 'Balanced BST: Height difference at every node ≤ 1. Operations O(log n) guaranteed.';
        } else {
            treeType = 'Unbalanced BST';
            const optH = Math.floor(Math.log2(totalNodes));
            complexityNote = `Unbalanced BST: Height ${height} with ${totalNodes} nodes. Optimal height would be ~${optH} for ${totalNodes} nodes. Operations may approach O(n) in extreme cases.`;
        }

        return {
            totalNodes, leafNodes, internalNodes, height, levels, edges,
            minValue, maxValue, isValidBST, isBalanced, balanceFactor,
            isPerfect, isComplete, isFull, isLeftSkewed, isRightSkewed,
            treeType, validationMsg, balanceMsg, complexityNote
        };
    }

    api_validate() {
        const isValid = this._validateBSTHelper(this.root, -Infinity, Infinity) ? 1 : 0;
        return {
            isValid,
            message: isValid
                ? 'Valid BST: All nodes satisfy the Binary Search Tree property.'
                : 'Invalid BST: BST property is violated.'
        };
    }

    api_undo() {
        if (!this.undoAvailable) {
            return { success: 0, message: 'No operation to undo.', tree: null };
        }
        this.root = this.undoRoot;
        this.undoRoot = null;
        this.undoAvailable = false;
        return { success: 1, message: 'Last operation undone.', tree: this._nodeToJSON(this.root) };
    }

    api_get_height()     { return this._getHeight(this.root); }
    api_get_node_count() { return this._getNodeCount(this.root); }
    api_get_leaf_count() { return this._getLeafCount(this.root); }
    api_get_min()        { return this._getMin(this.root); }
    api_get_max()        { return this._getMax(this.root); }

    /* Convenience aliases matching BSTEngine interface */
    reset()              { return this.api_reset(); }
    insert(val)          { return this.api_insert(val); }
    search(val)          { return this.api_search(val); }
    delete(val)          { return this.api_delete(val); }
    getTree()            { return this.api_get_tree(); }
    getHeight()          { return this.api_get_height(); }
}

/* ============================================================
 * WASM LOADER
 * Tries to load the WebAssembly module.
 * Falls back to JavaScript engine if WASM is not available.
 * ============================================================ */

class BSTEngine {
    constructor() {
        this.mode = 'JS_FALLBACK';
        this.wasmModule = null;
        this.jsEngine = new JSBSTEngine();
        this.ready = false;
        this.onReady = null;
    }

    /**
     * Initialize the engine.
     * Attempts to load WASM; falls back to JS if unavailable.
     */
    async init() {
        try {
            /* Try to load Emscripten-generated WASM module */
            if (typeof Module !== 'undefined' && Module.cwrap) {
                await this._initWASM();
                this.mode = 'WASM';
                console.log('[BSTEngine] Running in WASM mode (C engine)');
            } else {
                throw new Error('WASM module not found');
            }
        } catch (e) {
            console.warn('[BSTEngine] WASM not available, using JS fallback:', e.message);
            console.warn('[BSTEngine] To use WASM: install Emscripten and run build.sh');
            this.mode = 'JS_FALLBACK';
        }

        this.jsEngine.api_init();
        this.ready = true;
        if (this.onReady) this.onReady(this.mode);
        return this.mode;
    }

    async _initWASM() {
        /* When WASM is available, wrap C functions */
        this._wasm_insert   = Module.cwrap('api_insert',   'string', ['number']);
        this._wasm_search   = Module.cwrap('api_search',   'string', ['number']);
        this._wasm_delete   = Module.cwrap('api_delete',   'string', ['number']);
        this._wasm_inorder  = Module.cwrap('api_inorder',  'string', []);
        this._wasm_preorder = Module.cwrap('api_preorder', 'string', []);
        this._wasm_postorder= Module.cwrap('api_postorder','string', []);
        this._wasm_analyze  = Module.cwrap('api_analyze',  'string', []);
        this._wasm_validate = Module.cwrap('api_validate', 'string', []);
        this._wasm_get_tree = Module.cwrap('api_get_tree', 'string', []);
        this._wasm_undo     = Module.cwrap('api_undo',     'string', []);
        this._wasm_reset    = Module.cwrap('api_reset',    'string', []);
        
        /* Advanced Ops */
        this._wasm_find_minimum = Module.cwrap('api_find_minimum', 'string', []);
        this._wasm_find_maximum = Module.cwrap('api_find_maximum', 'string', []);
        this._wasm_find_depth   = Module.cwrap('api_find_depth', 'string', ['number']);
        this._wasm_find_parent  = Module.cwrap('api_find_parent', 'string', ['number']);
        this._wasm_find_sibling = Module.cwrap('api_find_sibling', 'string', ['number']);
        this._wasm_find_lca     = Module.cwrap('api_find_lca', 'string', ['number', 'number']);
        
        Module.ccall('api_init', null, [], []);
    }

    /* -------- Route calls to WASM or JS engine -------- */

    _call(wasmFn, jsFn, args = []) {
        if (this.mode === 'WASM' && wasmFn) {
            try {
                const raw = wasmFn(...args);
                return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (e) {
                console.error('[BSTEngine] WASM call failed, falling back to JS:', e);
                this.mode = 'JS_FALLBACK';
            }
        }
        return jsFn(...args);
    }

    reset()        { return this._call(this._wasm_reset,    () => this.jsEngine.api_reset()); }
    insert(v)      { return this._call(this._wasm_insert,   (x) => this.jsEngine.api_insert(x), [v]); }
    search(v)      { return this._call(this._wasm_search,   (x) => this.jsEngine.api_search(x), [v]); }
    delete(v)      { return this._call(this._wasm_delete,   (x) => this.jsEngine.api_delete(x), [v]); }
    inorder()      { return this._call(this._wasm_inorder,  () => this.jsEngine.api_inorder()); }
    preorder()     { return this._call(this._wasm_preorder, () => this.jsEngine.api_preorder()); }
    postorder()    { return this._call(this._wasm_postorder,() => this.jsEngine.api_postorder()); }
    analyze()      { return this._call(this._wasm_analyze,  () => this.jsEngine.api_analyze()); }
    validate()     { return this._call(this._wasm_validate, () => this.jsEngine.api_validate()); }
    getTree()      { return this._call(this._wasm_get_tree, () => this.jsEngine.api_get_tree()); }
    undo()         { return this._call(this._wasm_undo,     () => this.jsEngine.api_undo()); }
    
    /* Advanced Ops wrappers */
    findMinimum()  { return this._call(this._wasm_find_minimum, () => this.jsEngine.api_find_minimum()); }
    findMaximum()  { return this._call(this._wasm_find_maximum, () => this.jsEngine.api_find_maximum()); }
    findDepth(v)   { return this._call(this._wasm_find_depth,   (x) => this.jsEngine.api_find_depth(x), [v]); }
    findParent(v)  { return this._call(this._wasm_find_parent,  (x) => this.jsEngine.api_find_parent(x), [v]); }
    findSibling(v) { return this._call(this._wasm_find_sibling, (x) => this.jsEngine.api_find_sibling(x), [v]); }
    findLCA(v1,v2) { return this._call(this._wasm_find_lca,     (x,y) => this.jsEngine.api_find_lca(x,y), [v1, v2]); }
    
    getHeight()    { return this.mode === 'WASM' ? Module.ccall('api_get_height','number',[],[]) : this.jsEngine.api_get_height(); }
    getNodeCount() { return this.mode === 'WASM' ? Module.ccall('api_get_node_count','number',[],[]) : this.jsEngine.api_get_node_count(); }
    getLeafCount() { return this.mode === 'WASM' ? Module.ccall('api_get_leaf_count','number',[],[]) : this.jsEngine.api_get_leaf_count(); }
    getMin()       { return this.mode === 'WASM' ? Module.ccall('api_get_min','number',[],[]) : this.jsEngine.api_get_min(); }
    getMax()       { return this.mode === 'WASM' ? Module.ccall('api_get_max','number',[],[]) : this.jsEngine.api_get_max(); }

    getMode()      { return this.mode; }
}

/* Global classes and singleton engine instance */
window.JSBSTEngine = JSBSTEngine;
window.BSTEngine = BSTEngine;
window.bstEngine = new BSTEngine();
