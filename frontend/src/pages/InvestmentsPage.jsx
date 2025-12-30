/**
 * InvestmentsPage - صفحه مدیریت درخواست‌های سرمایه‌گذاری + چت مذاکره
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import marketplaceService from '../services/marketplaceService';
import './InvestmentsPage.css';

function InvestmentsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('received'); // 'received' | 'sent'
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [viewMode, setViewMode] = useState('details'); // 'details' | 'chat'

    // Chat state
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        if (selectedRequest && viewMode === 'chat') {
            loadMessages(selectedRequest.id);
        }
    }, [selectedRequest, viewMode]);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getInvestmentRequests();
            const items = data.results || data;
            setRequests(items);
        } catch (error) {
            toast.error('خطا در دریافت درخواست‌ها');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (requestId) => {
        try {
            setLoadingMessages(true);
            const data = await marketplaceService.getInvestmentMessages(requestId);
            setMessages(data.results || data);
        } catch (error) {
            toast.error('خطا در دریافت پیام‌ها');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedRequest) return;

        try {
            setSendingMessage(true);
            const msg = await marketplaceService.sendInvestmentMessage(selectedRequest.id, newMessage);
            setMessages(prev => [...prev, msg]);
            setNewMessage('');

            // Update request status if it changed
            loadRequests();
        } catch (error) {
            toast.error('خطا در ارسال پیام');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleAccept = async (requestId) => {
        if (!window.confirm('آیا مطمئن هستید که این درخواست را می‌پذیرید؟')) return;
        try {
            await marketplaceService.acceptInvestment(requestId);
            toast.success('درخواست پذیرفته شد ✅ حالا می‌توانید مذاکره کنید');
            loadRequests();
            // Switch to chat mode
            setViewMode('chat');
        } catch (error) {
            toast.error('خطا در پذیرش درخواست');
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('آیا مطمئن هستید که این درخواست را رد می‌کنید؟')) return;
        try {
            await marketplaceService.rejectInvestment(requestId);
            toast.success('درخواست رد شد');
            loadRequests();
            setSelectedRequest(null);
        } catch (error) {
            toast.error('خطا در رد درخواست');
        }
    };

    const openRequest = (req) => {
        setSelectedRequest(req);
        // Auto switch to chat if already accepted/negotiation
        if (['accepted', 'negotiation'].includes(req.status)) {
            setViewMode('chat');
        } else {
            setViewMode('details');
        }
    };

    const closeModal = () => {
        setSelectedRequest(null);
        setViewMode('details');
        setMessages([]);
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'received') {
            return req.idea_owner_name === user?.full_name;
        } else {
            return req.investor_name === user?.full_name;
        }
    });

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { class: 'status--pending', label: '⏳ در انتظار' },
            accepted: { class: 'status--accepted', label: '✅ پذیرفته' },
            rejected: { class: 'status--rejected', label: '❌ رد شده' },
            negotiation: { class: 'status--negotiation', label: '💬 در حال مذاکره' },
            completed: { class: 'status--completed', label: '🎉 تکمیل شده' }
        };
        return statusMap[status] || { class: '', label: status };
    };

    const formatAmount = (amount) => {
        if (!amount) return '-';
        return parseInt(amount).toLocaleString('fa-IR') + ' تومان';
    };

    const isMyMessage = (msg) => {
        return msg.sender_name === user?.full_name || msg.sender === user?.id;
    };

    return (
        <div className="investments-page">
            <header className="investments-header">
                <div className="investments-header__content">
                    <Link to="/dashboard" className="investments-back">← بازگشت</Link>
                    <h1>💰 درخواست‌های سرمایه‌گذاری</h1>
                </div>
            </header>

            <main className="investments-main">
                {/* Toggle */}
                <div className="investments-toggle">
                    <button
                        className={`toggle-btn ${filter === 'received' ? 'active' : ''}`}
                        onClick={() => setFilter('received')}
                    >
                        📥 دریافتی ({requests.filter(r => r.idea_owner_name === user?.full_name).length})
                    </button>
                    <button
                        className={`toggle-btn ${filter === 'sent' ? 'active' : ''}`}
                        onClick={() => setFilter('sent')}
                    >
                        📤 ارسالی ({requests.filter(r => r.investor_name === user?.full_name).length})
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <div className="investments-loading">در حال بارگذاری...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="investments-empty">
                        {filter === 'received'
                            ? 'هیچ درخواست سرمایه‌گذاری دریافت نکردید.'
                            : 'هنوز درخواستی ارسال نکردید.'}
                    </div>
                ) : (
                    <div className="investments-list">
                        {filteredRequests.map(req => (
                            <div
                                key={req.id}
                                className={`investment-card ${req.unread_count > 0 ? 'investment-card--unread' : ''}`}
                                onClick={() => openRequest(req)}
                            >
                                <div className="investment-card__header">
                                    <h3>{req.idea_title}</h3>
                                    <span className={`status-badge ${getStatusBadge(req.status).class}`}>
                                        {getStatusBadge(req.status).label}
                                    </span>
                                </div>
                                <div className="investment-card__info">
                                    <span>
                                        {filter === 'received'
                                            ? `👤 از: ${req.investor_name}`
                                            : `👤 صاحب ایده: ${req.idea_owner_name}`
                                        }
                                    </span>
                                    <span>💵 {formatAmount(req.amount)}</span>
                                    {req.share_percentage && (
                                        <span>📊 {req.share_percentage}% شراکت</span>
                                    )}
                                </div>
                                <div className="investment-card__meta">
                                    <span>{new Date(req.created_at).toLocaleDateString('fa-IR')}</span>
                                    {req.messages_count > 0 && (
                                        <span className="messages-count">
                                            💬 {req.messages_count} پیام
                                            {req.unread_count > 0 && (
                                                <span className="unread-badge">{req.unread_count}</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Detail/Chat Modal */}
            {selectedRequest && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="investment-modal investment-modal--chat" onClick={e => e.stopPropagation()}>
                        <div className="investment-modal__header">
                            <h3>{selectedRequest.idea_title}</h3>
                            <div className="modal-tabs">
                                <button
                                    className={viewMode === 'details' ? 'active' : ''}
                                    onClick={() => setViewMode('details')}
                                >
                                    📋 جزئیات
                                </button>
                                {['accepted', 'negotiation', 'completed'].includes(selectedRequest.status) && (
                                    <button
                                        className={viewMode === 'chat' ? 'active' : ''}
                                        onClick={() => setViewMode('chat')}
                                    >
                                        💬 چت
                                    </button>
                                )}
                            </div>
                            <button className="close-btn" onClick={closeModal}>✕</button>
                        </div>

                        {viewMode === 'details' ? (
                            <>
                                <div className="investment-modal__body">
                                    <div className="detail-row">
                                        <span className="label">نوع درخواست:</span>
                                        <span>{selectedRequest.request_type === 'investment' ? 'سرمایه‌گذاری شراکتی' : 'خرید کامل'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">مبلغ:</span>
                                        <span>{formatAmount(selectedRequest.amount)}</span>
                                    </div>
                                    {selectedRequest.share_percentage && (
                                        <div className="detail-row">
                                            <span className="label">درصد شراکت:</span>
                                            <span>{selectedRequest.share_percentage}%</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="label">سرمایه‌گذار:</span>
                                        <span>{selectedRequest.investor_name} ({selectedRequest.investor_email})</span>
                                    </div>
                                    {selectedRequest.message && (
                                        <div className="detail-message">
                                            <span className="label">پیام:</span>
                                            <p>{selectedRequest.message}</p>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="label">وضعیت:</span>
                                        <span className={`status-badge ${getStatusBadge(selectedRequest.status).class}`}>
                                            {getStatusBadge(selectedRequest.status).label}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions for idea owner */}
                                {filter === 'received' && selectedRequest.status === 'pending' && (
                                    <div className="investment-modal__actions">
                                        <button
                                            className="action-btn action-btn--reject"
                                            onClick={() => handleReject(selectedRequest.id)}
                                        >
                                            ❌ رد کردن
                                        </button>
                                        <button
                                            className="action-btn action-btn--accept"
                                            onClick={() => handleAccept(selectedRequest.id)}
                                        >
                                            ✅ پذیرش
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Chat View */
                            <div className="chat-container">
                                <div className="chat-messages">
                                    {loadingMessages ? (
                                        <div className="chat-loading">در حال بارگذاری پیام‌ها...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="chat-empty">
                                            هنوز پیامی رد و بدل نشده. شروع به مذاکره کنید!
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`chat-message ${isMyMessage(msg) ? 'chat-message--mine' : 'chat-message--theirs'}`}
                                            >
                                                <div className="chat-message__content">{msg.content}</div>
                                                <div className="chat-message__meta">
                                                    <span>{msg.sender_name}</span>
                                                    <span>{new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {selectedRequest.status !== 'rejected' && (
                                    <div className="chat-input">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="پیام خود را بنویسید..."
                                            disabled={sendingMessage}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim() || sendingMessage}
                                        >
                                            {sendingMessage ? '...' : '➤'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default InvestmentsPage;
