/**
 * Idea Service - سرویس مدیریت ایده‌ها و چت
 */

import api from './api';

class IdeaService {
    // ========== Idea CRUD ==========

    async getMyIdeas() {
        const response = await api.get('/ideas/my/');
        return response.data;
    }

    async getIdea(id) {
        const response = await api.get(`/ideas/${id}/`);
        return response.data;
    }

    async createIdea(data) {
        const response = await api.post('/ideas/', data);
        return response.data;
    }

    async updateIdea(id, data) {
        const response = await api.patch(`/ideas/${id}/`, data);
        return response.data;
    }

    async deleteIdea(id) {
        await api.delete(`/ideas/${id}/`);
    }

    // ========== AI Scoring ==========

    async getAIScore(ideaId) {
        const response = await api.post(`/ideas/${ideaId}/ai_score/`);
        return response.data;
    }

    async getSimilarIdeas(ideaId) {
        const response = await api.get(`/ideas/${ideaId}/similar/`);
        return response.data;
    }

    // ========== Chat ==========

    async getChatSession(ideaId) {
        const response = await api.get(`/ideas/${ideaId}/chat/`);
        return response.data;
    }

    async sendChatMessage(ideaId, message) {
        const response = await api.post(`/ideas/${ideaId}/chat/`, { message });
        return response.data;
    }

    async getChatHistory(ideaId) {
        const response = await api.get(`/ideas/${ideaId}/chat/history/`);
        return response.data;
    }

    async applyAction(ideaId, action) {
        const response = await api.post(`/ideas/${ideaId}/chat/apply-action/`, { action });
        return response.data;
    }

    // ========== Custom Fields ==========

    async getCustomFields(ideaId) {
        const response = await api.get(`/ideas/${ideaId}/custom-fields/`);
        return response.data;
    }

    async addCustomField(ideaId, fieldData) {
        const response = await api.post(`/ideas/${ideaId}/custom-fields/`, fieldData);
        return response.data;
    }

    async updateCustomField(ideaId, fieldId, fieldData) {
        const response = await api.patch(`/ideas/${ideaId}/custom-fields/${fieldId}/`, fieldData);
        return response.data;
    }

    async deleteCustomField(ideaId, fieldId) {
        await api.delete(`/ideas/${ideaId}/custom-fields/${fieldId}/`);
    }
}

export default new IdeaService();
