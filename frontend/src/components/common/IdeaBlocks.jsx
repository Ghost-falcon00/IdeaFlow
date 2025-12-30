/**
 * IdeaBlocks - سیستم بلوک‌های پیشرفته برای ایده
 * مدیریت انواع مختلف بلوک‌ها: Checklist, Tags, Progress, Links, NodeGraph
 */

import { useState, useEffect } from 'react';
import ChecklistBlock from './blocks/ChecklistBlock';
import TagsBlock from './blocks/TagsBlock';
import ProgressBlock from './blocks/ProgressBlock';
import LinkBlock from './blocks/LinkBlock';
import NodeGraphBlock from './blocks/NodeGraphBlock';
import {
    ChecklistIcon, TagsIcon, ProgressIcon, LinkIcon, GraphIcon, TextIcon, NumberIcon
} from './blocks/BlockIcons';
import './IdeaBlocks.css';

const BLOCK_TYPES = [
    { type: 'checklist', Icon: ChecklistIcon, label: 'چک‌لیست' },
    { type: 'tags', Icon: TagsIcon, label: 'برچسب‌ها' },
    { type: 'progress', Icon: ProgressIcon, label: 'پیشرفت' },
    { type: 'link', Icon: LinkIcon, label: 'لینک' },
    { type: 'node_graph', Icon: GraphIcon, label: 'گراف نودی' },
    { type: 'text', Icon: TextIcon, label: 'متن' },
    { type: 'number', Icon: NumberIcon, label: 'عدد' },
];

function IdeaBlocks({ blocks = [], onChange, editable = true }) {
    const [localBlocks, setLocalBlocks] = useState(blocks);
    const [showAddMenu, setShowAddMenu] = useState(false);

    useEffect(() => {
        setLocalBlocks(blocks);
    }, [blocks]);

    const handleBlockChange = (index, newData) => {
        const updated = [...localBlocks];
        updated[index] = { ...updated[index], ...newData };
        setLocalBlocks(updated);
        if (onChange) onChange(updated);
    };

    const handleAddBlock = (type) => {
        const newBlock = {
            id: Date.now(),
            type,
            name: BLOCK_TYPES.find(b => b.type === type)?.label || 'بلوک جدید',
            value: getDefaultValue(type),
        };
        const updated = [...localBlocks, newBlock];
        setLocalBlocks(updated);
        if (onChange) onChange(updated);
        setShowAddMenu(false);
    };

    const handleRemoveBlock = (index) => {
        const updated = localBlocks.filter((_, i) => i !== index);
        setLocalBlocks(updated);
        if (onChange) onChange(updated);
    };

    const getDefaultValue = (type) => {
        switch (type) {
            case 'checklist': return [];
            case 'tags': return [];
            case 'progress': return 0;
            case 'link': return [];
            case 'node_graph': return { nodes: [], edges: [] };
            case 'text': return '';
            case 'number': return 0;
            default: return '';
        }
    };

    const renderBlock = (block, index) => {
        const commonProps = {
            block,
            editable,
            onChange: (data) => handleBlockChange(index, data),
            onRemove: () => handleRemoveBlock(index),
        };

        switch (block.type) {
            case 'checklist':
                return <ChecklistBlock key={block.id} {...commonProps} />;
            case 'tags':
                return <TagsBlock key={block.id} {...commonProps} />;
            case 'progress':
                return <ProgressBlock key={block.id} {...commonProps} />;
            case 'link':
                return <LinkBlock key={block.id} {...commonProps} />;
            case 'node_graph':
                return <NodeGraphBlock key={block.id} {...commonProps} />;
            default:
                return (
                    <div key={block.id} className="block block--text">
                        <div className="block__header">
                            <span className="block__icon">📝</span>
                            <input
                                className="block__name"
                                value={block.name}
                                onChange={(e) => handleBlockChange(index, { name: e.target.value })}
                                disabled={!editable}
                            />
                            {editable && (
                                <button type="button" className="block__remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveBlock(index); }}>✕</button>
                            )}
                        </div>
                        <input
                            type={block.type === 'number' ? 'number' : 'text'}
                            className="block__input"
                            value={block.value}
                            onChange={(e) => handleBlockChange(index, { value: e.target.value })}
                            disabled={!editable}
                            placeholder="مقدار را وارد کنید..."
                        />
                    </div>
                );
        }
    };

    return (
        <div className="idea-blocks">
            {localBlocks.map((block, index) => renderBlock(block, index))}

            {editable && (
                <div className="idea-blocks__add-wrapper">
                    <button
                        type="button"
                        className="idea-blocks__add-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAddMenu(!showAddMenu);
                        }}
                    >
                        + افزودن بلوک
                    </button>

                    {showAddMenu && (
                        <div className="idea-blocks__add-menu">
                            {BLOCK_TYPES.map(({ type, Icon, label }) => (
                                <button
                                    type="button"
                                    key={type}
                                    className="idea-blocks__menu-item"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddBlock(type);
                                    }}
                                >
                                    <span className="idea-blocks__menu-icon"><Icon /></span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default IdeaBlocks;
