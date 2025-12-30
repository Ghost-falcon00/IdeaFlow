/**
 * NegotiationsPage - صفحه چت مذاکرات سرمایه‌گذاری (مشابه پیام‌رسان‌ها)
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import marketplaceService from '../services/marketplaceService';
import './NegotiationsPage.css';

function NegotiationsPage() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const [negotiations, setNegotiations] = useState([]);
    const [selectedNegotiation, setSelectedNegotiation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        loadNegotiations();
    }, []);

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

    const loadNegotiations = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getInvestmentRequests();
            const items = data.results || data;
            // Filter only active negotiations (accepted, negotiation, completed)
            const activeNegotiations = items.filter(r =>
                ['accepted', 'negotiation', 'completed'].includes(r.status)
            );
            setNegotiations(activeNegotiations);
        } catch (error) {
            toast.error('خطا در دریافت مذاکرات');
        } finally {
            setLoading(false);
        }
    };

    const selectNegotiation = async (negotiation) => {
        setSelectedNegotiation(negotiation);
        navigate(`/negotiations/${negotiation.id}`, { replace: true });
        await loadMessages(negotiation.id);
        inputRef.current?.focus();
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
            const msg = await marketplaceService.sendInvestmentMessage(selectedNegotiation.id, newMessage);
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
            loadNegotiations(); // Update unread counts
        } catch (error) {
            toast.error('خطا در ارسال پیام');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleCompleteDeal = async () => {
        if (!window.confirm('آیا مطمئن هستید که معامله را نهایی می‌کنید؟ این عمل غیرقابل بازگشت است.')) return;

        try {
            // For now, we'll just update status - in a real app this would involve payment/escrow
            await marketplaceService.completeDeal(selectedNegotiation.id);
            toast.success('🎉 تبریک! معامله با موفقیت نهایی شد');
            loadNegotiations();
            loadMessages(selectedNegotiation.id);
        } catch (error) {
            toast.error('خطا در نهایی‌سازی معامله');
        }
    };

    const isMyMessage = (msg) => {
        return msg.sender_name === user?.full_name || msg.sender === user?.id;
    };

    const isIdeaOwner = (neg) => {
        return neg?.idea_owner_name === user?.full_name;
    };

    const getOtherPartyName = (neg) => {
        if (!neg) return '';
        return isIdeaOwner(neg) ? neg.investor_name : neg.idea_owner_name;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'امروز';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'دیروز';
        }
        return date.toLocaleDateString('fa-IR');
    };

    return (
        <div className="negotiations-page">
            {/* Sidebar - List of negotiations */}
            <aside className="negotiations-sidebar">
                <div className="sidebar-header">
                    <Link to="/investments" className="back-link">←</Link>
                    <h2>💬 مذاکرات</h2>
                </div>

                <div className="negotiations-list">
                    {loading ? (
                        <div className="sidebar-loading">در حال بارگذاری...</div>
                    ) : negotiations.length === 0 ? (
                        <div className="sidebar-empty">
                            <p>هیچ مذاکره فعالی ندارید</p>
                            <Link to="/explore">کاوش ایده‌ها</Link>
                        </div>
                    ) : (
                        negotiations.map(neg => (
                            <div
                                key={neg.id}
                                className={`negotiation-item ${selectedNegotiation?.id === neg.id ? 'active' : ''} ${neg.unread_count > 0 ? 'unread' : ''}`}
                                onClick={() => selectNegotiation(neg)}
                            >
                                <div className="negotiation-avatar">
                                    {getOtherPartyName(neg)[0]}
                                </div>
                                <div className="negotiation-info">
                                    <div className="negotiation-name">
                                        {getOtherPartyName(neg)}
                                    </div>
                                    <div className="negotiation-preview">
                                        {neg.idea_title}
                                    </div>
                                </div>
                                <div className="negotiation-meta">
                                    <span className="negotiation-date">{formatDate(neg.updated_at)}</span>
                                    {neg.unread_count > 0 && (
                                        <span className="unread-count">{neg.unread_count}</span>
                                    )}
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
                        <div className="chat-empty-icon">💬</div>
                        <h3>یک مذاکره انتخاب کنید</h3>
                        <p>از لیست سمت راست یک مذاکره را انتخاب کنید تا گفتگو آغاز شود</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className="chat-header">
                            <div className="chat-header__info">
                                <div className="chat-header__avatar">
                                    {getOtherPartyName(selectedNegotiation)[0]}
                                </div>
                                <div className="chat-header__text">
                                    <h3>{getOtherPartyName(selectedNegotiation)}</h3>
                                    <span>{selectedNegotiation.idea_title}</span>
                                </div>
                            </div>
                            <div className="chat-header__actions">
                                <div className="deal-info">
                                    <span className="deal-amount">
                                        💵 {parseInt(selectedNegotiation.amount || 0).toLocaleString('fa-IR')} تومان
                                    </span>
                                    {selectedNegotiation.share_percentage && (
                                        <span className="deal-share">
                                            📊 {selectedNegotiation.share_percentage}%
                                        </span>
                                    )}
                                </div>
                                {isIdeaOwner(selectedNegotiation) && selectedNegotiation.status !== 'completed' && (
                                    <button
                                        className="complete-deal-btn"
                                        onClick={handleCompleteDeal}
                                    >
                                        ✅ نهایی کردن معامله
                                    </button>
                                )}
                                {selectedNegotiation.status === 'completed' && (
                                    <span className="deal-completed-badge">🎉 معامله نهایی شده</span>
                                )}
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="chat-messages-container">
                            {loadingMessages ? (
                                <div className="chat-loading">در حال بارگذاری پیام‌ها...</div>
                            ) : messages.length === 0 ? (
                                <div className="chat-start-prompt">
                                    <div className="prompt-icon">🤝</div>
                                    <h4>شروع مذاکره</h4>
                                    <p>با ارسال اولین پیام، مذاکره را آغاز کنید</p>
                                </div>
                            ) : (
                                <div className="messages-wrapper">
                                    {messages.map((msg, index) => {
                                        const showDate = index === 0 ||
                                            formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);

                                        return (
                                            <div key={msg.id}>
                                                {showDate && (
                                                    <div className="date-separator">
                                                        <span>{formatDate(msg.created_at)}</span>
                                                    </div>
                                                )}
                                                <div className={`message ${isMyMessage(msg) ? 'message--sent' : 'message--received'}`}>
                                                    <div className="message__bubble">
                                                        <p>{msg.content}</p>
                                                        <span className="message__time">{formatTime(msg.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {selectedNegotiation.status !== 'rejected' && (
                            <div className="chat-input-area">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder="پیام خود را بنویسید..."
                                    disabled={sendingMessage}
                                />
                                <button
                                    className="send-btn"
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sendingMessage}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default NegotiationsPage;
