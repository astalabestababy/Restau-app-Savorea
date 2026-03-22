import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState('light'); // Default to light

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                setTheme(systemColorScheme || 'light');
            }
        } catch (e) {
            console.error('Failed to load theme', e);
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        await AsyncStorage.setItem('theme', newTheme);
    };

    const colors = theme === 'light' ? {
        primary: '#D72323',
        background: '#ffffff',
        surface: '#f9f9f9',
        text: '#333333',
        textSecondary: '#666666',
        border: '#eeeeee',
        card: '#ffffff',
        error: '#ff4d4d',
        success: '#4caf50',
    } : {
        primary: '#D72323',
        background: '#000000', // AMOLED Black
        surface: '#121212', // Darker surface
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        border: '#1a1a1a', // Subtle borders
        card: '#080808', // Very dark cards
        error: '#ff4d4d',
        success: '#4caf50',
    };

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
