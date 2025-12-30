/**
 * NodeGraphBlock - پیش‌نمایش گراف نودی
 * کلیک روی آن ویرایشگر تمام‌صفحه را باز می‌کند
 */

import { useState } from 'react';
import { GraphIcon, ExpandIcon } from './BlockIcons';
import NodeGraphEditor from './NodeGraphEditor';

function NodeGraphBlock({ block, editable, onChange, onRemove }) {
    const [showEditor, setShowEditor] = useState(false);
    const data = block.value || { nodes: [], edges: [] };

    const handleSave = (newData) => {
        onChange({ value: newData });
    };

    const nodeCount = data.nodes?.length || 0;
    const edgeCount = data.edges?.length || 0;

    return (
        <>
            <div className="block block--node-graph-preview">
                <div className="block__header">
                    <span className="block__icon block__icon--svg">
                        <GraphIcon />
                    </span>
                    <input
                        className="block__name"
                        value={block.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        disabled={!editable}
                    />
                    {editable && (
                        <button type="button" className="block__remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}>✕</button>
                    )}
                </div>

                <div className="graph-preview" onClick={() => editable && setShowEditor(true)}>
                    {nodeCount > 0 ? (
                        <>
                            <div className="graph-preview__visual">
                                {(() => {
                                    // Calculate bounds for scaling
                                    const allX = data.nodes.map(n => n.x);
                                    const allY = data.nodes.map(n => n.y);
                                    const minX = Math.min(...allX);
                                    const maxX = Math.max(...allX);
                                    const minY = Math.min(...allY);
                                    const maxY = Math.max(...allY);
                                    const rangeX = maxX - minX || 1;
                                    const rangeY = maxY - minY || 1;

                                    return data.nodes.slice(0, 8).map((node) => {
                                        const x = ((node.x - minX) / rangeX) * 70 + 10;
                                        const y = ((node.y - minY) / rangeY) * 60 + 15;
                                        return (
                                            <div
                                                key={node.id}
                                                className="graph-preview__node"
                                                style={{
                                                    backgroundColor: node.color,
                                                    left: `${x}%`,
                                                    top: `${y}%`,
                                                }}
                                                title={node.label}
                                            />
                                        );
                                    });
                                })()}
                                {edgeCount > 0 && (
                                    <svg className="graph-preview__edges">
                                        {data.edges.slice(0, 5).map((edge, i) => {
                                            const fromNode = data.nodes.find(n => n.id === edge.from);
                                            const toNode = data.nodes.find(n => n.id === edge.to);
                                            if (!fromNode || !toNode) return null;

                                            const allX = data.nodes.map(n => n.x);
                                            const allY = data.nodes.map(n => n.y);
                                            const minX = Math.min(...allX);
                                            const maxX = Math.max(...allX);
                                            const minY = Math.min(...allY);
                                            const maxY = Math.max(...allY);
                                            const rangeX = maxX - minX || 1;
                                            const rangeY = maxY - minY || 1;

                                            const x1 = ((fromNode.x - minX) / rangeX) * 70 + 15;
                                            const y1 = ((fromNode.y - minY) / rangeY) * 60 + 20;
                                            const x2 = ((toNode.x - minX) / rangeX) * 70 + 15;
                                            const y2 = ((toNode.y - minY) / rangeY) * 60 + 20;

                                            return (
                                                <line
                                                    key={i}
                                                    x1={`${x1}%`}
                                                    y1={`${y1}%`}
                                                    x2={`${x2}%`}
                                                    y2={`${y2}%`}
                                                    stroke="rgba(99,102,241,0.5)"
                                                    strokeWidth="2"
                                                />
                                            );
                                        })}
                                    </svg>
                                )}
                            </div>
                            <div className="graph-preview__stats">
                                <span>{nodeCount} نود</span>
                                <span>{edgeCount} اتصال</span>
                            </div>
                        </>
                    ) : (
                        <div className="graph-preview__empty">
                            <GraphIcon />
                            <span>کلیک کنید تا گراف بسازید</span>
                        </div>
                    )}

                    {editable && (
                        <button type="button" className="graph-preview__expand" onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}>
                            <ExpandIcon />
                            ویرایش گراف
                        </button>
                    )}
                </div>
            </div>

            <NodeGraphEditor
                isOpen={showEditor}
                onClose={() => setShowEditor(false)}
                data={data}
                onSave={handleSave}
            />
        </>
    );
}

export default NodeGraphBlock;
