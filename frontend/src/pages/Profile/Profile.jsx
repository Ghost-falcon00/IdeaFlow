/**
 * Profile Modal - مودال پروفایل کاربر (Enhanced with Subscription Tab)
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import authService from '../../services/authService';
import subscriptionService from '../../services/subscriptionService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './Profile.css';

function Profile() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef(null);

    // Active tab
    const [activeTab, setActiveTab] = useState('profile');

    // Profile form state
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        phone_number: '',
    });
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form state
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Image upload state
    const [imageLoading, setImageLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Subscription state
    const [subscription, setSubscription] = useState(null);
    const [limits, setLimits] = useState(null);
    const [plans, setPlans] = useState([]);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                bio: user.bio || '',
                phone_number: user.phone_number || '',
            });
            setPreviewImage(user.profile_image);
        }

        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [user]);

    // Load subscription data when tab changes
    useEffect(() => {
        if (activeTab === 'subscription') {
            loadSubscriptionData();
        }
    }, [activeTab]);

    const loadSubscriptionData = async () => {
        setSubscriptionLoading(true);
        try {
            const [subData, limitsData, plansData] = await Promise.all([
                subscriptionService.getMySubscription().catch(() => null),
                subscriptionService.getRemainingLimits().catch(() => null),
                subscriptionService.getPlans().catch(() => []),
            ]);
            setSubscription(subData);
            setLimits(limitsData);
            // Handle both paginated and non-paginated responses
            const plansArray = plansData?.results || plansData || [];
            console.log('Plans loaded:', plansArray); // Debug
            setPlans(Array.isArray(plansArray) ? plansArray : []);
        } catch (error) {
            console.error('Error loading subscription:', error);
            setPlans([]);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const handleClose = () => {
        navigate(-1);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            const updatedUser = await authService.updateProfile(profileData);
            if (updateUser) updateUser(updatedUser);
            toast.success('پروفایل با موفقیت بروزرسانی شد ✅');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.detail || 'خطا در بروزرسانی پروفایل');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('رمزعبور جدید و تأیید آن مطابقت ندارند');
            return;
        }

        if (passwordData.new_password.length < 8) {
            toast.error('رمزعبور باید حداقل ۸ کاراکتر باشد');
            return;
        }

        setPasswordLoading(true);

        try {
            await authService.changePassword(
                passwordData.old_password,
                passwordData.new_password
            );
            toast.success('رمزعبور با موفقیت تغییر کرد 🔐');
            setPasswordData({
                old_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMsg = error.response?.data?.old_password?.[0] ||
                error.response?.data?.new_password?.[0] ||
                error.response?.data?.detail ||
                'خطا در تغییر رمزعبور';
            toast.error(errorMsg);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('لطفاً یک فایل تصویری انتخاب کنید');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);

        setImageLoading(true);
        try {
            const updatedUser = await authService.uploadProfileImage(file);
            if (updateUser) updateUser(updatedUser);
            toast.success('عکس پروفایل آپلود شد 📸');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('خطا در آپلود تصویر');
            setPreviewImage(user?.profile_image);
        } finally {
            setImageLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'پروفایل', icon: '👤' },
        { id: 'subscription', label: 'اشتراک', icon: '💎' },
        { id: 'security', label: 'امنیت', icon: '🔐' },
        { id: 'notifications', label: 'اعلان‌ها', icon: '🔔', badge: 3, disabled: true },
        { id: 'activity', label: 'فعالیت‌ها', icon: '📊', disabled: true },
    ];

    const currentPlanName = subscription?.plan?.name || 'رایگان';

    return createPortal(
        <div className="profile-overlay" onClick={handleOverlayClick}>
            <div className="profile-modal">
                {/* Sidebar */}
                <aside className="profile-sidebar">
                    {/* Avatar */}
                    <div
                        className={`profile-avatar ${imageLoading ? 'profile-avatar--loading' : ''}`}
                        onClick={handleImageClick}
                    >
                        {previewImage ? (
                            <img src={previewImage} alt="پروفایل" />
                        ) : (
                            <span className="profile-avatar__placeholder">
                                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        )}
                        <div className="profile-avatar__overlay">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </div>
                        {imageLoading && (
                            <div className="profile-avatar__spinner">
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                    />

                    <h2 className="profile-sidebar__name">{user?.full_name || user?.username}</h2>
                    <p className="profile-sidebar__email">{user?.email}</p>

                    {/* Current Plan Badge */}
                    <div className="profile-sidebar__plan">
                        <span className="profile-plan-badge">💎 {currentPlanName}</span>
                    </div>

                    {/* Tabs */}
                    <nav className="profile-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`profile-tab ${activeTab === tab.id ? 'profile-tab--active' : ''} ${tab.disabled ? 'profile-tab--disabled' : ''}`}
                                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                                disabled={tab.disabled}
                            >
                                <span className="profile-tab__icon">{tab.icon}</span>
                                <span className="profile-tab__label">{tab.label}</span>
                                {tab.badge && (
                                    <span className="profile-tab__badge">{tab.badge}</span>
                                )}
                                {tab.disabled && (
                                    <span className="profile-tab__soon">به‌زودی</span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <p className="profile-sidebar__date">
                        عضو از {new Date(user?.created_at).toLocaleDateString('fa-IR')}
                    </p>
                </aside>

                {/* Main Content */}
                <main className="profile-content">
                    <div className="profile-content__header">
                        <h1>{tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}</h1>
                        <button className="profile-close" onClick={handleClose}>✕</button>
                    </div>

                    <div className="profile-content__body">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit} className="profile-form">
                                <div className="profile-form__grid">
                                    <Input
                                        name="first_name"
                                        label="نام"
                                        value={profileData.first_name}
                                        onChange={handleProfileChange}
                                        placeholder="نام شما"
                                    />
                                    <Input
                                        name="last_name"
                                        label="نام خانوادگی"
                                        value={profileData.last_name}
                                        onChange={handleProfileChange}
                                        placeholder="نام خانوادگی شما"
                                    />
                                </div>

                                <Input
                                    name="phone_number"
                                    label="شماره تلفن"
                                    value={profileData.phone_number}
                                    onChange={handleProfileChange}
                                    placeholder="09123456789"
                                    dir="ltr"
                                />

                                <div className="input-group">
                                    <label className="input-group__label">درباره من</label>
                                    <textarea
                                        name="bio"
                                        className="profile-textarea"
                                        value={profileData.bio}
                                        onChange={handleProfileChange}
                                        placeholder="چند خط درباره خودت بنویس..."
                                        rows={4}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={profileLoading}
                                >
                                    💾 ذخیره تغییرات
                                </Button>
                            </form>
                        )}

                        {activeTab === 'subscription' && (
                            <div className="subscription-content">
                                {subscriptionLoading ? (
                                    <div className="subscription-loading">
                                        <div className="loading-spinner"></div>
                                        <p>در حال بارگذاری...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Current Limits */}
                                        <div className="subscription-limits">
                                            <h3>📊 محدودیت‌های امروز</h3>
                                            <p className="subscription-limits__note">محدودیت‌ها هر ۲۴ ساعت ریست می‌شوند</p>

                                            <div className="limits-grid">
                                                <div className="limit-card">
                                                    <span className="limit-card__icon">💡</span>
                                                    <div className="limit-card__info">
                                                        <span className="limit-card__label">ایده‌ها</span>
                                                        <span className="limit-card__value">
                                                            {limits?.ideas_remaining || 0} / {limits?.ideas_limit || 3}
                                                        </span>
                                                    </div>
                                                    <div className="limit-card__bar">
                                                        <div
                                                            className="limit-card__progress"
                                                            style={{ width: `${((limits?.ideas_remaining || 0) / (limits?.ideas_limit || 3)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="limit-card">
                                                    <span className="limit-card__icon">💬</span>
                                                    <div className="limit-card__info">
                                                        <span className="limit-card__label">چت AI</span>
                                                        <span className="limit-card__value">
                                                            {limits?.chats_remaining || 0} / {limits?.chats_limit || 5}
                                                        </span>
                                                    </div>
                                                    <div className="limit-card__bar">
                                                        <div
                                                            className="limit-card__progress"
                                                            style={{ width: `${((limits?.chats_remaining || 0) / (limits?.chats_limit || 5)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="limit-card">
                                                    <span className="limit-card__icon">🎯</span>
                                                    <div className="limit-card__info">
                                                        <span className="limit-card__label">امتیازگیری هر ایده</span>
                                                        <span className="limit-card__value">{limits?.scoring_attempts || 3} بار</span>
                                                    </div>
                                                </div>

                                                <div className="limit-card">
                                                    <span className="limit-card__icon">🎨</span>
                                                    <div className="limit-card__info">
                                                        <span className="limit-card__label">فیلد سفارشی هر ایده</span>
                                                        <span className="limit-card__value">{limits?.custom_fields_limit || 3} عدد</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Available Plans */}
                                        <div className="subscription-plans">
                                            <h3>🎁 پلن‌های اشتراک</h3>

                                            <div className="plans-grid">
                                                {plans.map(plan => (
                                                    <div
                                                        key={plan.id}
                                                        className={`plan-card ${plan.is_featured ? 'plan-card--featured' : ''} ${subscription?.plan?.id === plan.id ? 'plan-card--active' : ''}`}
                                                    >
                                                        {plan.is_featured && (
                                                            <span className="plan-card__ribbon">پیشنهادی</span>
                                                        )}
                                                        {subscription?.plan?.id === plan.id && (
                                                            <span className="plan-card__current">فعال</span>
                                                        )}

                                                        <h4 className="plan-card__name">{plan.name}</h4>
                                                        <p className="plan-card__price">
                                                            {plan.is_free ? (
                                                                <span>رایگان</span>
                                                            ) : (
                                                                <>
                                                                    <span className="plan-card__amount">{plan.price.toLocaleString('fa-IR')}</span>
                                                                    <span className="plan-card__period">تومان/ماه</span>
                                                                </>
                                                            )}
                                                        </p>

                                                        <ul className="plan-card__features">
                                                            <li>💡 {plan.ideas_per_day} ایده در روز</li>
                                                            <li>💬 {plan.ai_chats_per_day} پیام AI در روز</li>
                                                            <li>🎯 {plan.ai_scoring_attempts}x امتیازگیری</li>
                                                            <li>🎨 {plan.custom_fields_per_idea} فیلد سفارشی</li>
                                                        </ul>

                                                        {subscription?.plan?.id !== plan.id && (
                                                            <Button
                                                                variant={plan.is_featured ? 'primary' : 'secondary'}
                                                                size="small"
                                                                onClick={() => toast.info('به زودی درگاه پرداخت فعال می‌شود')}
                                                            >
                                                                {plan.is_free ? 'فعال' : 'خرید اشتراک'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handlePasswordSubmit} className="profile-form">
                                <div className="profile-security-info">
                                    <p>برای امنیت بیشتر، رمزعبور قوی با ترکیب حروف، اعداد و نمادها انتخاب کنید.</p>
                                </div>

                                <Input
                                    name="old_password"
                                    type="password"
                                    label="رمز فعلی"
                                    value={passwordData.old_password}
                                    onChange={handlePasswordChange}
                                    placeholder="رمزعبور فعلی خود را وارد کنید"
                                />
                                <Input
                                    name="new_password"
                                    type="password"
                                    label="رمز جدید"
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    placeholder="حداقل ۸ کاراکتر"
                                />
                                <Input
                                    name="confirm_password"
                                    type="password"
                                    label="تأیید رمز جدید"
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    placeholder="رمز جدید را مجدداً وارد کنید"
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={passwordLoading}
                                >
                                    🔐 تغییر رمزعبور
                                </Button>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="profile-coming-soon">
                                <span>🔔</span>
                                <h3>اعلان‌ها</h3>
                                <p>به زودی می‌توانید اعلان‌های خود را اینجا مشاهده کنید.</p>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="profile-coming-soon">
                                <span>📊</span>
                                <h3>فعالیت‌های اخیر</h3>
                                <p>تاریخچه فعالیت‌هایتان به زودی در این بخش نمایش داده می‌شود.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>,
        document.body
    );
}

export default Profile;
