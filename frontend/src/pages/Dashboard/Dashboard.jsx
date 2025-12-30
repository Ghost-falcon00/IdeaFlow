/**
 * Dashboard Page - داشبورد کاربر با آمار Realtime
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ideaService from '../../services/ideaService';
import scoringService from '../../services/scoringService';
import Button from '../../components/common/Button';
import IdeaCard from '../../components/common/IdeaCard';
import CreateIdeaModal from '../../components/common/CreateIdeaModal';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import './Dashboard.css';

function Dashboard() {
    const { user } = useAuth();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [stats, setStats] = useState({
        totalIdeas: 0,
        avgScore: 0,
        rank: null,
    });
    const [statsAnimating, setStatsAnimating] = useState({
        ideas: false,
        score: false,
    });

    useEffect(() => {
        fetchMyIdeas();
        fetchUserRank();
    }, []);

    const fetchMyIdeas = async () => {
        try {
            const data = await ideaService.getMyIdeas();
            setIdeas(data);
            updateStats(data);
        } catch (error) {
            console.error('Error fetching ideas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRank = async () => {
        try {
            const data = await scoringService.getLeaderboard('sum');
            const leaderboard = data.results || data;
            // Find current user's rank
            const userIndex = leaderboard.findIndex(item => item.user_id === user?.id);
            if (userIndex !== -1) {
                setStats(prev => ({ ...prev, rank: userIndex + 1 }));
            }
        } catch (error) {
            console.error('Error fetching rank:', error);
        }
    };

    const updateStats = useCallback((ideasList) => {
        const totalIdeas = ideasList.length;
        const scoredIdeas = ideasList.filter(i => i.ai_score);
        const avgScore = scoredIdeas.length > 0
            ? scoredIdeas.reduce((sum, i) => sum + i.ai_score, 0) / scoredIdeas.length
            : 0;

        setStats(prev => ({
            ...prev,
            totalIdeas,
            avgScore: Math.round(avgScore),
        }));
    }, []);

    const handleIdeaCreated = (newIdea) => {
        // Trigger animation
        setStatsAnimating(prev => ({ ...prev, ideas: true }));
        setTimeout(() => setStatsAnimating(prev => ({ ...prev, ideas: false })), 600);

        setIdeas(prev => {
            const updated = [newIdea, ...prev];
            updateStats(updated);
            return updated;
        });
        setShowCreateModal(false);
    };

    const handleIdeaUpdated = (updatedIdea) => {
        // Trigger score animation if score changed
        setStatsAnimating(prev => ({ ...prev, score: true }));
        setTimeout(() => setStatsAnimating(prev => ({ ...prev, score: false })), 600);

        setIdeas(prev => {
            const updated = prev.map(i => i.id === updatedIdea.id ? { ...i, ...updatedIdea } : i);
            updateStats(updated);
            return updated;
        });
    };

    const handleIdeaDeleted = (ideaId) => {
        setStatsAnimating(prev => ({ ...prev, ideas: true }));
        setTimeout(() => setStatsAnimating(prev => ({ ...prev, ideas: false })), 600);

        setIdeas(prev => {
            const updated = prev.filter(i => i.id !== ideaId);
            updateStats(updated);
            return updated;
        });
    };

    return (
        <div className="dashboard">
            <div className="container">
                {/* Header */}
                <div className="dashboard__header">
                    <div className="dashboard__welcome">
                        <h1>سلام {user?.first_name || user?.username || 'کاربر'}! 👋</h1>
                        <p>ایده‌هات رو مدیریت کن و امتیاز بگیر</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        ➕ ایده جدید
                    </Button>
                </div>

                {/* Stats - Animated */}
                <div className="dashboard__stats">
                    <div className={`stat-card ${statsAnimating.ideas ? 'stat-card--pulse' : ''}`}>
                        <span className="stat-card__icon">💡</span>
                        <div className="stat-card__content">
                            <span className="stat-card__value">
                                <AnimatedCounter end={stats.totalIdeas} duration={800} />
                            </span>
                            <span className="stat-card__label">ایده‌های من</span>
                        </div>
                    </div>
                    <div className={`stat-card ${statsAnimating.score ? 'stat-card--pulse' : ''}`}>
                        <span className="stat-card__icon">🤖</span>
                        <div className="stat-card__content">
                            <span className="stat-card__value">
                                {stats.avgScore > 0 ? (
                                    <AnimatedCounter end={stats.avgScore} duration={1000} />
                                ) : '-'}
                            </span>
                            <span className="stat-card__label">میانگین امتیاز</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-card__icon">🏆</span>
                        <div className="stat-card__content">
                            <span className="stat-card__value">{stats.rank || '-'}</span>
                            <span className="stat-card__label">رتبه‌ام</span>
                        </div>
                    </div>
                </div>

                {/* Ideas List */}
                <div className="dashboard__ideas">
                    <h2>ایده‌های من</h2>

                    {loading ? (
                        <div className="dashboard__loading">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : ideas.length === 0 ? (
                        <div className="dashboard__empty">
                            <span className="dashboard__empty-icon">💭</span>
                            <h3>هنوز ایده‌ای ثبت نکردی</h3>
                            <p>اولین ایده‌ات رو ثبت کن و از AI امتیاز بگیر!</p>
                            <Button
                                variant="primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                ➕ ثبت اولین ایده
                            </Button>
                        </div>
                    ) : (
                        <div className="dashboard__ideas-grid">
                            {ideas.map(idea => (
                                <IdeaCard
                                    key={idea.id}
                                    idea={idea}
                                    onDelete={handleIdeaDeleted}
                                    onUpdate={handleIdeaUpdated}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Idea Modal */}
            {showCreateModal && (
                <CreateIdeaModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleIdeaCreated}
                />
            )}
        </div>
    );
}

export default Dashboard;
