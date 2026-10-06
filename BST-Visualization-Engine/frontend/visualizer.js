/**
 * visualizer.js - SVG Tree Renderer
 *
 * Responsible for:
 *   - Converting BST JSON tree data to SVG node positions
 *   - Drawing nodes (circles with values)
 *   - Drawing edges (lines between parent and child)
 *   - Managing visual states (normal, highlighted, found, etc.)
 *   - Smooth transitions when tree structure changes
 *
 * ARCHITECTURE:
 *   The visualizer is completely separate from the BST algorithm.
 *   It receives tree data (JSON) from BSTEngine and renders it.
 *   It NEVER runs BST logic itself.
 *
 * NODE VISUAL STATES:
 *   normal      — default blue circle
 *   comparing   — yellow, pulsing (currently being compared)
 *   path        — orange border (node is on the search/insert path)
 *   found       — green (value found)
 *   inserted    — cyan, glowing (newly inserted node)
 *   deleted     — red (node being deleted)
 *   successor   — purple (inorder successor selected)
 *   replaced    — magenta (node value replaced)
 *   visited     — teal (visited during traversal)
 *   active      — bright white highlight
 */

'use strict';

class BSTVisualizer {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.nodeRadius = 28;
        this.levelHeight = 85;
        this.minNodeSpacing = 20;
        this.nodeMap = new Map(); /* value → DOM element */
        this.currentHighlights = new Set();
        this.animating = false;
        this.showBalanceFactors = false;

