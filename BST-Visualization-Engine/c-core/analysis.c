/**
 * analysis.c - BST Analysis Implementation
 *
 * Implements all tree property calculations:
 *   - Structural: height, node counts, edge count
 *   - Validation: BST property check
 *   - Balance:    AVL-style balance check
 *   - Classification: Perfect, Complete, Full, Skewed
 *
 * ACADEMIC NOTE:
 *   These functions are commonly asked about in DSA viva exams.
 *   Each function has a clear algorithm description.
 *
 * CORRECTNESS NOTES:
 *   - Balance check visits EVERY node (not just root)
 *   - BST validation uses min/max bounds (correct approach)
 *   - Perfect tree check verifies all leaves at same depth
 */

#include "analysis.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

/* ============================================================
 * HEIGHT
 * ============================================================ */

/**
 * getHeight - Compute the height of the BST.
 *
 * HEIGHT DEFINITION:
 *   - Empty tree:   height = -1
 *   - Single node:  height = 0
 *   - General:      height = 1 + max(height(left), height(right))
 *
 * TIME COMPLEXITY:  O(n) — must visit every node
 * SPACE COMPLEXITY: O(h) — recursion stack
 */
int getHeight(Node *root) {
    if (root == NULL) return -1;

    int leftHeight  = getHeight(root->left);
    int rightHeight = getHeight(root->right);

    /* Height = 1 + the taller subtree's height */
    return 1 + (leftHeight > rightHeight ? leftHeight : rightHeight);
}

/* ============================================================
 * NODE COUNTS
 * ============================================================ */

/**
 * getNodeCount - Count all nodes in the BST.
 *
 * TIME COMPLEXITY:  O(n)
 * SPACE COMPLEXITY: O(h)
 */
int getNodeCount(Node *root) {
    if (root == NULL) return 0;
    return 1 + getNodeCount(root->left) + getNodeCount(root->right);
}

/**
 * getLeafCount - Count leaf nodes (no children).
 *
 * A leaf node has both left and right as NULL.
 *
 * TIME COMPLEXITY:  O(n)
 * SPACE COMPLEXITY: O(h)
 */
int getLeafCount(Node *root) {
    if (root == NULL) return 0;
    if (root->left == NULL && root->right == NULL) return 1; /* This is a leaf */
    return getLeafCount(root->left) + getLeafCount(root->right);
}

/**
 * getInternalCount - Count internal nodes (at least one child).
 *
 * internal = total - leaves
 *
 * TIME COMPLEXITY:  O(n)
 * SPACE COMPLEXITY: O(h)
 */
int getInternalCount(Node *root) {
    if (root == NULL) return 0;
    if (root->left == NULL && root->right == NULL) return 0; /* Leaf, not internal */
    return 1 + getInternalCount(root->left) + getInternalCount(root->right);
}

/* ============================================================
 * MIN / MAX
 * ============================================================ */

/**
 * getMin - Get minimum value.
 * In a BST, minimum is always in the leftmost position.
 */
int getMin(Node *root) {
    if (root == NULL) return INT_MIN;
    while (root->left != NULL) root = root->left;
    return root->data;
}

/**
 * getMax - Get maximum value.
 * In a BST, maximum is always in the rightmost position.
 */
int getMax(Node *root) {
    if (root == NULL) return INT_MAX;
    while (root->right != NULL) root = root->right;
    return root->data;
}

/* ============================================================
 * LEVELS AND EDGES
 * ============================================================ */

/**
 * getLevelCount - Number of levels = height + 1.
 * An empty tree has 0 levels. A single node has 1 level.
 */
int getLevelCount(Node *root) {
    if (root == NULL) return 0;
    return getHeight(root) + 1;
}

/**
 * getEdgeCount - Number of edges = total_nodes - 1.
 * Every node except root has exactly one incoming edge.
 */
int getEdgeCount(Node *root) {
    int n = getNodeCount(root);
    return n > 0 ? n - 1 : 0;
}

