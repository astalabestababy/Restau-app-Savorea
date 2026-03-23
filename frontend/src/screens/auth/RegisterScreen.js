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
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

/** Set to true if signup must include a profile photo (course requirement). */
const REQUIRE_PROFILE_PHOTO = false;
const APP_ICON = require('../../../assets/icon.png');

const RegisterScreen = () => {
    const { register } = useAuth();
    const { colors } = useTheme();
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatarUri, setAvatarUri] = useState(null);
    /** Raw base64 from ImagePicker (uploaded as JSON avatarBase64 — avoids multipart losing password on RN). */
    const [avatarBase64, setAvatarBase64] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickAvatar = async (source) => {
        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need permission to use your camera.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need permission to access your photos.');
                    return;
                }
            }

            const pickerOpts = {
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.75,
                base64: true,
            };
            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync(pickerOpts)
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    ...pickerOpts,
                });

            if (!result.canceled && result.assets?.[0]) {
                const a = result.assets[0];
                setAvatarUri(a.uri);
                setAvatarBase64(a.base64 || null);
            }
        } catch (e) {
            Alert.alert('Error', 'Could not select a photo.');
        }
    };

    const openAvatarOptions = () => {
        Alert.alert(
            'Profile photo',
            'Optional — add a photo now or skip and add one later in Edit Profile.',
            [
                { text: 'Camera', onPress: () => pickAvatar('camera') },
                { text: 'Photo library', onPress: () => pickAvatar('library') },
                ...(avatarUri ? [{ text: 'Remove photo', style: 'destructive', onPress: () => setAvatarUri(null) }] : []),
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (REQUIRE_PROFILE_PHOTO && !avatarBase64) {
            Alert.alert('Photo required', 'Please add a profile photo using the camera or photo library.');
            return;
        }

        setLoading(true);
        const result = await register(name, email, password, avatarBase64 || undefined);
        setLoading(false);

        if (result.success) {
            Alert.alert('Success', result.message || 'Registration successful.', [
                { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
            ]);
        } else {
            Alert.alert('Registration Failed', result.message);
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
                    <View style={styles.logoWrapper}>
                        <Image source={APP_ICON} style={styles.logoImage} resizeMode="contain" />
                    </View>
                    <Text style={[styles.title, { color: colors.primary }]}>Savorea</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create an account to start ordering your Filipino favorites.</Text>

                    <TouchableOpacity
                        style={[styles.avatarWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}
                        onPress={openAvatarOptions}
                        activeOpacity={0.8}
                    >
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                                <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>Add photo</Text>
                                <Text style={[styles.avatarSubhint, { color: colors.textSecondary }]}>optional</Text>
                            </View>
                        )}
                        <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, { color: colors.text }]}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

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
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.btnText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.loginText, { color: colors.primary }]}>Login</Text>
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
    },
    logoWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoImage: {
        width: 96,
        height: 96,
        borderRadius: 24,
    },
    avatarWrap: {
        alignSelf: 'center',
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 2,
        marginBottom: 24,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    avatarHint: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
    },
    avatarSubhint: {
        fontSize: 11,
        marginTop: 2,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#D72323',
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
    loginText: {
        color: '#D72323',
        fontSize: 15,
        fontWeight: 'bold',
    }
});

export default RegisterScreen;

