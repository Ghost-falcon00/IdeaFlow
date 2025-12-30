/**
 * Input Component - فیلد ورودی پایه‌ای
 */

import './Input.css';

function Input({
    label,
    error,
    type = 'text',
    placeholder,
    value,
    onChange,
    name,
    required = false,
    disabled = false,
    icon,
    ...props
}) {
    return (
        <div className={`input-group ${error ? 'input-group--error' : ''}`}>
            {label && (
                <label className="input-group__label" htmlFor={name}>
                    {label}
                    {required && <span className="input-group__required">*</span>}
                </label>
            )}
            <div className="input-group__wrapper">
                {icon && <span className="input-group__icon">{icon}</span>}
                <input
                    id={name}
                    name={name}
                    type={type}
                    className="input-group__input"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    {...props}
                />
            </div>
            {error && <span className="input-group__error">{error}</span>}
        </div>
    );
}

export default Input;
