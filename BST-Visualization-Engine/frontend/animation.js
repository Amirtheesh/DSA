/**
 * animation.js - Step-Based Animation Engine
 *
 * Processes operation steps from the BST engine and animates them
 * sequentially on the SVG visualization.
 *
 * ARCHITECTURE:
 *   BSTEngine.operation() → steps[]
 *         ↓
 *   AnimationEngine.playSteps(steps)
 *         ↓
 *   For each step: BSTVisualizer.highlightNode()
 *         ↓
 *   StepsPanel.showStep()
 *
 * This decoupled design means the algorithm (C/WASM/JS engine)
 * generates steps, and the animation engine renders them.
 * The two concerns are completely separate.
 *
 * STEP TYPES (must match STEP constants in bst-engine.js):
 *   COMPARE=1    → highlight node yellow (currently comparing)
 *   MOVE_LEFT=2  → show directional indicator
 *   MOVE_RIGHT=3 → show directional indicator
 *   FOUND=4      → highlight node green
 *   NOT_FOUND=5  → show X indicator
 *   INSERT=6     → highlight new node cyan
 *   DELETE=7     → flash node red
 *   SELECT_SUCC=8 → highlight successor purple
 *   REPLACE_NODE=9 → flash magenta
 *   VISIT=10     → highlight visited node teal
 *   LEAF_DELETE=11  → leaf deletion animation
 *   ONE_CHILD_DEL=12 → one-child deletion
 *   TWO_CHILD_DEL=13 → two-child deletion case
 */

'use strict';

class AnimationEngine {
    constructor(visualizer, stepsPanel) {
        this.visualizer = visualizer;
        this.stepsPanel = stepsPanel;

        this.speeds = { Slow: 1200, Normal: 650, Fast: 280, Instant: 50 };
        this.currentSpeed = 'Normal';
        this.delay = this.speeds[this.currentSpeed];

        this.playing = false;
        this.paused = false;
        this.currentStepIndex = 0;
        this.steps = [];
        this.onComplete = null;
        this._timer = null;
    }

    setSpeed(speed) {
        this.currentSpeed = speed;
        this.delay = this.speeds[speed] || 650;
    }

    /* ============================================================
     * STEP PROCESSING
     * Maps step types to visual actions
     * ============================================================ */

    /**
     * _processStep - Apply visual effects for one operation step.
     *
     * @param step  OperationStep object from BSTEngine
     * @param index Step index (for numbering in panel)
     */
    _processStep(step, index) {
        const v = step.nodeValue;
        const t = step.targetValue;

        /* Clear previous highlights first */
        this.visualizer.clearHighlights();

        switch (step.type) {
            case 1: /* COMPARE */
                if (v >= 0) this.visualizer.highlightNode(v, 'comparing', true);
                break;

            case 2: /* MOVE_LEFT */
                if (v >= 0) this.visualizer.highlightNode(v, 'path');
                this._showDirectionArrow('←', v);
                break;

            case 3: /* MOVE_RIGHT */
                if (v >= 0) this.visualizer.highlightNode(v, 'path');
                this._showDirectionArrow('→', v);
                break;

            case 4: /* FOUND */
                if (v >= 0) this.visualizer.highlightNode(v, 'found', true);
                break;

            case 5: /* NOT_FOUND */
                /* Show a "dead end" flash on the last visited node */
                if (this._lastVisited >= 0) {
                    this.visualizer.highlightNode(this._lastVisited, 'deleted');
                }
                break;

            case 6: /* INSERT */
                if (v >= 0) {
                    setTimeout(() => {
                        this.visualizer.highlightNode(v, 'inserted', true);
                    }, 100);
                }
                break;

            case 7: /* DELETE */
                if (v >= 0) this.visualizer.highlightNode(v, 'deleted', true);
                break;

            case 8: /* SELECT_SUCC */
                if (v >= 0) this.visualizer.highlightNode(v, 'successor', true);
                break;

            case 9: /* REPLACE_NODE */
                if (v >= 0) this.visualizer.highlightNode(v, 'replaced', true);
                break;

            case 10: /* VISIT (traversal) */
                if (v >= 0) this.visualizer.highlightNode(v, 'visited', true);
                break;

            case 11: /* LEAF_DELETE */
                if (v >= 0) this.visualizer.highlightNode(v, 'deleted', true);
                break;

            case 12: /* ONE_CHILD_DEL */
                if (v >= 0) this.visualizer.highlightNode(v, 'deleted');
                if (step.successorVal >= 0) this.visualizer.highlightNode(step.successorVal, 'active');
                break;

            case 13: /* TWO_CHILD_DEL */
                if (v >= 0) this.visualizer.highlightNode(v, 'deleted');
                break;
        }

        /* Track last visited node (for NOT_FOUND case) */
        if (v >= 0) this._lastVisited = v;

        /* Update the steps panel */
        if (this.stepsPanel) {
            this.stepsPanel.highlightStep(index);
            this.stepsPanel.setCurrentMessage(step.message);
        }
    }

