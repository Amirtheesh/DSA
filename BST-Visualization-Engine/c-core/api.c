/**
 * api.c - Emscripten WebAssembly API Layer
 *
 * This file provides the interface between the C BST engine
 * and the JavaScript frontend via WebAssembly.
 *
 * ARCHITECTURE:
 *   C BST Engine (bst.c, traversal.c, analysis.c)
 *         ↓
 *   api.c  (this file - marshals data, manages global state)
 *         ↓
 *   Emscripten + EMSCRIPTEN_KEEPALIVE
 *         ↓
 *   WebAssembly Module (bst.wasm)
 *         ↓
 *   JavaScript bridge (wasm/bst.js)
 *         ↓
 *   Frontend Visualization
 *
 * DATA TRANSFER STRATEGY:
 *   C → JS: Serialized JSON strings written to a shared char buffer.
 *           JS reads the buffer using UTF8ToString().
 *   JS → C: Integer and string arguments passed directly as WASM args.
 *
 * GLOBAL STATE:
 *   The BST root pointer is maintained as a global variable.
 *   This avoids passing pointers across the JS/WASM boundary.
 *   The entire tree state lives in C-managed memory.
 *
 * UNDO SUPPORT:
 *   Before destructive operations, the previous tree is saved
 *   to `undo_root`. One level of undo is supported.
 */

#include "bst.h"
#include "traversal.h"
#include "analysis.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

/* Emscripten macros (no-ops when compiled with GCC for testing) */
#ifdef __EMSCRIPTEN__
  #include <emscripten/emscripten.h>
#else
  /* When compiled with GCC for testing, EMSCRIPTEN_KEEPALIVE is a no-op */
  #define EMSCRIPTEN_KEEPALIVE
  /* Provide a simple main() for standalone testing */
  #define STANDALONE_TEST
#endif

/* ============================================================
 * GLOBAL STATE
 * ============================================================ */

/* Current BST root — all operations use this */
static Node *bst_root = NULL;

/* Saved tree for undo — one level of undo supported */
static Node *undo_root = NULL;

/* Whether an undo snapshot exists */
static int undo_available = 0;

/* Shared output buffer used to return strings to JavaScript */
static char output_buffer[MAX_OUTPUT];

/* ============================================================
 * INTERNAL HELPER: JSON SERIALIZATION
 * ============================================================ */

/**
 * serializeNode - Recursively serialize a BST node to JSON.
 *
 * Output format:
 * {
 *   "value": 50,
 *   "left": { ... } or null,
 *   "right": { ... } or null
 * }
 *
 * This JSON tree structure is consumed by the JS visualization
 * engine to render the SVG tree.
 */
static int serializeNode(Node *node, char *buf, int buf_size, int offset) {
    if (node == NULL) {
        int len = snprintf(buf + offset, buf_size - offset, "null");
        return offset + len;
    }
    int len = snprintf(buf + offset, buf_size - offset,
                       "{\"value\":%d,\"left\":", node->data);
    offset += len;
    offset = serializeNode(node->left, buf, buf_size, offset);
    len = snprintf(buf + offset, buf_size - offset, ",\"right\":");
    offset += len;
    offset = serializeNode(node->right, buf, buf_size, offset);
    len = snprintf(buf + offset, buf_size - offset, "}");
    offset += len;
    return offset;
}

/**
 * serializeTree - Serialize full BST to JSON string.
 * Writes to output_buffer and returns a pointer to it.
 */
static const char* serializeTree(void) {
    int offset = 0;
    offset += snprintf(output_buffer, MAX_OUTPUT, "{\"tree\":");
    offset = serializeNode(bst_root, output_buffer, MAX_OUTPUT - 2, offset);
    snprintf(output_buffer + offset, MAX_OUTPUT - offset, "}");
    return output_buffer;
}

/**
 * serializeSteps - Serialize OperationResult to JSON.
 * Includes steps, path, comparisons, summary.
 */
