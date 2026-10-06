import os

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BST Engine | Visualization Lab</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="styles.css" />
</head>
<body>

<div class="app-container">
    <!-- SIDEBAR -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#logo-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#14b8a6"/></linearGradient></defs><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <div class="sidebar-title">
                    <span class="title-main">BST Engine</span>
                    <span class="title-sub">Visualization Lab</span>
                </div>
            </div>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-group">
                <div class="nav-group-label">Dashboard</div>
                <a class="nav-item" href="#/home">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>Home</span>
                </a>
            </div>

            <div class="nav-group">
                <div class="nav-group-label">Build</div>
                <a class="nav-item" href="#/input">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    <span>Matrix Input</span>
                </a>
            </div>

            <div class="nav-group">
                <div class="nav-group-label">Operations</div>
                <a class="nav-item" href="#/bst/operations">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    <span>BST Operations</span>
                </a>
                <a class="nav-item" href="#/avl/compare">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
                    <span>BST vs AVL</span>
                </a>
                <a class="nav-item" href="#/traversals">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
                    <span>Traversals</span>
                </a>
            </div>

            <div class="nav-group">
                <div class="nav-group-label">Analysis</div>
                <a class="nav-item" href="#/analysis">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.5 16.5h13"/><circle cx="12" cy="16" r="1"/></svg>
                    <span>Tree Analysis</span>
                </a>
                <a class="nav-item" href="#/bst/balance">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M3 12h18"/><path d="M12 12 3 7"/><path d="M12 12l9-5"/></svg>
                    <span>Balance Analysis</span>
                </a>
                <a class="nav-item" href="#/complexity">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    <span>Complexity</span>
                </a>
            </div>
        </nav>

        <div class="sidebar-footer">
            <div class="status-pill" id="engine-mode" title="Engine Status">
                <span class="status-dot"></span>
                <span class="status-text">Initializing...</span>
            </div>
        </div>
    </aside>

    <!-- MAIN APP AREA -->
    <main class="main-wrapper">
        <header class="topbar">
            <div class="topbar-left">
                <h1 class="page-title">BST Engine</h1>
            </div>
            <div class="topbar-right">
                <button class="btn btn-secondary btn-icon-text" id="btn-undo" title="Undo last operation">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                    Undo
                </button>
                <button class="btn btn-danger btn-icon-text" id="btn-reset" title="Reset tree">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Reset
                </button>
            </div>
        </header>

        <div id="status-message" class="status-message" role="alert"></div>

        <div class="content-area">
            
            <!-- ROW 1: GLOBAL STATS -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-label">Total Nodes</div>
                    <div class="stat-value" id="info-nodes">0</div>
                    <div style="display:none;" id="home-nodes"></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Tree Height</div>
                    <div class="stat-value text-teal" id="info-height">-</div>
                    <div style="display:none;" id="home-height"></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Balanced</div>
                    <div class="stat-value text-blue" id="info-balanced">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Valid BST</div>
                    <div class="stat-value text-green" id="info-valid">-</div>
                    <div style="display:none;" id="home-valid"></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Tree Type</div>
                    <div class="stat-value text-indigo" id="info-type">Empty</div>
                    <div style="display:none;" id="home-type"></div>
                </div>
            </div>

            <!-- ROW 2: UNIFIED WORKSPACE (60% Canvas / 40% Right Panel) -->
            <div class="workspace-row">
                <!-- 60% Left: Global Visualization Area -->
                <div class="canvas-panel card">
                    <div class="card-header border-b flex-between" style="padding:12px 16px;">
                        <h2 class="card-title" style="margin:0;">Visualization</h2>
                        <div class="anim-toolbar flex gap-2">
                            <button class="btn btn-ghost btn-icon" id="btn-anim-prev">⏮</button>
                            <button class="btn btn-primary btn-icon" id="btn-anim-play">▶</button>
                            <button class="btn btn-ghost btn-icon" id="btn-anim-pause">⏸</button>
                            <button class="btn btn-ghost btn-icon" id="btn-anim-next">⏭</button>
                            <button class="btn btn-ghost btn-icon" id="btn-anim-stop">⏹</button>
                            <select id="speed-select" class="input-base text-sm ml-2" style="height:28px; padding:0 8px;">
                                <option value="Slow">Slow</option>
                                <option value="Normal" selected>Normal</option>
                                <option value="Fast">Fast</option>
                                <option value="Instant">Instant</option>
                            </select>
                        </div>
                    </div>
                    <div class="canvas-wrapper">
                        <!-- We stack all specific canvases here. CSS visibility is toggled based on the active section -->
                        <svg id="bst-svg"></svg>
                        <svg id="bst-svg-trav"></svg>
                        <svg id="bst-svg-balance"></svg>
                        <svg id="bst-svg-home"></svg>
                        
                        <div class="compare-canvases">
                            <div class="compare-col border-r">
                                <div class="text-xs font-bold text-muted p-2 border-b flex-between">Standard BST <span id="bst-compare-height"></span></div>
                                <svg id="bst-svg-compare-bst"></svg>
                            </div>
                            <div class="compare-col">
                                <div class="text-xs font-bold text-muted p-2 border-b flex-between">AVL Tree <span id="avl-compare-height"></span></div>
                                <svg id="bst-svg-compare-avl"></svg>
                            </div>
                        </div>

                        <div id="home-empty-state" class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <h3>No Tree Found</h3>
                            <p>Load a sample tree or create one via Matrix Input.</p>
                            <button class="btn btn-primary mt-4" id="btn-load-sample">Load Sample Tree</button>
                        </div>
                    </div>
                </div>

                <!-- 40% Right: Dynamic Content Panel (The routing sections live here) -->
                <div class="right-panel card">
                    
                    <!-- HOME SECTION -->
                    <section class="section active p-5" id="section-home">
                        <div class="hero">
                            <h2 class="hero-title text-gradient text-2xl font-bold mb-3">BST Engine Lab</h2>
                            <p class="hero-desc text-sm text-muted">A high-performance educational laboratory powered by a C DSA core compiled to WebAssembly. Analyze, manipulate, and visualize trees at native speed.</p>
                        </div>
                        <div class="divider my-4"></div>
                        <h3 class="font-bold mb-3">Quick Actions</h3>
                        <div class="grid-2-col gap-3">
                            <a href="#/input" class="btn btn-secondary flex-1 justify-start">🌲 Create BST</a>
                            <a href="#/bst/operations/insert" class="btn btn-secondary flex-1 justify-start">➕ Insert Node</a>
                            <a href="#/traversals" class="btn btn-secondary flex-1 justify-start">🔄 Traversals</a>
                            <a href="#/analysis" class="btn btn-secondary flex-1 justify-start">🔬 Analyze Tree</a>
                        </div>
                        
                        <!-- Extra tree info to keep app.js happy -->
                        <div style="display:none;">
                            <span id="info-leaves"></span><span id="info-internal"></span><span id="info-levels"></span>
                            <span id="info-edges"></span><span id="info-min"></span><span id="info-max"></span>
                        </div>
                    </section>

                    <!-- MATRIX INPUT SECTION -->
                    <section class="section flex-col h-full" id="section-input">
                        <div class="tab-header"><h3 class="font-bold">Matrix Input</h3></div>
                        <div class="p-4 flex-col grow overflow-y-auto">
                            <p class="text-sm text-muted mb-3">Enter values separated by spaces, commas, or newlines.</p>
                            <textarea class="input-area w-full" id="matrix-input" rows="4" placeholder="50 30 70&#10;20 40 60&#10;80"></textarea>
                            <div class="flex gap-2 mb-4">
                                <button class="btn btn-secondary flex-1" id="btn-parse-preview">👁 Preview</button>
                                <button class="btn btn-primary flex-1" id="btn-create-bst">🌲 Create BST</button>
                            </div>
                            
                            <h4 class="font-bold text-sm mb-2">Parsed Values</h4>
                            <div id="parsed-values" class="parsed-box p-3 text-sm text-muted mb-2">Click "Preview" to see extracted values.</div>
                            <div id="parse-errors" class="text-error text-sm mb-4"></div>
                            
                            <div class="divider my-4"></div>
                            
                            <h4 class="font-bold text-sm mb-2">Quick Load Examples</h4>
                            <div class="flex-col gap-2">
                                <button class="btn btn-ghost justify-start" onclick="document.getElementById('matrix-input').value='50 30 70 20 40 60 80'">Standard (7 nodes)</button>
                                <button class="btn btn-ghost justify-start" onclick="document.getElementById('matrix-input').value='10 20 30 40 50'">Right-Skewed</button>
                                <button class="btn btn-ghost justify-start" onclick="document.getElementById('matrix-input').value='50 40 30 20 10'">Left-Skewed</button>
                            </div>
                        </div>
                    </section>

                    <!-- OPS LANDING SECTION -->
                    <section class="section flex-col h-full" id="section-ops-landing">
                        <div class="tab-header"><h3 class="font-bold">Operations</h3></div>
                        <div class="p-4 overflow-y-auto">
                            <h4 class="font-bold text-sm mb-3">Basic</h4>
                            <div class="grid-2-col gap-3 mb-6">
                                <a href="#/bst/operations/search" class="btn btn-secondary justify-start">🔍 Search</a>
                                <a href="#/bst/operations/insert" class="btn btn-secondary justify-start">➕ Insert</a>
                                <a href="#/bst/operations/delete" class="btn btn-secondary justify-start">➖ Delete</a>
                            </div>
                            <h4 class="font-bold text-sm mb-3">Advanced</h4>
                            <div class="grid-2-col gap-3">
                                <a href="#/bst/operations/minimum" class="btn btn-ghost justify-start text-left">⬇️ Min</a>
                                <a href="#/bst/operations/maximum" class="btn btn-ghost justify-start text-left">⬆️ Max</a>
                                <a href="#/bst/operations/height" class="btn btn-ghost justify-start text-left">📏 Height</a>
                                <a href="#/bst/operations/depth" class="btn btn-ghost justify-start text-left">🎯 Depth</a>
                                <a href="#/bst/operations/parent" class="btn btn-ghost justify-start text-left">👪 Parent</a>
                                <a href="#/bst/operations/sibling" class="btn btn-ghost justify-start text-left">👯 Sibling</a>
                                <a href="#/bst/operations/lca" class="btn btn-ghost justify-start text-left">🌳 LCA</a>
                            </div>
                        </div>
                    </section>

                    <!-- OPERATION VIEW -->
                    <section class="section flex-col h-full" id="section-operation">
                        <!-- Custom inner tabs via vanilla JS -->
                        <div class="tab-header-row border-b flex">
                            <button class="inner-tab-btn active" data-target="ops-tab-controls">Controls</button>
                            <button class="inner-tab-btn" data-target="ops-tab-steps">Step-by-step</button>
                            <button class="inner-tab-btn" data-target="ops-tab-complexity">Complexity</button>
                        </div>
                        
                        <div class="inner-tab-content active flex-col p-4 grow" id="ops-tab-controls">
                            <div class="flex-between mb-4">
                                <h3 id="current-op-title" class="font-bold text-lg">Operation</h3>
                                <a href="#/bst/operations" class="btn btn-ghost btn-sm">← Back</a>
                            </div>
                            <div id="current-op-controls" class="flex-col gap-3 mb-4">
                                <input type="number" id="input-op" class="input-base w-full" placeholder="Value" style="display:none;" />
                                <input type="number" id="input-op2" class="input-base w-full" placeholder="Value 2" style="display:none;" />
                                <button class="btn btn-primary w-full" id="btn-op-execute">Execute</button>
                            </div>
                            <div id="path-info" class="text-sm"></div>
                            <div id="deletion-info" class="text-sm mt-2"></div>
                        </div>
                        
                        <div class="inner-tab-content flex-col p-0 grow overflow-hidden" id="ops-tab-steps">
                            <div class="p-3 border-b bg-surface-hover">
                                <h4 id="steps-title" class="font-bold text-sm mb-1">Operation Steps</h4>
                                <div id="current-message" class="text-sm text-indigo">Execute an operation to see steps.</div>
                            </div>
                            <ul id="steps-list" class="steps-list p-0 m-0 grow overflow-y-auto">
                                <li class="p-3 text-muted text-sm border-b">No steps to display.</li>
                            </ul>
                        </div>
                        
                        <div class="inner-tab-content flex-col p-4 grow overflow-y-auto" id="ops-tab-complexity">
                            <h4 class="font-bold text-sm mb-3">Time & Space</h4>
                            <div id="complexity-panel"></div>
                        </div>
                    </section>

                    <!-- TRAVERSALS SECTION -->
                    <section class="section flex-col h-full" id="section-traversal">
                        <div class="tab-header-row border-b flex">
                            <button class="inner-tab-btn active" data-target="trav-tab-controls">Controls & Output</button>
                            <button class="inner-tab-btn" data-target="trav-tab-steps">Step-by-step</button>
                        </div>
                        
                        <div class="inner-tab-content active p-4 grow overflow-y-auto" id="trav-tab-controls">
                            <h4 class="font-bold text-sm mb-3">Run Traversal</h4>
                            <div class="flex-col gap-2 mb-6">
                                <button class="btn btn-primary w-full" id="btn-inorder">Inorder (L→Root→R)</button>
                                <button class="btn btn-secondary w-full" id="btn-preorder">Preorder (Root→L→R)</button>
                                <button class="btn btn-secondary w-full" id="btn-postorder">Postorder (L→R→Root)</button>
                            </div>
                            
                            <div class="anim-toolbar flex gap-2 mb-6 justify-center bg-surface-hover p-2 rounded">
                                <button class="btn btn-ghost btn-icon" id="btn-trav-prev">⏮</button>
                                <button class="btn btn-primary btn-icon" id="btn-trav-play">▶</button>
                                <button class="btn btn-ghost btn-icon" id="btn-trav-pause">⏸</button>
                                <button class="btn btn-ghost btn-icon" id="btn-trav-next">⏭</button>
                                <button class="btn btn-ghost btn-icon" id="btn-trav-reset">↺</button>
                                <select id="trav-speed-select" class="input-base text-sm ml-2" style="height:28px; padding:0 8px;">
                                    <option value="Slow">Slow</option>
                                    <option value="Normal" selected>Normal</option>
                                    <option value="Fast">Fast</option>
                                </select>
                            </div>
                            
                            <div id="traversal-display">
                                <h4 id="trav-name" class="font-bold text-indigo mb-1">Output</h4>
                                <p id="trav-desc" class="text-xs text-muted mb-3"></p>
                                <div id="trav-seq" class="flex flex-wrap gap-2 text-sm font-mono"></div>
                            </div>
                        </div>
                        
                        <div class="inner-tab-content p-0 grow overflow-hidden flex-col" id="trav-tab-steps">
                            <div class="p-3 border-b bg-surface-hover">
                                <h4 class="font-bold text-sm mb-1">Traversal Steps</h4>
                                <div id="trav-current-msg" class="text-sm text-indigo">Select traversal to begin.</div>
                            </div>
                            <ul id="trav-steps-list" class="steps-list p-0 m-0 grow overflow-y-auto">
                                <li class="p-3 text-muted text-sm border-b">No steps to display.</li>
                            </ul>
                        </div>
                    </section>

                    <!-- AVL COMPARE SECTION -->
                    <section class="section flex-col h-full" id="section-avl-compare">
                        <div class="tab-header"><h3 class="font-bold">BST vs AVL</h3></div>
                        <div class="p-4 flex-col grow overflow-hidden">
                            <p class="text-sm text-muted mb-4">Compare how standard BST and AVL Tree handle the same insertions.</p>
                            <div class="flex-col gap-2 mb-4">
                                <input type="text" id="avl-input" class="input-base w-full" placeholder="e.g. 10 20 30 40 50">
                                <button class="btn btn-primary w-full" id="btn-run-avl-compare">Run Comparison</button>
                            </div>
                            <h4 class="font-bold text-sm mb-2">Comparison Log</h4>
                            <div id="avl-compare-log" class="p-3 bg-app border border-light rounded font-mono text-xs text-muted grow overflow-y-auto">Ready for comparison.</div>
                        </div>
                    </section>

                    <!-- BALANCE ANALYSIS -->
                    <section class="section flex-col h-full" id="section-balance">
                        <div class="tab-header"><h3 class="font-bold">Balance Analysis</h3></div>
                        <div class="p-4 flex-col grow overflow-y-auto">
                            <p class="text-sm text-muted mb-4">Balance Factor (BF) = height(left) - height(right)</p>
                            <button class="btn btn-primary w-full mb-6" id="btn-run-balance">Calculate Balance</button>
                            
                            <h4 class="font-bold text-sm mb-2">Balance Status</h4>
                            <div id="balance-status" class="text-sm text-muted mb-6">Run analysis to see balance status.</div>
                            
                            <div class="divider my-4"></div>
                            <h4 class="text-xs font-bold text-muted mb-3">LEGEND</h4>
                            <div class="flex items-center gap-3 mb-2"><div class="w-3 h-3 rounded-full bg-green"></div><span class="text-sm">Balanced (-1, 0, 1)</span></div>
                            <div class="flex items-center gap-3 mb-2"><div class="w-3 h-3 rounded-full bg-yellow"></div><span class="text-sm">Left Heavy (>1)</span></div>
                            <div class="flex items-center gap-3"><div class="w-3 h-3 rounded-full bg-red"></div><span class="text-sm">Right Heavy (<-1)</span></div>
                        </div>
                    </section>

                    <!-- ANALYSIS SECTION -->
                    <section class="section flex-col h-full" id="section-analysis">
                        <div class="tab-header"><h3 class="font-bold">Tree Analysis</h3></div>
                        <div class="p-4 flex-col grow overflow-y-auto">
                            <button class="btn btn-primary w-full mb-4" id="btn-analyze">Run Analysis</button>
                            <div id="analysis-panel">
                                <p class="text-muted text-sm text-center mt-6">Create a BST and click "Run Analysis" to see detailed properties.</p>
                            </div>
                        </div>
                    </section>

                    <!-- COMPLEXITY SECTION -->
                    <section class="section flex-col h-full" id="section-complexity">
                        <div class="tab-header"><h3 class="font-bold">Time & Space Complexity</h3></div>
                        <div class="p-4 flex-col gap-4 grow overflow-y-auto">
                            <div class="border border-light rounded p-3">
                                <h4 class="font-bold mb-1">🔍 Search</h4>
                                <div class="flex-between text-sm py-1 border-b border-light"><span class="text-muted">Avg Case</span><span class="font-mono text-green">O(log n)</span></div>
                                <div class="flex-between text-sm py-1 border-b border-light"><span class="text-muted">Worst Case</span><span class="font-mono text-red">O(n)</span></div>
                                <div class="flex-between text-sm py-1"><span class="text-muted">Space</span><span class="font-mono text-indigo">O(h)</span></div>
                            </div>
                            <div class="border border-light rounded p-3">
                                <h4 class="font-bold mb-1">➕ Insert</h4>
                                <div class="flex-between text-sm py-1 border-b border-light"><span class="text-muted">Avg Case</span><span class="font-mono text-green">O(log n)</span></div>
                                <div class="flex-between text-sm py-1 border-b border-light"><span class="text-muted">Worst Case</span><span class="font-mono text-red">O(n)</span></div>
                                <div class="flex-between text-sm py-1"><span class="text-muted">Space</span><span class="font-mono text-indigo">O(h)</span></div>
                            </div>
                            <div class="border border-light rounded p-3">
                                <h4 class="font-bold mb-1">➖ Delete</h4>
                                <div class="flex-between text-sm py-1 border-b border-light"><span class="text-muted">Avg Case</span><span class="font-mono text-green">O(log n)</span></div>
                                <div class="flex-between text-sm py-1 border-b border-light"><span class="text-muted">Worst Case</span><span class="font-mono text-red">O(n)</span></div>
                                <div class="flex-between text-sm py-1"><span class="text-muted">Space</span><span class="font-mono text-indigo">O(h)</span></div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- ROW 3: ARCHITECTURE PIPELINE -->
            <div class="arch-row mt-6">
                <div class="arch-pipeline">
                    <div class="arch-node"><div class="arch-icon text-red">⚙️</div><div class="arch-name">C DSA CORE</div><div class="arch-desc">bst.c · traversal.c</div></div>
                    <div class="arch-arrow">→</div>
                    <div class="arch-node"><div class="arch-icon text-yellow">🔧</div><div class="arch-name">EMSCRIPTEN</div><div class="arch-desc">C → WASM</div></div>
                    <div class="arch-arrow">→</div>
                    <div class="arch-node"><div class="arch-icon text-cyan">⚡</div><div class="arch-name">WEBASSEMBLY</div><div class="arch-desc">bst.wasm</div></div>
                    <div class="arch-arrow">→</div>
                    <div class="arch-node"><div class="arch-icon text-blue">🔗</div><div class="arch-name">JS BRIDGE</div><div class="arch-desc">bst-engine.js</div></div>
                    <div class="arch-arrow">→</div>
                    <div class="arch-node"><div class="arch-icon text-purple">🎬</div><div class="arch-name">ANIMATION</div><div class="arch-desc">visualizer.js</div></div>
                    <div class="arch-arrow">→</div>
                    <div class="arch-node"><div class="arch-icon text-green">🖥️</div><div class="arch-name">WEB UI</div><div class="arch-desc">HTML/CSS</div></div>
                </div>
            </div>

        </div> <!-- /.content-area -->
    </main>
