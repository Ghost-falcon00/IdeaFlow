/**
 * Scoring Service - سرویس امتیازدهی و لیدربورد
 */

import api from './api';

const scoringService = {
    /**
     * دریافت لیدربورد
     * @param {string} sortBy - 'sum' | 'avg'
     */
    getLeaderboard: async (sortBy = 'sum') => {
        const response = await api.get(`/scoring/leaderboard/?sort=${sortBy}`);
        return response.data;
    },

    /**
     * دریافت امتیاز کاربر فعلی
     */
    getMyScore: async () => {
        const response = await api.get('/scoring/my/');
        return response.data;
    }
};

export default scoringService;
