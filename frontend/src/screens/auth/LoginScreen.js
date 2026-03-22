import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

const APP_ICON = require('../../../assets/icon.png');

const LoginScreen = () => {
    const { login } = useAuth();
    const { clearCart } = useCart();
    const { colors } = useTheme();
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            await clearCart();
            if (result.user?.role === 'admin') {
                navigation.navigate('MainTabs', { screen: 'Admin' });
            } else {
                navigation.navigate('MainTabs');
            }
        } else {
            Alert.alert('Login Failed', result.message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Image source={APP_ICON} style={styles.logoImage} resizeMode="contain" />
                        <Text style={[styles.logoText, { color: colors.primary }]}>Savorea</Text>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue ordering your Filipino favorites.</Text>

                    <View style={styles.inputGroup}>
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                            <TextInput
                                placeholder="Email Address"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, { color: colors.text }]}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, { color: colors.text }]}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Login'}</Text>
                    </TouchableOpacity>

 

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.registerText, { color: colors.primary }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 25,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 28,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#D72323',
        marginTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#777',
        lineHeight: 24,
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    input: {
        flex: 1,
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
    },
    btn: {
        backgroundColor: '#D72323',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#D72323',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
 
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    footerText: {
        color: '#777',
        fontSize: 15,
    },
    registerText: {
        color: '#D72323',
        fontSize: 15,
        fontWeight: 'bold',
    }
});

export default LoginScreen;
