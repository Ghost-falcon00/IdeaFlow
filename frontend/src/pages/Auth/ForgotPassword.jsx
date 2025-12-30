/**
 * Forgot Password Page - صفحه فراموشی رمز
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../components/common/ThemeToggle';
import api from '../../services/api';
import './Auth.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('ایمیل الزامی است');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('ایمیل معتبر نیست');
            return;
        }

        setLoading(true);
        try {
            await api.post('/accounts/password-reset/', { email });
            setSuccess(true);
        } catch (err) {
            // Always show success for security
            setSuccess(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__bg">
                <div className="auth-page__blob auth-page__blob--1"></div>
                <div className="auth-page__blob auth-page__blob--2"></div>
            </div>

            <div className="auth-page__toggle">
                <ThemeToggle />
            </div>

            <div className="auth-card">
                <div className="auth-card__header">
                    <div className="auth-card__logo">🔑</div>
                    <h1>فراموشی رمز</h1>
                    <p>ایمیلت رو وارد کن تا لینک بازیابی بفرستیم</p>
                </div>

                {success ? (
                    <div className="auth-card__success">
                        <div className="auth-card__success-icon">✅</div>
                        <h3>ایمیل ارسال شد!</h3>
                        <p>اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی برایتان ارسال می‌شود.</p>
                        <p>لطفاً صندوق ورودی و پوشه اسپم خود را چک کنید.</p>
                        <Link to="/login" className="auth-btn auth-btn--primary" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                            بازگشت به ورود
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && <div className="auth-card__error">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="auth-form__group">
                                <label htmlFor="email">ایمیل</label>
                                <div className="auth-form__input-wrapper">
                                    <span className="auth-form__icon">✉️</span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-btn auth-btn--primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="auth-btn__spinner"></span>
                                ) : (
                                    'ارسال لینک بازیابی'
                                )}
                            </button>
                        </form>

                        <p className="auth-card__footer">
                            یادتان آمد؟ <Link to="/login">ورود به حساب</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