</div>

<!-- SCRIPTS -->
<script src="bst-engine.js"></script>
<script src="avl-engine.js"></script>
<script src="visualizer.js"></script>
<script src="animation.js"></script>
<script src="router.js"></script>
<script src="app.js"></script>

<script>
// --- Custom UI Interactions ---

// 1. Inner Tabs logic for the Right Panel
document.querySelectorAll('.inner-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Find parent section
        const section = e.target.closest('.section');
        // Deactivate all buttons & contents in this section
        section.querySelectorAll('.inner-tab-btn').forEach(b => b.classList.remove('active'));
        section.querySelectorAll('.inner-tab-content').forEach(c => c.classList.remove('active'));
        // Activate clicked
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
    });
});

// 2. Syncing Home canvas
document.addEventListener('DOMContentLoaded', () => {
    function waitForApp(cb, retries = 20) {
        if (window.app && window.bstEngine && window.BSTVisualizer) { cb(); } 
        else if (retries > 0) { setTimeout(() => waitForApp(cb, retries - 1), 150); }
    }
    
    waitForApp(() => {
        const homeSvg = document.getElementById('bst-svg-home');
        const emptyState = document.getElementById('home-empty-state');
        if(!homeSvg) return;
        
        const homeViz = new BSTVisualizer('bst-svg-home');
        
        function updateHomeTree() {
            const treeData = window.bstEngine.getTree();
            if (treeData && treeData.tree) {
                emptyState.style.display = 'none';
                homeSvg.style.opacity = '1';
                homeViz.renderTree(treeData.tree, false);
            } else {
                emptyState.style.display = 'flex';
                homeSvg.style.opacity = '0';
            }
        }
        
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#/home' || window.location.hash === '') {
                updateHomeTree();
            }
        });
        updateHomeTree();
        
        document.getElementById('btn-load-sample')?.addEventListener('click', () => {
            [50, 30, 70, 20, 40, 60, 80].forEach(v => window.bstEngine.insert(v));
            updateHomeTree();
            window.app.ui._updateTreeInfo();
        });

        // Setup traversal logic on the traversal tab canvas
        const travSvg = document.getElementById('bst-svg-trav');
        if (travSvg) {
            const travViz = new BSTVisualizer('bst-svg-trav');
            const travSpeedSel = document.getElementById('trav-speed-select');
            
            document.querySelectorAll('[href="#/traversals"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const t = window.bstEngine.getTree();
                    travViz.renderTree(t.tree, false);
                });
            });

            function runTraversal(type) {
                const t = window.bstEngine.getTree();
                travViz.renderTree(t.tree, false);
                let res;
                if(type==='inorder') res=window.bstEngine.inorder();
                else if(type==='preorder') res=window.bstEngine.preorder();
                else if(type==='postorder') res=window.bstEngine.postorder();
                
                window.app.ui.showTraversalSequence(res.name, res.sequence, res.description);
                
                const panel = document.getElementById('trav-steps-list');
                const msg = document.getElementById('trav-current-msg');
                if(panel) panel.innerHTML = res.steps.map((s,i) => `<li class="p-3 text-sm border-b" style="color:var(--text-muted);" data-index="${i}"><span class="font-mono text-xs mr-2 font-bold">${i+1}</span>${s.message}</li>`).join('');
                
                const anim = new AnimationEngine(travViz, {
                    highlightStep: (idx) => {
                        document.querySelectorAll('#trav-steps-list li').forEach((el, i) => {
                            el.style.color = i === idx ? 'var(--indigo)' : 'var(--text-muted)';
                            if (i===idx) el.scrollIntoView({behavior:'smooth', block:'nearest'});
                        });
                    },
                    setCurrentMessage: (m) => { if(msg) msg.textContent = m; }
                });
                anim.setSpeed(travSpeedSel?.value || 'Normal');
                
                let vIdx = 0;
                anim.animateTraversal(res, (val) => { window.app.ui.highlightTraversalNode(val, vIdx++); }, () => {
                    window.app.ui.setStatus(`${res.name} complete`, 'success');
                });
                
                document.getElementById('btn-trav-play').onclick = () => anim.resume();
                document.getElementById('btn-trav-pause').onclick = () => anim.pause();
                document.getElementById('btn-trav-reset').onclick = () => { anim.stop(); travViz.clearHighlights(); vIdx=0; };
                document.getElementById('btn-trav-prev').onclick = () => anim.stepBackward();
                document.getElementById('btn-trav-next').onclick = () => anim.stepForward();
            }

            document.getElementById('btn-inorder')?.addEventListener('click', () => runTraversal('inorder'));
            document.getElementById('btn-preorder')?.addEventListener('click', () => runTraversal('preorder'));
            document.getElementById('btn-postorder')?.addEventListener('click', () => runTraversal('postorder'));
        }
    });
});
</script>
</body>
</html>
"""

CSS_CONTENT = """
:root {
  --bg-app: #0B0F17;
  --bg-surface: #111827;
  --bg-surface-hover: #1f2937;
  --bg-highlight: rgba(99, 102, 241, 0.1);
  
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  
  --indigo: #6366f1;
  --indigo-hover: #4f46e5;
  --teal: #14b8a6;
  --green: #10b981;
  --red: #ef4444;
  --yellow: #f59e0b;
  --cyan: #06b6d4;
  --blue: #3b82f6;
  --purple: #a855f7;
  
  --border-light: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(99, 102, 241, 0.5);
  
  --radius: 8px;
  --radius-lg: 12px;
  
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --sidebar-w: 260px;
  --topbar-h: 60px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--bg-app);
  color: var(--text-primary);
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-size: 14px;
}

