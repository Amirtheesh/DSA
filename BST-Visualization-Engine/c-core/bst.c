/**
 * bst.c - Binary Search Tree Core Implementation
 *
 * Implements all fundamental BST operations:
 *   - Node creation
 *   - Insertion (with step recording)
 *   - Searching (with step recording and path tracking)
 *   - Deletion (all three cases, with step recording)
 *   - Min/Max finding
 *   - Memory management
 *
 * ACADEMIC NOTE:
 *   This implementation uses recursive algorithms throughout.
 *   Recursion naturally mirrors the recursive definition of a
 *   Binary Search Tree: a BST is either empty, or a node whose
 *   left subtree contains only keys less than the node's key
 *   and whose right subtree contains only keys greater.
 *
 * TIME COMPLEXITY:
 *   All operations: O(h) where h = height of tree
 *   Average case: O(log n) for balanced trees
 *   Worst case:   O(n)     for completely skewed trees
 *
 * SPACE COMPLEXITY:
 *   Each operation uses O(h) stack space due to recursion.
 */

#include "bst.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================
 * UTILITY FUNCTIONS
 * ============================================================ */

/**
 * initResult - Initialize an OperationResult to a clean state.
 * Must be called before passing result to any operation.
 */
void initResult(OperationResult *result) {
    result->success = 0;
    result->steps_count = 0;
    result->path_count = 0;
    result->comparisons = 0;
    result->summary[0] = '\0';
    result->deletion_case[0] = '\0';
    memset(result->path, 0, sizeof(result->path));
    memset(result->steps, 0, sizeof(result->steps));
}

/**
 * addStep - Record one algorithm step into the result.
 *
 * @param result     The OperationResult being built
 * @param type       STEP_* constant identifying the step type
 * @param node_val   Current node's value
 * @param target_val The value being operated on
 * @param succ_val   Successor value (used in deletion)
 * @param msg        Human-readable message
 */
void addStep(OperationResult *result, int type, int node_val,
             int target_val, int succ_val, const char *msg) {
    if (result->steps_count >= MAX_STEPS) return;
    OperationStep *step = &result->steps[result->steps_count++];
    step->type = type;
    step->node_value = node_val;
    step->target_value = target_val;
    step->successor_val = succ_val;
    strncpy(step->message, msg, 255);
    step->message[255] = '\0';
}

/**
 * addPathNode - Record a node value in the path array.
 */
static void addPathNode(OperationResult *result, int val) {
    if (result->path_count < BST_MAX_PATH) {
        result->path[result->path_count++] = val;
    }
}

/* ============================================================
 * NODE CREATION
 * ============================================================ */

/**
 * createNode - Allocate and initialize a new BST node.
 *
 * @param data  Integer value to store in the node
 * @return      Pointer to newly allocated node, or NULL on failure
 *
 * The newly created node has NULL left and right pointers,
 * meaning it is initially a leaf node.
 */
Node* createNode(int data) {
    Node *newNode = (Node*)malloc(sizeof(Node));
    if (newNode == NULL) {
        /* Memory allocation failed - this is a critical error */
        return NULL;
    }
    newNode->data = data;
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}

/* ============================================================
 * INSERTION
 * ============================================================ */

/**
 * insert - Insert a value into the BST.
 *
 * ALGORITHM:
 *   1. If tree is empty, create new root node.
 *   2. If value < current node → go left (recurse).
 *   3. If value > current node → go right (recurse).
 *   4. If value == current node → duplicate, do nothing.
 *
 * @param root    Current subtree root (NULL if empty)
 * @param data    Value to insert
 * @param result  Records each step of the algorithm
 * @return        New subtree root (important for recursive linking)
 *
 * TIME COMPLEXITY:  O(h) — visits at most h+1 nodes
 * SPACE COMPLEXITY: O(h) — recursion stack depth = h
 */
