import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, setAuthToken, clearAuthToken } from '../utils/authToken';
import API_URL from '../config/api';
import Constants from 'expo-constants';
import { registerForPushNotificationsAsync } from '../services/NotificationService';
 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
 

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

 

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            const userData = {
                ...data.user,
                id: data.user.id || data.user._id
            };
            setUser(userData);
            await setAuthToken(data.token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            try {
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    await updatePushToken(pushToken);
                }
            } catch (e) {
                console.error('Push token registration after login failed:', e);
            }
            return { success: true, user: userData };
        }
        return { success: false, message: data.message };
    };

    /** @param {string|null|undefined} avatarBase64 - raw base64 from expo-image-picker (not data: URL) */
    const register = async (name, email, password, avatarBase64 = null) => {
        try {
            const payload = {
                name: String(name),
                email: String(email),
                password: String(password),
            };
            if (avatarBase64 && typeof avatarBase64 === 'string') {
                payload.avatarBase64 = avatarBase64.replace(/^data:image\/\w+;base64,/, '');
            }
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json().catch(() => ({}));
            return { success: response.ok, message: data.message || 'Registration failed' };
        } catch (e) {
            return { success: false, message: e?.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        setUser(null);
        await clearAuthToken();
        await AsyncStorage.removeItem('user');
 
    };

    const updateProfile = async (profileData) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(profileData),
        });
        const data = await response.json();
        if (response.ok) {
            const updatedUser = {
                id: data._id,
                name: data.name,
                email: data.email,
                address: data.address,
                phoneNumber: data.phoneNumber,
                role: data.role,
                isActive: data.isActive,
                avatar: data.avatar ?? user?.avatar ?? null,
                pushToken: data.pushToken ?? user?.pushToken ?? null
            };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            return { success: true };
        }
        return { success: false, message: data.message };
    };

    const updatePushToken = useCallback(async (pushToken) => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/auth/push-token`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ pushToken }),
            });

            if (response.ok) {
                setUser((prev) => {
                    if (!prev) return prev;
                    const updatedUser = { ...prev, pushToken };
                    AsyncStorage.setItem('user', JSON.stringify(updatedUser)).catch(() => {});
                    return updatedUser;
                });
            }
        } catch (e) {
            console.error('Error updating push token:', e);
        }
    }, []);

    const uploadAvatar = async (fileUri) => {
        try {
            const token = await getAuthToken();
            const formData = new FormData();
            let filename = fileUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            let type = match ? `image/${match[1]}` : `image/jpeg`;
            if (!match) filename += '.jpg';
            formData.append('avatar', { uri: fileUri, name: filename, type });
            const res = await fetch(`${API_URL}/auth/avatar`, {
                method: 'PUT',
                headers: { 'x-auth-token': token },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                const updatedUser = {
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    role: data.role,
                    isActive: data.isActive,
                    avatar: data.avatar ?? null
                };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (e) {
            return { success: false, message: 'Upload failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, uploadAvatar, updatePushToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
