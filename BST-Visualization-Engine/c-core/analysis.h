/**
 * analysis.h - BST Analysis Module Header
 *
 * Provides function prototypes for computing tree properties:
 *   - Height calculation
 *   - Node counting (total, leaf, internal)
 *   - BST validation
 *   - Balance detection
 *   - Tree type classification
 *   - Edge counting
 *   - Skewed tree detection
 */

#ifndef ANALYSIS_H
#define ANALYSIS_H

#include "bst.h"
#include <limits.h>

/* ============================================================
 * TREE ANALYSIS RESULT
 * All computed properties of the tree packed into one struct.
 * ============================================================ */

typedef struct TreeAnalysis {
    /* Structural metrics */
    int total_nodes;        /* Total number of nodes */
    int leaf_nodes;         /* Nodes with no children */
    int internal_nodes;     /* Nodes with at least one child */
    int height;             /* Height of tree (0 for single node) */
    int levels;             /* Number of levels (height + 1) */
    int edges;              /* Total edges = total_nodes - 1 */

    /* Value metrics */
    int min_value;          /* Minimum value in BST */
    int max_value;          /* Maximum value in BST */

    /* Validation */
    int is_valid_bst;       /* 1 if structure satisfies BST property */
    char validation_msg[256];

    /* Balance */
    int is_balanced;        /* 1 if height-balanced (AVL-like) */
    int balance_factor;     /* Height difference of subtrees at root */
    char balance_msg[256];

    /* Classification flags */
    int is_perfect;         /* All leaves at same level, all internal nodes full */
    int is_complete;        /* All levels full except possibly last (left-filled) */
    int is_full;            /* Every node has 0 or 2 children */
    int is_left_skewed;     /* All nodes only have left children */
    int is_right_skewed;    /* All nodes only have right children */

    /* Classification label */
    char tree_type[128];    /* E.g. "Perfect Binary Tree", "Right-Skewed" */
    char complexity_note[512]; /* Complexity explanation based on tree shape */
} TreeAnalysis;

/* ============================================================
 * FUNCTION PROTOTYPES
 * ============================================================ */

/** Compute the height of the BST (0 for single node, -1 for empty) */
int getHeight(Node *root);

/** Count total nodes in the BST */
int getNodeCount(Node *root);

/** Count leaf nodes (nodes with no children) */
int getLeafCount(Node *root);

/** Count internal nodes (nodes with at least one child) */
int getInternalCount(Node *root);

/** Get minimum value in BST */
int getMin(Node *root);

/** Get maximum value in BST */
int getMax(Node *root);

/** Count total levels in BST (= height + 1) */
int getLevelCount(Node *root);

/** Count total edges in BST (= total_nodes - 1) */
int getEdgeCount(Node *root);

/**
 * validateBST - Check if a tree truly satisfies BST property.
 *
 * Uses the min/max bounds approach:
 * Each node must satisfy: min_bound < node->data < max_bound
 * Initially: min = INT_MIN, max = INT_MAX
 * When going left:  max becomes current node's value
 * When going right: min becomes current node's value
 *
 * @return 1 if valid BST, 0 otherwise
 */
int validateBST(Node *root);

/**
 * isBalanced - Check if BST is height-balanced.
 *
 * A tree is height-balanced if for EVERY node:
 * |height(left) - height(right)| <= 1
 *
 * This is the AVL balance condition.
 * Simply checking the root's subtrees is NOT sufficient.
 *
 * @return 1 if balanced, 0 otherwise
 */
int isBalanced(Node *root);

/** Check if BST is a Perfect Binary Tree */
int isPerfect(Node *root);

/** Check if BST is a Complete Binary Tree */
int isComplete(Node *root);

/** Check if BST is a Full Binary Tree */
int isFull(Node *root);

/** Check if BST is Left-Skewed (every node has only left child) */
int isLeftSkewed(Node *root);

/** Check if BST is Right-Skewed (every node has only right child) */
int isRightSkewed(Node *root);

/**
 * analyzeTree - Compute ALL tree properties at once.
 *
 * This is the main entry point called by the API.
 * Fills a TreeAnalysis struct with all computed values.
 *
 * @param root    Root of the BST
 * @param result  Struct to fill with analysis results
 */
void analyzeTree(Node *root, TreeAnalysis *result);

#endif /* ANALYSIS_H */
