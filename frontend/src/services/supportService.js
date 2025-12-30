import api from './api';

const supportService = {
    getTickets: async () => {
        const response = await api.get('/support/tickets/');
        return response.data.results || response.data;
    },
    getTicket: async (id) => {
        const response = await api.get(`/support/tickets/${id}/`);
        return response.data;
    },
    createTicket: async (data) => {
        const response = await api.post('/support/tickets/', data);
        return response.data;
    },
    replyTicket: async (ticketId, content, attachment) => {
        const formData = new FormData();
        formData.append('content', content);
        if (attachment) {
            formData.append('attachment', attachment);
        }

        const response = await api.post(`/support/tickets/${ticketId}/reply/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export default supportService;
