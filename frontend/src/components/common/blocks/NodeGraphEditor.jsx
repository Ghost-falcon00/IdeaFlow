/**
 * NodeGraphEditor - ویرایشگر گراف نودی تمام‌صفحه
 * Mind Map حرفه‌ای با زوم، پن، سلکت دسته‌جمعی، درگ برای اتصال و انواع نودهای آماده
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    CloseIcon, PlusIcon, TrashIcon, ConnectionIcon,
    ZoomInIcon, ZoomOutIcon, FitIcon, SaveIcon,
    IdeaNodeIcon, TeamNodeIcon, MarketNodeIcon, TechNodeIcon, MoneyNodeIcon, GoalNodeIcon
} from './BlockIcons';
import './NodeGraphEditor.css';

// More node types with icons
const NODE_TYPES = [
    { type: 'idea', label: 'ایده', icon: IdeaNodeIcon, color: '#6366f1' },
    { type: 'problem', label: 'مشکل', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, color: '#ef4444' },
    { type: 'solution', label: 'راه‌حل', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>, color: '#10b981' },
    { type: 'team', label: 'تیم', icon: TeamNodeIcon, color: '#06b6d4' },
    { type: 'user', label: 'کاربر', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, color: '#8b5cf6' },
    { type: 'market', label: 'بازار', icon: MarketNodeIcon, color: '#f59e0b' },
    { type: 'competitor', label: 'رقیب', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>, color: '#ec4899' },
    { type: 'tech', label: 'تکنولوژی', icon: TechNodeIcon, color: '#3b82f6' },
    { type: 'feature', label: 'ویژگی', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>, color: '#eab308' },
    { type: 'money', label: 'مالی', icon: MoneyNodeIcon, color: '#22c55e' },
    { type: 'risk', label: 'ریسک', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, color: '#f97316' },
    { type: 'goal', label: 'هدف', icon: GoalNodeIcon, color: '#a855f7' },
    { type: 'milestone', label: 'مایلستون', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>, color: '#14b8a6' },
    { type: 'resource', label: 'منبع', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>, color: '#64748b' },
    { type: 'note', label: 'یادداشت', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, color: '#94a3b8' },
];

function NodeGraphEditor({ isOpen, onClose, data, onSave }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    const [nodes, setNodes] = useState(data?.nodes || []);
    const [edges, setEdges] = useState(data?.edges || []);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(null);
    const [panning, setPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [selectedNodes, setSelectedNodes] = useState([]);

    // Marquee selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null);
    const [selectionStart, setSelectionStart] = useState(null);

    // Drag-to-connect state
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [connectLine, setConnectLine] = useState(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setNodes(data?.nodes || []);
            setEdges(data?.edges || []);
            setSelectedNodes([]);
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, data]);

    const handleSave = () => {
        onSave({ nodes, edges });
        onClose();
    };

    const addNode = (type) => {
        const nodeType = NODE_TYPES.find(n => n.type === type);
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = (rect.width / 2 - pan.x) / zoom;
        const centerY = (rect.height / 2 - pan.y) / zoom;

        const newNode = {
            id: Date.now(),
            type,
            label: nodeType?.label || 'نود',
            x: centerX + (Math.random() - 0.5) * 100,
            y: centerY + (Math.random() - 0.5) * 100,
            color: nodeType?.color || '#6366f1',
        };
        setNodes([...nodes, newNode]);
    };

    const removeSelectedNodes = () => {
        if (selectedNodes.length === 0) return;
        setNodes(nodes.filter(n => !selectedNodes.includes(n.id)));
        setEdges(edges.filter(e => !selectedNodes.includes(e.from) && !selectedNodes.includes(e.to)));
        setSelectedNodes([]);
    };

    const updateNodeLabel = (id, label) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, label } : n));
    };

    // Handle node mousedown - for dragging or starting connection
    const handleNodeMouseDown = (e, node) => {
        e.stopPropagation();

        // Shift+click for multi-select toggle
        if (e.shiftKey) {
            if (selectedNodes.includes(node.id)) {
                setSelectedNodes(selectedNodes.filter(id => id !== node.id));
            } else {
                setSelectedNodes([...selectedNodes, node.id]);
            }
            return;
        }

        // If node is already selected, drag all selected nodes
        if (selectedNodes.includes(node.id)) {
            const startX = (e.clientX - pan.x) / zoom;
            const startY = (e.clientY - pan.y) / zoom;
            setDragging({
                ids: selectedNodes,
                startX,
                startY,
                nodeOffsets: selectedNodes.map(id => {
                    const n = nodes.find(nd => nd.id === id);
                    return { id, offsetX: n.x, offsetY: n.y };
                })
            });
        } else {
            // Single select and drag
            const startX = (e.clientX - pan.x) / zoom;
            const startY = (e.clientY - pan.y) / zoom;
            setSelectedNodes([node.id]);
            setDragging({
                ids: [node.id],
                startX,
                startY,
                nodeOffsets: [{ id: node.id, offsetX: node.x, offsetY: node.y }]
            });
        }
    };

    // Handle connection port click
    const handlePortMouseDown = (e, node) => {
        e.stopPropagation();
        const rect = containerRef.current.getBoundingClientRect();
        setConnectingFrom(node.id);
        setConnectLine({
            fromX: node.x + 60,
            fromY: node.y + 25,
            toX: (e.clientX - rect.left - pan.x) / zoom,
            toY: (e.clientY - rect.top - pan.y) / zoom,
        });
    };

    const handleCanvasMouseDown = (e) => {
        if (e.target === containerRef.current || e.target === canvasRef.current || e.target.classList.contains('graph-svg')) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Left click on empty canvas starts marquee selection
            if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                setIsSelecting(true);
                setSelectionStart({ x, y });
                setSelectionBox({ x, y, width: 0, height: 0 });
                setSelectedNodes([]);
            }

            setConnectingFrom(null);
            setConnectLine(null);
        }
    };

    const handleCanvasMouseDownMiddle = (e) => {
        // Middle mouse button or Ctrl+click for panning
        if (e.button === 1 || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = useCallback((e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (dragging && dragging.ids) {
            const currentX = (e.clientX - pan.x) / zoom;
            const currentY = (e.clientY - pan.y) / zoom;
            const deltaX = currentX - dragging.startX;
            const deltaY = currentY - dragging.startY;

            setNodes(prev => prev.map(n => {
                const offset = dragging.nodeOffsets.find(o => o.id === n.id);
                if (offset) {
                    return { ...n, x: offset.offsetX + deltaX, y: offset.offsetY + deltaY };
                }
                return n;
            }));
        } else if (panning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        } else if (isSelecting && selectionStart) {
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            const x = Math.min(selectionStart.x, currentX);
            const y = Math.min(selectionStart.y, currentY);
            const width = Math.abs(currentX - selectionStart.x);
            const height = Math.abs(currentY - selectionStart.y);

            setSelectionBox({ x, y, width, height });

            // Find nodes within selection box
            const nodesInBox = nodes.filter(node => {
                const nodeScreenX = pan.x + node.x * zoom;
                const nodeScreenY = pan.y + node.y * zoom;
                const nodeWidth = 120 * zoom;
                const nodeHeight = 50 * zoom;

                return (
                    nodeScreenX < x + width &&
                    nodeScreenX + nodeWidth > x &&
                    nodeScreenY < y + height &&
                    nodeScreenY + nodeHeight > y
                );
            });

            setSelectedNodes(nodesInBox.map(n => n.id));
        } else if (connectingFrom && connectLine) {
            // Update connection line endpoint
            setConnectLine(prev => ({
                ...prev,
                toX: (e.clientX - rect.left - pan.x) / zoom,
                toY: (e.clientY - rect.top - pan.y) / zoom,
            }));
        }
    }, [dragging, panning, pan, zoom, panStart, isSelecting, selectionStart, nodes, connectingFrom, connectLine]);

    const handleMouseUp = (e) => {
        // If we were connecting and released on a node
        if (connectingFrom) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;

            // Find node under cursor
            const targetNode = nodes.find(n => {
                return mouseX >= n.x && mouseX <= n.x + 120 &&
                    mouseY >= n.y && mouseY <= n.y + 50;
            });

            if (targetNode && targetNode.id !== connectingFrom) {
                const exists = edges.some(
                    ed => (ed.from === connectingFrom && ed.to === targetNode.id) ||
                        (ed.from === targetNode.id && ed.to === connectingFrom)
                );
                if (!exists) {
                    setEdges([...edges, { from: connectingFrom, to: targetNode.id }]);
                }
            }
        }

        setDragging(null);
        setPanning(false);
        setIsSelecting(false);
        setSelectionBox(null);
        setSelectionStart(null);
        setConnectingFrom(null);
        setConnectLine(null);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(2, Math.max(0.3, prev + delta)));
    };

    const zoomIn = () => setZoom(prev => Math.min(2, prev + 0.2));
    const zoomOut = () => setZoom(prev => Math.max(0.3, prev - 0.2));
    const fitView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const selectAll = () => {
        setSelectedNodes(nodes.map(n => n.id));
    };

    const removeEdge = (from, to) => {
        setEdges(edges.filter(e => !(e.from === from && e.to === to)));
    };

    const getNodeCenter = (node) => ({
        x: node.x + 60,
        y: node.y + 25,
    });

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodes.length > 0 && document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    removeSelectedNodes();
                }
            } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                selectAll();
            } else if (e.key === 'Escape') {
                setSelectedNodes([]);
                setConnectingFrom(null);
                setConnectLine(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedNodes, nodes]);

    if (!isOpen) return null;

    return createPortal(
        <div className="graph-editor-overlay">
            <div className="graph-editor">
                {/* Header */}
                <div className="graph-editor__header">
                    <h2>ویرایشگر گراف نودی</h2>
                    <div className="graph-editor__actions">
                        <button type="button" className="ge-btn ge-btn--icon" onClick={zoomOut} title="کوچک‌تر">
                            <ZoomOutIcon />
                        </button>
                        <span className="graph-editor__zoom">{Math.round(zoom * 100)}%</span>
                        <button type="button" className="ge-btn ge-btn--icon" onClick={zoomIn} title="بزرگ‌تر">
                            <ZoomInIcon />
                        </button>
                        <button type="button" className="ge-btn ge-btn--icon" onClick={fitView} title="تنظیم نما">
                            <FitIcon />
                        </button>
                        <div className="graph-editor__divider"></div>
                        <button type="button" className="ge-btn ge-btn--primary" onClick={handleSave}>
                            <SaveIcon /> ذخیره
                        </button>
                        <button type="button" className="ge-btn ge-btn--icon ge-btn--close" onClick={onClose}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="graph-editor__sidebar">
                    <h3>افزودن نود</h3>
                    <div className="node-palette node-palette--scrollable">
                        {NODE_TYPES.map(nt => (
                            <button
                                type="button"
                                key={nt.type}
                                className="node-palette__item"
                                onClick={() => addNode(nt.type)}
                                style={{ '--node-color': nt.color }}
                            >
                                <nt.icon />
                                <span>{nt.label}</span>
                            </button>
                        ))}
                    </div>

                    <h3>ابزارها</h3>
                    <div className="graph-tools">
                        <button
                            type="button"
                            className="ge-btn ge-btn--tool ge-btn--danger"
                            onClick={removeSelectedNodes}
                            disabled={selectedNodes.length === 0}
                        >
                            <TrashIcon /> حذف {selectedNodes.length > 1 ? `(${selectedNodes.length})` : ''}
                        </button>
                        <button
                            type="button"
                            className="ge-btn ge-btn--tool"
                            onClick={selectAll}
                        >
                            ⊕ انتخاب همه
                        </button>
                    </div>

                    {selectedNodes.length === 1 && (
                        <div className="node-properties">
                            <h3>مشخصات نود</h3>
                            <input
                                type="text"
                                value={nodes.find(n => n.id === selectedNodes[0])?.label || ''}
                                onChange={(e) => updateNodeLabel(selectedNodes[0], e.target.value)}
                                placeholder="عنوان نود"
                            />
                        </div>
                    )}

                    {selectedNodes.length > 1 && (
                        <div className="multi-select-info">
                            <span className="multi-select-badge">{selectedNodes.length} نود انتخاب شده</span>
                        </div>
                    )}

                    <div className="graph-editor__help">
                        <p>🖱️ درگ نود: جابجایی</p>
                        <p>🔵 درگ از دایره: اتصال</p>
                        <p>🖱️ کلیک درگ روی خالی: سلکت</p>
                        <p>Ctrl + درگ: پن نما</p>
                        <p>⇧ + کلیک: افزودن به سلکت</p>
                        <p>🖱️ اسکرول: زوم</p>
                        <p>⌫ Delete: حذف انتخاب‌ها</p>
                        <p>Ctrl+A: انتخاب همه</p>
                    </div>
                </aside>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className={`graph-editor__canvas ${isSelecting ? 'graph-editor__canvas--selecting' : ''}`}
                    onMouseDown={(e) => { handleCanvasMouseDown(e); handleCanvasMouseDownMiddle(e); }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <svg
                        ref={canvasRef}
                        className="graph-svg"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        }}
                    >
                        {/* Grid */}
                        <defs>
                            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="5000" height="5000" x="-2500" y="-2500" fill="url(#grid)" />

                        {/* Edges */}
                        {edges.map((edge, idx) => {
                            const fromNode = nodes.find(n => n.id === edge.from);
                            const toNode = nodes.find(n => n.id === edge.to);
                            if (!fromNode || !toNode) return null;

                            const from = getNodeCenter(fromNode);
                            const to = getNodeCenter(toNode);

                            const midX = (from.x + to.x) / 2;
                            const midY = (from.y + to.y) / 2;

                            return (
                                <g key={idx} className="graph-edge" onClick={() => removeEdge(edge.from, edge.to)}>
                                    <line
                                        x1={from.x}
                                        y1={from.y}
                                        x2={to.x}
                                        y2={to.y}
                                        stroke="rgba(99, 102, 241, 0.6)"
                                        strokeWidth="3"
                                        markerEnd="url(#arrowhead)"
                                    />
                                    <circle cx={midX} cy={midY} r="6" fill="#6366f1" />
                                </g>
                            );
                        })}

                        {/* Connection line being drawn */}
                        {connectLine && (
                            <line
                                x1={connectLine.fromX}
                                y1={connectLine.fromY}
                                x2={connectLine.toX}
                                y2={connectLine.toY}
                                stroke="rgba(99, 102, 241, 0.8)"
                                strokeWidth="3"
                                strokeDasharray="8,4"
                                className="connect-line-preview"
                            />
                        )}

                        {/* Arrow marker */}
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                            </marker>
                        </defs>
                    </svg>

                    {/* Nodes */}
                    {nodes.map(node => {
                        const NodeIcon = NODE_TYPES.find(nt => nt.type === node.type)?.icon || IdeaNodeIcon;
                        const isSelected = selectedNodes.includes(node.id);
                        return (
                            <div
                                key={node.id}
                                className={`graph-node ${isSelected ? 'selected' : ''}`}
                                style={{
                                    left: `${pan.x + node.x * zoom}px`,
                                    top: `${pan.y + node.y * zoom}px`,
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'top left',
                                    '--node-color': node.color,
                                }}
                                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                            >
                                <div className="graph-node__icon">
                                    <NodeIcon />
                                </div>
                                <span className="graph-node__label">{node.label}</span>
                                {/* Connection port */}
                                <div
                                    className="graph-node__port"
                                    onMouseDown={(e) => handlePortMouseDown(e, node)}
                                    title="درگ کنید برای اتصال"
                                />
                            </div>
                        );
                    })}

                    {/* Selection Box */}
                    {selectionBox && selectionBox.width > 5 && (
                        <div
                            className="selection-box"
                            style={{
                                left: `${selectionBox.x}px`,
                                top: `${selectionBox.y}px`,
                                width: `${selectionBox.width}px`,
                                height: `${selectionBox.height}px`,
                            }}
                        />
                    )}

                    {/* Connecting hint */}
                    {connectingFrom && (
                        <div className="graph-editor__hint">
                            روی نود مقصد رها کنید
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default NodeGraphEditor;