Node* insert(Node *root, int data, OperationResult *result) {
    char msg[256];

    /* BASE CASE: Empty position found — insert here */
    if (root == NULL) {
        Node *newNode = createNode(data);
        if (newNode == NULL) {
            snprintf(result->summary, 511, "ERROR: Memory allocation failed.");
            return NULL;
        }
        snprintf(msg, 255, "%d inserted as a new node.", data);
        addStep(result, STEP_INSERT, data, data, -1, msg);
        snprintf(result->summary, 511, "%d inserted successfully.", data);
        result->success = 1;
        return newNode;
    }

    /* Record comparison with current node */
    result->comparisons++;
    addPathNode(result, root->data);

    if (data < root->data) {
        /* value is smaller → go LEFT */
        snprintf(msg, 255, "Compare %d with %d: %d < %d → Go Left",
                 data, root->data, data, root->data);
        addStep(result, STEP_COMPARE, root->data, data, -1, msg);

        snprintf(msg, 255, "%d < %d → Moving left", data, root->data);
        addStep(result, STEP_MOVE_LEFT, root->data, data, -1, msg);

        root->left = insert(root->left, data, result);

    } else if (data > root->data) {
        /* value is larger → go RIGHT */
        snprintf(msg, 255, "Compare %d with %d: %d > %d → Go Right",
                 data, root->data, data, root->data);
        addStep(result, STEP_COMPARE, root->data, data, -1, msg);

        snprintf(msg, 255, "%d > %d → Moving right", data, root->data);
        addStep(result, STEP_MOVE_RIGHT, root->data, data, -1, msg);

        root->right = insert(root->right, data, result);

    } else {
        /* DUPLICATE: BST property requires unique keys */
        snprintf(msg, 255, "Duplicate value %d found — ignoring.", data);
        addStep(result, STEP_COMPARE, root->data, data, -1, msg);
        snprintf(result->summary, 511,
                 "Duplicate value %d ignored. BST maintains unique keys.", data);
        result->success = 0;
    }

    return root;
}

/* ============================================================
 * SEARCH
 * ============================================================ */

/**
 * search - Search for a value in the BST.
 *
 * ALGORITHM:
 *   1. If tree is empty → NOT FOUND.
 *   2. If value == current node → FOUND.
 *   3. If value < current node → search left subtree.
 *   4. If value > current node → search right subtree.
 *
 * @param root    Current subtree root
 * @param data    Value to search for
 * @param result  Records search path and steps
 * @return        Pointer to found node, or NULL if not found
 *
 * TIME COMPLEXITY:  O(h)
 * SPACE COMPLEXITY: O(h)
 */
Node* search(Node *root, int data, OperationResult *result) {
    char msg[256];

    /* BASE CASE: Reached a NULL node — value not in tree */
    if (root == NULL) {
        snprintf(msg, 255, "%d not found in BST — search exhausted.", data);
        addStep(result, STEP_NOT_FOUND, -1, data, -1, msg);
        snprintf(result->summary, 511,
                 "%d not found in the BST after %d comparison(s).",
                 data, result->comparisons);
        result->success = 0;
        return NULL;
    }

    /* Record this node in the path */
    addPathNode(result, root->data);
    result->comparisons++;

    /* Record comparison step */
    snprintf(msg, 255, "Compare %d with node %d", data, root->data);
    addStep(result, STEP_COMPARE, root->data, data, -1, msg);

    if (data == root->data) {
        /* FOUND */
        snprintf(msg, 255, "%d Found! Search complete.", data);
        addStep(result, STEP_FOUND, root->data, data, -1, msg);
        snprintf(result->summary, 511,
                 "%d found after %d comparison(s).", data, result->comparisons);
        result->success = 1;
        return root;

    } else if (data < root->data) {
        /* Go LEFT */
        snprintf(msg, 255, "%d < %d → Move Left", data, root->data);
        addStep(result, STEP_MOVE_LEFT, root->data, data, -1, msg);
        return search(root->left, data, result);

    } else {
        /* Go RIGHT */
        snprintf(msg, 255, "%d > %d → Move Right", data, root->data);
        addStep(result, STEP_MOVE_RIGHT, root->data, data, -1, msg);
        return search(root->right, data, result);
    }
}

/* ============================================================
 * MIN / MAX FINDING
 * ============================================================ */

/**
 * findMin - Find the node with minimum value in a subtree.
 *
 * In a BST, the minimum is always the leftmost node.
 * This is used to find the inorder successor during deletion.
 *
 * @param root  Root of subtree to search
 * @return      Pointer to node with minimum value
 */
