import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

export const getAuthToken = async () => {
    try {
        const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (secureToken) return secureToken;
    } catch (e) {}

    try {
        const asyncToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (asyncToken) {
            try { await SecureStore.setItemAsync(TOKEN_KEY, asyncToken); } catch (e) {}
            return asyncToken;
        }
    } catch (e) {}

    return null;
};

export const setAuthToken = async (token) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    try { await SecureStore.setItemAsync(TOKEN_KEY, token); } catch (e) {}
};

export const clearAuthToken = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch (e) {}
};