static const char* serializeResult(OperationResult *res) {
    int offset = 0;

    /* Open result object */
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
        "{\"success\":%d,\"comparisons\":%d,\"summary\":\"%s\","
        "\"deletionCase\":\"%s\",",
        res->success, res->comparisons,
        res->summary, res->deletion_case);

    /* Path array */
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "\"path\":[");
    for (int i = 0; i < res->path_count; i++) {
        offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
                           "%d%s", res->path[i],
                           i < res->path_count - 1 ? "," : "");
    }
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "],");

    /* Steps array */
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "\"steps\":[");
    for (int i = 0; i < res->steps_count; i++) {
        OperationStep *s = &res->steps[i];
        /* Escape quotes in message */
        char safe_msg[300];
        int mi = 0, si = 0;
        while (s->message[mi] && si < 298) {
            if (s->message[mi] == '"') { safe_msg[si++] = '\\'; }
            safe_msg[si++] = s->message[mi++];
        }
        safe_msg[si] = '\0';

        offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
            "{\"type\":%d,\"nodeValue\":%d,\"targetValue\":%d,"
            "\"successorVal\":%d,\"message\":\"%s\"}%s",
            s->type, s->node_value, s->target_value,
            s->successor_val, safe_msg,
            i < res->steps_count - 1 ? "," : "");
    }
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "],");

    /* Current tree state after operation */
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "\"tree\":");
    offset = serializeNode(bst_root, output_buffer, MAX_OUTPUT - 10, offset);
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "}");

    return output_buffer;
}

/**
 * serializeTraversal - Serialize TraversalResult to JSON.
 */
static const char* serializeTraversal(TraversalResult *trav) {
    int offset = 0;

    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
        "{\"name\":\"%s\",\"description\":\"%s\",\"count\":%d,",
        trav->name, trav->description, trav->count);

    /* Sequence array */
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "\"sequence\":[");
    for (int i = 0; i < trav->count; i++) {
        offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
                           "%d%s", trav->sequence[i],
                           i < trav->count - 1 ? "," : "");
    }
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "],");

    /* Steps */
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "\"steps\":[");
    for (int i = 0; i < trav->steps_count; i++) {
        OperationStep *s = &trav->steps[i];
        char safe_msg[300];
        int mi = 0, si_idx = 0;
        while (s->message[mi] && si_idx < 298) {
            if (s->message[mi] == '"') { safe_msg[si_idx++] = '\\'; }
            safe_msg[si_idx++] = s->message[mi++];
        }
        safe_msg[si_idx] = '\0';
        offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
            "{\"type\":%d,\"nodeValue\":%d,\"message\":\"%s\"}%s",
            s->type, s->node_value, safe_msg,
            i < trav->steps_count - 1 ? "," : "");
    }
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset, "]}");

    return output_buffer;
}

/**
 * serializeAnalysis - Serialize TreeAnalysis to JSON.
 */
static const char* serializeAnalysis(TreeAnalysis *a) {
    /* Escape quotes in string fields */
    char safe_type[200], safe_valid[400], safe_bal[400], safe_complex[700];

    #define ESCAPE(src, dst) do { \
        int _i = 0, _j = 0; \
        while ((src)[_i] && _j < (int)sizeof(dst)-2) { \
            if ((src)[_i] == '"') (dst)[_j++] = '\\'; \
            (dst)[_j++] = (src)[_i++]; \
        } (dst)[_j] = '\0'; \
    } while(0)

    ESCAPE(a->tree_type,      safe_type);
    ESCAPE(a->validation_msg, safe_valid);
    ESCAPE(a->balance_msg,    safe_bal);
    ESCAPE(a->complexity_note,safe_complex);

    snprintf(output_buffer, MAX_OUTPUT,
        "{"
        "\"totalNodes\":%d,"
        "\"leafNodes\":%d,"
        "\"internalNodes\":%d,"
        "\"height\":%d,"
        "\"levels\":%d,"
        "\"edges\":%d,"
        "\"minValue\":%d,"
        "\"maxValue\":%d,"
        "\"isValidBST\":%d,"
        "\"isBalanced\":%d,"
        "\"balanceFactor\":%d,"
        "\"isPerfect\":%d,"
        "\"isComplete\":%d,"
        "\"isFull\":%d,"
        "\"isLeftSkewed\":%d,"
        "\"isRightSkewed\":%d,"
        "\"treeType\":\"%s\","
        "\"validationMsg\":\"%s\","
        "\"balanceMsg\":\"%s\","
        "\"complexityNote\":\"%s\""
        "}",
        a->total_nodes, a->leaf_nodes, a->internal_nodes,
        a->height, a->levels, a->edges,
        a->min_value, a->max_value,
        a->is_valid_bst, a->is_balanced, a->balance_factor,
        a->is_perfect, a->is_complete, a->is_full,
        a->is_left_skewed, a->is_right_skewed,
        safe_type, safe_valid, safe_bal, safe_complex
    );

    return output_buffer;
}