    _showDirectionArrow(dir, nodeValue) {
        /* Brief visual indicator — just use the step panel message */
    }

    /* ============================================================
     * PLAYBACK CONTROL
     * ============================================================ */

    /**
     * playSteps - Play all steps sequentially with delays.
     *
     * @param steps       Array of OperationStep objects
     * @param onComplete  Callback when animation completes
     */
    playSteps(steps, onComplete = null) {
        this.stop();
        this.steps = steps || [];
        this.currentStepIndex = 0;
        this.playing = true;
        this.paused = false;
        this.onComplete = onComplete;
        this._lastVisited = -1;

        if (this.steps.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        this._playNext();
    }

    _playNext() {
        if (!this.playing || this.paused) return;
        if (this.currentStepIndex >= this.steps.length) {
            this._onFinish();
            return;
        }

        const step = this.steps[this.currentStepIndex];
        this._processStep(step, this.currentStepIndex);
        this.currentStepIndex++;

        this._timer = setTimeout(() => this._playNext(), this.delay);
    }

    _onFinish() {
        this.playing = false;
        if (this.onComplete) this.onComplete();
    }

    pause() {
        this.paused = true;
        if (this._timer) clearTimeout(this._timer);
    }

    resume() {
        if (this.paused) {
            this.paused = false;
            this._playNext();
        }
    }

    stop() {
        this.playing = false;
        this.paused = false;
        if (this._timer) clearTimeout(this._timer);
        this.steps = [];
        this.currentStepIndex = 0;
    }

    /**
     * playInstant - Execute all steps without animation delay.
     * Used when user wants to skip animation.
     */
    playInstant(steps) {
        this.stop();
        for (let i = 0; i < steps.length; i++) {
            this._processStep(steps[i], i);
        }
    }

    /**
     * stepForward - Advance one step manually.
     */
    stepForward() {
        if (this.currentStepIndex < this.steps.length) {
            this._processStep(this.steps[this.currentStepIndex], this.currentStepIndex);
            this.currentStepIndex++;
            if (this.currentStepIndex >= this.steps.length) {
                this._onFinish();
            }
        }
    }

    /**
     * stepBackward - Go back one step (clears and replays to previous).
     */
    stepBackward() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex = Math.max(0, this.currentStepIndex - 2);
            this.visualizer.clearHighlights();
            if (this.currentStepIndex > 0) {
                this._processStep(this.steps[this.currentStepIndex - 1],
                                  this.currentStepIndex - 1);
            }
        }
    }

    isPlaying() { return this.playing && !this.paused; }
    isPaused()  { return this.paused; }

    /**
     * animateTraversal - Play traversal with sequence display.
     *
     * @param traversalResult  Result from BSTEngine.inorder/preorder/postorder
     * @param onNodeVisit      Callback(value, index) called when each node is visited
     * @param onComplete       Called when traversal finishes
     */
    animateTraversal(traversalResult, onNodeVisit, onComplete) {
        const steps = traversalResult.steps || [];
        let visitIndex = 0;

        const wrappedSteps = steps.map((step, i) => ({
            ...step,
            _visitIndex: visitIndex++
        }));

        this.playSteps(wrappedSteps, () => {
            this.visualizer.clearHighlights();
            if (onComplete) onComplete();
        });

        /* Override _processStep for traversal to call onNodeVisit */
        const originalProcess = this._processStep.bind(this);
        this._processStep = (step, index) => {
            originalProcess(step, index);
            if (step.type === 10 && onNodeVisit) { /* STEP.VISIT */
                onNodeVisit(step.nodeValue, step._visitIndex);
            }
        };
    }

    /**
     * resetTraversalOverride - Restore normal step processing.
     */
    resetTraversalOverride() {
        this._processStep = AnimationEngine.prototype._processStep.bind(this);
    }
}

window.AnimationEngine = AnimationEngine;
