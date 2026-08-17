import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/v1',
  withCredentials: true,
});

export const authApi = {
  forgotPassword: (email) => 
    api.post('/auth/forgot-password', { email }),
    
  verifyResetOtp: (email, otp) => 
    api.post('/auth/verify-reset-otp', { email, otp }),
    
  resetPassword: (resetToken, newPassword, confirmPassword) => 
    api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword }),
};