/* ============================================================
 * EXPORTED API FUNCTIONS
 * Called from JavaScript via WASM
 * ============================================================ */

/**
 * api_init - Initialize the BST engine.
 * Must be called once before any other operation.
 */
EMSCRIPTEN_KEEPALIVE
void api_init(void) {
    freeTree(bst_root);
    freeTree(undo_root);
    bst_root = NULL;
    undo_root = NULL;
    undo_available = 0;
}

/**
 * api_reset - Reset the tree to empty state.
 * @return JSON: {"tree": null}
 */
EMSCRIPTEN_KEEPALIVE
const char* api_reset(void) {
    freeTree(bst_root);
    freeTree(undo_root);
    bst_root = NULL;
    undo_root = NULL;
    undo_available = 0;
    snprintf(output_buffer, MAX_OUTPUT, "{\"tree\":null,\"message\":\"Tree reset to empty state.\"}");
    return output_buffer;
}

/**
 * api_insert - Insert a value into the BST.
 *
 * @param value  Integer value to insert
 * @return JSON string with operation steps and new tree state
 *
 * Data flow:
 *   JS calls api_insert(45)
 *   → C runs insert() with step recording
 *   → bst_root updated
 *   → JSON result returned to JS
 *   → JS animation engine processes steps
 *   → SVG renderer draws new tree
 */
EMSCRIPTEN_KEEPALIVE
const char* api_insert(int value) {
    /* Save current state for undo */
    freeTree(undo_root);
    undo_root = copyTree(bst_root);
    undo_available = 1;

    OperationResult result;
    initResult(&result);

    bst_root = insert(bst_root, value, &result);

    return serializeResult(&result);
}

/**
 * api_search - Search for a value in the BST.
 *
 * @param value  Integer value to search for
 * @return JSON string with search path, steps, and result
 */
EMSCRIPTEN_KEEPALIVE
const char* api_search(int value) {
    OperationResult result;
    initResult(&result);

    if (bst_root == NULL) {
        snprintf(result.summary, 511, "Cannot search: Tree is empty.");
        result.success = 0;
        return serializeResult(&result);
    }

    search(bst_root, value, &result);
    return serializeResult(&result);
}

/**
 * api_delete - Delete a value from the BST.
 *
 * @param value  Integer value to delete
 * @return JSON string with deletion case, steps, and new tree state
 */
EMSCRIPTEN_KEEPALIVE
const char* api_delete(int value) {
    /* Save current state for undo */
    freeTree(undo_root);
    undo_root = copyTree(bst_root);
    undo_available = 1;

    OperationResult result;
    initResult(&result);

    if (bst_root == NULL) {
        snprintf(result.summary, 511, "Cannot delete: Tree is empty.");
        result.success = 0;
        freeTree(undo_root);
        undo_root = NULL;
        undo_available = 0;
        return serializeResult(&result);
    }

    bst_root = deleteNode(bst_root, value, &result);
    return serializeResult(&result);
}

