/**
 * MessagesPage - صفحه پیام‌ها (چت + درخواست‌ها)
 * ترکیب NegotiationsPage و InvestmentsPage
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import marketplaceService from '../services/marketplaceService';
import './MessagesPage.css';

function MessagesPage() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    // Negotiations (chats)
    const [negotiations, setNegotiations] = useState([]);
    const [loadingNegotiations, setLoadingNegotiations] = useState(true);
    const [selectedNegotiation, setSelectedNegotiation] = useState(null);

    // Messages
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);

    // Requests modal
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestsFilter, setRequestsFilter] = useState('received');

    // Actions
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        loadNegotiations();
        loadRequests(); // Load requests on page load
    }, []);

    // Polling for real-time updates
    useEffect(() => {
        const pollInterval = setInterval(() => {
            // Refresh messages if a chat is selected
            if (selectedNegotiation) {
                loadMessages(selectedNegotiation.id);
            }
            // Refresh negotiations list
            loadNegotiations();
        }, 5000); // Every 5 seconds

        return () => clearInterval(pollInterval);
    }, [selectedNegotiation]);

    useEffect(() => {
        if (requestId && negotiations.length > 0) {
            const found = negotiations.find(n => n.id === parseInt(requestId));
            if (found) {
                selectNegotiation(found);
            }
        }
    }, [requestId, negotiations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load all negotiations (active chats)
    const loadNegotiations = async () => {
        try {
            setLoadingNegotiations(true);
            const data = await marketplaceService.getInvestmentRequests();
            const items = data.results || data;
            // Show all chats where user is involved (not just active ones)
            // For idea owner: show all including pending
            // For investor: show accepted/negotiation/completed
            const activeChats = items.filter(r => {
                const isOwner = r.idea_owner === user?.id;
                if (isOwner) {
                    // Owner sees all except rejected
                    return r.status !== 'rejected';
                } else {
                    // Investor sees only active chats
                    return ['accepted', 'negotiation', 'completed'].includes(r.status);
                }
            });
            setNegotiations(activeChats);

            // Auto-select first if none selected
            if (!selectedNegotiation && activeChats.length > 0 && !requestId) {
                selectNegotiation(activeChats[0]);
            }
        } catch (error) {
            toast.error('خطا در دریافت مکالمات');
        } finally {
            setLoadingNegotiations(false);
        }
    };

    const selectNegotiation = (negotiation) => {
        setSelectedNegotiation(negotiation);
        loadMessages(negotiation.id);
        navigate(`/investments/${negotiation.id}`, { replace: true });
    };

    const loadMessages = async (reqId) => {
        try {
            setLoadingMessages(true);
            const data = await marketplaceService.getInvestmentMessages(reqId);
            setMessages(data.results || data);
        } catch (error) {
            toast.error('خطا در دریافت پیام‌ها');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedNegotiation) return;

        try {
            setSendingMessage(true);
            const msg = await marketplaceService.sendInvestmentMessage(
                selectedNegotiation.id,
                newMessage
            );
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
            loadNegotiations();
        } catch (error) {
            toast.error('خطا در ارسال پیام');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleCompleteDeal = async () => {
        if (!selectedNegotiation) return;
        if (!window.confirm('آیا از نهایی کردن این معامله مطمئن هستید؟')) return;

        try {
            await marketplaceService.completeDeal(selectedNegotiation.id);
            toast.success('معامله با موفقیت نهایی شد! 🎉');
            loadNegotiations();
            loadRequests();
        } catch (error) {
            toast.error('خطا در نهایی کردن معامله');
        }
    };

    // Accept pending request from chat (for idea owner)
    const handleAcceptFromChat = async () => {
        if (!selectedNegotiation) return;
        if (!window.confirm('آیا این درخواست سرمایه‌گذاری را می‌پذیرید؟')) return;

        try {
            await marketplaceService.acceptInvestment(selectedNegotiation.id);
            toast.success('درخواست پذیرفته شد! حالا می‌توانید مذاکره کنید ✅');
            loadNegotiations();
            loadRequests();
            setSelectedNegotiation({ ...selectedNegotiation, status: 'accepted' });
        } catch (error) {
            toast.error('خطا در پذیرش درخواست');
        }
    };

    // Requests Modal functions
    const openRequestsModal = async () => {
        setShowRequestsModal(true);
        loadRequests();
    };

    const loadRequests = async () => {
        try {
            setLoadingRequests(true);
            const data = await marketplaceService.getInvestmentRequests();
            const items = data.results || data;
            setRequests(items);
        } catch (error) {
            toast.error('خطا در دریافت درخواست‌ها');
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleAccept = async (requestId) => {
        if (!window.confirm('آیا این درخواست را می‌پذیرید؟')) return;
        try {
            await marketplaceService.acceptInvestment(requestId);
            toast.success('درخواست پذیرفته شد ✅');
            loadRequests();
            loadNegotiations();
            setShowRequestsModal(false);
        } catch (error) {
            toast.error('خطا در پذیرش');
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('آیا این درخواست را رد می‌کنید؟')) return;
        try {
            await marketplaceService.rejectInvestment(requestId);
            toast.success('درخواست رد شد');
            loadRequests();
        } catch (error) {
            toast.error('خطا در رد درخواست');
        }
    };

    // Block user (placeholder - needs backend)
    const handleBlockUser = () => {
        toast.info('قابلیت بلاک در نسخه بعدی اضافه می‌شود');
        setShowActions(false);
    };

    // Report user (placeholder - needs backend)
    const handleReportUser = () => {
        toast.info('قابلیت گزارش در نسخه بعدی اضافه می‌شود');
        setShowActions(false);
    };

    // Helpers
    const isMyMessage = (msg) => msg.sender === user?.id;

    const isIdeaOwner = (neg) => neg?.idea_owner === user?.id;

    const getOtherPartyName = (neg) => {
        if (!neg) return '';
        return isIdeaOwner(neg) ? neg.investor_name : neg.idea_owner_name;
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return 'امروز';
        }
        return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'در انتظار', class: 'pending' },
            accepted: { label: 'پذیرفته شده', class: 'accepted' },
            rejected: { label: 'رد شده', class: 'rejected' },
            negotiation: { label: 'در حال مذاکره', class: 'negotiation' },
            completed: { label: 'تکمیل شده', class: 'completed' }
        };
        return badges[status] || { label: status, class: '' };
    };

    const filteredRequests = requests.filter(r => {
        if (requestsFilter === 'received') {
            return r.idea_owner === user?.id;
        }
        return r.investor === user?.id;
    });

    const pendingCount = requests.filter(r =>
        r.status === 'pending' && r.idea_owner === user?.id
    ).length;

    return (
        <div className="messages-page">
            {/* Sidebar - Chat List */}
            <aside className="messages-sidebar">
                <div className="sidebar-header">
                    <Link to="/dashboard" className="back-link">←</Link>
                    <h2>پیام‌ها</h2>
                    <button
                        className="requests-btn"
                        onClick={openRequestsModal}
                    >
                        📥 درخواست‌ها
                        {pendingCount > 0 && (
                            <span className="pending-badge">{pendingCount}</span>
                        )}
                    </button>
                </div>

                <div className="chat-list">
                    {loadingNegotiations ? (
                        <div className="sidebar-loading">در حال بارگذاری...</div>
                    ) : negotiations.length === 0 ? (
                        <div className="sidebar-empty">
                            <p>هنوز مکالمه‌ای ندارید</p>
                            <Link to="/explore">کاوش ایده‌ها</Link>
                        </div>
                    ) : (
                        negotiations.map(neg => (
                            <div
                                key={neg.id}
                                className={`chat-item ${selectedNegotiation?.id === neg.id ? 'active' : ''}`}
                                onClick={() => selectNegotiation(neg)}
                            >
                                <div className="chat-avatar">
                                    {getOtherPartyName(neg)?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-name">{getOtherPartyName(neg)}</div>
                                    <div className="chat-idea">{neg.idea_title}</div>
                                    <div className="chat-preview">
                                        {neg.last_message || 'شروع گفتگو...'}
                                    </div>
                                </div>
                                <div className="chat-meta">
                                    <span className="chat-date">{formatDate(neg.updated_at || neg.created_at)}</span>
                                    <span className={`status-dot status-dot--${neg.status}`}></span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-area">
                {!selectedNegotiation ? (
                    <div className="chat-empty-state">
                        <div className="empty-icon">💬</div>
                        <h3>یک مکالمه انتخاب کنید</h3>
                        <p>یا درخواست‌های جدید را بررسی کنید</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className="chat-header">
                            <div className="chat-header__info">
                                <div className="chat-header__avatar">
                                    {getOtherPartyName(selectedNegotiation)?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="chat-header__text">
                                    <h3>{getOtherPartyName(selectedNegotiation)}</h3>
                                    <span>{selectedNegotiation.idea_title}</span>
                                </div>
                            </div>
                            <div className="chat-header__actions">
                                <span className={`status-badge status-badge--${selectedNegotiation.status}`}>
                                    {getStatusBadge(selectedNegotiation.status).label}
                                </span>

                                {/* Accept button for pending requests */}
                                {isIdeaOwner(selectedNegotiation) &&
                                    selectedNegotiation.status === 'pending' && (
                                        <button
                                            className="accept-request-btn"
                                            onClick={handleAcceptFromChat}
                                        >
                                            ✓ پذیرش درخواست
                                        </button>
                                    )}

                                {isIdeaOwner(selectedNegotiation) &&
                                    ['accepted', 'negotiation'].includes(selectedNegotiation.status) && (
                                        <button
                                            className="complete-deal-btn"
                                            onClick={handleCompleteDeal}
                                        >
                                            ✓ نهایی کردن معامله
                                        </button>
                                    )}

                                <div className="actions-dropdown">
                                    <button
                                        className="actions-trigger"
                                        onClick={() => setShowActions(!showActions)}
                                    >
                                        ⋮
                                    </button>
                                    {showActions && (
                                        <div className="actions-menu">
                                            <Link
                                                to={`/explore/${selectedNegotiation.idea}`}
                                                className="action-item"
                                            >
                                                📄 مشاهده ایده
                                            </Link>
                                            <button
                                                className="action-item action-item--danger"
                                                onClick={handleBlockUser}
                                            >
                                                🚫 بلاک کاربر
                                            </button>
                                            <button
                                                className="action-item action-item--warning"
                                                onClick={handleReportUser}
                                            >
                                                ⚠️ گزارش تخلف
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="chat-messages">
                            {loadingMessages ? (
                                <div className="chat-loading">در حال بارگذاری پیام‌ها...</div>
                            ) : messages.length === 0 ? (
                                <div className="chat-start">
                                    <div className="start-icon">👋</div>
                                    <h4>شروع گفتگو</h4>
                                    <p>اولین پیام را ارسال کنید</p>
                                </div>
                            ) : (
                                <div className="messages-wrapper">
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={msg.id || idx}
                                            className={`message ${isMyMessage(msg) ? 'message--sent' : 'message--received'}`}
                                        >
                                            <div className="message__bubble">
                                                <p>{msg.content}</p>
                                                <span className="message__time">
                                                    {formatTime(msg.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        {selectedNegotiation.status !== 'completed' && (
                            <div className="chat-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="پیام خود را بنویسید..."
                                    disabled={sendingMessage}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage || !newMessage.trim()}
                                    className="send-btn"
                                >
                                    {sendingMessage ? '...' : '➤'}
                                </button>
                            </div>
                        )}

                        {selectedNegotiation.status === 'completed' && (
                            <div className="chat-completed">
                                ✅ این معامله نهایی شده است
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Requests Modal */}
            {showRequestsModal && (
                <div className="modal-overlay" onClick={() => setShowRequestsModal(false)}>
                    <div className="requests-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>درخواست‌های سرمایه‌گذاری</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowRequestsModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-tabs">
                            <button
                                className={requestsFilter === 'received' ? 'active' : ''}
                                onClick={() => setRequestsFilter('received')}
                            >
                                دریافتی
                                {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                            </button>
                            <button
                                className={requestsFilter === 'sent' ? 'active' : ''}
                                onClick={() => setRequestsFilter('sent')}
                            >
                                ارسالی
                            </button>
                        </div>

                        <div className="modal-content">
                            {loadingRequests ? (
                                <div className="modal-loading">در حال بارگذاری...</div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="modal-empty">
                                    درخواستی یافت نشد
                                </div>
                            ) : (
                                <div className="requests-list">
                                    {filteredRequests.map(req => (
                                        <div key={req.id} className="request-card">
                                            <div className="request-header">
                                                <h4>{req.idea_title}</h4>
                                                <span className={`status-badge status-badge--${req.status}`}>
                                                    {getStatusBadge(req.status).label}
                                                </span>
                                            </div>
                                            <div className="request-info">
                                                <span>💰 {req.proposed_amount?.toLocaleString()} تومان</span>
                                                <span>📊 {req.proposed_equity}% سهم</span>
                                            </div>
                                            <div className="request-from">
                                                {requestsFilter === 'received' ? (
                                                    <span>از: {req.investor_name}</span>
                                                ) : (
                                                    <span>به: {req.idea_owner_name}</span>
                                                )}
                                            </div>
                                            {req.message && (
                                                <p className="request-message">{req.message}</p>
                                            )}
                                            {req.status === 'pending' && requestsFilter === 'received' && (
                                                <div className="request-actions">
                                                    <button
                                                        className="btn-accept"
                                                        onClick={() => handleAccept(req.id)}
                                                    >
                                                        ✓ پذیرش
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => handleReject(req.id)}
                                                    >
                                                        ✕ رد
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MessagesPage;
