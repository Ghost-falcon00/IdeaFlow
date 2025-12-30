/**
 * Home Page - انیمیشن هوشمند براساس جهت اسکرول
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import './Home.css';

function Home() {
    const { isAuthenticated } = useAuth();
    const lastScrollY = useRef(0);
    const scrollDirection = useRef('down');

    useEffect(() => {
        const elements = document.querySelectorAll('.reveal');

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isScrollingDown = currentScrollY > lastScrollY.current;
            scrollDirection.current = isScrollingDown ? 'down' : 'up';
            lastScrollY.current = currentScrollY;

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                // Element is in viewport
                const isInView = rect.top < windowHeight - 80 && rect.bottom > 280;
                // Element is below viewport
                const isBelowView = rect.top >= windowHeight - 80;
                // Element is above viewport (starts exit animation at 280px from bottom)
                const isAboveView = rect.bottom <= 280;

                if (isScrollingDown) {
                    // SCROLLING DOWN
                    if (isInView) {
                        // Coming into view from bottom - animate in
                        el.classList.add('animate-in');
                        el.classList.remove('animate-out', 'no-animation');
                    } else if (isBelowView) {
                        // Below viewport - reset for next entrance
                        el.classList.remove('animate-in', 'animate-out');
                        el.classList.add('no-animation');
                    }
                } else {
                    // SCROLLING UP
                    if (isInView) {
                        // Visible - show immediately without animation
                        el.classList.add('animate-in');
                        el.classList.remove('animate-out', 'no-animation');
                    } else if (isBelowView) {
                        // Leaving from bottom - smooth exit animation
                        el.classList.remove('animate-in', 'no-animation');
                        el.classList.add('animate-out');
                    } else if (isAboveView) {
                        // Above viewport - keep visible for when scrolling back down
                        el.classList.add('animate-in');
                        el.classList.remove('animate-out', 'no-animation');
                    }
                }
            });
        };

        // Initial setup
        elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 80) {
                el.classList.add('animate-in');
            }
        });

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero__bg">
                    <div className="hero__blob hero__blob--1"></div>
                    <div className="hero__blob hero__blob--2"></div>
                    <div className="hero__grid"></div>
                </div>

                <div className="hero__content">
                    <div className="hero__badge">
                        <span className="hero__badge-dot"></span>
                        پلتفرم ثبت ایده با هوش مصنوعی
                    </div>

                    <h1 className="hero__title">
                        ایده‌هات رو
                        <span className="hero__title-gradient"> جاودانه </span>
                        کن
                    </h1>

                    <p className="hero__subtitle">
                        ایده‌هات رو ثبت کن، از هوش مصنوعی امتیاز بگیر و با بقیه رقابت کن
                    </p>

                    <div className="hero__cta">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="hero__btn hero__btn--primary">
                                <span>🚀</span>
                                رفتن به داشبورد
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="hero__btn hero__btn--primary">
                                    <span>✨</span>
                                    شروع رایگان
                                </Link>
                                <Link to="/login" className="hero__btn hero__btn--secondary">
                                    ورود به حساب
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="hero__stats">
                        <div className="hero__stat">
                            <span className="hero__stat-value">
                                <AnimatedCounter end={1000} duration={2500} suffix="+" />
                            </span>
                            <span className="hero__stat-label">ایده</span>
                        </div>
                        <div className="hero__stat-divider"></div>
                        <div className="hero__stat">
                            <span className="hero__stat-value">
                                <AnimatedCounter end={500} duration={2000} suffix="+" />
                            </span>
                            <span className="hero__stat-label">کاربر</span>
                        </div>
                        <div className="hero__stat-divider"></div>
                        <div className="hero__stat">
                            <span className="hero__stat-value">
                                <AnimatedCounter end={98} duration={1500} suffix="٪" />
                            </span>
                            <span className="hero__stat-label">رضایت</span>
                        </div>
                    </div>
                </div>

                <div className="hero__scroll">
                    <div className="hero__scroll-line"></div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="section-container">
                    <div className="section-header reveal fade-up">
                        <span className="section-badge">چطور کار می‌کنه؟</span>
                        <h2>سه قدم ساده</h2>
                    </div>

                    <div className="steps">
                        <div className="step reveal slide-up delay-1">
                            <div className="step__number">۱</div>
                            <div className="step__icon">📝</div>
                            <h3>ایده‌ات رو بنویس</h3>
                            <p>در چند ثانیه ثبتش کن</p>
                        </div>
                        <div className="step__connector reveal scale-in"></div>
                        <div className="step reveal slide-up delay-2">
                            <div className="step__number">۲</div>
                            <div className="step__icon">🤖</div>
                            <h3>امتیاز AI بگیر</h3>
                            <p>تحلیل هوشمند ایده</p>
                        </div>
                        <div className="step__connector reveal scale-in"></div>
                        <div className="step reveal slide-up delay-3">
                            <div className="step__number">۳</div>
                            <div className="step__icon">🏆</div>
                            <h3>رتبه‌بندی شو</h3>
                            <p>با بقیه رقابت کن</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features">
                <div className="section-container">
                    <div className="section-header reveal fade-up">
                        <span className="section-badge">امکانات</span>
                        <h2>چرا IdeaFlow؟</h2>
                    </div>

                    <div className="features__grid">
                        <div className="feature-card reveal slide-right delay-1">
                            <div className="feature-card__icon">💡</div>
                            <h3>ثبت سریع</h3>
                            <p>رابط کاربری ساده و سریع</p>
                        </div>

                        <div className="feature-card feature-card--highlight reveal slide-up delay-2">
                            <div className="feature-card__glow"></div>
                            <div className="feature-card__icon">🤖</div>
                            <h3>امتیاز AI</h3>
                            <p>تحلیل هوشمند ایده‌ها</p>
                            <div className="feature-card__tag">پرطرفدار</div>
                        </div>

                        <div className="feature-card reveal slide-left delay-1">
                            <div className="feature-card__icon">🔍</div>
                            <h3>ایده‌های مشابه</h3>
                            <p>پیدا کردن رقبا</p>
                        </div>

                        <div className="feature-card reveal slide-right delay-2">
                            <div className="feature-card__icon">🏆</div>
                            <h3>رتبه‌بندی</h3>
                            <p>رقابت با نوآوران</p>
                        </div>

                        <div className="feature-card reveal slide-up delay-3">
                            <div className="feature-card__icon">📊</div>
                            <h3>داشبورد</h3>
                            <p>مدیریت همه ایده‌ها</p>
                        </div>

                        <div className="feature-card reveal slide-left delay-2">
                            <div className="feature-card__icon">🔐</div>
                            <h3>امنیت</h3>
                            <p>محافظت از ایده‌ها</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <div className="section-container">
                    <div className="section-header reveal fade-up">
                        <span className="section-badge">نظرات</span>
                        <h2>کاربران چی میگن؟</h2>
                    </div>

                    <div className="testimonials__grid">
                        <div className="testimonial-card reveal flip-in delay-1">
                            <p>"IdeaFlow کمک کرد ایده‌هام رو سازماندهی کنم. امتیاز AI جالبه!"</p>
                            <div className="testimonial-card__author">
                                <div className="testimonial-card__avatar">س</div>
                                <div>
                                    <strong>سارا م.</strong>
                                    <span>کارآفرین</span>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-card reveal flip-in delay-2">
                            <p>"قابلیت پیدا کردن ایده‌های مشابه خیلی کمکم کرد."</p>
                            <div className="testimonial-card__author">
                                <div className="testimonial-card__avatar">ع</div>
                                <div>
                                    <strong>علی ر.</strong>
                                    <span>توسعه‌دهنده</span>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-card reveal flip-in delay-3">
                            <p>"رابط کاربری فارسی و زیباش باعث شد عاشقش بشم!"</p>
                            <div className="testimonial-card__author">
                                <div className="testimonial-card__avatar">م</div>
                                <div>
                                    <strong>مریم ا.</strong>
                                    <span>طراح</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section reveal zoom-in">
                <div className="cta-card">
                    <h2>آماده‌ای شروع کنی؟</h2>
                    <p>همین الان رایگان ثبت‌نام کن</p>
                    {!isAuthenticated && (
                        <Link to="/register" className="hero__btn hero__btn--primary hero__btn--large">
                            <span>🚀</span>
                            شروع رایگان
                        </Link>
                    )}
                </div>
            </section>

            <footer className="home-footer">
                <p>💡 IdeaFlow - ساخته شده با ❤️</p>
            </footer>
        </div>
    );
}

export default Home;
