/**
 * IdeaDetailPage - صفحه جزئیات ایده عمومی
 * با نمایش تدریجی، کامنت‌ها، ستاره و درخواست سرمایه‌گذاری
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import marketplaceService from '../services/marketplaceService';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import NumberInput from '../components/common/NumberInput';
import './IdeaDetailPage.css';

function IdeaDetailPage() {
    const { ideaId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const commentInputRef = useRef(null);

    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showInvestModal, setShowInvestModal] = useState(false);

    // Investment form state
    const [investType, setInvestType] = useState('investment');
    const [investAmount, setInvestAmount] = useState('');
    const [investShare, setInvestShare] = useState('');
    const [investMessage, setInvestMessage] = useState('');
    const [submittingInvest, setSubmittingInvest] = useState(false);

    useEffect(() => {
        loadIdea();
        loadComments();
    }, [ideaId]);

    const loadIdea = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getPublicIdea(ideaId);
            setIdea(data);
        } catch (error) {
            console.error('Error loading idea:', error);
            toast.error('ایده پیدا نشد');
            navigate('/explore');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            setLoadingComments(true);
            const data = await marketplaceService.getComments(ideaId);
            setComments(data);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleStar = async () => {
        if (!user) {
            toast.info('برای ستاره دادن ابتدا وارد شوید');
            navigate('/login');
            return;
        }

        try {
            const result = await marketplaceService.toggleStar(ideaId);
            setIdea(prev => ({
                ...prev,
                is_starred: result.starred,
                star_count: result.star_count
            }));
            toast.success(result.starred ? '⭐ ستاره اضافه شد' : 'ستاره برداشته شد');
        } catch (error) {
            toast.error('خطا در ثبت ستاره');
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        if (!user) {
            toast.info('برای کامنت ابتدا وارد شوید');
            navigate('/login');
            return;
        }

        try {
            const comment = await marketplaceService.postComment(
                ideaId,
                newComment,
                replyingTo?.id || null
            );

            if (replyingTo) {
                // Add reply to parent comment
                setComments(prev => prev.map(c =>
                    c.id === replyingTo.id
                        ? { ...c, replies: [...(c.replies || []), comment] }
                        : c
                ));
            } else {
                // Add new comment at top
                setComments(prev => [comment, ...prev]);
            }

            setNewComment('');
            setReplyingTo(null);
            toast.success('کامنت ثبت شد');
        } catch (error) {
            toast.error('خطا در ثبت کامنت');
        }
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        commentInputRef.current?.focus();
    };

    const handleInvestSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.info('برای سرمایه‌گذاری ابتدا وارد شوید');
            navigate('/login');
            return;
        }

        try {
            setSubmittingInvest(true);
            await marketplaceService.sendInvestmentRequest(ideaId, {
                request_type: investType,
                amount: investAmount,
                share_percentage: investType === 'investment' ? parseInt(investShare) || null : null,
                message: investMessage
            });

            toast.success('درخواست سرمایه‌گذاری ارسال شد! ✅');
            setShowInvestModal(false);
            loadIdea(); // Refresh to show request status
        } catch (error) {
            const msg = error.response?.data?.error || 'خطا در ارسال درخواست';
            toast.error(msg);
        } finally {
            setSubmittingInvest(false);
        }
    };

    const getScoreColor = (score) => {
        if (!score) return '#64748b';
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#6366f1';
        return '#ef4444';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="idea-detail idea-detail--loading">
                <div className="idea-detail__loader">
                    <span></span><span></span><span></span>
                </div>
            </div>
        );
    }

    if (!idea) return null;

    return (
        <div className="idea-detail">
            {/* Header */}
            <header className="idea-detail__header">
                <Link to="/explore" className="idea-detail__back">← کاوش</Link>
            </header>

            {/* Main Content */}
            <main className="idea-detail__main">
                {/* Idea Info */}
                <article className="idea-detail__content">
                    <div className="idea-detail__title-row">
                        <h1>{idea.title}</h1>
                        {idea.ai_score && (
                            <div
                                className="idea-detail__score"
                                style={{ '--score-color': getScoreColor(idea.ai_score) }}
                            >
                                <span className="idea-detail__score-value">{idea.ai_score}</span>
                                <span className="idea-detail__score-label">امتیاز AI</span>
                            </div>
                        )}
                    </div>

                    <div className="idea-detail__meta">
                        <span>👤 {idea.user_name || 'ناشناس'}</span>
                        <span>📅 {formatDate(idea.created_at)}</span>
                        {idea.category_name && <span>📁 {idea.category_name}</span>}
                    </div>

                    <div className="idea-detail__description">
                        <MarkdownRenderer content={idea.description} />
                    </div>

                    {idea.budget && (
                        <div className="idea-detail__info-card">
                            <span className="idea-detail__info-icon">💰</span>
                            <div>
                                <strong>بودجه تخمینی</strong>
                                <p>{idea.budget}</p>
                            </div>
                        </div>
                    )}

                    {idea.ai_feedback && (
                        <div className="idea-detail__feedback">
                            <h3>🤖 بازخورد هوش مصنوعی</h3>
                            <MarkdownRenderer content={idea.ai_feedback} />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="idea-detail__actions">
                        <button
                            className={`idea-detail__star-btn ${idea.is_starred ? 'idea-detail__star-btn--active' : ''}`}
                            onClick={handleStar}
                        >
                            {idea.is_starred ? '⭐' : '☆'} {idea.star_count || 0} ستاره
                        </button>

                        {idea.my_investment_request ? (
                            <div className="idea-detail__request-status">
                                درخواست شما: {idea.my_investment_request.status === 'pending' ? '⏳ در انتظار' :
                                    idea.my_investment_request.status === 'accepted' ? '✅ پذیرفته' :
                                        idea.my_investment_request.status === 'negotiation' ? '💬 در حال مذاکره' : '❌ رد شده'}
                            </div>
                        ) : user && idea.user_name !== user.full_name && (
                            <button
                                className="idea-detail__invest-btn"
                                onClick={() => setShowInvestModal(true)}
                            >
                                💰 درخواست سرمایه‌گذاری
                            </button>
                        )}
                    </div>
                </article>

                {/* Comments Section */}
                <section className="idea-detail__comments">
                    <h2>💬 کامنت‌ها ({comments.length})</h2>

                    {/* Comment Form */}
                    <form onSubmit={handleSubmitComment} className="idea-detail__comment-form">
                        {replyingTo && (
                            <div className="idea-detail__replying-to">
                                پاسخ به {replyingTo.user_name}
                                <button type="button" onClick={() => setReplyingTo(null)}>✕</button>
                            </div>
                        )}
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={user ? 'نظر خود را بنویسید...' : 'برای کامنت وارد شوید...'}
                            disabled={!user}
                        />
                        <button type="submit" disabled={!newComment.trim() || !user}>
                            ارسال
                        </button>
                    </form>

                    {/* Comments List */}
                    <div className="idea-detail__comments-list">
                        {loadingComments ? (
                            <p className="idea-detail__comments-loading">در حال بارگذاری...</p>
                        ) : comments.length === 0 ? (
                            <p className="idea-detail__no-comments">هنوز کامنتی ثبت نشده</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="comment">
                                    <div className="comment__header">
                                        <div className="comment__user-info">
                                            {comment.user_avatar ? (
                                                <img
                                                    src={comment.user_avatar}
                                                    alt={comment.user_name}
                                                    className="comment__avatar"
                                                />
                                            ) : (
                                                <div className="comment__avatar-placeholder">
                                                    {comment.user_name?.[0]}
                                                </div>
                                            )}
                                            <span className="comment__author">{comment.user_name}</span>
                                        </div>
                                        <span className="comment__time">
                                            {formatDate(comment.created_at)} - {formatTime(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="comment__content">{comment.content}</p>
                                    <button
                                        className="comment__reply-btn"
                                        onClick={() => handleReply(comment)}
                                    >
                                        ↩ پاسخ
                                    </button>

                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="comment__replies">
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="comment comment--reply">
                                                    <div className="comment__header">
                                                        <div className="comment__user-info">
                                                            {reply.user_avatar ? (
                                                                <img
                                                                    src={reply.user_avatar}
                                                                    alt={reply.user_name}
                                                                    className="comment__avatar comment__avatar--small"
                                                                />
                                                            ) : (
                                                                <div className="comment__avatar-placeholder comment__avatar-placeholder--small">
                                                                    {reply.user_name?.[0]}
                                                                </div>
                                                            )}
                                                            <span className="comment__author">{reply.user_name}</span>
                                                        </div>
                                                        <span className="comment__time">
                                                            {formatTime(reply.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="comment__content">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* Investment Modal */}
            {showInvestModal && (
                <div className="invest-modal__overlay" onClick={() => setShowInvestModal(false)}>
                    <div className="invest-modal" onClick={e => e.stopPropagation()}>
                        <div className="invest-modal__header">
                            <h3>💰 درخواست سرمایه‌گذاری</h3>
                            <button onClick={() => setShowInvestModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleInvestSubmit} className="invest-modal__form">
                            <div className="invest-modal__field">
                                <label>نوع درخواست</label>
                                <select value={investType} onChange={e => setInvestType(e.target.value)}>
                                    <option value="investment">سرمایه‌گذاری شراکتی</option>
                                    <option value="purchase">خرید کامل ایده</option>
                                </select>
                            </div>

                            <div className="invest-modal__field">
                                <NumberInput
                                    label="مبلغ پیشنهادی (تومان)"
                                    value={investAmount}
                                    onChange={e => setInvestAmount(e.target.value)}
                                    placeholder="مثال: 100,000,000"
                                />
                            </div>

                            {investType === 'investment' && (
                                <div className="invest-modal__field">
                                    <label>درصد شراکت پیشنهادی</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={investShare}
                                        onChange={e => setInvestShare(e.target.value)}
                                        placeholder="مثال: ۳۰"
                                    />
                                </div>
                            )}

                            <div className="invest-modal__field">
                                <label>پیام به ایده‌پرداز</label>
                                <textarea
                                    value={investMessage}
                                    onChange={e => setInvestMessage(e.target.value)}
                                    placeholder="خودتان را معرفی کنید و دلیل علاقه‌مندی را بنویسید..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="invest-modal__submit"
                                disabled={submittingInvest}
                            >
                                {submittingInvest ? 'در حال ارسال...' : 'ارسال درخواست'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IdeaDetailPage;