/* ============================================================
 * BST VALIDATION
 * ============================================================ */

/**
 * validateBSTHelper - Recursive BST validation using bounds.
 *
 * ALGORITHM:
 *   For each node, check:
 *     1. node->data > min_bound (inherited from left path decisions)
 *     2. node->data < max_bound (inherited from right path decisions)
 *
 *   When traversing LEFT:  max_bound becomes current node's data
 *   When traversing RIGHT: min_bound becomes current node's data
 *
 *   WHY THIS WORKS:
 *     A common wrong approach checks only direct parent-child.
 *     Example of a tree that fails the naive check but is NOT a BST:
 *
 *         10
 *        /  \
 *       5    15
 *            /
 *            6   ← 6 > 10 is FALSE but simple parent check misses this!
 *
 *     The bounds approach correctly catches this case.
 *
 * @param root      Current node
 * @param min_bound Minimum allowed value (exclusive)
 * @param max_bound Maximum allowed value (exclusive)
 * @return 1 if valid, 0 if not
 */
static int validateBSTHelper(Node *root, int min_bound, int max_bound) {
    if (root == NULL) return 1; /* Empty subtree is valid */

    /* Check bounds: strictly greater than min, strictly less than max */
    if (root->data <= min_bound || root->data >= max_bound) {
        return 0; /* Violates BST property */
    }

    /* Recurse on subtrees with updated bounds */
    return validateBSTHelper(root->left,  min_bound,   root->data) &&
           validateBSTHelper(root->right, root->data,  max_bound);
}

/**
 * validateBST - Public BST validation entry point.
 *
 * @param root  Root of the tree to validate
 * @return      1 if valid BST, 0 otherwise
 */
int validateBST(Node *root) {
    return validateBSTHelper(root, INT_MIN, INT_MAX);
}

/* ============================================================
 * BALANCE CHECK
 * ============================================================ */

/**
 * isBalancedHelper - Check balance at every node.
 *
 * A tree is balanced if for EVERY node:
 *   |height(left subtree) - height(right subtree)| <= 1
 *
 * Returns -1 if unbalanced (used as sentinel).
 * Returns the actual height if balanced.
 *
 * This runs in O(n) by computing height and checking balance
 * in a single pass (not two separate passes).
 */
static int isBalancedHelper(Node *root) {
    if (root == NULL) return 0;  /* Height of empty tree = 0 for this helper */

    int leftH  = isBalancedHelper(root->left);
    if (leftH == -1) return -1;  /* Left subtree unbalanced */

    int rightH = isBalancedHelper(root->right);
    if (rightH == -1) return -1; /* Right subtree unbalanced */

    int diff = leftH - rightH;
    if (diff < -1 || diff > 1) return -1; /* This node unbalanced */

    /* Return height of this subtree */
    return 1 + (leftH > rightH ? leftH : rightH);
}

/**
 * isBalanced - Public balance check.
 */
int isBalanced(Node *root) {
    return isBalancedHelper(root) != -1;
}

/* ============================================================
 * TREE CLASSIFICATION
 * ============================================================ */

/**
 * isPerfect - Check if tree is a Perfect Binary Tree.
 *
 * A Perfect Binary Tree has:
 *   1. All internal nodes have exactly 2 children
 *   2. All leaves are at the same level
 *
 * For a perfect binary tree with height h:
 *   Total nodes = 2^(h+1) - 1
 *
 * We use this formula to check: if nodes == 2^(levels) - 1
 */
int isPerfect(Node *root) {
    if (root == NULL) return 1; /* Vacuously true */

    int h = getHeight(root) + 1; /* number of levels */
    int n = getNodeCount(root);

    /* 2^h - 1 nodes required for a perfect tree of height h-1 */
    int required = (1 << h) - 1;  /* 1 << h = 2^h */
    return n == required;
}

