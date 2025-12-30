/**
 * ChecklistBlock - بلوک چک‌لیست حرفه‌ای
 * لیست تسک‌ها با آیکون‌های SVG
 */

import { useState } from 'react';
import { ChecklistIcon, CloseIcon, PlusIcon } from './BlockIcons';

function ChecklistBlock({ block, editable, onChange, onRemove }) {
    const [items, setItems] = useState(block.value || []);
    const [newItemText, setNewItemText] = useState('');

    const updateItems = (newItems) => {
        setItems(newItems);
        onChange({ value: newItems });
    };

    const toggleItem = (index) => {
        const updated = [...items];
        updated[index] = { ...updated[index], done: !updated[index].done };
        updateItems(updated);
    };

    const updateItemText = (index, text) => {
        const updated = [...items];
        updated[index] = { ...updated[index], text };
        updateItems(updated);
    };

    const addItem = () => {
        if (!newItemText.trim()) return;
        updateItems([...items, { text: newItemText.trim(), done: false }]);
        setNewItemText('');
    };

    const removeItem = (index) => {
        updateItems(items.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    };

    const completedCount = items.filter(i => i.done).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="block block--checklist-pro">
            <div className="block__header">
                <span className="block__icon block__icon--svg">
                    <ChecklistIcon />
                </span>
                <input
                    className="block__name"
                    value={block.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    disabled={!editable}
                />
                {totalCount > 0 && (
                    <span className="checklist-pro__count">{completedCount}/{totalCount}</span>
                )}
                {editable && (
                    <button type="button" className="block__remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}>
                        <CloseIcon />
                    </button>
                )}
            </div>

            {totalCount > 0 && (
                <div className="checklist-pro__progress">
                    <div className="checklist-pro__progress-fill" style={{ width: `${progress}%` }} />
                </div>
            )}

            <div className="checklist-pro__items">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`checklist-pro__item ${item.done ? 'checklist-pro__item--done' : ''}`}
                    >
                        <label className="checklist-pro__checkbox">
                            <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => editable && toggleItem(index)}
                                disabled={!editable}
                            />
                            <span className="checklist-pro__checkmark">
                                {item.done && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </span>
                        </label>
                        <input
                            type="text"
                            className="checklist-pro__text"
                            value={item.text}
                            onChange={(e) => updateItemText(index, e.target.value)}
                            disabled={!editable}
                            placeholder="آیتم..."
                        />
                        {editable && (
                            <button
                                type="button"
                                className="checklist-pro__remove"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(index); }}
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                ))}

                {editable && (
                    <div className="checklist-pro__add">
                        <span className="checklist-pro__add-icon"><PlusIcon /></span>
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={addItem}
                            placeholder="افزودن آیتم جدید..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChecklistBlock;
