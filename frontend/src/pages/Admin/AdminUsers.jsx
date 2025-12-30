import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (error) {
            toast.error('خطا در دریافت کاربران');
        } finally {
            setLoading(false);
        }
    };

    const handleBan = async (user) => {
        if (!window.confirm(`آیا مطمئن هستید که می‌خواهید ${user.full_name} را بن کنید؟`)) return;
        try {
            await adminService.banUser(user.id);
            toast.success('کاربر بن شد');
            loadUsers();
        } catch (error) {
            toast.error('خطا در بن کردن کاربر');
        }
    };

    const handleUnban = async (user) => {
        try {
            await adminService.unbanUser(user.id);
            toast.success('کاربر فعال شد');
            loadUsers();
        } catch (error) {
            toast.error('خطا در فعال‌سازی کاربر');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <header className="admin-page-header">
                <h2 className="admin-page-title">مدیریت کاربران</h2>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>نام</th>
                            <th>ایمیل</th>
                            <th>نقش</th>
                            <th>وضعیت</th>
                            <th>تاریخ عضویت</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.full_name}</td>
                                <td>{user.email}</td>
                                <td>
                                    {user.is_staff ? (
                                        <span className="status-badge status-badge--warning">ادمین</span>
                                    ) : (
                                        <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>کاربر</span>
                                    )}
                                </td>
                                <td>
                                    {user.is_active ? (
                                        <span className="status-badge status-badge--success">فعال</span>
                                    ) : (
                                        <span className="status-badge status-badge--danger">بن شده</span>
                                    )}
                                </td>
                                <td>{new Date(user.date_joined).toLocaleDateString('fa-IR')}</td>
                                <td>
                                    {!user.is_staff && (
                                        <>
                                            {user.is_active ? (
                                                <button
                                                    className="action-btn action-btn--danger"
                                                    onClick={() => handleBan(user)}
                                                >
                                                    بن کردن
                                                </button>
                                            ) : (
                                                <button
                                                    className="action-btn action-btn--primary"
                                                    onClick={() => handleUnban(user)}
                                                >
                                                    فعال‌سازی
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminUsers;