/* Utilities */
.flex { display: flex; } .flex-col { display: flex; flex-direction: column; } .grow { flex: 1; }
.items-center { align-items: center; } .justify-between { justify-content: space-between; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-2 { gap: 8px; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }
.mt-2 { margin-top: 8px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; }
.mb-1 { margin-bottom: 4px; } .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; } .mb-4 { margin-bottom: 16px; } .mb-6 { margin-bottom: 24px; }
.ml-2 { margin-left: 8px; } .ml-4 { margin-left: 16px; } .ml-auto { margin-left: auto; }
.p-0 { padding: 0; } .p-2 { padding: 8px; } .p-3 { padding: 12px; } .p-4 { padding: 16px; } .p-5 { padding: 20px; }
.border-b { border-bottom: 1px solid var(--border-light); }
.border-r { border-right: 1px solid var(--border-light); }
.divider { height: 1px; background: var(--border-light); }
.my-4 { margin-top: 16px; margin-bottom: 16px; }
.w-full { width: 100%; } .h-full { height: 100%; }
.overflow-hidden { overflow: hidden; } .overflow-y-auto { overflow-y: auto; }
.text-xs { font-size: 11px; } .text-sm { font-size: 13px; } .text-lg { font-size: 16px; } .text-2xl { font-size: 24px; }
.font-bold { font-weight: 600; } .font-mono { font-family: var(--font-mono); }
.text-muted { color: var(--text-muted); }
.text-indigo { color: var(--indigo); } .text-teal { color: var(--teal); } .text-green { color: var(--green); }
.text-red { color: var(--red); } .text-yellow { color: var(--yellow); } .text-blue { color: var(--blue); }
.text-center { text-align: center; } .text-right { text-align: right; }
.bg-app { background: var(--bg-app); } .bg-surface { background: var(--bg-surface); } .bg-surface-hover { background: var(--bg-surface-hover); }
.bg-green { background: var(--green); } .bg-yellow { background: var(--yellow); } .bg-red { background: var(--red); }
.rounded { border-radius: var(--radius); } .rounded-full { border-radius: 999px; }
.w-3 { width: 12px; } .h-3 { height: 12px; }

