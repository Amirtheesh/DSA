#ifndef AVL_H
#define AVL_H

#include "bst.h"

/* AVL Node operations return new root after rotations */
Node* avl_insert(Node *root, int data, OperationResult *result);
Node* avl_deleteNode(Node *root, int data, OperationResult *result);

/* Rotations */
Node* rightRotate(Node *y, OperationResult *result);
Node* leftRotate(Node *x, OperationResult *result);
int getBalance(Node *N);
int height(Node *N);

#endif /* AVL_H */
