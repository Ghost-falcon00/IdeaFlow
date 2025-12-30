/**
 * Marketplace Service - سرویس API مارکت‌پلیس
 */

import api from './api';

const marketplaceService = {
    // ========== Explore ==========

    /**
     * دریافت لیست ایده‌های عمومی
     */
    getPublicIdeas: async (params = {}) => {
        const response = await api.get('/ideas/marketplace/explore/', { params });
        return response.data;
    },

    /**
     * دریافت جزئیات یک ایده عمومی
     */
    getPublicIdea: async (ideaId) => {
        const response = await api.get(`/ideas/marketplace/explore/${ideaId}/`);
        return response.data;
    },

    /**
     * ستاره دادن/برداشتن
     */
    toggleStar: async (ideaId) => {
        const response = await api.post(`/ideas/marketplace/explore/${ideaId}/star/`);
        return response.data;
    },

    // ========== Comments ==========

    /**
     * دریافت کامنت‌های ایده
     */
    getComments: async (ideaId) => {
        const response = await api.get(`/ideas/marketplace/explore/${ideaId}/comments/`);
        return response.data;
    },

    /**
     * ارسال کامنت
     */
    postComment: async (ideaId, content, parentId = null) => {
        const response = await api.post(`/ideas/marketplace/explore/${ideaId}/comments/`, {
            content,
            parent_id: parentId
        });
        return response.data;
    },

    /**
     * حذف کامنت
     */
    deleteComment: async (commentId) => {
        const response = await api.delete(`/ideas/marketplace/comments/${commentId}/`);
        return response.data;
    },

    // ========== Investment ==========

    /**
     * ارسال درخواست سرمایه‌گذاری
     */
    sendInvestmentRequest: async (ideaId, data) => {
        const response = await api.post(`/ideas/marketplace/explore/${ideaId}/invest/`, data);
        return response.data;
    },

    /**
     * دریافت درخواست‌های سرمایه‌گذاری
     */
    getInvestmentRequests: async () => {
        const response = await api.get('/ideas/marketplace/investments/');
        return response.data;
    },

    /**
     * پذیرش درخواست
     */
    acceptInvestment: async (requestId) => {
        const response = await api.post(`/ideas/marketplace/investments/${requestId}/accept/`);
        return response.data;
    },

    /**
     * رد درخواست
     */
    rejectInvestment: async (requestId) => {
        const response = await api.post(`/ideas/marketplace/investments/${requestId}/reject/`);
        return response.data;
    },

    /**
     * نهایی کردن معامله (توسط صاحب ایده)
     */
    completeDeal: async (requestId) => {
        const response = await api.post(`/ideas/marketplace/investments/${requestId}/complete/`);
        return response.data;
    },

    /**
     * دریافت پیام‌های مذاکره
     */
    getInvestmentMessages: async (requestId) => {
        const response = await api.get(`/ideas/marketplace/investments/${requestId}/messages/`);
        return response.data;
    },

    /**
     * ارسال پیام مذاکره
     */
    sendInvestmentMessage: async (requestId, content) => {
        const response = await api.post(`/ideas/marketplace/investments/${requestId}/messages/`, {
            content
        });
        return response.data;
    },

    // ========== Duplicate Report ==========

    /**
     * گزارش ایده تکراری
     */
    reportDuplicate: async (ideaId, originalIdeaId) => {
        const response = await api.post(`/ideas/marketplace/explore/${ideaId}/report_duplicate/`, {
            original_idea_id: originalIdeaId
        });
        return response.data;
    }
};

export default marketplaceService;
