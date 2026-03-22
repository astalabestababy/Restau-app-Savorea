import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const VerificationScreen = () => {
    const { verify } = useAuth();
    const navigation = useNavigation();
    const route = useRoute();
    const email = route?.params?.email || '';
    const { colors } = useTheme();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length < 6) {
            Alert.alert('Error', 'Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        const result = await verify(email, code);
        setLoading(false);

        if (result.success) {
            Alert.alert('Verified!', 'Your email has been verified.', [
                { text: 'OK', onPress: () => {
                    if (result.user?.role === 'admin') {
                        navigation.navigate('MainTabs', { screen: 'Admin' });
                    } else {
                        navigation.navigate('MainTabs');
                    }
                }}
            ]);
        } else {
            Alert.alert('Verification Failed', result.message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-open-outline" size={80} color={colors.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Enter the 6-digit code sent to <Text style={[styles.bold, { color: colors.text }]}>{email}</Text>
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                        placeholder="000000"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        letterSpacing={10}
                        textAlign="center"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Now'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn}>
                    <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    content: {
        padding: 25,
        alignItems: 'center',
    },
    iconContainer: {
        marginVertical: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#777',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    bold: {
        fontWeight: 'bold',
        color: '#333',
    },
    inputContainer: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        height: 70,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#eee',
        justifyContent: 'center',
    },
    input: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    btn: {
        backgroundColor: '#D72323',
        width: '100%',
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
    resendBtn: {
        marginTop: 25,
    },
    resendText: {
        color: '#777',
        fontSize: 14,
    }
});

export default VerificationScreen;