        /* Colors for each visual state */
        this.stateColors = {
            normal:    { fill: '#1e3a5f', stroke: '#3b82f6', text: '#e2e8f0' },
            comparing: { fill: '#854d0e', stroke: '#f59e0b', text: '#fef3c7' },
            path:      { fill: '#7c2d12', stroke: '#f97316', text: '#ffedd5' },
            found:     { fill: '#14532d', stroke: '#22c55e', text: '#dcfce7' },
            inserted:  { fill: '#164e63', stroke: '#06b6d4', text: '#cffafe' },
            deleted:   { fill: '#7f1d1d', stroke: '#ef4444', text: '#fee2e2' },
            successor: { fill: '#4c1d95', stroke: '#a855f7', text: '#f3e8ff' },
            replaced:  { fill: '#831843', stroke: '#ec4899', text: '#fce7f3' },
            visited:   { fill: '#134e4a', stroke: '#14b8a6', text: '#ccfbf1' },
            active:    { fill: '#1e3a5f', stroke: '#ffffff', text: '#ffffff' },
        };

        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(this.svg.parentElement);
    }

    _onResize() {
        if (this._lastTree) this.renderTree(this._lastTree, false);
    }

    /* ============================================================
     * POSITION CALCULATION
     * Uses a recursive algorithm to assign x,y coordinates to
     * each node, avoiding overlaps.
     * ============================================================ */

    /**
     * calculatePositions - Assign (x, y) coordinates to each node.
     *
     * Algorithm:
     *   1. Count nodes in each subtree for proportional spacing.
     *   2. Recursively assign positions, adjusting x-offset based
     *      on subtree sizes.
     *
     * @param node      BST JSON node {value, left, right}
     * @param x         Center x for this subtree
     * @param y         Center y for this node
     * @param spread    Available horizontal width for this subtree
     * @param positions Map: value → {x, y}
     */
    _calculatePositions(node, x, y, spread, positions) {
        if (!node) return;

        positions.set(node.value, { x, y });

        /* Count nodes in left and right subtrees to split space proportionally */
        const leftCount  = this._countNodes(node.left);
        const rightCount = this._countNodes(node.right);
        const totalChildren = leftCount + rightCount;

        let leftSpread, rightSpread, leftX, rightX;

        if (totalChildren === 0) {
            leftSpread = rightSpread = spread / 2;
            leftX  = x - spread / 4;
            rightX = x + spread / 4;
        } else {
            const halfSpread = Math.max(spread / 2, this.nodeRadius * 3);
            leftSpread  = halfSpread;
            rightSpread = halfSpread;
            leftX  = x - halfSpread / 2 - this.nodeRadius;
            rightX = x + halfSpread / 2 + this.nodeRadius;
        }

        const nextY = y + this.levelHeight;

        if (node.left)  this._calculatePositions(node.left,  leftX,  nextY, leftSpread,  positions);
        if (node.right) this._calculatePositions(node.right, rightX, nextY, rightSpread, positions);
    }

    _countNodes(node) {
        if (!node) return 0;
        return 1 + this._countNodes(node.left) + this._countNodes(node.right);
    }

    /* ============================================================
     * BETTER POSITION ALGORITHM - Reingold-Tilford inspired
     * Produces non-overlapping, aesthetically pleasing layouts
     * ============================================================ */

    /**
     * _computeLayout - Assign x-coords using Reingold-Tilford style.
     * Each leaf gets position 0..n-1 in inorder.
     * Internal nodes get the midpoint of their children.
     */
    _computeLayout(node, positions, depth, counter) {
        if (!node) return;

        this._computeLayout(node.left, positions, depth + 1, counter);
        node._x = counter.val++;
        node._depth = depth;
        this._computeLayout(node.right, positions, depth + 1, counter);
    }

    /* ============================================================
     * MAIN RENDER FUNCTION
     * ============================================================ */

    /**
     * renderTree - Draw the entire BST as SVG.
     *
     * @param treeData  JSON tree: { value, left, right } or null
     * @param animate   If true, apply entrance animation
     */
    renderTree(treeData, animate = true) {
        this._lastTree = treeData;
        this.nodeMap.clear();
        this.currentHighlights.clear();

        const svg = this.svg;
        const W = svg.parentElement.clientWidth  || 800;
        const H = svg.parentElement.clientHeight || 500;

        svg.setAttribute('width',  W);
        svg.setAttribute('height', H);
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

        /* Clear previous content */
        svg.innerHTML = '';

        if (!treeData) {
            this._drawEmptyMessage(svg, W, H);
            return;
        }

        /* Assign layout positions using inorder-counter approach */
        const counter = { val: 0 };
        const treeCopy = this._deepCopyWithLayout(treeData);
        this._computeLayout(treeCopy, new Map(), 0, counter);
        const totalLeaves = counter.val;

        /* Compute SVG positions from layout positions */
        const padding = 60;
        const availW = W - padding * 2;
        const unitW  = totalLeaves > 1 ? availW / (totalLeaves - 1) : availW;
        const startY = 60;

        const positions = new Map();
        this._assignSVGPositions(treeCopy, positions, padding, unitW, startY, H);

        /* Ensure minimum spacing */
        this._enforceMinSpacing(positions, this.nodeRadius * 2 + this.minNodeSpacing);

        /* Draw edges first (behind nodes) */
        const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgeGroup.setAttribute('class', 'edges');
        svg.appendChild(edgeGroup);

        /* Draw nodes group */
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeGroup.setAttribute('class', 'nodes');
        svg.appendChild(nodeGroup);

        /* Render the tree recursively */
        this._renderNode(treeCopy, positions, edgeGroup, nodeGroup, null, animate);
    }

    _deepCopyWithLayout(node) {
        if (!node) return null;
        const left = this._deepCopyWithLayout(node.left);
        const right = this._deepCopyWithLayout(node.right);
        
        const lh = left ? left._height : 0;
        const rh = right ? right._height : 0;
        
        return {
            value: node.value,
            left: left,
            right: right,
            _x: 0, 
            _depth: 0,
            _height: Math.max(lh, rh) + 1,
            _bf: lh - rh
        };
    }

    _assignSVGPositions(node, positions, padding, unitW, startY, svgH) {
        if (!node) return;
        const x = padding + node._x * unitW;
        const y = startY + node._depth * this.levelHeight;
        positions.set(node.value, { x, y });
        this._assignSVGPositions(node.left,  positions, padding, unitW, startY, svgH);
        this._assignSVGPositions(node.right, positions, padding, unitW, startY, svgH);
    }

    _enforceMinSpacing(positions, minDist) {
        /* Group by depth (same y level), sort by x, enforce min horizontal spacing */
        const byDepth = new Map();
        for (const [val, pos] of positions) {
            const d = Math.round(pos.y);
            if (!byDepth.has(d)) byDepth.set(d, []);
            byDepth.get(d).push({ val, pos });
        }
        for (const nodes of byDepth.values()) {
            nodes.sort((a, b) => a.pos.x - b.pos.x);
            for (let i = 1; i < nodes.length; i++) {
                const prev = nodes[i-1].pos;
                const curr = nodes[i].pos;
                if (curr.x - prev.x < minDist) {
                    curr.x = prev.x + minDist;
                }
            }
        }
    }

    _renderNode(node, positions, edgeGroup, nodeGroup, parentPos, animate) {
        if (!node) return;

        const pos = positions.get(node.value);
        if (!pos) return;

        /* Draw edge to parent */
        if (parentPos) {
            this._drawEdge(edgeGroup, parentPos, pos, animate);
        }

        /* Draw this node */
        this._drawNode(nodeGroup, node.value, pos, 'normal', animate, node._bf);

        /* Recurse on children */
        this._renderNode(node.left,  positions, edgeGroup, nodeGroup, pos, animate);
        this._renderNode(node.right, positions, edgeGroup, nodeGroup, pos, animate);
    }

    /* ============================================================
     * DRAWING PRIMITIVES
     * ============================================================ */

    /**
     * drawEdge - Draw a line between parent and child nodes.
     */
    _drawEdge(group, from, to, animate) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y + this.nodeRadius - 4);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y - this.nodeRadius + 4);
        line.setAttribute('stroke', '#334155');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('class', 'bst-edge');

        if (animate) {
            line.style.opacity = '0';
            setTimeout(() => {
                line.style.transition = 'opacity 0.3s ease';
                line.style.opacity = '1';
            }, 50);
        }

        group.appendChild(line);
    }

    /**
     * drawNode - Draw a circular node with value text.
     *
     * @param group    SVG group to append to
     * @param value    Node value to display
     * @param pos      {x, y} position
     * @param state    Visual state name (keys of stateColors)
     * @param animate  Whether to animate entrance
     * @param bf       Balance Factor (optional)
     */
    _drawNode(group, value, pos, state, animate, bf = 0) {
        const colors = this.stateColors[state] || this.stateColors.normal;
        const r = this.nodeRadius;

        /* Container group */
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `bst-node bst-node-${value}`);
        g.setAttribute('data-value', value);
        g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

        /* Shadow/glow filter */
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shadow.setAttribute('r', r + 2);
        shadow.setAttribute('fill', 'none');
        shadow.setAttribute('stroke', colors.stroke);
        shadow.setAttribute('stroke-width', '1');
        shadow.setAttribute('opacity', '0.3');

        /* Main circle */
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', r);
        circle.setAttribute('fill', colors.fill);
        circle.setAttribute('stroke', colors.stroke);
        circle.setAttribute('stroke-width', '2.5');
        circle.setAttribute('class', 'bst-node-circle');

        /* Gradient overlay for depth effect */
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        grad.setAttribute('r', r - 4);
        grad.setAttribute('fill', 'rgba(255,255,255,0.05)');
        grad.setAttribute('cy', -r * 0.3);

        /* Value text */
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('fill', colors.text);
        text.setAttribute('font-size', value >= 1000 ? '11' : value >= 100 ? '13' : '15');
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', "'Inter', 'Segoe UI', sans-serif");
        text.setAttribute('class', 'bst-node-text');
        text.textContent = value;

        g.appendChild(shadow);
        g.appendChild(circle);
        g.appendChild(grad);
        g.appendChild(text);

        if (this.showBalanceFactors) {
            const bfColor = bf === 0 ? '#22c55e' : (Math.abs(bf) === 1 ? '#22c55e' : (bf > 1 ? '#eab308' : '#ef4444'));
            const bfBadge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bfBadge.setAttribute('cx', r - 4);
            bfBadge.setAttribute('cy', -r + 4);
            bfBadge.setAttribute('r', 10);
            bfBadge.setAttribute('fill', bfColor);
            bfBadge.setAttribute('stroke', '#0f172a');
            bfBadge.setAttribute('stroke-width', '1.5');

            const bfText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            bfText.setAttribute('x', r - 4);
            bfText.setAttribute('y', -r + 4);
            bfText.setAttribute('text-anchor', 'middle');
            bfText.setAttribute('dominant-baseline', 'central');
            bfText.setAttribute('fill', '#ffffff');
            bfText.setAttribute('font-size', '10');
            bfText.setAttribute('font-weight', 'bold');
            bfText.setAttribute('font-family', "'Inter', sans-serif");
            bfText.textContent = bf > 0 ? `+${bf}` : bf;

            g.appendChild(bfBadge);
            g.appendChild(bfText);
        }

        if (animate) {
            g.style.opacity = '0';
            g.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(0.3)`;
            setTimeout(() => {
                g.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
                g.style.opacity = '1';
                g.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1)`;
            }, 80);
        }

        group.appendChild(g);

        /* Save reference for later highlighting */
        this.nodeMap.set(value, { element: g, circle, text, state: 'normal', pos });
    }

    /* ============================================================
     * HIGHLIGHTING
     * ============================================================ */

    /**
     * highlightNode - Apply a visual state to a node.
     *
     * @param value  Node value to highlight
     * @param state  State name from stateColors
     * @param pulse  If true, add pulsing animation
     */
    highlightNode(value, state, pulse = false) {
        const nodeData = this.nodeMap.get(value);
        if (!nodeData) return;

        const colors = this.stateColors[state] || this.stateColors.normal;
        const { element, circle, text } = nodeData;

        circle.setAttribute('fill',   colors.fill);
        circle.setAttribute('stroke', colors.stroke);
        text.setAttribute('fill',     colors.text);

        if (pulse) {
            circle.style.animation = 'bst-pulse 0.6s ease infinite alternate';
        } else {
            circle.style.animation = '';
        }

        this.currentHighlights.add(value);
        nodeData.state = state;
    }

    /**
     * clearHighlights - Reset all highlighted nodes to normal state.
     */
    clearHighlights() {
        for (const value of this.currentHighlights) {
            this.highlightNode(value, 'normal');
        }
        this.currentHighlights.clear();

        /* Also clear any animation markers */
        for (const [, nodeData] of this.nodeMap) {
            nodeData.circle.style.animation = '';
        }
    }

    /**
     * highlightPath - Highlight multiple nodes as a path.
     *
     * @param path    Array of node values in path order
     * @param state   State to apply ('path', 'found', etc.)
     */
    highlightPath(path, state = 'path') {
        for (const value of path) {
            this.highlightNode(value, state);
        }
    }

    /**
     * highlightEdge - Highlight the edge between two nodes.
     *
     * @param fromVal  Parent node value
     * @param toVal    Child node value
     * @param color    Edge color
     */
    highlightEdge(fromVal, toVal, color = '#f97316') {
        /* Find the edge SVG element — edges are drawn as lines */
        const fromData = this.nodeMap.get(fromVal);
        const toData   = this.nodeMap.get(toVal);
        if (!fromData || !toData) return;

        const from = fromData.pos;
        const to   = toData.pos;

        /* Find the matching edge line */
        const edges = this.svg.querySelectorAll('.bst-edge');
        for (const edge of edges) {
            const x1 = parseFloat(edge.getAttribute('x1'));
            const y1 = parseFloat(edge.getAttribute('y1'));
            const x2 = parseFloat(edge.getAttribute('x2'));
            const y2 = parseFloat(edge.getAttribute('y2'));

            /* Match by approximate position */
            const fromMatch = Math.abs(x1 - from.x) < 5 && Math.abs(y1 - (from.y + this.nodeRadius - 4)) < 5;
            const toMatch   = Math.abs(x2 - to.x) < 5   && Math.abs(y2 - (to.y - this.nodeRadius + 4)) < 5;

            if (fromMatch && toMatch) {
                edge.setAttribute('stroke', color);
                edge.setAttribute('stroke-width', '3');
                break;
            }
        }
    }

    /* ============================================================
     * EMPTY STATE
     * ============================================================ */

    _drawEmptyMessage(svg, W, H) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', W/2 - 160);
        rect.setAttribute('y', H/2 - 50);
        rect.setAttribute('width', 320);
        rect.setAttribute('height', 100);
        rect.setAttribute('rx', 12);
        rect.setAttribute('fill', 'rgba(30,58,95,0.5)');
        rect.setAttribute('stroke', '#3b82f6');
        rect.setAttribute('stroke-width', '1');

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', W/2);
        icon.setAttribute('y', H/2 - 10);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('fill', '#3b82f6');
        icon.setAttribute('font-size', '24');
        icon.textContent = '🌲';

        const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text1.setAttribute('x', W/2);
        text1.setAttribute('y', H/2 + 20);
        text1.setAttribute('text-anchor', 'middle');
        text1.setAttribute('fill', '#94a3b8');
        text1.setAttribute('font-size', '14');
        text1.setAttribute('font-family', "'Inter', sans-serif");
        text1.textContent = 'Enter values above and click "Create BST"';

        g.appendChild(rect);
        g.appendChild(icon);
        g.appendChild(text1);
        svg.appendChild(g);
    }

    /* ============================================================
     * UTILITIES
     * ============================================================ */

    /**
     * getNodePosition - Get the SVG coordinates of a node.
     * Used by animation engine to position tooltips/overlays.
     */
    getNodePosition(value) {
        const nodeData = this.nodeMap.get(value);
        return nodeData ? nodeData.pos : null;
    }

    /**
     * getSVGElement - Return the raw SVG element.
     */
    getSVGElement() {
        return this.svg;
    }

    /**
     * setSVGSize - Update the SVG canvas size.
     */
    setSVGSize(w, h) {
        this.svg.setAttribute('width', w);
        this.svg.setAttribute('height', h);
        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    /**
     * bumpNodeCount - Adjust node radius for large trees.
     */
    adaptToTreeSize(nodeCount) {
        if (nodeCount > 20) {
            this.nodeRadius = 22;
            this.levelHeight = 70;
        } else if (nodeCount > 10) {
            this.nodeRadius = 25;
            this.levelHeight = 78;
        } else {
            this.nodeRadius = 28;
            this.levelHeight = 85;
        }
    }
}

window.BSTVisualizer = BSTVisualizer;
