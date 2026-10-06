class JSAVLEngine extends JSBSTEngine {
    constructor() {
        super();
    }

    _getHeightAVL(node) {
        if (!node) return 0;
        return Math.max(this._getHeightAVL(node.left), this._getHeightAVL(node.right)) + 1;
    }

    _getBalance(node) {
        if (!node) return 0;
        return this._getHeightAVL(node.left) - this._getHeightAVL(node.right);
    }

    _rightRotate(y, result) {
        const x = y.left;
        const T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        if (result) {
            result.steps.push({
                type: 14, // Custom step for rotate
                node_value: y.data,
                target_value: y.data,
                message: `Right rotate around node ${y.data}`
            });
        }
        return x;
    }

    _leftRotate(x, result) {
        const y = x.right;
        const T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        if (result) {
            result.steps.push({
                type: 15, // Custom step for rotate
                node_value: x.data,
                target_value: x.data,
                message: `Left rotate around node ${x.data}`
            });
        }
        return y;
    }

    _insertHelper(node, value, result) {
        // Normal BST insertion
        if (node === null) {
            result.steps.push({
                type: 6,
                node_value: value,
                target_value: value,
                message: `Inserted ${value} as new leaf node.`
            });
            result.success = 1;
            return this._createNode(value);
        }

        result.comparisons++;
        result.steps.push({
            type: 1,
            node_value: node.data,
            target_value: value,
            message: `Comparing ${value} with ${node.data}.`
        });

        if (value < node.data) {
            result.steps.push({
                type: 2, node_value: node.data, target_value: value,
                message: 'Going left.'
            });
            result.path.push(node.data);
            node.left = this._insertHelper(node.left, value, result);
        } else if (value > node.data) {
            result.steps.push({
                type: 3, node_value: node.data, target_value: value,
                message: 'Going right.'
            });
            result.path.push(node.data);
            node.right = this._insertHelper(node.right, value, result);
        } else {
            result.steps.push({
                type: 4, node_value: node.data, target_value: value,
                message: `Duplicate value ${value} ignored.`
            });
            return node;
        }

        // Get balance factor
        const balance = this._getBalance(node);

        // Left Left Case
        if (balance > 1 && value < node.left.data) {
            result.steps.push({ type: 16, node_value: node.data, target_value: value, message: 'Left-Left imbalance detected' });
            return this._rightRotate(node, result);
        }

        // Right Right Case
        if (balance < -1 && value > node.right.data) {
            result.steps.push({ type: 16, node_value: node.data, target_value: value, message: 'Right-Right imbalance detected' });
            return this._leftRotate(node, result);
        }

        // Left Right Case
        if (balance > 1 && value > node.left.data) {
            result.steps.push({ type: 16, node_value: node.data, target_value: value, message: 'Left-Right imbalance detected' });
            node.left = this._leftRotate(node.left, result);
            return this._rightRotate(node, result);
        }

        // Right Left Case
        if (balance < -1 && value < node.right.data) {
            result.steps.push({ type: 16, node_value: node.data, target_value: value, message: 'Right-Left imbalance detected' });
            node.right = this._rightRotate(node.right, result);
            return this._leftRotate(node, result);
        }

        return node;
    }
}
window.JSAVLEngine = JSAVLEngine;
