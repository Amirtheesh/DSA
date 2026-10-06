/**
 * app.js - Main Application Controller
 *
 * Connects all modules together:
 *   BSTEngine ↔ AnimationEngine ↔ BSTVisualizer ↔ UI
 *
 * Handles:
 *   - Navigation between sections
 *   - Input parsing (matrix/array format)
 *   - Operation dispatch (insert, search, delete, traversal, analysis)
 *   - Undo / Reset
 *   - Steps panel updates
 *   - Status messages
 *   - Tree info panel updates
 */

'use strict';

/* ============================================================
 * UI MANAGER
 * Handles DOM interactions and display updates
 * ============================================================ */

class UIManager {
    constructor() {
        /* Panel references */
        this.stepsPanel       = document.getElementById('steps-panel');
        this.stepsList        = document.getElementById('steps-list');
        this.currentMsgEl     = document.getElementById('current-message');
        this.statusEl         = document.getElementById('status-message');
        this.engineModeEl     = document.getElementById('engine-mode');
        this.traversalDisplay = document.getElementById('traversal-display');
        this.traversalSeq     = document.getElementById('traversal-sequence');
        this.activeNavItem    = null;
    }

    /* -------- Navigation -------- */
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) navItem.classList.add('active');
    }

    /* -------- Status Messages -------- */
    setStatus(message, type = 'info') {
        if (!this.statusEl) return;
        const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
        this.statusEl.textContent = `${icons[type] || ''} ${message}`;
        this.statusEl.className = `status-message status-${type}`;
        this.statusEl.style.display = 'block';

        /* Auto-hide after delay */
        if (this._statusTimer) clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => {
            if (this.statusEl) this.statusEl.style.opacity = '0';
            setTimeout(() => {
                if (this.statusEl) this.statusEl.style.display = 'none';
                if (this.statusEl) this.statusEl.style.opacity = '1';
            }, 400);
        }, 4000);
    }

    /* -------- Steps Panel -------- */
    buildStepsPanel(steps, title = 'OPERATION STEPS') {
        if (!this.stepsList) return;

        const header = document.getElementById('steps-title');
        if (header) header.textContent = title;

        this.stepsList.innerHTML = '';

        if (!steps || steps.length === 0) {
            this.stepsList.innerHTML = '<li class="step-empty">No steps to display.</li>';
            return;
        }

        steps.forEach((step, i) => {
            const li = document.createElement('li');
            li.className = 'step-item';
            li.setAttribute('data-index', i);

            const num = document.createElement('span');
            num.className = 'step-num';
            num.textContent = i + 1;

            const msg = document.createElement('span');
            msg.className = 'step-msg';
            msg.textContent = step.message;

            li.appendChild(num);
            li.appendChild(msg);
            this.stepsList.appendChild(li);
        });
    }

    highlightStep(index) {
        if (!this.stepsList) return;
        document.querySelectorAll('.step-item').forEach((el, i) => {
            el.classList.toggle('step-active', i === index);
            if (i === index) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    setCurrentMessage(msg) {
        if (this.currentMsgEl) this.currentMsgEl.textContent = msg;
    }

    /* -------- Tree Info Panel -------- */
    updateTreeInfo(analysis) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        if (!analysis || analysis.totalNodes === 0) {
            set('info-nodes', '0');
            set('info-leaves', '0');
            set('info-internal', '0');
            set('info-height', '-');
            set('info-min', '-');
            set('info-max', '-');
            set('info-levels', '0');
            set('info-edges', '0');
            set('info-type', 'Empty Tree');
            set('info-balanced', '-');
            set('info-valid', '-');
            return;
        }

        set('info-nodes',    analysis.totalNodes);
        set('info-leaves',   analysis.leafNodes);
        set('info-internal', analysis.internalNodes);
        set('info-height',   analysis.height);
        set('info-min',      analysis.minValue);
        set('info-max',      analysis.maxValue);
        set('info-levels',   analysis.levels);
        set('info-edges',    analysis.edges);
        set('info-type',     analysis.treeType);

        const balEl = document.getElementById('info-balanced');
        if (balEl) {
            balEl.textContent = analysis.isBalanced ? 'Balanced ✓' : 'Unbalanced ✗';
            balEl.style.color = analysis.isBalanced ? '#22c55e' : '#ef4444';
        }

        const validEl = document.getElementById('info-valid');
        if (validEl) {
            validEl.textContent = analysis.isValidBST ? 'Valid BST ✓' : 'Invalid ✗';
            validEl.style.color = analysis.isValidBST ? '#22c55e' : '#ef4444';
        }
    }

    /* -------- Traversal Display -------- */
    showTraversalSequence(name, sequence, description) {
        if (!this.traversalDisplay) return;

        const nameEl = document.getElementById('trav-name');
        const descEl = document.getElementById('trav-desc');
        const seqEl  = document.getElementById('trav-seq');

        if (nameEl) nameEl.textContent = name;
        if (descEl) descEl.textContent = description;
        if (seqEl) {
            seqEl.innerHTML = sequence.map((v, i) =>
                `<span class="trav-node" data-val="${v}" id="trav-node-${v}">${v}</span>${i < sequence.length - 1 ? '<span class="trav-arrow">→</span>' : ''}`
            ).join('');
        }

        this.traversalDisplay.style.display = 'block';
    }

    highlightTraversalNode(value, index) {
        /* Un-highlight previous */
        document.querySelectorAll('.trav-node').forEach(el => {
            el.classList.remove('trav-active', 'trav-visited');
        });

        /* Mark visited up to index */
        const nodes = document.querySelectorAll('.trav-node');
        nodes.forEach((el, i) => {
            if (i < index) el.classList.add('trav-visited');
            if (i === index) {
                el.classList.add('trav-active');
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    /* -------- Engine Mode Indicator -------- */
    setEngineMode(mode) {
        if (!this.engineModeEl) return;
        if (mode === 'WASM') {
            this.engineModeEl.textContent = '⚡ C / WebAssembly';
            this.engineModeEl.className = 'engine-badge engine-wasm';
        } else {
            this.engineModeEl.textContent = '🔧 JS Fallback (WASM pending)';
            this.engineModeEl.className = 'engine-badge engine-js';
        }
    }

    /* -------- Analysis Panel -------- */
    renderAnalysis(analysis) {
        const panel = document.getElementById('analysis-panel');
        if (!panel) return;

        const badge = (condition, trueLabel, falseLabel) =>
            `<span class="badge ${condition ? 'badge-success' : 'badge-neutral'}">${condition ? trueLabel : falseLabel}</span>`;

        panel.innerHTML = `
            <div class="analysis-grid">
                <div class="analysis-card">
                    <h4>Structure</h4>
                    <table class="analysis-table">
                        <tr><td>Total Nodes</td><td><strong>${analysis.totalNodes}</strong></td></tr>
                        <tr><td>Leaf Nodes</td><td><strong>${analysis.leafNodes}</strong></td></tr>
                        <tr><td>Internal Nodes</td><td><strong>${analysis.internalNodes}</strong></td></tr>
                        <tr><td>Height</td><td><strong>${analysis.height}</strong></td></tr>
                        <tr><td>Levels</td><td><strong>${analysis.levels}</strong></td></tr>
                        <tr><td>Edges</td><td><strong>${analysis.edges}</strong></td></tr>
                        <tr><td>Min Value</td><td><strong>${analysis.minValue}</strong></td></tr>
                        <tr><td>Max Value</td><td><strong>${analysis.maxValue}</strong></td></tr>
                    </table>
                </div>
                <div class="analysis-card">
                    <h4>Classification</h4>
                    <div class="badges-grid">
                        ${badge(analysis.isValidBST,    '✓ Valid BST',       '✗ Invalid BST')}
                        ${badge(analysis.isBalanced,    '✓ Balanced',        '✗ Unbalanced')}
                        ${badge(analysis.isPerfect,     '✓ Perfect',         '○ Not Perfect')}
                        ${badge(analysis.isComplete,    '✓ Complete',        '○ Incomplete')}
                        ${badge(analysis.isFull,        '✓ Full',            '○ Not Full')}
                        ${badge(!analysis.isLeftSkewed, '○ Not Left-Skewed', '⚠ Left-Skewed')}
                        ${badge(!analysis.isRightSkewed,'○ Not Right-Skewed','⚠ Right-Skewed')}
                    </div>
                    <div class="tree-type-label">Type: <strong>${analysis.treeType}</strong></div>
                    <div class="balance-factor">Balance Factor (root): ${analysis.balanceFactor > 0 ? '+' : ''}${analysis.balanceFactor}</div>
                </div>
            </div>
            <div class="analysis-note">
                <strong>Validation:</strong> ${analysis.validationMsg}<br/>
                <strong>Balance:</strong> ${analysis.balanceMsg}
            </div>
            <div class="analysis-complexity">
                <strong>🔍 Complexity Note:</strong><br/>${analysis.complexityNote}
            </div>
        `;
    }
}

/* ============================================================
 * INPUT PARSER
 * Parses the matrix/array input format
 * Handles: spaces, commas, newlines, duplicates, invalid chars
 * ============================================================ */

function parseInput(rawInput) {
    const errors = [];
    const duplicates = [];
    const seen = new Set();
    const values = [];

    /* Split by any whitespace or comma */
    const tokens = rawInput.trim().split(/[\s,]+/).filter(t => t.length > 0);

    if (tokens.length === 0) {
        return { values: [], errors: ['Input is empty. Please enter some numbers.'], duplicates: [] };
    }

    for (const token of tokens) {
        /* Validate: must be an integer */
        if (!/^-?\d+$/.test(token)) {
            errors.push(`"${token}" is not a valid integer — ignored.`);
            continue;
        }

        const num = parseInt(token, 10);

        /* Check range */
        if (num > 999999 || num < -999999) {
            errors.push(`${num} is out of range (max ±999999) — ignored.`);
            continue;
        }

        /* Check duplicate */
        if (seen.has(num)) {
            duplicates.push(num);
            continue;
        }

        seen.add(num);
        values.push(num);
    }

    return { values, errors, duplicates };
}

/* ============================================================
 * COMPLEXITY INFORMATION
 * ============================================================ */

const COMPLEXITY_DATA = {
    search: {
        title: 'SEARCH',
        average: 'O(log n)',
        worst:   'O(n)',
        space:   'O(h)',
        note:    'Average O(log n) for balanced trees. Worst O(n) for skewed trees (every node visited).'
    },
    insert: {
        title: 'INSERT',
        average: 'O(log n)',
        worst:   'O(n)',
        space:   'O(h)',
        note:    'Must find correct position before inserting. Same traversal cost as search.'
    },
    delete: {
        title: 'DELETE',
        average: 'O(log n)',
        worst:   'O(n)',
        space:   'O(h)',
        note:    'Worst case: finding inorder successor requires extra traversal.'
    },
    inorder: {
        title: 'INORDER TRAVERSAL',
        average: 'O(n)',
        worst:   'O(n)',
        space:   'O(h)',
        note:    'Must visit every node exactly once. Always O(n) regardless of shape.'
    },
    preorder: {
        title: 'PREORDER TRAVERSAL',
        average: 'O(n)',
        worst:   'O(n)',
        space:   'O(h)',
        note:    'Visits root before children. Used for tree serialization.'
    },
    postorder: {
        title: 'POSTORDER TRAVERSAL',
        average: 'O(n)',
        worst:   'O(n)',
        space:   'O(h)',
        note:    'Visits children before root. Used for tree deletion.'
    },
};

/* ============================================================
 * MAIN APPLICATION CLASS
 * ============================================================ */

class BSTApp {
    constructor() {
        this.engine     = null;
        this.visualizer = null;
        this.animation  = null;
        this.ui         = new UIManager();
        this.history    = []; /* Operation history for display */
        this.currentAnalysis = null;
    }

    async init() {
        /* Initialize engine */
        this.engine = window.bstEngine;
        await this.engine.init();

        /* Set engine mode indicator */
        const mode = this.engine.getMode();
        this.ui.setEngineMode(mode);

        /* Initialize visualizer */
        this.visualizer = new BSTVisualizer('bst-svg');

        /* Initialize animation engine */
        this.animation = new AnimationEngine(this.visualizer, this.ui);

        /* Override _processStep to include stepsPanel tracking */
        const origProcess = this.animation._processStep.bind(this.animation);
        this.animation._processStep = (step, index) => {
            origProcess(step, index);
            this.ui.setCurrentMessage(step.message);
            this.ui.highlightStep(index);
        };

        /* Wire up UI events */
        this._bindEvents();

        /* Set up Hash Router */
        this.router = new Router(this);
        this._setupRoutes();
        this.router.handleRoute();

        console.log('[BSTApp] Initialized. Engine mode:', mode);
    }

    /* ============================================================
     * ROUTER & DYNAMIC OPERATION VIEW
     * ============================================================ */
    
    _setupRoutes() {
        const show = (sectionId) => () => this.ui.showSection(sectionId);
        
        this.router.addRoute('/', show('section-home'));
        this.router.addRoute('/home', show('section-home'));
        this.router.addRoute('/input', show('section-input'));
        this.router.addRoute('/bst/operations', show('section-ops-landing'));
        this.router.addRoute('/avl/compare', () => {
            show('section-avl-compare')();
            // Initialize instances if they don't exist
            if (!this.compareBSTEngine) this.compareBSTEngine = new JSBSTEngine();
            if (!this.compareAVLEngine && window.JSAVLEngine) this.compareAVLEngine = new JSAVLEngine();
            if (!this.compareBSTViz) {
                this.compareBSTViz = new BSTVisualizer('bst-svg-compare-bst');
                this.compareBSTViz.showBalanceFactors = true;
            }
            if (!this.compareAVLViz) {
                this.compareAVLViz = new BSTVisualizer('bst-svg-compare-avl');
                this.compareAVLViz.showBalanceFactors = true;
            }
        });
        this.router.addRoute('/traversals', show('section-traversal'));
        this.router.addRoute('/analysis', show('section-analysis'));
        this.router.addRoute('/bst/balance', () => {
            show('section-balance')();
            // Also sync the tree visually immediately so it's not empty
            if (this.balanceViz && this.engine) {
                this.balanceViz.renderTree(this.engine.getTree().tree, false);
            }
        });
        this.router.addRoute('/complexity', show('section-complexity'));

        // Advanced Operations Dynamic Route
        const ops = ['search', 'insert', 'delete', 'minimum', 'maximum', 'height', 'depth', 'parent', 'sibling', 'lca'];
        for (const op of ops) {
            this.router.addRoute(`/bst/operations/${op}`, () => {
                this._configureOperationView(op);
                this.ui.showSection('section-operation');
            });
        }
    }

    _configureOperationView(opType) {
        const titleEl = document.getElementById('current-op-title');
        const input1 = document.getElementById('input-op');
        const input2 = document.getElementById('input-op2');
        const btn = document.getElementById('btn-op-execute');
        
        // Reset
        input1.style.display = 'none';
        input2.style.display = 'none';
        input1.value = '';
        input2.value = '';
        
        // Remove old event listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        const titles = {
            search: '🔍 Search', insert: '➕ Insert', delete: '➖ Delete',
            minimum: '⬇️ Find Minimum', maximum: '⬆️ Find Maximum',
            height: '📏 Find Height', depth: '🎯 Find Depth',
            parent: '👪 Find Parent', sibling: '👯 Find Sibling',
            lca: '🌳 Lowest Common Ancestor'
        };
        titleEl.textContent = titles[opType] || 'Operation';

        const needsOneInput = ['search', 'insert', 'delete', 'depth', 'parent', 'sibling'];
        const needsTwoInputs = ['lca'];
        
        if (needsOneInput.includes(opType)) {
            input1.style.display = 'block';
            input1.placeholder = 'Target Value';
        } else if (needsTwoInputs.includes(opType)) {
            input1.style.display = 'block';
            input2.style.display = 'block';
            input1.placeholder = 'Value 1';
            input2.placeholder = 'Value 2';
        }
        
        newBtn.onclick = () => this._executeDynamicOp(opType);
    }

    /* ============================================================
     * EVENT BINDING
     * ============================================================ */
    _bindEvents() {
        /* Matrix input create BST */
        const createBtn = document.getElementById('btn-create-bst');
        if (createBtn) createBtn.addEventListener('click', () => this._onCreateBST());

        /* Parse preview */
        const previewBtn = document.getElementById('btn-parse-preview');
        if (previewBtn) previewBtn.addEventListener('click', () => this._onParsePreview());

        /* Enter key support on dynamic operation inputs */
        const inputOp1 = document.getElementById('input-op');
        const inputOp2 = document.getElementById('input-op2');
        const handleEnter = (e) => {
            if (e.key === 'Enter') document.getElementById('btn-op-execute').click();
        };
        if (inputOp1) inputOp1.addEventListener('keydown', handleEnter);
        if (inputOp2) inputOp2.addEventListener('keydown', handleEnter);

        /* Traversal buttons */
        document.getElementById('btn-inorder')?.addEventListener('click',   () => this._onTraversal('inorder'));
        document.getElementById('btn-preorder')?.addEventListener('click',  () => this._onTraversal('preorder'));
        document.getElementById('btn-postorder')?.addEventListener('click', () => this._onTraversal('postorder'));

        /* Traversal controls */
        document.getElementById('btn-trav-play')?.addEventListener('click',  () => this.animation.resume());
        document.getElementById('btn-trav-pause')?.addEventListener('click', () => this.animation.pause());
        document.getElementById('btn-trav-reset')?.addEventListener('click', () => {
            this.animation.stop();
            this.visualizer.clearHighlights();
        });
        document.getElementById('btn-trav-prev')?.addEventListener('click', () => this.animation.stepBackward());
        document.getElementById('btn-trav-next')?.addEventListener('click', () => this.animation.stepForward());

        /* Speed control */
        document.getElementById('speed-select')?.addEventListener('change', (e) => {
            this.animation.setSpeed(e.target.value);
        });

        /* Analysis */
        document.getElementById('btn-analyze')?.addEventListener('click', () => this._onAnalyze());

        /* Balance Analysis */
        document.getElementById('btn-run-balance')?.addEventListener('click', () => this._onBalance());

        /* AVL Comparison */
        document.getElementById('btn-run-avl-compare')?.addEventListener('click', () => this._onAVLCompare());

        /* Undo */
        document.getElementById('btn-undo')?.addEventListener('click', () => this._onUndo());

        /* Reset */
        document.getElementById('btn-reset')?.addEventListener('click', () => this._onReset());

        /* Complexity buttons */
        document.querySelectorAll('[data-complexity]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._showComplexity(btn.getAttribute('data-complexity'));
            });
        });

        /* Animation control buttons */
        document.getElementById('btn-anim-play')?.addEventListener('click',  () => this.animation.resume());
        document.getElementById('btn-anim-pause')?.addEventListener('click', () => this.animation.pause());
        document.getElementById('btn-anim-stop')?.addEventListener('click',  () => {
            this.animation.stop();
            this.visualizer.clearHighlights();
        });
        document.getElementById('btn-anim-prev')?.addEventListener('click',  () => this.animation.stepBackward());
        document.getElementById('btn-anim-next')?.addEventListener('click',  () => this.animation.stepForward());
    }

    _handleQuickAction(action) {
        const sectionMap = {
            'create':    'section-input',
            'search':    'section-ops',
            'insert':    'section-ops',
            'delete':    'section-ops',
            'traversal': 'section-traversal',
            'analyze':   'section-analysis',
        };
        const section = sectionMap[action];
        if (section) this.ui.showSection(section);
    }

    /* ============================================================
     * OPERATIONS
     * ============================================================ */

    _onParsePreview() {
        const input = document.getElementById('matrix-input')?.value || '';
        const { values, errors, duplicates } = parseInput(input);

        const display = document.getElementById('parsed-values');
        const errDisplay = document.getElementById('parse-errors');

        if (display) {
            if (values.length > 0) {
                display.innerHTML = `<strong>Extracted ${values.length} value(s):</strong><br/>` +
                    values.map(v => `<span class="parsed-val">${v}</span>`).join(' ');
            } else {
                display.textContent = 'No valid values found.';
            }
        }

        if (errDisplay) {
            const msgs = [...errors, ...duplicates.map(d => `Duplicate: ${d} ignored`)];
            errDisplay.innerHTML = msgs.length > 0
                ? msgs.map(e => `<div class="parse-error">⚠ ${e}</div>`).join('')
                : '<div class="parse-ok">✓ All values parsed successfully.</div>';
        }
    }

    async _onCreateBST() {
        const input = document.getElementById('matrix-input')?.value || '';
        const { values, errors, duplicates } = parseInput(input);

        if (values.length === 0) {
            this.ui.setStatus(errors[0] || 'No valid values to insert.', 'error');
            return;
        }

        /* Reset tree first */
        this.engine.reset();
        this.animation.stop();
        this.visualizer.clearHighlights();

        /* Build steps display */
        const allSteps = [];
        const pathDisplay = [];

        /* Insert all values */
        for (const val of values) {
            const result = this.engine.insert(val);
            if (result.success) {
                pathDisplay.push(val);
            }
        }

        /* Get final tree and render */
        const treeData = this.engine.getTree();
        const analysis = this.engine.analyze();
        this.currentAnalysis = analysis;

        this.visualizer.adaptToTreeSize(values.length);
        this.visualizer.renderTree(treeData.tree, true);
        this._updateTreeInfo();

        /* Show status */
        const dupMsg = duplicates.length > 0 ? ` (${duplicates.length} duplicate(s) ignored)` : '';
        const errMsg = errors.length > 0 ? ` (${errors.length} invalid value(s) skipped)` : '';
        this.ui.setStatus(`BST created with ${pathDisplay.length} node(s).${dupMsg}${errMsg}`, 'success');

        /* Show steps */
        this.ui.buildStepsPanel([
            { message: `Inserted values: ${pathDisplay.join(', ')}` },
            { message: `Tree height: ${analysis.height}` },
            { message: `Tree type: ${analysis.treeType}` },
        ], 'BST CREATION');

        /* Show extracted values */
        const display = document.getElementById('parsed-values');
        if (display) {
            display.innerHTML = `<strong>Inserted ${pathDisplay.length} values:</strong><br/>` +
                pathDisplay.map(v => `<span class="parsed-val">${v}</span>`).join(' ');
        }

        /* Navigate to visualization if on input page */
        this.router.navigate('/bst/operations');
    }

    async _executeDynamicOp(opType) {
        if (this.engine.getNodeCount() === 0 && opType !== 'insert') {
            this.ui.setStatus('Tree is empty. Create a BST or Insert a node first.', 'warning');
            return;
        }

        const input1 = document.getElementById('input-op');
        const input2 = document.getElementById('input-op2');
        const v1 = parseInt(input1?.value?.trim(), 10);
        const v2 = parseInt(input2?.value?.trim(), 10);
        
        const needsOneInput = ['search', 'insert', 'delete', 'depth', 'parent', 'sibling'];
        const needsTwoInputs = ['lca'];

        if (needsOneInput.includes(opType) && isNaN(v1)) {
            this.ui.setStatus('Enter a valid integer value.', 'error');
            return;
        }
        if (needsTwoInputs.includes(opType) && (isNaN(v1) || isNaN(v2))) {
            this.ui.setStatus('Enter two valid integers.', 'error');
            return;
        }

        this.animation.stop();
        this.visualizer.clearHighlights();
        
        let result = null;
        switch(opType) {
            case 'search': result = this.engine.search(v1); break;
            case 'insert': result = this.engine.insert(v1); break;
            case 'delete': result = this.engine.delete(v1); break;
            case 'minimum': result = this.engine.findMinimum(); break;
            case 'maximum': result = this.engine.findMaximum(); break;
            case 'height': result = { 
                success: 1, 
                summary: `Tree height is ${this.engine.getHeight()}`, 
                steps: [{message: "Calculating tree height..."}, {message: `Height: ${this.engine.getHeight()}`}] 
            }; break;
            case 'depth': result = this.engine.findDepth(v1); break;
            case 'parent': result = this.engine.findParent(v1); break;
            case 'sibling': result = this.engine.findSibling(v1); break;
            case 'lca': result = this.engine.findLCA(v1, v2); break;
        }

        if (!result) return;

        // Tree structure might have changed
        if (['insert', 'delete'].includes(opType) && result.success) {
            this.visualizer.adaptToTreeSize(this.engine.getNodeCount());
            this.visualizer.renderTree(result.tree, false);
            this._updateTreeInfo();
        } else {
            // Restore visualizer base state in case previous ops left artifacts
            this.visualizer.renderTree(this.engine.getTree().tree, false);
        }

        /* Build steps panel */
        this.ui.buildStepsPanel(result.steps || [], opType.toUpperCase() + ' STEPS');

        if (result.path) {
            this._showPathInfo('Path', result.path.join(' → '), result.comparisons, result.summary, result.success);
        } else {
            document.getElementById('path-info').innerHTML = '';
        }

        if (opType === 'delete' && result.deletionCase) {
            this._showDeletionCase(result.deletionCase, v1, result.summary);
        } else {
            document.getElementById('deletion-info').innerHTML = '';
        }

        if (result.steps && result.steps.length > 0) {
            this.animation.playSteps(result.steps, () => {
                if (['insert', 'search'].includes(opType) && result.success) {
                    this.visualizer.highlightNode(v1, 'inserted'); // Generic highlight
                } else if (opType === 'delete' && result.success) {
                    // Re-render tree cleanly after animation
                    setTimeout(() => {
                        this.visualizer.clearHighlights();
                        this.visualizer.renderTree(result.tree, true);
                    }, 300);
                }
            });
        }

        const type = result.success ? 'success' : 'warning';
        this.ui.setStatus(result.summary || `Operation ${opType} complete.`, type);
        
        // Show complexity (we might need to add new complexities later, but fallback for now)
        if (['search', 'insert', 'delete'].includes(opType)) {
            this._showComplexity(opType);
        }
        
        // Clear inputs after successful execution
        if (result.success && input1) {
            input1.value = '';
            if (input2) input2.value = '';
        }
    }

    async _onTraversal(type) {
        if (this.engine.getNodeCount() === 0) {
            this.ui.setStatus('Tree is empty. Create a BST first.', 'warning');
            return;
        }

        this.animation.stop();
        this.animation.resetTraversalOverride();
        this.visualizer.clearHighlights();

        let result;
        switch (type) {
            case 'inorder':   result = this.engine.inorder();   break;
            case 'preorder':  result = this.engine.preorder();  break;
            case 'postorder': result = this.engine.postorder(); break;
        }

        /* Show sequence display */
        this.ui.showTraversalSequence(result.name, result.sequence, result.description);

        /* Build steps panel */
        this.ui.buildStepsPanel(result.steps, `${result.name} TRAVERSAL`);

        /* Animate traversal */
        let visitIdx = 0;
        this.animation.animateTraversal(result,
            (nodeVal, idx) => {
                this.ui.highlightTraversalNode(nodeVal, visitIdx++);
            },
            () => {
                this.ui.setStatus(`${result.name} traversal complete: ${result.sequence.join(' → ')}`, 'success');
            }
        );

        this.ui.setStatus(`Playing ${result.name} traversal...`, 'info');
        this._showComplexity(type);
    }

    _onAnalyze() {
        if (this.engine.getNodeCount() === 0) {
            this.ui.setStatus('Tree is empty. Create a BST first.', 'warning');
            return;
        }

        const analysis = this.engine.analyze();
        this.currentAnalysis = analysis;
        this.ui.renderAnalysis(analysis);
        this._updateTreeInfo();
        this.ui.showSection('section-analysis');
    }

    _onBalance() {
        if (this.engine.getNodeCount() === 0) {
            this.ui.setStatus('Tree is empty. Create a BST first.', 'warning');
            return;
        }

        if (!this.balanceViz) {
            const svgEl = document.getElementById('bst-svg-balance');
            if (svgEl) {
                this.balanceViz = new BSTVisualizer('bst-svg-balance');
                this.balanceViz.showBalanceFactors = true;
            }
        }

        if (this.balanceViz) {
            const treeData = this.engine.getTree();
            const analysis = this.engine.analyze();
            
            // Render tree with balance factors shown
            this.balanceViz.renderTree(treeData.tree, false);
            
            // Update status text
            const statusDiv = document.getElementById('balance-status');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="font-weight:600;color:${analysis.isBalanced ? 'var(--green)' : 'var(--red)'};font-size:16px;margin-bottom:8px;">
                        ${analysis.isBalanced ? '✓ Balanced BST' : '✗ Unbalanced BST'}
                    </div>
                    <div style="margin-bottom:4px;"><strong>Root Balance Factor:</strong> ${analysis.balanceFactor > 0 ? '+' : ''}${analysis.balanceFactor}</div>
                    <div style="font-size:13px;color:var(--text-secondary);">${analysis.balanceMsg}</div>
                `;
            }
            
            this.ui.setStatus('Balance factors computed and visualized.', 'success');
        }
    }

    _onAVLCompare() {
        const input = document.getElementById('avl-input')?.value || '';
        const { values, errors, duplicates } = parseInput(input);
        
        if (values.length === 0) {
            this.ui.setStatus('No valid values to insert for comparison.', 'error');
            return;
        }

        if (!this.compareBSTEngine || !this.compareAVLEngine) return;

        // Reset engines defensively
        if (typeof this.compareBSTEngine.reset === 'function') {
            this.compareBSTEngine.reset();
        } else if (typeof this.compareBSTEngine.api_reset === 'function') {
            this.compareBSTEngine.api_reset();
        }

        if (typeof this.compareAVLEngine.reset === 'function') {
            this.compareAVLEngine.reset();
        } else if (typeof this.compareAVLEngine.api_reset === 'function') {
            this.compareAVLEngine.api_reset();
        }

        const logPanel = document.getElementById('avl-compare-log');
        if (logPanel) logPanel.innerHTML = '';
        
        let bstStepsTotal = 0;
        let avlStepsTotal = 0;

        // Insert into both and log
        for (const val of values) {
            const bstRes = typeof this.compareBSTEngine.insert === 'function'
                ? this.compareBSTEngine.insert(val)
                : this.compareBSTEngine.api_insert(val);
            const avlRes = typeof this.compareAVLEngine.insert === 'function'
                ? this.compareAVLEngine.insert(val)
                : this.compareAVLEngine.api_insert(val);
            
            bstStepsTotal += bstRes.steps ? bstRes.steps.length : 0;
            avlStepsTotal += avlRes.steps ? avlRes.steps.length : 0;
            
            // Look for rotations in AVL steps
            const rotations = avlRes.steps ? avlRes.steps.filter(s => s.type === 14 || s.type === 15 || s.type === 16).map(s => s.message) : [];
            
            if (logPanel) {
                logPanel.innerHTML += `<div><strong>Insert ${val}:</strong> BST took ${bstRes.steps ? bstRes.steps.length : 0} steps, AVL took ${avlRes.steps ? avlRes.steps.length : 0} steps. ${rotations.length > 0 ? `<span style="color:var(--yellow)">[${rotations.join(', ')}]</span>` : ''}</div>`;
            }
        }

        // Render
        const bstTree = typeof this.compareBSTEngine.getTree === 'function'
            ? this.compareBSTEngine.getTree()
            : this.compareBSTEngine.api_get_tree();
        const avlTree = typeof this.compareAVLEngine.getTree === 'function'
            ? this.compareAVLEngine.getTree()
            : this.compareAVLEngine.api_get_tree();

        this.compareBSTViz.renderTree(bstTree.tree, true);
        this.compareAVLViz.renderTree(avlTree.tree, true);

        // Update heights
        const bstH = typeof this.compareBSTEngine.getHeight === 'function'
            ? this.compareBSTEngine.getHeight()
            : this.compareBSTEngine.api_get_height();
        const avlH = typeof this.compareAVLEngine.getHeight === 'function'
            ? this.compareAVLEngine.getHeight()
            : this.compareAVLEngine.api_get_height();

        document.getElementById('bst-compare-height').textContent = `Height: ${bstH}`;
        document.getElementById('avl-compare-height').textContent = `Height: ${avlH}`;

        if (logPanel) {
            logPanel.innerHTML += `<div style="margin-top:12px;border-top:1px solid var(--border-light);padding-top:12px;"><strong>Final Stats:</strong> BST Total Steps: ${bstStepsTotal}, AVL Total Steps: ${avlStepsTotal}</div>`;
            logPanel.scrollTop = logPanel.scrollHeight;
        }
        
        this.ui.setStatus(`Compared insertion of ${values.length} elements.`, 'success');
    }

    _onUndo() {
        const result = this.engine.undo();
        if (result.success) {
            this.animation.stop();
            this.visualizer.clearHighlights();
            this.visualizer.renderTree(result.tree, true);
            this._updateTreeInfo();
            this.ui.setStatus(result.message, 'success');
        } else {
            this.ui.setStatus(result.message, 'warning');
        }
    }

    _onReset() {
        this.engine.reset();
        this.animation.stop();
        this.visualizer.renderTree(null, false);
        this.ui.buildStepsPanel([], '');
        this._updateTreeInfo();

        const travDisplay = document.getElementById('traversal-display');
        if (travDisplay) travDisplay.style.display = 'none';

        this.ui.setStatus('Tree reset. Enter values to create a new BST.', 'info');
        this.ui.showSection('section-home');
    }

    /* ============================================================
     * HELPER METHODS
     * ============================================================ */

    _updateTreeInfo() {
        const analysis = this.engine.analyze();
        this.currentAnalysis = analysis;
        this.ui.updateTreeInfo(analysis);

        /* Update home stats */
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('home-nodes',  analysis.totalNodes || 0);
        set('home-height', analysis.height >= 0 ? analysis.height : '-');
        set('home-type',   analysis.totalNodes > 0 ? analysis.treeType : 'Empty');
        set('home-valid',  analysis.totalNodes > 0 ? (analysis.isValidBST ? '✓ Valid' : '✗ Invalid') : '-');
    }

    _showPathInfo(title, path, comparisons, summary, success) {
        const panel = document.getElementById('path-info');
        if (!panel) return;

        panel.innerHTML = `
            <div class="path-title">${title}</div>
            <div class="path-str">${path || '—'}</div>
            <div class="path-meta">
                <span>Comparisons: <strong>${comparisons}</strong></span>
                <span class="${success ? 'text-success' : 'text-warn'}">${summary}</span>
            </div>
        `;
        panel.style.display = 'block';
    }

    _showDeletionCase(deletionCase, val, summary) {
        const panel = document.getElementById('deletion-info');
        if (!panel) return;

        const cases = {
            LEAF: {
                icon: '🍃',
                title: 'Case 1: Leaf Node',
                desc: `${val} has no children. Simply removed from the tree.`
            },
            ONE_CHILD: {
                icon: '🔗',
                title: 'Case 2: One Child',
                desc: `${val} has one child. The child takes the position of the deleted node.`
            },
            TWO_CHILDREN: {
                icon: '🔄',
                title: 'Case 3: Two Children',
                desc: `${val} has two children. Replaced with its inorder successor (smallest value in right subtree).`
            },
        };

        const caseInfo = cases[deletionCase] || { icon: '❓', title: 'Deletion', desc: summary };
        panel.innerHTML = `
            <div class="del-icon">${caseInfo.icon}</div>
            <div class="del-title">${caseInfo.title}</div>
            <div class="del-desc">${caseInfo.desc}</div>
        `;
        panel.style.display = 'block';
    }

    _showComplexity(operation) {
        const data = COMPLEXITY_DATA[operation];
        if (!data) return;

        const panel = document.getElementById('complexity-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="complexity-title">${data.title}</div>
            <div class="complexity-table">
                <div class="comp-row"><span>Average Case</span><span class="comp-val comp-avg">${data.average}</span></div>
                <div class="comp-row"><span>Worst Case</span><span class="comp-val comp-worst">${data.worst}</span></div>
                <div class="comp-row"><span>Space</span><span class="comp-val comp-space">${data.space}</span></div>
            </div>
            <div class="comp-note">${data.note}</div>
        `;
        panel.style.display = 'block';
    }
}

/* ============================================================
 * APPLICATION STARTUP
 * ============================================================ */

let app;

document.addEventListener('DOMContentLoaded', async () => {
    app = new BSTApp();
    await app.init();
    window.app = app; /* Make accessible to inline scripts */
});

window.BSTApp = BSTApp;
