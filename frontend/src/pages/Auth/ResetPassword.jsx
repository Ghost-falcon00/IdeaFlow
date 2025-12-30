/**
 * Reset Password Page - صفحه تغییر رمز
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/common/ThemeToggle';
import api from '../../services/api';
import './Auth.css';

function ResetPassword() {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        new_password: '',
        new_password_confirm: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.new_password) {
            setError('رمزعبور الزامی است');
            return;
        }

        if (formData.new_password.length < 8) {
            setError('رمزعبور باید حداقل ۸ کاراکتر باشد');
            return;
        }

        if (formData.new_password !== formData.new_password_confirm) {
            setError('رمزها مطابقت ندارند');
            return;
        }

        setLoading(true);
        try {
            await api.post('/accounts/password-reset/confirm/', {
                uid,
                token,
                new_password: formData.new_password,
                new_password_confirm: formData.new_password_confirm,
            });
            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'لینک نامعتبر یا منقضی شده است');
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
                    <div className="auth-card__logo">🔐</div>
                    <h1>رمز جدید</h1>
                    <p>رمزعبور جدید خود را وارد کنید</p>
                </div>

                {success ? (
                    <div className="auth-card__success">
                        <div className="auth-card__success-icon">✅</div>
                        <h3>رمز تغییر کرد!</h3>
                        <p>رمزعبور شما با موفقیت تغییر کرد.</p>
                        <p>در حال انتقال به صفحه ورود...</p>
                        <Link to="/login" className="auth-btn auth-btn--primary" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                            ورود به حساب
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && <div className="auth-card__error">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="auth-form__group">
                                <label htmlFor="new_password">رمزعبور جدید</label>
                                <div className="auth-form__input-wrapper">
                                    <span className="auth-form__icon">🔒</span>
                                    <input
                                        id="new_password"
                                        name="new_password"
                                        type="password"
                                        placeholder="حداقل ۸ کاراکتر"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="auth-form__group">
                                <label htmlFor="new_password_confirm">تأیید رمز</label>
                                <div className="auth-form__input-wrapper">
                                    <span className="auth-form__icon">🔒</span>
                                    <input
                                        id="new_password_confirm"
                                        name="new_password_confirm"
                                        type="password"
                                        placeholder="تکرار رمز جدید"
                                        value={formData.new_password_confirm}
                                        onChange={handleChange}
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
                                    'تغییر رمزعبور'
                                )}
                            </button>
                        </form>

                        <p className="auth-card__footer">
                            <Link to="/login">بازگشت به ورود</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
