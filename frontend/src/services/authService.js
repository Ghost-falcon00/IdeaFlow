/**
 * Auth Service - سرویس احراز هویت و پروفایل
 */

import api from './api';

class AuthService {
    // دریافت اطلاعات پروفایل کاربر فعلی
    async getProfile() {
        const response = await api.get('/accounts/me/');
        return response.data;
    }

    // ویرایش پروفایل
    async updateProfile(data) {
        const response = await api.patch('/accounts/me/', data);
        return response.data;
    }

    // آپلود عکس پروفایل
    async uploadProfileImage(file) {
        const formData = new FormData();
        formData.append('profile_image', file);

        const response = await api.patch('/accounts/me/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    // تغییر رمزعبور
    async changePassword(oldPassword, newPassword) {
        const response = await api.put('/accounts/change-password/', {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response.data;
    }
}

export default new AuthService();
