/**
 * TagsBlock - بلوک برچسب‌ها با آیکون‌های SVG
 */

import { useState } from 'react';
import { TagsIcon, CloseIcon } from './BlockIcons';

const TAG_COLORS = [
    { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' },
    { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7' },
    { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', color: '#fcd34d' },
    { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' },
    { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', color: '#c4b5fd' },
    { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.4)', color: '#f9a8d4' },
    { bg: 'rgba(6, 182, 212, 0.2)', border: 'rgba(6, 182, 212, 0.4)', color: '#67e8f9' },
];

function TagsBlock({ block, editable, onChange, onRemove }) {
    const [tags, setTags] = useState(block.value || []);
    const [inputValue, setInputValue] = useState('');

    const updateTags = (newTags) => {
        setTags(newTags);
        onChange({ value: newTags });
    };

    const addTag = () => {
        const text = inputValue.trim();
        if (!text || tags.some(t => t.text === text)) return;

        const colorIndex = tags.length % TAG_COLORS.length;
        updateTags([...tags, { text, colorIndex }]);
        setInputValue('');
    };

    const removeTag = (index) => {
        updateTags(tags.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className="block block--tags-pro">
            <div className="block__header">
                <span className="block__icon block__icon--svg">
                    <TagsIcon />
                </span>
                <input
                    className="block__name"
                    value={block.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    disabled={!editable}
                />
                {tags.length > 0 && (
                    <span className="tags-pro__count">{tags.length}</span>
                )}
                {editable && (
                    <button type="button" className="block__remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}>
                        <CloseIcon />
                    </button>
                )}
            </div>

            <div className="tags-pro__list">
                {tags.map((tag, index) => {
                    const colors = TAG_COLORS[tag.colorIndex % TAG_COLORS.length];
                    return (
                        <span
                            key={index}
                            className="tags-pro__tag"
                            style={{
                                background: colors.bg,
                                borderColor: colors.border,
                                color: colors.color,
                            }}
                        >
                            {tag.text}
                            {editable && (
                                <button
                                    type="button"
                                    className="tags-pro__tag-remove"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTag(index); }}
                                >
                                    <CloseIcon />
                                </button>
                            )}
                        </span>
                    );
                })}

                {editable && (
                    <input
                        type="text"
                        className="tags-pro__input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={addTag}
                        placeholder="+ برچسب..."
                    />
                )}
            </div>
        </div>
    );
}

export default TagsBlock;
