/**
 * traversal.h - BST Traversal Module Header
 *
 * Provides function prototypes for:
 *   - Inorder traversal   (Left → Root → Right)
 *   - Preorder traversal  (Root → Left → Right)
 *   - Postorder traversal (Left → Right → Root)
 *
 * Each traversal returns an array of visited node values
 * in the correct order, along with step-by-step records
 * for animation.
 */

#ifndef TRAVERSAL_H
#define TRAVERSAL_H

#include "bst.h"

/* ============================================================
 * TRAVERSAL RESULT
 * Returned by each traversal function.
 * Contains the ordered sequence and animation steps.
 * ============================================================ */

typedef struct TraversalResult {
    int sequence[BST_MAX_PATH];     /* Node values in traversal order */
    int count;                  /* Number of nodes visited */
    int steps_count;            /* Number of animation steps */
    OperationStep steps[MAX_STEPS]; /* Each step for animation */
    char name[32];              /* "INORDER", "PREORDER", "POSTORDER" */
    char description[256];      /* Human-readable traversal description */
} TraversalResult;

/* ============================================================
 * FUNCTION PROTOTYPES
 * ============================================================ */

/**
 * inorder - Traverse BST in inorder (Left → Root → Right).
 *
 * For a BST, inorder traversal produces nodes in
 * SORTED ASCENDING ORDER. This is the key property
 * used to verify BST correctness.
 *
 * @param root    Root of the BST
 * @param result  Filled with the traversal sequence and steps
 */
void inorder(Node *root, TraversalResult *result);

/**
 * preorder - Traverse BST in preorder (Root → Left → Right).
 *
 * Visits the root before its subtrees.
 * Useful for: creating a copy of the tree, prefix expressions.
 *
 * @param root    Root of the BST
 * @param result  Filled with the traversal sequence and steps
 */
void preorder(Node *root, TraversalResult *result);

/**
 * postorder - Traverse BST in postorder (Left → Right → Root).
 *
 * Visits children before the parent.
 * Useful for: deleting a tree, postfix expressions.
 *
 * @param root    Root of the BST
 * @param result  Filled with the traversal sequence and steps
 */
void postorder(Node *root, TraversalResult *result);

/**
 * initTraversalResult - Initialize a TraversalResult to clean state.
 */
void initTraversalResult(TraversalResult *result);

#endif /* TRAVERSAL_H */
