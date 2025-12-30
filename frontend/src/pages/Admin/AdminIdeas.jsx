import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

function AdminIdeas() {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadIdeas();
    }, []);

    const loadIdeas = async () => {
        try {
            const data = await adminService.getIdeas();
            setIdeas(data);
        } catch (error) {
            toast.error('خطا در دریافت ایده‌ها');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (idea) => {
        if (!window.confirm(`آیا مطمئن هستید که می‌خواهید ایده "${idea.title}" را حذف کنید؟`)) return;
        try {
            await adminService.deleteIdea(idea.id);
            toast.success('ایده حذف شد');
            loadIdeas();
        } catch (error) {
            toast.error('خطا در حذف ایده');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <header className="admin-page-header">
                <h2 className="admin-page-title">مدیریت ایده‌ها</h2>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>عنوان</th>
                            <th>نویسنده</th>
                            <th>تاریخ ثبت</th>
                            <th>امتیاز AI</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ideas.map(idea => (
                            <tr key={idea.id}>
                                <td>{idea.title}</td>
                                <td>{idea.user_email}</td>
                                <td>{new Date(idea.created_at).toLocaleDateString('fa-IR')}</td>
                                <td>
                                    <span className="status-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                                        {idea.ai_score || '-'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="action-btn action-btn--danger"
                                        onClick={() => handleDelete(idea)}
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminIdeas;
