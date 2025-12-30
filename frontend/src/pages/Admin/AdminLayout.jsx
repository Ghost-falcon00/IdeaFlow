import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

function AdminLayout() {
    const { user } = useAuth();

    // Safety check - although route should be protected
    if (!user || !user.is_staff) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar__header">
                    <h2>🛡️ پنل مدیریت</h2>
                </div>

                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}>
                        📊 داشبورد
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}>
                        👥 کاربران
                    </NavLink>
                    <NavLink to="/admin/ideas" className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}>
                        💡 ایده‌ها
                    </NavLink>
                    <NavLink to="/admin/tickets" className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}>
                        🎫 تیکت‌ها
                    </NavLink>
                </nav>

                <div className="admin-sidebar__footer">
                    <NavLink to="/" className="admin-nav__link admin-nav__link--exit">
                        خروج به سایت
                    </NavLink>
                </div>
            </aside>

            <main className="admin-content">
                <header className="admin-header">
                    <h1>سلام، {user.full_name}</h1>
                </header>
                <div className="admin-page-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