.text-gradient {
  background: linear-gradient(90deg, var(--indigo), var(--teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Layout */
.app-container { display: flex; width: 100%; height: 100%; }
.sidebar {
  width: var(--sidebar-w); background: var(--bg-surface);
  border-right: 1px solid var(--border-light); display: flex; flex-direction: column;
}
.sidebar-header { padding: 24px; border-bottom: 1px solid var(--border-light); }
.sidebar-logo { display: flex; align-items: center; gap: 12px; }
.title-main { display: block; font-weight: 700; font-size: 16px; }
.title-sub { display: block; font-size: 12px; color: var(--text-muted); }

.sidebar-nav { flex: 1; overflow-y: auto; padding: 16px; }
.nav-group { margin-bottom: 24px; }
.nav-group-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; padding-left: 8px; letter-spacing: 0.05em; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px; border-radius: var(--radius);
  color: var(--text-secondary); text-decoration: none;
  transition: all 0.15s ease; margin-bottom: 4px;
}
.nav-item:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
.nav-item.active { background: var(--bg-highlight); color: var(--indigo); font-weight: 500; }

.sidebar-footer { padding: 16px; border-top: 1px solid var(--border-light); }
.status-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.05); padding: 8px 12px;
  border-radius: 999px; font-size: 12px;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--yellow); }
