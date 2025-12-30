/**
 * ExplorePage - صفحه کاوش ایده‌های عمومی
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import marketplaceService from '../services/marketplaceService';
import './ExplorePage.css';

function ExplorePage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [minScore, setMinScore] = useState('');

    // Load ideas
    const loadIdeas = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};

            if (searchQuery) params.search = searchQuery;
            if (sortBy === 'popular') params.sort = 'popular';
            if (sortBy === 'top_rated') params.sort = 'top_rated';
            if (sortBy === 'newest') params.ordering = '-created_at';
            if (minScore) params.min_score = minScore;

            const data = await marketplaceService.getPublicIdeas(params);
            setIdeas(data.results || data);
        } catch (error) {
            console.error('Error loading ideas:', error);
            toast.error('خطا در بارگذاری ایده‌ها');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, sortBy, minScore]);

    useEffect(() => {
        loadIdeas();
    }, [loadIdeas]);

    // Toggle star
    const handleStar = async (ideaId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.info('برای ستاره دادن ابتدا وارد شوید');
            navigate('/login');
            return;
        }

        try {
            const result = await marketplaceService.toggleStar(ideaId);
            setIdeas(prev => prev.map(idea =>
                idea.id === ideaId
                    ? { ...idea, is_starred: result.starred, star_count: result.star_count }
                    : idea
            ));
        } catch (error) {
            toast.error('خطا در ثبت ستاره');
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

    return (
        <div className="explore-page">
            {/* Filters */}
            <div className="explore-page__filters">
                <div className="explore-page__search">
                    <input
                        type="text"
                        placeholder="جستجو در ایده‌ها..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="explore-page__search-icon">🔍</span>
                </div>

                <div className="explore-page__filter-group">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="explore-page__select"
                    >
                        <option value="newest">جدیدترین</option>
                        <option value="popular">محبوب‌ترین</option>
                        <option value="top_rated">بالاترین امتیاز</option>
                    </select>

                    <select
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        className="explore-page__select"
                    >
                        <option value="">همه امتیازها</option>
                        <option value="80">امتیاز ۸۰+</option>
                        <option value="60">امتیاز ۶۰+</option>
                        <option value="40">امتیاز ۴۰+</option>
                    </select>
                </div>
            </div>

            {/* Ideas Grid */}
            <main className="explore-page__main">
                {loading ? (
                    <div className="explore-page__loading">
                        <div className="explore-page__loader">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p>در حال بارگذاری...</p>
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="explore-page__empty">
                        <span>📭</span>
                        <h3>ایده‌ای یافت نشد</h3>
                        <p>هنوز ایده عمومی ثبت نشده یا فیلترهای شما نتیجه‌ای ندارد</p>
                    </div>
                ) : (
                    <div className="explore-page__grid">
                        {ideas.map(idea => (
                            <Link
                                key={idea.id}
                                to={`/explore/${idea.id}`}
                                className="explore-card"
                            >
                                <div className="explore-card__header">
                                    <h3>{idea.title}</h3>
                                    {idea.ai_score && (
                                        <div
                                            className="explore-card__score"
                                            style={{ '--score-color': getScoreColor(idea.ai_score) }}
                                        >
                                            {idea.ai_score}
                                        </div>
                                    )}
                                </div>

                                <p className="explore-card__description">
                                    {idea.short_description}
                                </p>

                                <div className="explore-card__meta">
                                    <span className="explore-card__author">
                                        👤 {idea.user_name || 'ناشناس'}
                                    </span>
                                    <span className="explore-card__date">
                                        {formatDate(idea.created_at)}
                                    </span>
                                </div>

                                <div className="explore-card__footer">
                                    <button
                                        className={`explore-card__star ${idea.is_starred ? 'explore-card__star--active' : ''}`}
                                        onClick={(e) => handleStar(idea.id, e)}
                                    >
                                        {idea.is_starred ? '⭐' : '☆'} {idea.star_count || 0}
                                    </button>
                                    <span className="explore-card__comments">
                                        💬 {idea.comment_count || 0}
                                    </span>
                                    {idea.category_name && (
                                        <span className="explore-card__category">
                                            {idea.category_name}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default ExplorePage;