Node* findMin(Node *root) {
    if (root == NULL) return NULL;
    /* Keep going left until we can't */
    while (root->left != NULL) {
        root = root->left;
    }
    return root;
}

/**
 * findMax - Find the node with maximum value in a subtree.
 *
 * In a BST, the maximum is always the rightmost node.
 *
 * @param root  Root of subtree to search
 * @return      Pointer to node with maximum value
 */
Node* findMax(Node *root) {
    if (root == NULL) return NULL;
    while (root->right != NULL) {
        root = root->right;
    }
    return root;
}

/* ============================================================
 * DELETION
 * ============================================================ */

/**
 * deleteNode - Delete a value from the BST.
 *
 * Handles all three standard cases:
 *
 * CASE 1 — Leaf Node (no children):
 *   Simply free the node and return NULL.
 *   Parent's pointer is set to NULL automatically.
 *
 * CASE 2 — One Child:
 *   Replace the node with its only child.
 *   The child "takes the place" of the deleted node.
 *
 * CASE 3 — Two Children:
 *   Find the inorder successor (leftmost node in right subtree).
 *   Copy successor's value into this node.
 *   Delete the successor from the right subtree.
 *   This preserves the BST property.
 *
 * WHY INORDER SUCCESSOR?
 *   The inorder successor is the smallest value greater than
 *   the node to delete. Replacing the node with this value
 *   maintains the BST property: left < node < right.
 *
 * @param root    Current subtree root
 * @param data    Value to delete
 * @param result  Records deletion case and steps
 * @return        New subtree root after deletion
 *
 * TIME COMPLEXITY:  O(h)
 * SPACE COMPLEXITY: O(h)
 */