/**
 * isCompleteHelper - Helper for complete binary tree check.
 *
 * ALGORITHM:
 *   In a complete tree, if we number nodes by level-order
 *   (root = 1, left = 2i, right = 2i+1), then all node
 *   indices should be <= total_nodes.
 *
 *   Alternatively: once we see a NULL pointer in level-order,
 *   all subsequent nodes must also be NULL.
 *
 *   We check: for a node with index i, i <= n (total nodes).
 *   If any node has index > n, the tree is incomplete.
 */
static int isCompleteHelper(Node *root, int index, int n) {
    if (root == NULL) return 1;
    if (index >= n) return 0;  /* Node index exceeds total count */
    return isCompleteHelper(root->left,  2 * index + 1, n) &&
           isCompleteHelper(root->right, 2 * index + 2, n);
}

/**
 * isComplete - Check if BST is a Complete Binary Tree.
 *
 * A Complete Binary Tree: all levels are fully filled except
 * possibly the last level, which is filled from left to right.
 */
int isComplete(Node *root) {
    if (root == NULL) return 1;
    int n = getNodeCount(root);
    return isCompleteHelper(root, 0, n);
}

/**
 * isFull - Check if BST is a Full Binary Tree.
 *
 * A Full Binary Tree: every node has either 0 or 2 children.
 * No node has exactly one child.
 */
int isFull(Node *root) {
    if (root == NULL) return 1;

    /* Leaf node: OK */
    if (root->left == NULL && root->right == NULL) return 1;

    /* Has exactly one child: NOT full */
    if (root->left == NULL || root->right == NULL) return 0;

    /* Has both children: check recursively */
    return isFull(root->left) && isFull(root->right);
}

/**
 * isLeftSkewed - Check if tree is completely left-skewed.
 *
 * Every node has at most a left child (no right children).
 * This represents the WORST CASE for a BST: O(n) for all ops.
 *
 * Created by inserting values in descending order:
 *   e.g., 80, 70, 60, 50, 40, 30, 20
 */
int isLeftSkewed(Node *root) {
    if (root == NULL) return 1;
    if (root->right != NULL) return 0;  /* Has a right child → not left-skewed */
    return isLeftSkewed(root->left);
}

/**
 * isRightSkewed - Check if tree is completely right-skewed.
 *
 * Every node has at most a right child (no left children).
 * Also worst case O(n).
 *
 * Created by inserting values in ascending order:
 *   e.g., 10, 20, 30, 40, 50
 */
int isRightSkewed(Node *root) {
    if (root == NULL) return 1;
    if (root->left != NULL) return 0;   /* Has a left child → not right-skewed */
    return isRightSkewed(root->right);
}

/* ============================================================
 * MASTER ANALYSIS FUNCTION
 * ============================================================ */

/**
 * analyzeTree - Compute all BST properties and fill TreeAnalysis.
 *
 * This is the single entry point for full tree analysis.
 * Called by the API layer to populate the analysis dashboard.
 */
