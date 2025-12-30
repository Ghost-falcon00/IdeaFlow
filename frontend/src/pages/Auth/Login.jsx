/**
 * Login Page - صفحه ورود با گوگل و فراموشی رمز
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import api from '../../services/api';
import './Auth.css';

function Login() {
    const navigate = useNavigate();
    const { login, setUser, setIsAuthenticated } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
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
            await login(formData);
            navigate('/dashboard');
        } catch (error) {
            setApiError(error.response?.data?.detail || 'ایمیل یا رمزعبور اشتباه است');
        } finally {
            setLoading(false);
        }
    };

    // Google Login
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setApiError('');

        try {
            // Load Google API
            if (!window.google) {
                // Load Google Identity Services
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
                            console.error('Google login error:', err);
                            setApiError('خطا در ورود با گوگل');
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
            {/* Background Animation */}
            <div className="auth-page__bg">
                <div className="auth-page__blob auth-page__blob--1"></div>
                <div className="auth-page__blob auth-page__blob--2"></div>
            </div>

            {/* Theme Toggle */}
            <div className="auth-page__toggle">
                <ThemeToggle />
            </div>

            {/* Login Card */}
            <div className="auth-card">
                <div className="auth-card__header">
                    <div className="auth-card__logo">💡</div>
                    <h1>ورود</h1>
                    <p>به IdeaFlow خوش آمدید</p>
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
                        <div className="auth-form__label-row">
                            <label htmlFor="password">رمزعبور</label>
                            <Link to="/forgot-password" className="auth-form__forgot">
                                فراموشی رمز؟
                            </Link>
                        </div>
                        <div className="auth-form__input-wrapper">
                            <span className="auth-form__icon">🔒</span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                            />
                        </div>
                        {errors.password && <span className="auth-form__error">{errors.password}</span>}
                    </div>

                    <button
                        type="submit"
                        className="auth-btn auth-btn--primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="auth-btn__spinner"></span>
                        ) : (
                            'ورود به حساب'
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>یا</span>
                </div>

                <button
                    className="auth-btn auth-btn--google"
                    onClick={handleGoogleLogin}
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
                            ورود با گوگل
                        </>
                    )}
                </button>

                <p className="auth-card__footer">
                    حساب ندارید؟ <Link to="/register">ثبت‌نام کنید</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
