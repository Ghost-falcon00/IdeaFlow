import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supportService from '../services/supportService';
import { useToast } from '../contexts/ToastContext';
import './SupportPage.css';

function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Form State
    const [subject, setSubject] = useState('');
    const [priority, setPriority] = useState('medium');

    // Reply Form State
    const [replyContent, setReplyContent] = useState('');

    const toast = useToast();

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const data = await supportService.getTickets();
            setTickets(data);
        } catch (error) {
            toast.error('خطا در دریافت تیکت‌ها');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!subject.trim()) return;

        try {
            await supportService.createTicket({ subject, priority });
            toast.success('تیکت ایجاد شد');
            setIsCreateModalOpen(false);
            setSubject('');
            setPriority('medium');
            loadTickets();
        } catch (error) {
            toast.error('خطا در ایجاد تیکت');
        }
    };

    const handleViewTicket = async (ticketId) => {
        try {
            const data = await supportService.getTicket(ticketId);
            setSelectedTicket(data);
        } catch (error) {
            toast.error('خطا در دریافت جزئیات تیکت');
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;
        try {
            const newMessage = await supportService.replyTicket(selectedTicket.id, replyContent);
            toast.success('پاسخ ارسال شد');
            setReplyContent('');

            // Update local state
            setSelectedTicket(prev => ({
                ...prev,
                status: prev.status === 'answered' ? 'open' : prev.status, // Ideally status logic is backend handled
                messages: [...prev.messages, newMessage]
            }));

            loadTickets(); // Refresh list status
        } catch (error) {
            toast.error('خطا در ارسال پاسخ');
        }
    };

    return (
        <div className="support-page">
            <header className="support-header">
                <div className="support-header__content">
                    <Link to="/dashboard" className="support-back">← بازگشت</Link>
                    <h1>مرکز پشتیبانی</h1>
                    <button
                        className="new-ticket-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        + تیکت جدید
                    </button>
                </div>
            </header>

            <main className="support-main">
                {loading ? (
                    <div className="support-loading">در حال بارگذاری...</div>
                ) : (
                    <div className="tickets-list">
                        {tickets.length === 0 ? (
                            <div className="tickets-empty">
                                <p>هیچ تیکتی ندارید. برای شروع، یک تیکت جدید ایجاد کنید.</p>
                                <button
                                    className="new-ticket-btn"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    style={{ marginTop: '1rem' }}
                                >
                                    + تیکت جدید
                                </button>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div key={ticket.id} className="ticket-item" onClick={() => handleViewTicket(ticket.id)}>
                                    <div className="ticket-item__icon">
                                        🎫
                                    </div>
                                    <div className="ticket-item__info">
                                        <h3>{ticket.subject}</h3>
                                        <span className="ticket-meta">
                                            {new Date(ticket.updated_at).toLocaleDateString('fa-IR')} • {ticket.priority}
                                        </span>
                                    </div>
                                    <div className="ticket-item__status">
                                        <span className={`status-badge ${ticket.status === 'open' ? 'status-badge--success' :
                                            ticket.status === 'closed' ? 'status-badge--danger' :
                                                'status-badge--warning'
                                            }`}>
                                            {ticket.status === 'answered' ? 'پاسخ داده شده' :
                                                ticket.status === 'open' ? 'باز' : 'بسته'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
                }
            </main >

            {/* Create Ticket Modal */}
            {
                isCreateModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="support-modal" onClick={e => e.stopPropagation()}>
                            <h3>تیکت جدید</h3>
                            <form onSubmit={handleCreateTicket}>
                                <div className="form-group">
                                    <label>موضوع</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        placeholder="موضوع مشکل یا سوال..."
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اولویت</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="low">کم</option>
                                        <option value="medium">متوسط</option>
                                        <option value="high">زیاد</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="cancel-btn">انصراف</button>
                                    <button type="submit" className="submit-btn" disabled={!subject.trim()}>ایجاد تیکت</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* View Ticket Modal */}
            {
                selectedTicket && (
                    <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                        <div className="support-modal support-modal--large" onClick={e => e.stopPropagation()}>
                            <div className="ticket-detail-header">
                                <h3>{selectedTicket.subject}</h3>
                                <span className={`status-badge ${selectedTicket.status === 'open' ? 'status-badge--success' :
                                    selectedTicket.status === 'closed' ? 'status-badge--danger' :
                                        'status-badge--warning'
                                    }`}>
                                    {selectedTicket.status}
                                </span>
                            </div>

                            <div className="conversation-box">
                                {selectedTicket.messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`message-bubble ${msg.is_me ? 'message-bubble--me' : 'message-bubble--support'}`}
                                    >
                                        <div className="message-content">
                                            {msg.content}
                                        </div>
                                        <span className="message-time">
                                            {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {selectedTicket.status !== 'closed' && (
                                <div className="reply-box">
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        placeholder="پاسخ خود را بنویسید..."
                                        className="reply-input"
                                    />
                                    <button
                                        onClick={handleReply}
                                        className="send-reply-btn"
                                        disabled={!replyContent.trim()}
                                    >
                                        ➤
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default SupportPage;
