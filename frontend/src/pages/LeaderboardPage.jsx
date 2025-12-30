/**
 * LeaderboardPage - صفحه رتبه‌بندی کاربران
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import scoringService from '../services/scoringService';
import './LeaderboardPage.css';

function LeaderboardPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('sum'); // 'sum' or 'avg'
    const { user: currentUser } = useAuth();
    const toast = useToast();

    useEffect(() => {
        loadLeaderboard();
    }, [sortBy]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await scoringService.getLeaderboard(sortBy);
            setUsers(data.results || data);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            toast.error('خطا در بارگذاری رتبه‌بندی');
        } finally {
            setLoading(false);
        }
    };

    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return index + 1;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#6366f1';
        return '#ef4444';
    };

    return (
        <div className="leaderboard-page">
            <header className="leaderboard-page__header">
                <Link to="/dashboard" className="leaderboard-page__back">← داشبورد</Link>
                <h1>🏆 برترین‌های IdeaFlow</h1>
                <p>رتبه‌بندی بر اساس فعالیت و کیفیت ایده‌ها</p>

                <div className="leaderboard-page__toggles">
                    <button
                        className={`leaderboard-page__toggle ${sortBy === 'sum' ? 'active' : ''}`}
                        onClick={() => setSortBy('sum')}
                    >
                        مجموع امتیازات
                    </button>
                    <button
                        className={`leaderboard-page__toggle ${sortBy === 'avg' ? 'active' : ''}`}
                        onClick={() => setSortBy('avg')}
                    >
                        میانگین کیفیت
                    </button>
                </div>
            </header>

            <main className="leaderboard-page__main">
                {loading ? (
                    <div className="leaderboard-page__loading">
                        <div className="leaderboard-page__loader">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                ) : (
                    <div className="leaderboard-list">
                        <div className="leaderboard-list__header">
                            <span className="col-rank">رتبه</span>
                            <span className="col-user">کاربر</span>
                            <span className="col-ideas">تعداد ایده</span>
                            <span className="col-score">
                                {sortBy === 'sum' ? 'مجموع امتیاز' : 'میانگین امتیاز'}
                            </span>
                        </div>

                        {users.map((u, index) => (
                            <div
                                key={index}
                                className={`leaderboard-item ${currentUser && u.user_name === currentUser.full_name ? 'leaderboard-item--me' : ''}`}
                            >
                                <div className="col-rank">
                                    <span className={`rank-badge rank-${index + 1}`}>
                                        {getMedal(index)}
                                    </span>
                                </div>
                                <div className="col-user">
                                    <div className="user-avatar">
                                        {u.user_avatar ? (
                                            <img src={u.user_avatar} alt={u.user_name} />
                                        ) : (
                                            <span>{u.user_name?.[0]}</span>
                                        )}
                                    </div>
                                    <span className="user-name">{u.user_name}</span>
                                    {currentUser && u.user_name === currentUser.full_name && (
                                        <span className="me-badge">شما</span>
                                    )}
                                </div>
                                <div className="col-ideas">
                                    {u.ideas_count}
                                </div>
                                <div className="col-score">
                                    <span className="score-value">
                                        {sortBy === 'sum' ? u.sum_ai_score : u.avg_ai_score?.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {users.length === 0 && (
                            <div className="leaderboard-empty">
                                هنوز داده‌ای ثبت نشده است
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default LeaderboardPage;
