/**
 * IdeaCard Component - کارت نمایش ایده با AI Scoring
 * محدودیت: 3 بار امتیازگیری
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ideaService from '../../services/ideaService';
import Button from './Button';
import EditIdeaModal from './EditIdeaModal';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import './IdeaCard.css';

function IdeaCard({ idea, onDelete, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [currentIdea, setCurrentIdea] = useState(idea);
    const [showFullFeedback, setShowFullFeedback] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    // Sync with prop changes
    useEffect(() => {
        setCurrentIdea(idea);
    }, [idea]);

    const remainingAttempts = currentIdea?.remaining_scoring_attempts ??
        (3 - (currentIdea?.scoring_count || 0));

    const handleGetAIScore = async () => {
        if (!currentIdea?.id) {
            toast.error('شناسه ایده نامعتبر است');
            return;
        }

        if (remainingAttempts <= 0) {
            toast.error('شما به سقف مجاز امتیازگیری برای این ایده رسیده‌اید.');
            return;
        }

        setIsScoring(true);
        try {
            const result = await ideaService.getAIScore(currentIdea.id);
            const updatedIdea = {
                ...currentIdea,
                ai_score: result.ai_score,
                ai_feedback: result.ai_feedback,
                scoring_count: result.scoring_count,
                remaining_scoring_attempts: result.remaining_attempts,
                last_scored_description: currentIdea.description // Update local state assumption
            };

            setCurrentIdea(updatedIdea);

            if (onUpdate) onUpdate(updatedIdea);

            toast.success(result.message || 'امتیازدهی با موفقیت انجام شد');

        } catch (error) {
            console.error('Error getting AI score:', error);
            const errorMsg = error.response?.data?.error;

            if (errorMsg) {
                toast.error(errorMsg);
            } else {
                toast.error('خطا در ارتباط با هوش مصنوعی. لطفا مجددا تلاش کنید.');
            }
        } finally {
            setIsScoring(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await ideaService.deleteIdea(currentIdea.id);
            if (onDelete) onDelete(currentIdea.id);
            toast.success('ایده با موفقیت حذف شد');
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error deleting idea:', error);
            toast.error('خطا در حذف ایده');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'linear-gradient(135deg, #10b981, #059669)';
        if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
        if (score >= 40) return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
        return 'linear-gradient(135deg, #ef4444, #dc2626)';
    };

    const getScoreEmoji = (score) => {
        if (score >= 80) return '🏆';
        if (score >= 60) return '👍';
        if (score >= 40) return '👌';
        return '📈';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fa-IR');
    };

    return (
        <div className="idea-card">
            <div className="idea-card__header">
                <h3 className="idea-card__title">{currentIdea.title}</h3>
                <div className="idea-card__badges">
                    {currentIdea.category && (
                        <span className="idea-card__category">{currentIdea.category.name}</span>
                    )}
                    <span className="idea-card__visibility">
                        {currentIdea.visibility === 'public' ? '🌐' : '🔒'}
                    </span>
                </div>
            </div>

            <p className="idea-card__description">
                {currentIdea.description?.length > 200
                    ? currentIdea.description.substring(0, 200) + '...'
                    : currentIdea.description
                }
            </p>

            <div className="idea-card__meta">
                <span className="idea-card__date">📅 {formatDate(currentIdea.created_at)}</span>
                {currentIdea.similar_count > 0 && (
                    <span className="idea-card__similar">
                        🔍 {currentIdea.similar_count} مشابه
                    </span>
                )}
            </div>

            {/* AI Score Section */}
            {currentIdea.ai_score !== null && currentIdea.ai_score !== undefined ? (
                <div className="idea-card__score-section">
                    <div className="idea-card__score-header">
                        <div
                            className="idea-card__score-badge"
                            style={{ background: getScoreColor(currentIdea.ai_score) }}
                        >
                            <span className="idea-card__score-emoji">{getScoreEmoji(currentIdea.ai_score)}</span>
                            <span className="idea-card__score-value">{Math.round(currentIdea.ai_score)}</span>
                            <span className="idea-card__score-max">/100</span>
                        </div>

                        {/* Rescore button with remaining attempts */}
                        {remainingAttempts > 0 && (
                            <button
                                className="idea-card__rescore-btn"
                                onClick={handleGetAIScore}
                                disabled={isScoring}
                                title={`${remainingAttempts} بار دیگر می‌توانید امتیازگیری کنید`}
                            >
                                {isScoring ? (
                                    <span className="idea-card__rescore-spinner"></span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                                    </svg>
                                )}
                                <span className="idea-card__attempts-badge">{remainingAttempts}</span>
                            </button>
                        )}
                    </div>

                    {currentIdea.ai_feedback && (
                        <div className="idea-card__feedback-section">
                            <div
                                className={`idea-card__feedback ${showFullFeedback ? 'expanded' : ''}`}
                            >
                                {currentIdea.ai_feedback}
                            </div>
                            {currentIdea.ai_feedback.length > 200 && (
                                <button
                                    className="idea-card__feedback-toggle"
                                    onClick={() => setShowFullFeedback(!showFullFeedback)}
                                >
                                    {showFullFeedback ? '🔼 کمتر' : '🔽 بیشتر'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <Button
                    variant="primary"
                    size="small"
                    loading={isScoring}
                    onClick={handleGetAIScore}
                    fullWidth
                >
                    🤖 دریافت امتیاز AI ({remainingAttempts} بار)
                </Button>
            )}

            <div className="idea-card__actions">
                <Button variant="ghost" size="small" onClick={() => navigate(`/ideas/${currentIdea.id}/chat`)}>
                    💬 چت با آریا
                </Button>
                <Button variant="ghost" size="small" onClick={() => setShowEditModal(true)}>
                    ✏️ ویرایش
                </Button>
                <Button
                    variant="ghost"
                    size="small"
                    loading={loading}
                    onClick={() => setShowDeleteModal(true)}
                >
                    🗑️ حذف
                </Button>
            </div>

            {showEditModal && (
                <EditIdeaModal
                    idea={currentIdea}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={(updated) => {
                        setCurrentIdea(updated);
                        if (onUpdate) onUpdate(updated);
                    }}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="حذف ایده"
                message={`آیا مطمئنید که می‌خواهید "${currentIdea.title}" را حذف کنید؟ این عمل قابل بازگشت نیست.`}
                confirmText="بله، حذف کن"
                cancelText="انصراف"
                type="danger"
                loading={loading}
            />
        </div>
    );
}

export default IdeaCard;
