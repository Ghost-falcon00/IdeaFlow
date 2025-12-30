/**
 * IdeaChat - کامپوننت چت با مشاور AI
 * رابط کاربری شیک برای گفتگو درباره ایده
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../contexts/ToastContext';
import ideaService from '../../services/ideaService';
import MarkdownRenderer from './MarkdownRenderer';
import './IdeaChat.css';

function IdeaChat({ idea, onClose }) {
    const toast = useToast();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Load chat session on mount
    useEffect(() => {
        loadChatSession();
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [idea.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatSession = async () => {
        try {
            const session = await ideaService.getChatSession(idea.id);
            setSessionId(session.id);
            setMessages(session.messages || []);
        } catch (error) {
            console.error('Error loading chat:', error);
            // Start fresh if no session
            setMessages([]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Add user message immediately
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString()
        }]);

        setIsLoading(true);

        try {
            const response = await ideaService.sendChatMessage(idea.id, userMessage);

            // Add AI response
            setMessages(prev => [...prev, response.message]);

            // Handle suggested actions
            if (response.message.suggested_action) {
                handleSuggestedAction(response.message.suggested_action);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = error.response?.data?.error || 'خطا در ارسال پیام';
            toast.error(errorMsg);

            // Remove user message on error
            setMessages(prev => prev.slice(0, -1));
            setInputValue(userMessage);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSuggestedAction = (action) => {
        // TODO: Handle AI suggested actions (update fields, etc.)
        console.log('Suggested action:', action);
        toast.info('مشاور AI پیشنهادی برای تغییر ایده دارد');
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    };

    return createPortal(
        <div className="idea-chat-overlay" onClick={handleOverlayClick}>
            <div className="idea-chat">
                {/* Header */}
                <div className="idea-chat__header">
                    <div className="idea-chat__header-info">
                        <div className="idea-chat__avatar">
                            <span>🤖</span>
                        </div>
                        <div>
                            <h3>آریا - مشاور استارتاپ</h3>
                            <p>درباره: {idea.title}</p>
                        </div>
                    </div>
                    <button className="idea-chat__close" onClick={onClose}>✕</button>
                </div>

                {/* Messages */}
                <div className="idea-chat__messages">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="idea-chat__welcome">
                            <div className="idea-chat__welcome-icon">🚀</div>
                            <h4>سلام! من آریا هستم</h4>
                            <p>مشاور استارتاپ شما. درباره ایده‌ات سوال بپرس، کمکت کنم بهترش کنی!</p>
                            <div className="idea-chat__suggestions">
                                <button onClick={() => setInputValue('نقاط قوت ایده‌ام چیه؟')}>
                                    نقاط قوت ایده‌ام چیه؟
                                </button>
                                <button onClick={() => setInputValue('چطور می‌تونم این ایده رو پولدار کنم؟')}>
                                    مدل درآمدی پیشنهاد بده
                                </button>
                                <button onClick={() => setInputValue('رقبای این ایده کیا هستن؟')}>
                                    تحلیل رقبا
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`idea-chat__message idea-chat__message--${msg.role}`}
                        >
                            <div className="idea-chat__message-content">
                                {msg.role === 'assistant' ? (
                                    <MarkdownRenderer content={msg.content} />
                                ) : (
                                    msg.content
                                )}
                            </div>
                            <div className="idea-chat__message-time">
                                {formatTime(msg.created_at)}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="idea-chat__message idea-chat__message--assistant">
                            <div className="idea-chat__typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form className="idea-chat__input-form" onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="پیامت رو بنویس..."
                        disabled={isLoading}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="idea-chat__send-btn"
                    >
                        {isLoading ? (
                            <span className="idea-chat__send-spinner"></span>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default IdeaChat;