/**
 * api_inorder - Get inorder traversal.
 * @return JSON with traversal sequence and animation steps
 */
EMSCRIPTEN_KEEPALIVE
const char* api_inorder(void) {
    TraversalResult trav;
    inorder(bst_root, &trav);
    return serializeTraversal(&trav);
}

/**
 * api_preorder - Get preorder traversal.
 * @return JSON with traversal sequence and animation steps
 */
EMSCRIPTEN_KEEPALIVE
const char* api_preorder(void) {
    TraversalResult trav;
    preorder(bst_root, &trav);
    return serializeTraversal(&trav);
}

/**
 * api_postorder - Get postorder traversal.
 * @return JSON with traversal sequence and animation steps
 */
EMSCRIPTEN_KEEPALIVE
const char* api_postorder(void) {
    TraversalResult trav;
    postorder(bst_root, &trav);
    return serializeTraversal(&trav);
}

/**
 * api_get_tree - Get the current tree structure as JSON.
 * @return JSON with tree structure for rendering
 */
EMSCRIPTEN_KEEPALIVE
const char* api_get_tree(void) {
    return serializeTree();
}

/**
 * api_analyze - Perform full tree analysis.
 * @return JSON with all tree properties
 */
EMSCRIPTEN_KEEPALIVE
const char* api_analyze(void) {
    TreeAnalysis analysis;
    analyzeTree(bst_root, &analysis);
    return serializeAnalysis(&analysis);
}

/**
 * api_validate - Validate BST property.
 * @return JSON: {"isValid": 1/0, "message": "..."}
 */
EMSCRIPTEN_KEEPALIVE
const char* api_validate(void) {
    int valid = validateBST(bst_root);
    const char *msg = valid
        ? "Valid BST: All nodes satisfy the Binary Search Tree property."
        : "Invalid BST: BST property is violated.";
    snprintf(output_buffer, MAX_OUTPUT,
             "{\"isValid\":%d,\"message\":\"%s\"}", valid, msg);
    return output_buffer;
}

/**
 * api_undo - Undo the last insert or delete operation.
 * @return JSON with previous tree state, or error if no undo available
 */
EMSCRIPTEN_KEEPALIVE
const char* api_undo(void) {
    if (!undo_available) {
        snprintf(output_buffer, MAX_OUTPUT,
                 "{\"success\":0,\"message\":\"No operation to undo.\",\"tree\":null}");
        return output_buffer;
    }

    freeTree(bst_root);
    bst_root = undo_root;
    undo_root = NULL;
    undo_available = 0;

    int offset = 0;
    offset += snprintf(output_buffer + offset, MAX_OUTPUT - offset,
                       "{\"success\":1,\"message\":\"Last operation undone.\",\"tree\":");
    offset = serializeNode(bst_root, output_buffer, MAX_OUTPUT - 5, offset);
    snprintf(output_buffer + offset, MAX_OUTPUT - offset, "}");
    return output_buffer;
}

/**
 * api_get_height - Get tree height.
 * @return Height as integer (-1 for empty tree)
 */
EMSCRIPTEN_KEEPALIVE
int api_get_height(void) {
    return getHeight(bst_root);
}

/**
 * api_get_node_count - Get total node count.
 */
EMSCRIPTEN_KEEPALIVE
int api_get_node_count(void) {
    return getNodeCount(bst_root);
}

/**
 * api_get_leaf_count - Get leaf node count.
 */
EMSCRIPTEN_KEEPALIVE
int api_get_leaf_count(void) {
    return getLeafCount(bst_root);
}

/**
 * api_get_min - Get minimum value.
 */
EMSCRIPTEN_KEEPALIVE
int api_get_min(void) {
    return getMin(bst_root);
}

/**
 * api_get_max - Get maximum value.
 */
EMSCRIPTEN_KEEPALIVE
int api_get_max(void) {
    return getMax(bst_root);
}

/* ============================================================
 * ADVANCED OPERATIONS API
 * ============================================================ */

