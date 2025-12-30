import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import './AdminTickets.css'; // Will create specific styles if needed, or reuse AdminLayout.css

function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const toast = useToast();

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const data = await adminService.getTickets();
            setTickets(data);
        } catch (error) {
            toast.error('خطا در دریافت تیکت‌ها');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;
        try {
            const newMessage = await adminService.replyTicket(selectedTicket.id, replyContent);
            toast.success('پاسخ ارسال شد');
            setReplyContent('');

            // Update local state
            setSelectedTicket(prev => ({
                ...prev,
                status: 'answered',
                messages: [...prev.messages, newMessage]
            }));

            // Update list
            loadTickets();
        } catch (error) {
            toast.error('خطا در ارسال پاسخ');
        }
    };

    const handleCloseTicket = async () => {
        if (!window.confirm('Are you sure you want to close this ticket?')) return;
        try {
            await adminService.closeTicket(selectedTicket.id);
            toast.success('تیکت بسته شد');
            setSelectedTicket(null);
            loadTickets();
        } catch (error) {
            toast.error('خطا در بستن تیکت');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <header className="admin-page-header">
                <h2 className="admin-page-title">مدیریت تیکت‌های پشتیبانی</h2>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>موضوع</th>
                            <th>کاربر</th>
                            <th>وضعیت</th>
                            <th>اولویت</th>
                            <th>تاریخ</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(ticket => (
                            <tr key={ticket.id}>
                                <td>{ticket.subject}</td>
                                <td>{ticket.user_name}</td>
                                <td>
                                    <span className={`status-badge ${ticket.status === 'open' ? 'status-badge--success' :
                                            ticket.status === 'closed' ? 'status-badge--danger' :
                                                'status-badge--warning'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td>{ticket.priority}</td>
                                <td>{new Date(ticket.updated_at).toLocaleDateString('fa-IR')}</td>
                                <td>
                                    <button
                                        className="action-btn action-btn--primary"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        مشاهده
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Ticket Modal */}
            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="ticket-modal" onClick={e => e.stopPropagation()}>
                        <div className="ticket-modal__header">
                            <h3>{selectedTicket.subject}</h3>
                            <button onClick={() => setSelectedTicket(null)}>✕</button>
                        </div>

                        <div className="ticket-messages">
                            {selectedTicket.messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`ticket-message ${msg.sender === selectedTicket.user ? 'ticket-message--user' : 'ticket-message--admin'}`}
                                >
                                    <div className="ticket-message__info">
                                        <span>{msg.sender_name}</span>
                                        <small>{new Date(msg.created_at).toLocaleString('fa-IR')}</small>
                                    </div>
                                    <div className="ticket-message__content">
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                            <div className="ticket-reply-box">
                                <textarea
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    placeholder="نوشتن پاسخ..."
                                />
                                <div className="ticket-actions">
                                    <button
                                        className="action-btn action-btn--danger"
                                        onClick={handleCloseTicket}
                                    >
                                        بستن تیکت
                                    </button>
                                    <button
                                        className="action-btn action-btn--primary"
                                        onClick={handleReply}
                                        disabled={!replyContent.trim()}
                                    >
                                        ارسال پاسخ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminTickets;