Node* deleteNode(Node *root, int data, OperationResult *result) {
    char msg[256];

    /* BASE CASE: Value not found in tree */
    if (root == NULL) {
        snprintf(msg, 255, "%d not found in BST — deletion aborted.", data);
        addStep(result, STEP_NOT_FOUND, -1, data, -1, msg);
        snprintf(result->summary, 511, "%d not found in the BST.", data);
        result->success = 0;
        return NULL;
    }

    addPathNode(result, root->data);
    result->comparisons++;

    if (data < root->data) {
        /* Target is in left subtree */
        snprintf(msg, 255, "Compare %d with %d: %d < %d → Go Left",
                 data, root->data, data, root->data);
        addStep(result, STEP_COMPARE, root->data, data, -1, msg);

        snprintf(msg, 255, "%d < %d → Moving left to find deletion target",
                 data, root->data);
        addStep(result, STEP_MOVE_LEFT, root->data, data, -1, msg);

        root->left = deleteNode(root->left, data, result);

    } else if (data > root->data) {
        /* Target is in right subtree */
        snprintf(msg, 255, "Compare %d with %d: %d > %d → Go Right",
                 data, root->data, data, root->data);
        addStep(result, STEP_COMPARE, root->data, data, -1, msg);

        snprintf(msg, 255, "%d > %d → Moving right to find deletion target",
                 data, root->data);
        addStep(result, STEP_MOVE_RIGHT, root->data, data, -1, msg);

        root->right = deleteNode(root->right, data, result);

    } else {
        /* FOUND the node to delete — determine which case applies */

        snprintf(msg, 255, "Found node %d — determining deletion case.", data);
        addStep(result, STEP_COMPARE, root->data, data, -1, msg);

        /* ---- CASE 1: Leaf Node (no children) ---- */
        if (root->left == NULL && root->right == NULL) {
            snprintf(msg, 255,
                "CASE 1 (Leaf Node): %d has no children. Removing directly.", data);
            addStep(result, STEP_LEAF_DELETE, root->data, data, -1, msg);
            strcpy(result->deletion_case, "LEAF");
            snprintf(result->summary, 511,
                "Deletion Case 1: %d is a leaf node. Removed directly.", data);
            result->success = 1;
            free(root);
            return NULL;
        }

        /* ---- CASE 2a: Only Right Child ---- */
        if (root->left == NULL) {
            Node *temp = root->right;
            snprintf(msg, 255,
                "CASE 2 (One Child): %d has only a right child (%d). "
                "Replacing with right child.", data, temp->data);
            addStep(result, STEP_ONE_CHILD_DEL, root->data, data, temp->data, msg);
            strcpy(result->deletion_case, "ONE_CHILD");
            snprintf(result->summary, 511,
                "Deletion Case 2: %d has one child (%d). "
                "Child replaces deleted node.", data, temp->data);
            result->success = 1;
            free(root);
            return temp;
        }

        /* ---- CASE 2b: Only Left Child ---- */
        if (root->right == NULL) {
            Node *temp = root->left;
            snprintf(msg, 255,
                "CASE 2 (One Child): %d has only a left child (%d). "
                "Replacing with left child.", data, temp->data);
            addStep(result, STEP_ONE_CHILD_DEL, root->data, data, temp->data, msg);
            strcpy(result->deletion_case, "ONE_CHILD");
            snprintf(result->summary, 511,
                "Deletion Case 2: %d has one child (%d). "
                "Child replaces deleted node.", data, temp->data);
            result->success = 1;
            free(root);
            return temp;
        }

        /* ---- CASE 3: Two Children ---- */
        /*
         * Strategy: Find inorder successor (leftmost in right subtree).
         * Copy its value to this node.
         * Delete the successor from the right subtree.
         * This maintains BST property because:
         *   - successor > all nodes in left subtree
         *   - successor < all other nodes in right subtree
         */
        Node *successor = findMin(root->right);
        int successorData = successor->data;  /* Capture now before it gets freed */

        snprintf(msg, 255,
            "CASE 3 (Two Children): %d has both left and right children. "
            "Finding inorder successor (smallest in right subtree).",
            data);
        addStep(result, STEP_TWO_CHILD_DEL, root->data, data, -1, msg);

        snprintf(msg, 255,
            "Inorder successor of %d is %d "
            "(leftmost node in right subtree).",
            data, successorData);
        addStep(result, STEP_SELECT_SUCC, successorData, data,
                successorData, msg);

        snprintf(msg, 255,
            "Replacing value %d with successor value %d.",
            data, successorData);
        addStep(result, STEP_REPLACE_NODE, root->data, data,
                successorData, msg);

        /* Copy successor's value into this node */
        int oldData = root->data;
        root->data = successorData;

        /* Now delete the successor from the right subtree */
        snprintf(msg, 255,
            "Deleting original successor node %d from right subtree.",
            successorData);
        addStep(result, STEP_DELETE, successorData, successorData, -1, msg);

        root->right = deleteNode(root->right, successorData, result);

        strcpy(result->deletion_case, "TWO_CHILDREN");
        snprintf(result->summary, 511,
            "Deletion Case 3: %d has two children. "
            "Replaced with inorder successor %d.",
            oldData, successorData);
        result->success = 1;
    }

    return root;
}

/* ============================================================
 * MEMORY MANAGEMENT
 * ============================================================ */

/**
 * freeTree - Free all memory used by a BST.
 *
 * Uses POST-ORDER traversal to free child nodes before parents.
 * This ensures no node is freed while its children still exist.
 *
 * TIME COMPLEXITY:  O(n) — visits every node once
 * SPACE COMPLEXITY: O(h) — recursion stack
 *
 * @param root  Root of the tree to free
 */
void freeTree(Node *root) {
    if (root == NULL) return;
    freeTree(root->left);   /* Free left subtree first */
    freeTree(root->right);  /* Free right subtree next */
    free(root);             /* Then free this node */
}

/**
 * copyTree - Create a deep copy of a BST (for undo history).
 *
 * Recursively creates new nodes with the same values.
 * The copy is completely independent — modifying one tree
 * does not affect the other.
 *
 * TIME COMPLEXITY:  O(n)
 * SPACE COMPLEXITY: O(n) for the copy + O(h) stack space
 *
 * @param root  Root of tree to copy
 * @return      Root of new independent copy
 */
Node* copyTree(Node *root) {
    if (root == NULL) return NULL;
    Node *newNode = createNode(root->data);
    if (newNode == NULL) return NULL;
    newNode->left  = copyTree(root->left);
    newNode->right = copyTree(root->right);
    return newNode;
}
