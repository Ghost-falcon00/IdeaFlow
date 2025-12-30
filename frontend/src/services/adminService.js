import api from './api';

const adminService = {
    // Users
    getUsers: async () => {
        const response = await api.get('/admin-panel/users/');
        return response.data.results || response.data;
    },
    banUser: async (userId) => {
        const response = await api.post(`/admin-panel/users/${userId}/ban/`);
        return response.data;
    },
    unbanUser: async (userId) => {
        const response = await api.post(`/admin-panel/users/${userId}/unban/`);
        return response.data;
    },
    giveSubscription: async (userId, planSlug, durationDays) => {
        const response = await api.post(`/admin-panel/users/${userId}/give_subscription/`, {
            plan_slug: planSlug,
            duration_days: durationDays
        });
        return response.data;
    },

    // Ideas
    getIdeas: async () => {
        const response = await api.get('/admin-panel/ideas/');
        return response.data.results || response.data;
    },
    deleteIdea: async (ideaId) => {
        const response = await api.delete(`/admin-panel/ideas/${ideaId}/`);
        return response.data;
    },

    // Tickets
    getTickets: async () => {
        const response = await api.get('/admin-panel/tickets/');
        return response.data.results || response.data;
    },
    replyTicket: async (ticketId, content) => {
        const response = await api.post(`/admin-panel/tickets/${ticketId}/reply/`, { content });
        return response.data;
    },
    closeTicket: async (ticketId) => {
        const response = await api.post(`/admin-panel/tickets/${ticketId}/close/`);
        return response.data;
    }
};

export default adminService;
