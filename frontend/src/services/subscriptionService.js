/**
 * Subscription Service - سرویس اشتراک و پلن‌ها
 */

import api from './api';

class SubscriptionService {
    // لیست پلن‌های فعال
    async getPlans() {
        const response = await api.get('/subscriptions/plans/');
        return response.data;
    }

    // اشتراک فعلی کاربر
    async getMySubscription() {
        const response = await api.get('/subscriptions/my-subscription/');
        return response.data;
    }

    // محدودیت‌های باقیمانده
    async getRemainingLimits() {
        const response = await api.get('/subscriptions/limits/');
        return response.data;
    }
}

export default new SubscriptionService();
