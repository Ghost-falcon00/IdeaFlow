/**
 * Header Component - لوگو وسط، آیکون‌ها سمت راست
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import './Header.css';

function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();

    // Don't show header on auth pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    // Helper to check if route is active
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <header className="header">
            <div className="header__container">
                {/* Right: Navigation Icons */}
                <nav className="header__nav">
                    <Link to="/" className={`header__nav-btn ${isActive('/') ? 'header__nav-btn--active' : ''}`} title="خانه">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </Link>
                    {isAuthenticated && (
                        <>
                            <Link to="/dashboard" className={`header__nav-btn ${isActive('/dashboard') ? 'header__nav-btn--active' : ''}`} title="داشبورد">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </Link>
                            <Link to="/explore" className={`header__nav-btn ${isActive('/explore') ? 'header__nav-btn--active' : ''}`} title="کاوش ایده‌ها">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                                </svg>
                            </Link>
                            <Link to="/leaderboard" className={`header__nav-btn ${isActive('/leaderboard') ? 'header__nav-btn--active' : ''}`} title="رتبه‌بندی">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9H2V15H6M10 9H14V15H10M18 9H22V15H18M2 15H22M6 5V9M10 5V9M18 5V9" />
                                </svg>
                            </Link>
                            <Link to="/support" className={`header__nav-btn ${isActive('/support') ? 'header__nav-btn--active' : ''}`} title="پشتیبانی">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </Link>
                            <Link to="/investments" className={`header__nav-btn ${isActive('/investments') ? 'header__nav-btn--active' : ''}`} title="پیام‌ها">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <path d="M22 6l-10 7L2 6" />
                                </svg>
                            </Link>
                            {user?.is_staff && (
                                <Link to="/admin" className={`header__nav-btn header__nav-btn--admin ${isActive('/admin') ? 'header__nav-btn--active' : ''}`} title="پنل مدیریت">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </Link>
                            )}
                        </>
                    )}
                </nav>

                {/* Center: Logo */}
                <Link to="/" className="header__logo">
                    <div className="header__logo-wrapper">
                        <img src="/logo.png" alt="IdeaFlow" className="header__logo-img" />
                        <div className="header__logo-glow"></div>
                    </div>
                    <div className="header__logo-text">
                        <span className="header__logo-name">IdeaFlow</span>
                        <span className="header__logo-tagline">ثبت ایده هوشمند</span>
                    </div>
                </Link>

                {/* Left: Actions */}
                <div className="header__actions">
                    <ThemeToggle />

                    {isAuthenticated ? (
                        <div className="header__user">
                            <Link to="/profile" className="header__avatar">
                                {user?.profile_image ? (
                                    <img src={user.profile_image} alt={user.first_name} />
                                ) : (
                                    <span>{user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </Link>
                            <button className="header__logout" onClick={logout} title="خروج">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="header__auth-btns">
                            <Link to="/login" className="header__btn header__btn--ghost">
                                ورود
                            </Link>
                            <Link to="/register" className="header__btn header__btn--primary">
                                شروع
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