void analyzeTree(Node *root, TreeAnalysis *result) {
    /* Clear the result struct */
    memset(result, 0, sizeof(TreeAnalysis));

    if (root == NULL) {
        result->total_nodes   = 0;
        result->leaf_nodes    = 0;
        result->internal_nodes = 0;
        result->height        = -1;
        result->levels        = 0;
        result->edges         = 0;
        result->min_value     = 0;
        result->max_value     = 0;
        result->is_valid_bst  = 1;
        result->is_balanced   = 1;
        result->is_perfect    = 1;
        result->is_complete   = 1;
        result->is_full       = 1;
        result->is_left_skewed  = 1;
        result->is_right_skewed = 1;
        strcpy(result->tree_type, "Empty Tree");
        strcpy(result->validation_msg, "Empty tree is trivially a valid BST.");
        strcpy(result->balance_msg, "Empty tree is trivially balanced.");
        strcpy(result->complexity_note,
               "No operations possible on empty tree.");
        return;
    }

    /* Compute all metrics */
    result->total_nodes     = getNodeCount(root);
    result->leaf_nodes      = getLeafCount(root);
    result->internal_nodes  = getInternalCount(root);
    result->height          = getHeight(root);
    result->levels          = getLevelCount(root);
    result->edges           = getEdgeCount(root);
    result->min_value       = getMin(root);
    result->max_value       = getMax(root);

    /* BST Validation */
    result->is_valid_bst = validateBST(root);
    if (result->is_valid_bst) {
        strcpy(result->validation_msg,
               "Valid BST: All nodes satisfy left < node < right property.");
    } else {
        strcpy(result->validation_msg,
               "Invalid BST: Some node violates the BST property.");
    }

    /* Balance Check */
    result->is_balanced = isBalanced(root);
    int lh = getHeight(root->left);
    int rh = getHeight(root->right);
    result->balance_factor = lh - rh;

    if (result->is_balanced) {
        snprintf(result->balance_msg, 255,
                 "Balanced: All nodes satisfy |h(left) - h(right)| ≤ 1. "
                 "Operations run in O(log n).");
    } else {
        snprintf(result->balance_msg, 255,
                 "Unbalanced: Some node has |h(left) - h(right)| > 1. "
                 "Worst-case operations may approach O(n).");
    }

    /* Tree Classification */
    result->is_perfect       = isPerfect(root);
    result->is_complete      = isComplete(root);
    result->is_full          = isFull(root);
    result->is_left_skewed   = isLeftSkewed(root);
    result->is_right_skewed  = isRightSkewed(root);

    /* Determine tree type label */
    if (result->is_left_skewed && result->total_nodes > 1) {
        strcpy(result->tree_type, "Left-Skewed BST");
        strcpy(result->complexity_note,
               "Left-Skewed BST: degenerates to a linked list. "
               "All operations O(n) in the worst case. "
               "Self-balancing trees (AVL, Red-Black) were invented to fix this.");
    } else if (result->is_right_skewed && result->total_nodes > 1) {
        strcpy(result->tree_type, "Right-Skewed BST");
        strcpy(result->complexity_note,
               "Right-Skewed BST: degenerates to a linked list. "
               "All operations O(n) in the worst case. "
               "Inserting values in ascending order always produces this shape.");
    } else if (result->is_perfect) {
        strcpy(result->tree_type, "Perfect Binary BST");
        snprintf(result->complexity_note, 511,
                 "Perfect Binary Tree: All %d leaf nodes at same level. "
                 "Total nodes = 2^(h+1)-1. All operations O(log n). "
                 "This is the ideal BST shape.", result->leaf_nodes);
    } else if (result->is_complete && result->is_full) {
        strcpy(result->tree_type, "Complete & Full BST");
        strcpy(result->complexity_note,
               "Complete & Full BST: Every node has 0 or 2 children and "
               "all levels are filled left-to-right. Operations O(log n).");
    } else if (result->is_complete) {
        strcpy(result->tree_type, "Complete BST");
        strcpy(result->complexity_note,
               "Complete BST: All levels filled except possibly the last "
               "(filled left to right). Operations O(log n).");
    } else if (result->is_full) {
        strcpy(result->tree_type, "Full BST");
        strcpy(result->complexity_note,
               "Full BST: Every node has exactly 0 or 2 children. "
               "Leaf nodes = internal nodes + 1.");
    } else if (result->is_balanced) {
        strcpy(result->tree_type, "Balanced BST");
        strcpy(result->complexity_note,
               "Balanced BST: Height difference at every node ≤ 1. "
               "Operations O(log n) guaranteed.");
    } else {
        strcpy(result->tree_type, "Unbalanced BST");
        snprintf(result->complexity_note, 511,
                 "Unbalanced BST: Height %d with %d nodes. "
                 "Optimal height would be ~%d for %d nodes. "
                 "Operations may approach O(n) in extreme cases.",
                 result->height, result->total_nodes,
                 (int)(__builtin_clz(1) - __builtin_clz(result->total_nodes)),
                 result->total_nodes);
    }
}
