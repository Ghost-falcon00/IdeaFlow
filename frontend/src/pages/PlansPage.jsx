/**
 * PlansPage - صفحه نمایش پلن‌های اشتراک
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import subscriptionService from '../services/subscriptionService';
import './PlansPage.css';

function PlansPage() {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [limits, setLimits] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlans();
        if (isAuthenticated) {
            loadCurrentSubscription();
            loadLimits();
        }
    }, [isAuthenticated]);

    const loadPlans = async () => {
        try {
            const data = await subscriptionService.getPlans();
            setPlans(data.results || data);
        } catch (error) {
            toast.error('خطا در دریافت پلن‌ها');
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentSubscription = async () => {
        try {
            const data = await subscriptionService.getMySubscription();
            setCurrentPlan(data.plan);
        } catch (error) {
            console.log('No subscription found');
        }
    };

    const loadLimits = async () => {
        try {
            const data = await subscriptionService.getRemainingLimits();
            setLimits(data);
        } catch (error) {
            console.log('Error loading limits');
        }
    };

    const formatPrice = (price) => {
        if (price === 0) return 'رایگان';
        return `${price.toLocaleString()} تومان/ماه`;
    };

    const isCurrentPlan = (plan) => {
        return currentPlan?.id === plan.id;
    };

    return (
        <div className="plans-page">
            <div className="plans-container">
                {/* Header */}
                <div className="plans-header">
                    <Link to="/dashboard" className="back-link">← بازگشت</Link>
                    <h1>پلن‌های اشتراک</h1>
                    <p>پلن مناسب خود را انتخاب کنید و از امکانات بیشتر استفاده کنید</p>
                </div>

                {/* Current Limits (if authenticated) */}
                {isAuthenticated && limits && (
                    <div className="current-limits">
                        <h3>وضعیت امروز شما</h3>
                        <div className="limits-grid">
                            <div className="limit-item">
                                <span className="limit-label">ایده‌های باقیمانده</span>
                                <span className="limit-value">{limits.ideas_remaining} از {limits.ideas_limit}</span>
                                <div className="limit-bar">
                                    <div
                                        className="limit-progress"
                                        style={{ width: `${(limits.ideas_remaining / limits.ideas_limit) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="limit-item">
                                <span className="limit-label">چت با AI</span>
                                <span className="limit-value">{limits.chats_remaining} از {limits.chats_limit}</span>
                                <div className="limit-bar">
                                    <div
                                        className="limit-progress"
                                        style={{ width: `${(limits.chats_remaining / limits.chats_limit) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plans Grid */}
                {loading ? (
                    <div className="plans-loading">در حال بارگذاری...</div>
                ) : (
                    <div className="plans-grid">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className={`plan-card ${plan.is_featured ? 'plan-card--featured' : ''} ${isCurrentPlan(plan) ? 'plan-card--current' : ''}`}
                            >
                                {plan.is_featured && <div className="featured-badge">پیشنهاد ویژه</div>}
                                {isCurrentPlan(plan) && <div className="current-badge">پلن فعلی</div>}

                                <h2 className="plan-name">{plan.name}</h2>
                                <p className="plan-description">{plan.description}</p>

                                <div className="plan-price">
                                    {plan.is_free ? (
                                        <span className="price-free">رایگان</span>
                                    ) : (
                                        <>
                                            <span className="price-amount">{plan.price.toLocaleString()}</span>
                                            <span className="price-unit">تومان/ماه</span>
                                        </>
                                    )}
                                </div>

                                <ul className="plan-features">
                                    <li>
                                        <span className="feature-icon">💡</span>
                                        {plan.ideas_per_day === 999 ? 'ایده نامحدود' : `${plan.ideas_per_day} ایده در روز`}
                                    </li>
                                    <li>
                                        <span className="feature-icon">🤖</span>
                                        {plan.ai_chats_per_day === 999 ? 'چت نامحدود با AI' : `${plan.ai_chats_per_day} پیام چت AI در روز`}
                                    </li>
                                    <li>
                                        <span className="feature-icon">⭐</span>
                                        {plan.ai_scoring_attempts === 999 ? 'امتیازگیری نامحدود' : `${plan.ai_scoring_attempts} بار امتیازگیری هر ایده`}
                                    </li>
                                    <li>
                                        <span className="feature-icon">📝</span>
                                        {plan.custom_fields_per_idea === 999 ? 'فیلد سفارشی نامحدود' : `${plan.custom_fields_per_idea} فیلد سفارشی هر ایده`}
                                    </li>
                                </ul>

                                <button
                                    className={`plan-button ${isCurrentPlan(plan) ? 'plan-button--disabled' : ''}`}
                                    disabled={isCurrentPlan(plan)}
                                >
                                    {isCurrentPlan(plan) ? 'پلن فعلی شما' : plan.is_free ? 'شروع رایگان' : 'خرید پلن'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* FAQ */}
                <div className="plans-faq">
                    <h3>سوالات متداول</h3>
                    <div className="faq-item">
                        <h4>محدودیت‌ها چطور کار می‌کنند؟</h4>
                        <p>محدودیت‌ها به صورت روزانه ریست می‌شوند. هر روز ساعت ۰۰:۰۰ محدودیت‌های مصرفی شما صفر می‌شود.</p>
                    </div>
                    <div className="faq-item">
                        <h4>می‌توانم پلن را تغییر دهم؟</h4>
                        <p>بله، هر زمان می‌توانید به پلن بالاتر ارتقا دهید. تفاوت هزینه محاسبه و دریافت می‌شود.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlansPage;
