/**
 * bst.h - Binary Search Tree Core Header
 * 
 * Defines the fundamental BST data structure and all
 * function prototypes for BST operations.
 * 
 * Architecture:
 *   bst.h (this file)
 *     ↓
 *   bst.c  (BST creation, insertion, search, deletion)
 *   traversal.c (inorder, preorder, postorder)
 *   analysis.c  (height, count, validation, classification)
 *   api.c       (Emscripten-exported interface)
 */

#ifndef BST_H
#define BST_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================
 * CORE DATA STRUCTURE
 * ============================================================ */

/**
 * BST Node - fundamental building block.
 * Each node stores an integer value and pointers to
 * its left and right children.
 */
typedef struct Node {
    int data;
    struct Node *left;
    struct Node *right;
} Node;

/* ============================================================
 * OPERATION STEP TYPES
 * These constants represent each type of step that can
 * be recorded during an algorithm execution.
 * The frontend animation engine processes these sequentially.
 * ============================================================ */

#define STEP_COMPARE        1   /* Comparing value with current node */
#define STEP_MOVE_LEFT      2   /* Decision: go left */
#define STEP_MOVE_RIGHT     3   /* Decision: go right */
#define STEP_FOUND          4   /* Value found */
#define STEP_NOT_FOUND      5   /* Value not found */
#define STEP_INSERT         6   /* Node inserted */
#define STEP_DELETE         7   /* Node deleted */
#define STEP_SELECT_SUCC    8   /* Inorder successor selected */
#define STEP_REPLACE_NODE   9   /* Node value replaced with successor */
#define STEP_VISIT          10  /* Node visited during traversal */
#define STEP_LEAF_DELETE    11  /* Leaf node deletion */
#define STEP_ONE_CHILD_DEL  12  /* One-child node deletion */
#define STEP_TWO_CHILD_DEL  13  /* Two-child node deletion */

/* Maximum number of operation steps per operation */
#define MAX_STEPS 256

/* Maximum number of nodes in path/sequence */
#define BST_MAX_PATH  128

/* Maximum output buffer size for serialized data */
#define MAX_OUTPUT 8192

/* ============================================================
 * OPERATION STEP - sent from C to JavaScript
 * Each step describes one action in the algorithm.
 * ============================================================ */

typedef struct OperationStep {
    int type;           /* One of the STEP_* constants above */
    int node_value;     /* The node currently being processed */
    int target_value;   /* The value being searched/inserted/deleted */
    int successor_val;  /* Used in two-child deletion */
    char message[256];  /* Human-readable description of this step */
} OperationStep;

/* ============================================================
 * OPERATION RESULT - returned after an operation completes
 * Contains all steps, the path taken, and metadata.
 * ============================================================ */

typedef struct OperationResult {
    int success;                        /* 1 = operation succeeded */
    int steps_count;                    /* Number of steps recorded */
    int path_count;                     /* Number of nodes in path */
    int comparisons;                    /* Total comparisons made */
    int path[BST_MAX_PATH];                 /* Node values along the path */
    OperationStep steps[MAX_STEPS];     /* Ordered steps */
    char summary[512];                  /* Final summary message */
    char deletion_case[128];            /* "LEAF", "ONE_CHILD", "TWO_CHILDREN" */
} OperationResult;

/* ============================================================
 * FUNCTION PROTOTYPES - bst.c
 * ============================================================ */

/* Create a new BST node with given data */
Node* createNode(int data);

/* Insert a value into the BST; returns new root */
Node* insert(Node *root, int data, OperationResult *result);

/* Search for a value; fills result with steps and path */
Node* search(Node *root, int data, OperationResult *result);

/* Delete a value from BST; returns new root */
Node* deleteNode(Node *root, int data, OperationResult *result);

/* Find the node with minimum value in a subtree */
Node* findMin(Node *root);

/* Find the node with maximum value in a subtree */
Node* findMax(Node *root);

/* Free all memory in the BST (post-order deletion) */
void freeTree(Node *root);

/* Copy a tree (for undo history) */
Node* copyTree(Node *root);

/* Initialize an OperationResult struct */
void initResult(OperationResult *result);

/* Add a step to an OperationResult */
void addStep(OperationResult *result, int type, int node_val,
             int target_val, int succ_val, const char *msg);

/* Advanced Operations */
Node* findMinimumOp(Node *root, OperationResult *result);
Node* findMaximumOp(Node *root, OperationResult *result);
int findDepthOp(Node *root, int data, OperationResult *result);
Node* findParentOp(Node *root, int data, OperationResult *result);
Node* findSiblingOp(Node *root, int data, OperationResult *result);
Node* findLCAOp(Node *root, int data1, int data2, OperationResult *result);

#endif /* BST_H */
