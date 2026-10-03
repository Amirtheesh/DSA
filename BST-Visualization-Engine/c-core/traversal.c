/**
 * traversal.c - BST Traversal Implementation
 *
 * Implements three fundamental tree traversal algorithms.
 * Each traversal records step-by-step information for
 * the frontend animation engine to process sequentially.
 *
 * TRAVERSAL ORDER SUMMARY:
 * ┌─────────────┬─────────────────────────────┬────────────────────────┐
 * │ Traversal   │ Order                       │ Primary Use            │
 * ├─────────────┼─────────────────────────────┼────────────────────────┤
 * │ Inorder     │ Left → Root → Right         │ Sorted output from BST │
 * │ Preorder    │ Root → Left → Right         │ Tree copying/serialization│
 * │ Postorder   │ Left → Right → Root         │ Tree deletion          │
 * └─────────────┴─────────────────────────────┴────────────────────────┘
 *
 * TIME COMPLEXITY:  O(n) for all traversals — each node visited once
 * SPACE COMPLEXITY: O(h) for recursion stack (h = height)
 */

#include "traversal.h"
#include <stdio.h>
#include <string.h>

/* ============================================================
 * INITIALIZATION
 * ============================================================ */

/**
 * initTraversalResult - Initialize a TraversalResult struct.
 */
void initTraversalResult(TraversalResult *result) {
    result->count = 0;
    result->steps_count = 0;
    memset(result->sequence, 0, sizeof(result->sequence));
    memset(result->steps, 0, sizeof(result->steps));
    result->name[0] = '\0';
    result->description[0] = '\0';
}

/* ============================================================
 * INTERNAL HELPERS
 * ============================================================ */

/**
 * addTraversalStep - Record one traversal step.
 */
static void addTraversalStep(TraversalResult *result, int node_val,
                              const char *msg) {
    if (result->steps_count >= MAX_STEPS) return;
    OperationStep *step = &result->steps[result->steps_count++];
    step->type = STEP_VISIT;
    step->node_value = node_val;
    step->target_value = -1;
    step->successor_val = -1;
    strncpy(step->message, msg, 255);
    step->message[255] = '\0';
}

/**
 * addToSequence - Add a node value to traversal sequence.
 */
static void addToSequence(TraversalResult *result, int val) {
    if (result->count < BST_MAX_PATH) {
        result->sequence[result->count++] = val;
    }
}

/* ============================================================
 * INORDER TRAVERSAL
 * Left → Root → Right
 * ============================================================ */

/**
 * inorderHelper - Recursive helper for inorder traversal.
 */
static void inorderHelper(Node *root, TraversalResult *result) {
    if (root == NULL) return;

    /* Step 1: Go Left */
    inorderHelper(root->left, result);

    /* Step 2: Visit Root (record this visit) */
    char msg[256];
    snprintf(msg, 255, "Visit node %d [INORDER: L→Root→R]", root->data);
    addTraversalStep(result, root->data, msg);
    addToSequence(result, root->data);

    /* Step 3: Go Right */
    inorderHelper(root->right, result);
}

/**
 * inorder - Public inorder traversal entry point.
 *
 * MATHEMATICAL PROPERTY:
 *   For a BST, inorder traversal always produces elements
 *   in non-decreasing order. This is a fundamental theorem
 *   of BSTs and is often used to verify BST correctness.
 *
 * EXAMPLE:
 *       50
 *      /  \
 *    30    70
 *   / \   / \
 *  20  40 60  80
 *
 *   Inorder: 20, 30, 40, 50, 60, 70, 80  ← sorted!
 */
void inorder(Node *root, TraversalResult *result) {
    initTraversalResult(result);
    strcpy(result->name, "INORDER");
    strcpy(result->description,
           "Inorder (Left→Root→Right): Visits nodes in sorted ascending order.");

    if (root == NULL) {
        result->description[0] = '\0';
        strcpy(result->description, "Tree is empty. No traversal possible.");
        return;
    }

    inorderHelper(root, result);
}

/* ============================================================
 * PREORDER TRAVERSAL
 * Root → Left → Right
 * ============================================================ */

/**
 * preorderHelper - Recursive helper for preorder traversal.
 */
static void preorderHelper(Node *root, TraversalResult *result) {
    if (root == NULL) return;

    /* Step 1: Visit Root FIRST */
    char msg[256];
    snprintf(msg, 255, "Visit node %d [PREORDER: Root→L→R]", root->data);
    addTraversalStep(result, root->data, msg);
    addToSequence(result, root->data);

    /* Step 2: Go Left */
    preorderHelper(root->left, result);

    /* Step 3: Go Right */
    preorderHelper(root->right, result);
}

/**
 * preorder - Public preorder traversal entry point.
 *
 * USE CASE:
 *   Preorder traversal can be used to create a copy of the tree.
 *   The first element is always the root, making it useful
 *   for serializing and reconstructing a BST.
 *
 * EXAMPLE:
 *       50                    Preorder: 50, 30, 20, 40, 70, 60, 80
 *      /  \                   (Root is always first)
 *    30    70
 *   / \   / \
 *  20  40 60  80
 */
void preorder(Node *root, TraversalResult *result) {
    initTraversalResult(result);
    strcpy(result->name, "PREORDER");
    strcpy(result->description,
           "Preorder (Root→Left→Right): Visits root first, useful for tree copying.");

    if (root == NULL) {
        strcpy(result->description, "Tree is empty. No traversal possible.");
        return;
    }

    preorderHelper(root, result);
}

/* ============================================================
 * POSTORDER TRAVERSAL
 * Left → Right → Root
 * ============================================================ */

/**
 * postorderHelper - Recursive helper for postorder traversal.
 */
static void postorderHelper(Node *root, TraversalResult *result) {
    if (root == NULL) return;

    /* Step 1: Go Left */
    postorderHelper(root->left, result);

    /* Step 2: Go Right */
    postorderHelper(root->right, result);

    /* Step 3: Visit Root LAST */
    char msg[256];
    snprintf(msg, 255, "Visit node %d [POSTORDER: L→R→Root]", root->data);
    addTraversalStep(result, root->data, msg);
    addToSequence(result, root->data);
}

/**
 * postorder - Public postorder traversal entry point.
 *
 * USE CASE:
 *   Postorder visits all children before the parent.
 *   This mirrors the order in which nodes must be freed
 *   during tree deletion — children freed before parents.
 *
 * EXAMPLE:
 *       50                    Postorder: 20, 40, 30, 60, 80, 70, 50
 *      /  \                   (Root is always last)
 *    30    70
 *   / \   / \
 *  20  40 60  80
 */
void postorder(Node *root, TraversalResult *result) {
    initTraversalResult(result);
    strcpy(result->name, "POSTORDER");
    strcpy(result->description,
           "Postorder (Left→Right→Root): Visits root last, used for tree deletion.");

    if (root == NULL) {
        strcpy(result->description, "Tree is empty. No traversal possible.");
        return;
    }

    postorderHelper(root, result);
}
