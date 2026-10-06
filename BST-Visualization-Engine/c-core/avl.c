#include "avl.h"

// Max macro
#define MAX(a,b) (((a)>(b))?(a):(b))

// A utility function to get the height of the tree
int height(Node *N) {
    if (N == NULL)
        return 0;
    
    int lh = height(N->left);
    int rh = height(N->right);
    return MAX(lh, rh) + 1;
}

// Get Balance factor of node N
int getBalance(Node *N) {
    if (N == NULL)
        return 0;
    return height(N->left) - height(N->right);
}

// Right rotate
Node *rightRotate(Node *y, OperationResult *result) {
    Node *x = y->left;
    Node *T2 = x->right;

    // Perform rotation
    x->right = y;
    y->left = T2;

    if (result) {
        char msg[128];
        snprintf(msg, sizeof(msg), "Right rotate around node %d", y->data);
        addStep(result, 14, y->data, y->data, 0, msg);
    }

    // Return new root
    return x;
}

// Left rotate
Node *leftRotate(Node *x, OperationResult *result) {
    Node *y = x->right;
    Node *T2 = y->left;

    // Perform rotation
    y->left = x;
    x->right = T2;

    if (result) {
        char msg[128];
        snprintf(msg, sizeof(msg), "Left rotate around node %d", x->data);
        addStep(result, 15, x->data, x->data, 0, msg);
    }

    // Return new root
    return y;
}

// Recursive function to insert a key in the subtree rooted
// with node and returns the new root of the subtree.
Node* avl_insert(Node* node, int data, OperationResult *result) {
    /* 1. Perform the normal BST insertion */
    if (node == NULL) {
        Node* n = createNode(data);
        if (result) {
            char msg[128];
            snprintf(msg, sizeof(msg), "Inserted %d as new leaf node.", data);
            addStep(result, STEP_INSERT, data, data, 0, msg);
        }
        return (n);
    }

    if (result) {
        char msg[128];
        snprintf(msg, sizeof(msg), "Comparing %d with %d.", data, node->data);
        addStep(result, STEP_COMPARE, node->data, data, 0, msg);
    }

    if (data < node->data) {
        if (result) {
            addStep(result, STEP_MOVE_LEFT, node->data, data, 0, "Going left.");
            result->path[result->path_count++] = node->data;
        }
        node->left  = avl_insert(node->left, data, result);
    } else if (data > node->data) {
        if (result) {
            addStep(result, STEP_MOVE_RIGHT, node->data, data, 0, "Going right.");
            result->path[result->path_count++] = node->data;
        }
        node->right = avl_insert(node->right, data, result);
    } else { // Equal keys are not allowed in BST
        if (result) {
            char msg[128];
            snprintf(msg, sizeof(msg), "Duplicate value %d ignored.", data);
            addStep(result, STEP_FOUND, node->data, data, 0, msg);
        }
        return node;
    }

    /* 2. Update height? (Implicitly calculated in getBalance, though O(N) at each node, it's fine for small viz trees) */
    
    /* 3. Get the balance factor of this ancestor node to check whether this node became unbalanced */
    int balance = getBalance(node);

    // If this node becomes unbalanced, then there are 4 cases

    // Left Left Case
    if (balance > 1 && data < node->left->data) {
        if (result) addStep(result, 16, node->data, data, 0, "Left-Left imbalance detected");
        return rightRotate(node, result);
    }

    // Right Right Case
    if (balance < -1 && data > node->right->data) {
        if (result) addStep(result, 16, node->data, data, 0, "Right-Right imbalance detected");
        return leftRotate(node, result);
    }

    // Left Right Case
    if (balance > 1 && data > node->left->data) {
        if (result) addStep(result, 16, node->data, data, 0, "Left-Right imbalance detected");
        node->left = leftRotate(node->left, result);
        return rightRotate(node, result);
    }

    // Right Left Case
    if (balance < -1 && data < node->right->data) {
        if (result) addStep(result, 16, node->data, data, 0, "Right-Left imbalance detected");
        node->right = rightRotate(node->right, result);
        return leftRotate(node, result);
    }

    /* return the (unchanged) node pointer */
    return node;
}
