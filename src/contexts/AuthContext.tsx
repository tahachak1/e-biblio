import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { userService, UserProfile } from '../services/userService';
import { otpService, OTPResponse, LoginOTPResponse, PasswordResetRequestResponse, OTPType } from '../services/otpService';

type User = UserProfile;

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  completeFirstLogin: (email: string, temporaryPassword: string, newPassword: string) => Promise<User | null>;
  register: (name: string, email: string, password: string) => Promise<User | null>;
  registerWithOTP: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<OTPResponse>;
  verifyOTP: (userId: string, otp: string, otpType?: OTPType) => Promise<User | null>;
  loginWithOTP: (identifier: string) => Promise<LoginOTPResponse>;
  requestPasswordReset: (identifier: string) => Promise<PasswordResetRequestResponse>;
  resetPassword: (userId: string, otp: string, newPassword: string) => Promise<void>;
  resendOTP: (userId: string, otpType?: OTPType) => Promise<OTPResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (payload: any): User | null => {
  if (!payload) return null;
  const data = payload.user ?? payload;
  if (!data) return null;
  const id = data._id || data.id;
  return {
    ...data,
    id,
    _id: data._id || id,
  };
};

const getUserFromStorage = (): User | null => {
  try {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    return normalizeUser(JSON.parse(savedUser));
  } catch (err) {
    console.error('Failed to parse user from storage', err);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialUser = getUserFromStorage();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [user, setUser] = useState<User | null>(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token && initialUser));

  useEffect(() => {
    // Réhydrate si l'état est vide mais que le storage contient encore un token/user
    if (!user) {
      const storedUser = getUserFromStorage();
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      const normalizedUser = normalizeUser(userData);
      if (!normalizedUser) {
        throw new Error('Données utilisateur invalides');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setIsAuthenticated(true);

      return normalizedUser;
    } catch (error: any) {
      if (error.response?.data?.requirePasswordChange) {
        const customError: any = new Error(error.response?.data?.message || 'Veuillez changer votre mot de passe avant de continuer.');
        customError.requirePasswordChange = true;
        customError.email = error.response?.data?.email || email;
        throw customError;
      }
      throw new Error(error.response?.data?.message || 'Erreur lors de la connexion');
    }
  };

  const completeFirstLogin = async (email: string, temporaryPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/complete-first-login', {
        email,
        temporaryPassword,
        newPassword,
      });
      const { token, user: userData } = response.data;

      const normalizedUser = normalizeUser(userData);
      if (!normalizedUser) {
        throw new Error('Données utilisateur invalides');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setIsAuthenticated(true);

      return normalizedUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Impossible de mettre à jour le mot de passe');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const response = await api.post('/auth/register', {
        firstName: firstName || name,
        lastName: lastName || '',
        email,
        password
      });
      const { token, user: userData } = response.data;

      const normalizedUser = normalizeUser(userData);
      if (!normalizedUser) {
        throw new Error('Données utilisateur invalides');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setIsAuthenticated(true);

      return normalizedUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  const registerWithOTP = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => {
    try {
      return await otpService.register(
        firstName,
        lastName,
        email,
        password
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  const verifyOTP = async (userId: string, otp: string, otpType?: OTPType) => {
    try {
      const response = await otpService.verifyOTP(userId, otp, otpType);
      const { token, user: userData } = response;

      const normalizedUser = normalizeUser(userData);
      if (!normalizedUser) {
        throw new Error('Données utilisateur invalides');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setIsAuthenticated(true);

      return normalizedUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Code de vérification invalide');
    }
  };

  const loginWithOTP = async (identifier: string) => {
    try {
      return await otpService.loginWithOTP(identifier);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'envoi du code');
    }
  };

  const requestPasswordReset = async (
    identifier: string
  ) => {
    try {
      return await otpService.requestPasswordReset(identifier);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la demande de réinitialisation');
    }
  };

  const resetPassword = async (userId: string, otp: string, newPassword: string) => {
    try {
      const verification = await otpService.verifyPasswordReset(userId, otp);
      await otpService.resetPassword(verification.resetToken, newPassword);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  const resendOTP = async (userId: string, otpType?: OTPType) => {
    try {
      return await otpService.resendOTP(userId, otpType);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors du renvoi du code');
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await userService.getProfile();
      if (profile) {
        localStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);
        setIsAuthenticated(true);
      }
      return profile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil', error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      completeFirstLogin,
      register,
      registerWithOTP,
      verifyOTP,
      loginWithOTP,
      requestPasswordReset,
      resetPassword,
      resendOTP,
      logout,
      isAuthenticated,
      isAdmin,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
