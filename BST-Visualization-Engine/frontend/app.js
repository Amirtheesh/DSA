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

        /* Show initial empty tree */
        this.visualizer.renderTree(null, false);
        this._updateTreeInfo();

        /* Show dashboard */
        this.ui.showSection('section-home');

        console.log('[BSTApp] Initialized. Engine mode:', mode);
    }

    /* ============================================================
     * EVENT BINDING
     * ============================================================ */
    _bindEvents() {
        /* Navigation */
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                if (section) this.ui.showSection(section);
            });
        });

        /* Quick actions on home */
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                this._handleQuickAction(action);
            });
        });

        /* Matrix input create BST */
        const createBtn = document.getElementById('btn-create-bst');
        if (createBtn) createBtn.addEventListener('click', () => this._onCreateBST());

        /* Parse preview */
        const previewBtn = document.getElementById('btn-parse-preview');
        if (previewBtn) previewBtn.addEventListener('click', () => this._onParsePreview());

        /* Operations */
        document.getElementById('btn-insert')?.addEventListener('click', () => this._onInsert());
        document.getElementById('btn-search')?.addEventListener('click', () => this._onSearch());
        document.getElementById('btn-delete')?.addEventListener('click', () => this._onDelete());

        /* Enter key support on operation inputs */
        ['input-insert', 'input-search', 'input-delete'].forEach(id => {
            document.getElementById(id)?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const action = id.replace('input-', '');
                    this[`_on${action.charAt(0).toUpperCase() + action.slice(1)}`]();
                }
            });
        });

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
        this.ui.showSection('section-ops');
    }

    async _onSearch() {
        const input = document.getElementById('input-search');
        const val = parseInt(input?.value?.trim(), 10);

        if (isNaN(val)) {
            this.ui.setStatus('Enter a valid integer to search.', 'error');
            return;
        }

        if (this.engine.getNodeCount() === 0) {
            this.ui.setStatus('Tree is empty. Create a BST first.', 'warning');
            return;
        }

        this.animation.stop();
        this.visualizer.clearHighlights();

        const result = this.engine.search(val);

        /* Build steps panel */
        this.ui.buildStepsPanel(result.steps, 'SEARCH STEPS');

        /* Show path */
        const pathStr = result.path ? result.path.join(' → ') : '';
        this._showPathInfo('Search Path', pathStr, result.comparisons, result.summary, result.success);

        /* Animate */
        this.animation.playSteps(result.steps, () => {
            /* After animation, keep found/not-found state */
        });

        const type = result.success ? 'success' : 'warning';
        this.ui.setStatus(result.summary, type);

        this._showComplexity('search');
    }

    async _onInsert() {
        const input = document.getElementById('input-insert');
        const val = parseInt(input?.value?.trim(), 10);

        if (isNaN(val)) {
            this.ui.setStatus('Enter a valid integer to insert.', 'error');
            return;
        }

        this.animation.stop();
        this.visualizer.clearHighlights();

        const result = this.engine.insert(val);

        /* Re-render tree with new node */
        this.visualizer.adaptToTreeSize(this.engine.getNodeCount());
        this.visualizer.renderTree(result.tree, true);
        this._updateTreeInfo();

        /* Build steps */
        this.ui.buildStepsPanel(result.steps, 'INSERTION STEPS');

        const pathStr = result.path ? result.path.join(' → ') + (result.success ? ` → ${val}` : '') : '';
        this._showPathInfo('Insertion Path', pathStr, result.comparisons, result.summary, result.success);

        /* Animate on new tree */
        this.animation.playSteps(result.steps, () => {
            if (result.success) this.visualizer.highlightNode(val, 'inserted');
        });

        const type = result.success ? 'success' : 'warning';
        this.ui.setStatus(result.summary, type);

        if (input) input.value = '';
        this._showComplexity('insert');
    }

    async _onDelete() {
        const input = document.getElementById('input-delete');
        const val = parseInt(input?.value?.trim(), 10);

        if (isNaN(val)) {
            this.ui.setStatus('Enter a valid integer to delete.', 'error');
            return;
        }

        if (this.engine.getNodeCount() === 0) {
            this.ui.setStatus('Tree is empty.', 'warning');
            return;
        }

        this.animation.stop();

        /* Animate deletion steps on CURRENT tree BEFORE rendering new tree */
        const result = this.engine.delete(val);

        /* Build steps panel */
        this.ui.buildStepsPanel(result.steps, 'DELETION STEPS');

        /* Show deletion case explanation */
        this._showDeletionCase(result.deletionCase, val, result.summary);

        /* Animate steps, then re-render */
        this.animation.playSteps(result.steps, () => {
            /* After animation: render updated tree */
            setTimeout(() => {
                this.visualizer.clearHighlights();
                this.visualizer.renderTree(result.tree, true);
                this._updateTreeInfo();
            }, 300);
        });

        const type = result.success ? 'success' : 'warning';
        this.ui.setStatus(result.summary, type);

        if (input) input.value = '';
        this._showComplexity('delete');
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
