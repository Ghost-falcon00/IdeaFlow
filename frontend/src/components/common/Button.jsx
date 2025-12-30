/**
 * Button Component - دکمه پایه‌ای
 */

import './Button.css';

function Button({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    ...props
}) {
    const classNames = [
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && 'btn--full-width',
        loading && 'btn--loading',
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={classNames}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading ? (
                <span className="btn__spinner"></span>
            ) : (
                children
            )}
        </button>
    );
}

export default Button;
