import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        ideas: 0,
        tickets: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // In a real app, use a dedicated stats endpoint
            const [users, ideas, tickets] = await Promise.all([
                adminService.getUsers(),
                adminService.getIdeas(),
                adminService.getTickets()
            ]);

            setStats({
                users: users.length,
                ideas: ideas.length,
                tickets: tickets.length
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <header className="admin-page-header">
                <h2 className="admin-page-title">داشبورد وضعیت</h2>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>👥 کاربران</h3>
                    <div className="value">{stats.users}</div>
                </div>
                <div className="stat-card">
                    <h3>💡 ایده‌ها</h3>
                    <div className="value">{stats.ideas}</div>
                </div>
                <div className="stat-card">
                    <h3>🎫 تیکت‌ها</h3>
                    <div className="value">{stats.tickets}</div>
                </div>
            </div>

            <div style={{ marginTop: '3rem', color: '#94a3b8' }}>
                <p>به پنل مدیریت خوش آمدید.</p>
                <p>از منوی سمت راست برای مدیریت بخش‌های مختلف استفاده کنید.</p>
            </div>
        </div>
    );
}

export default AdminDashboard;
