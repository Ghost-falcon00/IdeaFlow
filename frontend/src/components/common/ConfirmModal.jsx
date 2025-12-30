/**
 * ConfirmModal - مودال تأیید شیشه‌ای
 * برای تأیید اقدامات مهم مثل حذف
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'آیا مطمئنید؟',
    message = 'این عمل قابل بازگشت نیست.',
    confirmText = 'بله، حذف کن',
    cancelText = 'انصراف',
    type = 'danger', // 'danger' | 'warning' | 'info'
    loading = false
}) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    ),
                    iconColor: '#ef4444',
                    buttonClass: 'confirm-modal__btn--danger',
                };
            case 'warning':
                return {
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    ),
                    iconColor: '#f59e0b',
                    buttonClass: 'confirm-modal__btn--warning',
                };
            default:
                return {
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    ),
                    iconColor: '#6366f1',
                    buttonClass: 'confirm-modal__btn--primary',
                };
        }
    };

    const styles = getTypeStyles();

    return createPortal(
        <div className="confirm-modal-overlay" onClick={!loading ? onClose : undefined}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-modal__icon" style={{ '--icon-color': styles.iconColor }}>
                    {styles.icon}
                </div>

                <h2 className="confirm-modal__title">{title}</h2>
                <p className="confirm-modal__message">{message}</p>

                <div className="confirm-modal__actions">
                    <button
                        type="button"
                        className="confirm-modal__btn confirm-modal__btn--cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`confirm-modal__btn ${styles.buttonClass}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="confirm-modal__spinner"></span>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConfirmModal;