EMSCRIPTEN_KEEPALIVE
const char* api_find_minimum(void) {
    OperationResult result;
    initResult(&result);
    findMinimumOp(bst_root, &result);
    return serializeResult(&result);
}

EMSCRIPTEN_KEEPALIVE
const char* api_find_maximum(void) {
    OperationResult result;
    initResult(&result);
    findMaximumOp(bst_root, &result);
    return serializeResult(&result);
}

EMSCRIPTEN_KEEPALIVE
const char* api_find_depth(int data) {
    OperationResult result;
    initResult(&result);
    findDepthOp(bst_root, data, &result);
    return serializeResult(&result);
}

EMSCRIPTEN_KEEPALIVE
const char* api_find_parent(int data) {
    OperationResult result;
    initResult(&result);
    findParentOp(bst_root, data, &result);
    return serializeResult(&result);
}

EMSCRIPTEN_KEEPALIVE
const char* api_find_sibling(int data) {
    OperationResult result;
    initResult(&result);
    findSiblingOp(bst_root, data, &result);
    return serializeResult(&result);
}

EMSCRIPTEN_KEEPALIVE
const char* api_find_lca(int data1, int data2) {
    OperationResult result;
    initResult(&result);
    findLCAOp(bst_root, data1, data2, &result);
    return serializeResult(&result);
}

/* ============================================================
 * STANDALONE TEST (compiled with GCC, not Emscripten)
 * ============================================================ */

#ifdef STANDALONE_TEST
int main(void) {
    printf("=== BST C Engine Standalone Test ===\n\n");

    /* Test 1: Insert test data */
    printf("--- Test 1: Inserting 50 30 70 20 40 60 80 ---\n");
    int values[] = {50, 30, 70, 20, 40, 60, 80};
    int n = sizeof(values) / sizeof(values[0]);

    for (int i = 0; i < n; i++) {
        const char *result = api_insert(values[i]);
        printf("Insert %d: success=%c\n", values[i],
               strstr(result, "\"success\":1") ? '1' : '0');
    }

    printf("\n--- Test 2: Tree Structure ---\n");
    printf("%s\n", api_get_tree());

    printf("\n--- Test 3: Analysis ---\n");
    printf("%s\n", api_analyze());

    printf("\n--- Test 4: Inorder Traversal ---\n");
    const char *inord = api_inorder();
    printf("Inorder: %s\n", inord);

    printf("\n--- Test 5: Preorder Traversal ---\n");
    printf("Preorder: %s\n", api_preorder());

    printf("\n--- Test 6: Postorder Traversal ---\n");
    printf("Postorder: %s\n", api_postorder());

    printf("\n--- Test 7: Search for 60 ---\n");
    printf("%s\n", api_search(60));

    printf("\n--- Test 8: Search for 99 (not found) ---\n");
    printf("%s\n", api_search(99));

    printf("\n--- Test 9: Insert 45 ---\n");
    printf("%s\n", api_insert(45));

    printf("\n--- Test 10: Delete 30 (two children) ---\n");
    printf("%s\n", api_delete(30));

    printf("\n--- Test 11: Inorder after deletion ---\n");
    printf("%s\n", api_inorder());

    printf("\n--- Test 12: Undo deletion ---\n");
    printf("%s\n", api_undo());

    printf("\n--- Test 13: Inorder after undo ---\n");
    printf("%s\n", api_inorder());

    printf("\n--- Test 14: Duplicate insertion ---\n");
    printf("%s\n", api_insert(50));

    printf("\n--- Test 15: Delete on empty tree ---\n");
    api_reset();
    printf("%s\n", api_delete(50));

    printf("\n--- Test 16: Search on empty tree ---\n");
    printf("%s\n", api_search(50));

    printf("\n--- Test 17: BST Validation ---\n");
    api_insert(50); api_insert(30); api_insert(70);
    printf("%s\n", api_validate());

    printf("\n=== All Tests Complete ===\n");

    api_reset();
    return 0;
}
#endif /* STANDALONE_TEST */
