/**
 * Register Page - با گوگل OAuth
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import api from '../../services/api';
import './Auth.css';

function Register() {
    const navigate = useNavigate();
    const { register, setUser, setIsAuthenticated } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        password: '',
        password_confirm: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'ایمیل الزامی است';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'ایمیل معتبر نیست';
        }
        if (!formData.password) {
            newErrors.password = 'رمزعبور الزامی است';
        } else if (formData.password.length < 8) {
            newErrors.password = 'حداقل ۸ کاراکتر';
        }
        if (formData.password !== formData.password_confirm) {
            newErrors.password_confirm = 'رمزها مطابقت ندارند';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validate()) return;

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                username: formData.email.split('@')[0] + '_' + Date.now().toString().slice(-4),
            };
            await register(submitData);
            navigate('/dashboard');
        } catch (error) {
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                const fieldErrors = {};
                Object.keys(data).forEach(key => {
                    fieldErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
                });
                setErrors(fieldErrors);
            } else {
                setApiError('خطا در ثبت‌نام');
            }
        } finally {
            setLoading(false);
        }
    };

    // Google Sign Up
    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        setApiError('');

        try {
            // Load Google API
            if (!window.google) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);

                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // Initialize Google Sign-In
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                scope: 'email profile',
                callback: async (response) => {
                    if (response.access_token) {
                        try {
                            // Get user info from Google
                            const userInfoResponse = await fetch(
                                'https://www.googleapis.com/oauth2/v3/userinfo',
                                {
                                    headers: { Authorization: `Bearer ${response.access_token}` }
                                }
                            );
                            const userInfo = await userInfoResponse.json();

                            // Send to our backend
                            const backendResponse = await api.post('/accounts/google/', {
                                token: response.access_token,
                                email: userInfo.email,
                                first_name: userInfo.given_name || '',
                                last_name: userInfo.family_name || '',
                            });

                            // Store tokens
                            localStorage.setItem('access_token', backendResponse.data.access);
                            localStorage.setItem('refresh_token', backendResponse.data.refresh);
                            setUser(backendResponse.data.user);
                            setIsAuthenticated(true);

                            setGoogleLoading(false);
                            navigate('/dashboard');
                        } catch (err) {
                            console.error('Google signup error:', err);
                            setApiError('خطا در ثبت‌نام با گوگل');
                            setGoogleLoading(false);
                        }
                    } else {
                        setGoogleLoading(false);
                    }
                },
            });

            client.requestAccessToken();
        } catch (error) {
            setApiError('خطا در اتصال به گوگل');
            setGoogleLoading(false);
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
                    <div className="auth-card__logo">✨</div>
                    <h1>ثبت‌نام</h1>
                    <p>یک حساب رایگان بساز</p>
                </div>

                {apiError && <div className="auth-card__error">{apiError}</div>}

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
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                            />
                        </div>
                        {errors.email && <span className="auth-form__error">{errors.email}</span>}
                    </div>

                    <div className="auth-form__group">
                        <label htmlFor="first_name">
                            نام نمایشی
                            <span className="auth-form__optional">(اختیاری)</span>
                        </label>
                        <div className="auth-form__input-wrapper">
                            <span className="auth-form__icon">👤</span>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="نام شما در پروفایل"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="auth-form__row">
                        <div className="auth-form__group">
                            <label htmlFor="password">رمزعبور</label>
                            <div className="auth-form__input-wrapper">
                                <span className="auth-form__icon">🔒</span>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="حداقل ۸ کاراکتر"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'error' : ''}
                                />
                            </div>
                            {errors.password && <span className="auth-form__error">{errors.password}</span>}
                        </div>

                        <div className="auth-form__group">
                            <label htmlFor="password_confirm">تأیید رمز</label>
                            <div className="auth-form__input-wrapper">
                                <span className="auth-form__icon">🔒</span>
                                <input
                                    id="password_confirm"
                                    name="password_confirm"
                                    type="password"
                                    placeholder="تکرار رمز"
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    className={errors.password_confirm ? 'error' : ''}
                                />
                            </div>
                            {errors.password_confirm && <span className="auth-form__error">{errors.password_confirm}</span>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-btn auth-btn--primary"
                        disabled={loading}
                    >
                        {loading ? <span className="auth-btn__spinner"></span> : 'ایجاد حساب'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>یا</span>
                </div>

                <button
                    className="auth-btn auth-btn--google"
                    onClick={handleGoogleSignup}
                    disabled={googleLoading}
                >
                    {googleLoading ? (
                        <span className="auth-btn__spinner auth-btn__spinner--dark"></span>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            ادامه با گوگل
                        </>
                    )}
                </button>

                <p className="auth-card__footer">
                    حساب دارید؟ <Link to="/login">وارد شوید</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
