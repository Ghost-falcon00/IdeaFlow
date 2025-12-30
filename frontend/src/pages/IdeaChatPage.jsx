/**
 * IdeaChatPage - صفحه چت کامل با آریا
 * صفحه تمام‌صفحه برای گفتگو با مشاور AI درباره ایده
 * با قابلیت اجرای خودکار اکشن‌های پیشنهادی AI
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import ideaService from '../services/ideaService';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import Button from '../components/common/Button';
import './IdeaChatPage.css';

function IdeaChatPage() {
    const { ideaId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [idea, setIdea] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingIdea, setLoadingIdea] = useState(true);
    const [applyingAction, setApplyingAction] = useState(false);

    // Load idea and chat session
    useEffect(() => {
        if (ideaId) {
            loadIdea();
            loadChatSession();
        }
    }, [ideaId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadIdea = async () => {
        try {
            setLoadingIdea(true);
            const data = await ideaService.getIdea(ideaId);
            setIdea(data);
        } catch (error) {
            console.error('Error loading idea:', error);
            toast.error('خطا در بارگذاری ایده');
            navigate('/dashboard');
        } finally {
            setLoadingIdea(false);
        }
    };

    const loadChatSession = async () => {
        try {
            const session = await ideaService.getChatSession(ideaId);
            setMessages(session.messages || []);
        } catch (error) {
            console.error('Error loading chat:', error);
            setMessages([]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Execute AI action
    const executeAction = async (action) => {
        if (!action || applyingAction) return;

        setApplyingAction(true);
        try {
            const result = await ideaService.applyAction(ideaId, action);
            if (result.success) {
                // Update local idea state with new data
                setIdea(result.idea);
                toast.success(result.message || '✅ تغییرات اعمال شد!');
            } else {
                toast.error(result.error || 'خطا در اعمال تغییرات');
            }
        } catch (error) {
            console.error('Error applying action:', error);
            toast.error('خطا در اعمال تغییرات');
        } finally {
            setApplyingAction(false);
        }
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
            const response = await ideaService.sendChatMessage(ideaId, userMessage);
            const aiMessage = response.message;

            setMessages(prev => [...prev, aiMessage]);

            // Auto-execute action if present (AI confirmed user approval)
            if (aiMessage.suggested_action) {
                // Small delay for better UX
                setTimeout(() => {
                    executeAction(aiMessage.suggested_action);
                }, 500);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = error.response?.data?.error || 'خطا در ارسال پیام';
            toast.error(errorMsg);
            setMessages(prev => prev.slice(0, -1));
            setInputValue(userMessage);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    };

    const quickQuestions = [
        'نقاط قوت ایده‌ام چیه؟',
        'چطور می‌تونم درآمدزایی کنم؟',
        'رقبای این حوزه کیا هستن؟',
        'چه ریسک‌هایی وجود داره؟',
        'بودجه پیشنهادی چقدره؟',
        'یه چک‌لیست برام بساز',
    ];

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#6366f1';
        return '#ef4444';
    };

    const getBlockIcon = (type) => {
        const icons = {
            checklist: '✅',
            tags: '🏷️',
            progress: '📊',
            link: '🔗',
            node_graph: '🕸️'
        };
        return icons[type] || '📦';
    };

    if (loadingIdea) {
        return (
            <div className="chat-page chat-page--loading">
                <div className="chat-page__loader">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        );
    }

    if (!idea) {
        return (
            <div className="chat-page chat-page--error">
                <h2>ایده پیدا نشد</h2>
                <Button onClick={() => navigate('/dashboard')}>بازگشت به داشبورد</Button>
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* Sidebar - Always visible */}
            <aside className="chat-page__sidebar">
                <div className="chat-page__sidebar-header">
                    <Link to="/dashboard" className="chat-page__back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        برگشت به داشبورد
                    </Link>
                </div>

                <div className="chat-page__sidebar-content">
                    {/* Idea Info */}
                    <div className="chat-page__idea-info">
                        <h2>{idea.title}</h2>

                        {idea.ai_score && (
                            <div className="chat-page__score" style={{ '--score-color': getScoreColor(idea.ai_score) }}>
                                <span className="chat-page__score-value">{idea.ai_score}</span>
                                <span className="chat-page__score-label">امتیاز</span>
                            </div>
                        )}

                        <p className="chat-page__description">
                            {idea.description.length > 100
                                ? idea.description.substring(0, 100) + '...'
                                : idea.description}
                        </p>
                    </div>

                    {/* Info Cards */}
                    {(idea.budget || idea.required_skills) && (
                        <div className="chat-page__info-cards">
                            {idea.budget && (
                                <div className="chat-page__info-card">
                                    <span>💰</span>
                                    <span>{idea.budget}</span>
                                </div>
                            )}
                            {idea.required_skills && (
                                <div className="chat-page__info-card">
                                    <span>👥</span>
                                    <span>{idea.required_skills.substring(0, 40)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Blocks */}
                    {idea.blocks && idea.blocks.length > 0 && (
                        <div className="chat-page__blocks-section">
                            <h5 className="chat-page__section-title">بلوک‌ها</h5>
                            <div className="chat-page__blocks-list">
                                {idea.blocks.map((block, i) => (
                                    <span key={i} className="chat-page__block-tag">
                                        {getBlockIcon(block.type)}
                                        {block.name || block.type}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Questions */}
                <div className="chat-page__quick-section">
                    <h5 className="chat-page__section-title">پیشنهادات</h5>
                    {quickQuestions.map((q, i) => (
                        <button
                            key={i}
                            className="chat-page__quick-btn"
                            onClick={() => setInputValue(q)}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-page__main">
                {/* Header */}
                <header className="chat-page__header">
                    <div className="chat-page__header-avatar">
                        <span>🤖</span>
                    </div>
                    <div className="chat-page__header-info">
                        <h3>آریا - مشاور هوشمند استارتاپ</h3>
                        <p>
                            {applyingAction ? '⏳ در حال اعمال تغییرات...' : 'آماده کمک برای بهبود ایده‌ات'}
                        </p>
                    </div>
                    <div className="chat-page__header-actions">
                        <button
                            className="chat-page__refresh-btn"
                            onClick={loadIdea}
                            title="بروزرسانی ایده"
                        >
                            🔄
                        </button>
                        <Link to="/dashboard" className="chat-page__dashboard-btn">
                            🏠 داشبورد
                        </Link>
                    </div>
                </header>

                {/* Messages */}
                <div className="chat-page__messages">
                    {/* Welcome */}
                    {messages.length === 0 && (
                        <div className="chat-page__welcome">
                            <div className="chat-page__welcome-icon">🚀</div>
                            <h4>سلام! من آریا هستم</h4>
                            <p>مشاور هوشمند استارتاپ. هر سوالی درباره ایده‌ات داری بپرس!</p>
                            <p className="chat-page__welcome-hint">
                                💡 من می‌تونم بودجه پیشنهاد بدم، چک‌لیست بسازم، و حتی نقشه ایده‌ات رو طراحی کنم!
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-page__message chat-page__message--${msg.role}`}
                        >
                            {/* AI avatar on left */}
                            {msg.role === 'assistant' && (
                                <div className="chat-page__message-avatar chat-page__message-avatar--ai">🤖</div>
                            )}
                            <div className="chat-page__message-content">
                                {msg.role === 'assistant' ? (
                                    <MarkdownRenderer content={msg.content} />
                                ) : (
                                    msg.content
                                )}
                                <div className="chat-page__message-time">
                                    {formatTime(msg.created_at)}
                                </div>
                            </div>
                            {/* User avatar on right */}
                            {msg.role === 'user' && (
                                <div className="chat-page__message-avatar chat-page__message-avatar--user">👤</div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="chat-page__message chat-page__message--assistant">
                            <div className="chat-page__message-avatar">🤖</div>
                            <div className="chat-page__typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form className="chat-page__input-form" onSubmit={handleSubmit}>
                    <div className="chat-page__input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="پیامت رو بنویس..."
                            disabled={isLoading || applyingAction}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading || applyingAction}
                            className="chat-page__send-btn"
                        >
                            {isLoading || applyingAction ? (
                                <span className="chat-page__send-spinner"></span>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default IdeaChatPage;
