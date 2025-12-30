/**
 * ThemeToggle Component - دکمه تغییر تم با آیکون وسط
 */

import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            className={`theme-toggle ${className}`}
            onClick={toggleTheme}
            aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
        >
            <div className="theme-toggle__track">
                <div className="theme-toggle__stars">
                    <span></span><span></span><span></span>
                </div>
                <div className="theme-toggle__clouds">
                    <span></span><span></span>
                </div>
                <div className={`theme-toggle__thumb ${isDark ? 'theme-toggle__thumb--moon' : ''}`}>
                    <div className="theme-toggle__crater"></div>
                    <div className="theme-toggle__crater"></div>
                </div>
            </div>
        </button>
    );
}

export default ThemeToggle;