.status-pill.ready .status-dot { background: var(--green); }
.status-pill.error .status-dot { background: var(--red); }

.main-wrapper { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.topbar {
  height: var(--topbar-h); border-bottom: 1px solid var(--border-light);
  display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
}
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.content-area { flex: 1; overflow-y: auto; padding: 24px 32px; position: relative; display: flex; flex-direction: column; gap: 24px; }

/* ROW 1: STATS */
.stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.stat-card {
  background: var(--bg-surface); border: 1px solid var(--border-light);
  padding: 16px; border-radius: var(--radius-lg); box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-family: var(--font-mono); font-weight: 700; }

/* ROW 2: UNIFIED WORKSPACE */
.workspace-row { display: flex; gap: 24px; min-height: 500px; flex: 1; }
.canvas-panel { width: 60%; background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; }
.right-panel { width: 40%; background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; }

/* Right Panel Inner Sections (Routing) */
.section { display: none; width: 100%; height: 100%; animation: fadeIn 0.2s ease; }
.section.active { display: flex; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

/* Right Panel Inner Tabs (Vanilla JS) */
.tab-header-row { display: flex; background: var(--bg-surface-hover); }
.inner-tab-btn {
  flex: 1; padding: 12px; background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--text-muted); font-weight: 500; font-size: 13px; cursor: pointer; transition: 0.15s;
}
.inner-tab-btn:hover { color: var(--text-primary); }
.inner-tab-btn.active { color: var(--indigo); border-bottom-color: var(--indigo); }
.inner-tab-content { display: none; }
.inner-tab-content.active { display: flex; }
.tab-header { padding: 16px; border-bottom: 1px solid var(--border-light); background: var(--bg-surface-hover); }

/* Canvas Visibility Logic */
.canvas-wrapper { position: relative; flex: 1; background: var(--bg-app); display: flex; }
.canvas-wrapper svg { width: 100%; height: 100%; display: none; }
.compare-canvases { display: none; width: 100%; height: 100%; }
.compare-col { flex: 1; display: flex; flex-direction: column; }
.compare-col svg { display: block; flex: 1; }
.empty-state { position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 12px; }

/* Show correct canvas based on active section */
body:has(#section-home.active) #bst-svg-home { display: block; }
body:has(#section-input.active) #bst-svg,
body:has(#section-ops-landing.active) #bst-svg,
body:has(#section-operation.active) #bst-svg,
body:has(#section-analysis.active) #bst-svg,
body:has(#section-complexity.active) #bst-svg { display: block; }
body:has(#section-traversal.active) #bst-svg-trav { display: block; }
body:has(#section-balance.active) #bst-svg-balance { display: block; }
body:has(#section-avl-compare.active) .compare-canvases { display: flex; }

/* ROW 3: ARCHITECTURE */
.arch-row { width: 100%; background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); }
.arch-pipeline { display: flex; align-items: center; justify-content: space-between; padding: 20px; flex-wrap: wrap; gap: 12px; }
.arch-node {
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-light);
  padding: 12px; border-radius: var(--radius); text-align: center; flex: 1; min-width: 110px;
}
.arch-icon { font-size: 20px; margin-bottom: 6px; }
.arch-name { font-size: 10px; font-weight: 700; margin-bottom: 2px; letter-spacing: 0.05em; }
.arch-desc { font-size: 10px; color: var(--text-muted); }
.arch-arrow { color: var(--text-muted); font-size: 16px; }

/* Buttons & Inputs */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 8px 16px; border-radius: var(--radius); font-family: var(--font-sans); font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: 0.15s; outline: none; text-decoration: none;
}
.btn-primary { background: var(--indigo); color: white; }
.btn-primary:hover { background: var(--indigo-hover); }
.btn-secondary { background: rgba(255,255,255,0.1); color: white; }
.btn-secondary:hover { background: rgba(255,255,255,0.15); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: rgba(255,255,255,0.05); color: white; }
.btn-danger { background: rgba(239, 68, 68, 0.15); color: var(--red); }
.btn-danger:hover { background: rgba(239, 68, 68, 0.25); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon { padding: 6px; }
.btn-icon-text { gap: 6px; }
.justify-start { justify-content: flex-start; }
.text-left { text-align: left; }
.flex-1 { flex: 1; }

.input-base {
  background: var(--bg-app); border: 1px solid var(--border-light);
  color: white; padding: 8px 12px; border-radius: var(--radius);
  font-family: var(--font-sans); font-size: 13px;
}
.input-base:focus { border-color: var(--indigo); }
.input-area {
  background: var(--bg-app); border: 1px solid var(--border-light);
  color: white; padding: 12px; border-radius: var(--radius);
  font-family: var(--font-mono); font-size: 13px; resize: vertical;
}

/* Grids */
.grid-2-col { display: grid; grid-template-columns: 1fr 1fr; }

/* Visualizer Overrides */
circle.node-circle { stroke: rgba(255,255,255,0.2) !important; stroke-width: 2px !important; }
text.node-text { font-family: var(--font-mono) !important; font-size: 14px !important; fill: white !important; font-weight: 500 !important; }
line.edge-line { stroke: rgba(255,255,255,0.15) !important; stroke-width: 2px !important; }
.node-highlighted circle { fill: var(--indigo) !important; stroke: var(--indigo-hover) !important; }
.node-traversed circle { fill: var(--teal) !important; stroke: #0f766e !important; }

/* Toast */
.status-message {
  position: absolute; top: 16px; right: 32px; z-index: 100;
  padding: 12px 20px; border-radius: var(--radius); font-size: 13px;
  background: var(--bg-surface); border: 1px solid var(--border-light);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: 0.3s; transform: translateY(-10px);
}
.status-message.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
.status-message.success { border-left: 4px solid var(--green); }
.status-message.error { border-left: 4px solid var(--red); }
.status-message.info { border-left: 4px solid var(--blue); }

/* Animation Controls Overrides */
.anim-toolbar select { padding: 4px 8px; height: 32px; border-radius: var(--radius); background: rgba(255,255,255,0.05); }

/* Responsive adjustments */
@media (max-width: 1024px) {
  .workspace-row { flex-direction: column; }
  .canvas-panel, .right-panel { width: 100%; min-height: 400px; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
"""

with open("frontend/index.html", "w", encoding="utf-8") as f:
    f.write(HTML_CONTENT)

with open("frontend/styles.css", "w", encoding="utf-8") as f:
    f.write(CSS_CONTENT)

print("Files generated successfully.")
