import api from './api';

export interface OTPResponse {
  success: boolean;
  message: string;
  userId: string;
}

export interface LoginOTPResponse {
  success: boolean;
  message: string;
  userId: string;
}

export interface PasswordResetRequestResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface PasswordResetVerifyResponse {
  success: boolean;
  message: string;
  resetToken: string;
}

export type OTPType = 'register' | 'login';

export const otpService = {
  // Register with OTP
  register: async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<OTPResponse> => {
    const response = await api.post('/otp/register', {
      nom: lastName,
      prenom: firstName,
      email,
      password
    });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (userId: string, otp: string, otpType?: OTPType): Promise<any> => {
    const response = await api.post('/otp/verify', { userId, otp, otpType });
    return response.data;
  },

  // Login with OTP (passwordless)
  loginWithOTP: async (
    identifier: string
  ): Promise<LoginOTPResponse> => {
    const response = await api.post('/otp/login', { identifier });
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (
    identifier: string
  ): Promise<PasswordResetRequestResponse> => {
    const response = await api.post('/otp/password-reset/request', { identifier });
    return response.data;
  },

  // Verify password reset OTP
  verifyPasswordReset: async (userId: string, otp: string): Promise<PasswordResetVerifyResponse> => {
    const response = await api.post('/otp/password-reset/verify', { userId, otp });
    return response.data;
  },

  // Complete password reset
  resetPassword: async (resetToken: string, newPassword: string): Promise<void> => {
    await api.post('/otp/password-reset/complete', { resetToken, newPassword });
  },

  // Resend OTP
  resendOTP: async (userId: string, otpType?: OTPType): Promise<OTPResponse> => {
    const response = await api.post('/otp/resend', { userId, otpType });
    return response.data;
  }
};
