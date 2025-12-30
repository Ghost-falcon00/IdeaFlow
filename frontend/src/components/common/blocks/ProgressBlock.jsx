/**
 * ProgressBlock - بلوک پیشرفت حرفه‌ای
 * نوار پیشرفت با اسلایدر دستگیره‌دار و ورودی عددی
 */

import { useState, useRef, useEffect } from 'react';
import { ProgressIcon, CloseIcon } from './BlockIcons';

function ProgressBlock({ block, editable, onChange, onRemove }) {
    const [value, setValue] = useState(block.value || 0);
    const [isDragging, setIsDragging] = useState(false);
    const barRef = useRef(null);

    const updateValue = (newValue) => {
        const clamped = Math.min(100, Math.max(0, Math.round(Number(newValue))));
        setValue(clamped);
        onChange({ value: clamped });
    };

    const handleMouseDown = (e) => {
        if (!editable) return;
        setIsDragging(true);
        updateFromMouse(e);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        updateFromMouse(e);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const updateFromMouse = (e) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = (x / rect.width) * 100;
        updateValue(percent);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    const getColor = () => {
        if (value >= 80) return { gradient: 'linear-gradient(90deg, #10b981, #059669)', glow: 'rgba(16, 185, 129, 0.4)' };
        if (value >= 50) return { gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)', glow: 'rgba(99, 102, 241, 0.4)' };
        if (value >= 25) return { gradient: 'linear-gradient(90deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.4)' };
        return { gradient: 'linear-gradient(90deg, #ef4444, #dc2626)', glow: 'rgba(239, 68, 68, 0.4)' };
    };

    const colors = getColor();

    return (
        <div className="block block--progress-pro">
            <div className="block__header">
                <span className="block__icon block__icon--svg">
                    <ProgressIcon />
                </span>
                <input
                    className="block__name"
                    value={block.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    disabled={!editable}
                />
                {editable && (
                    <button type="button" className="block__remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}>
                        <CloseIcon />
                    </button>
                )}
            </div>

            <div className="progress-pro">
                <div
                    ref={barRef}
                    className={`progress-pro__bar ${editable ? 'progress-pro__bar--editable' : ''}`}
                    onMouseDown={handleMouseDown}
                    style={{ direction: 'ltr' }}
                >
                    <div
                        className="progress-pro__fill"
                        style={{
                            width: `${value}%`,
                            background: colors.gradient,
                            boxShadow: `0 0 15px ${colors.glow}`,
                        }}
                    />
                    {editable && (
                        <div
                            className="progress-pro__handle"
                            style={{
                                left: `${value}%`,
                                background: colors.gradient,
                                boxShadow: `0 0 10px ${colors.glow}`,
                            }}
                        />
                    )}
                </div>

                <div className="progress-pro__value">
                    {editable ? (
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => updateValue(e.target.value)}
                            className="progress-pro__input"
                        />
                    ) : (
                        <span>{value}</span>
                    )}
                    <span className="progress-pro__percent">%</span>
                </div>
            </div>

            {editable && (
                <div className="progress-pro__quick">
                    {[0, 25, 50, 75, 100].map(v => (
                        <button
                            key={v}
                            type="button"
                            className={`progress-pro__quick-btn ${value === v ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateValue(v); }}
                        >
                            {v}%
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProgressBlock;
