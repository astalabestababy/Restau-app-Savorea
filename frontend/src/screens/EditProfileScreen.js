import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import API_URL from '../config/api';

const EditProfileScreen = () => {
    const { user, updateProfile, uploadAvatar } = useAuth();
    const { colors } = useTheme();
    const navigation = useNavigation();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [address, setAddress] = useState(user?.address || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAddress(user.address || '');
            setPhone(user.phoneNumber || '');
        }
    }, [user?.id, user?.name, user?.email, user?.address, user?.phoneNumber]);

    const getAvatarUri = () => {
        if (!user?.avatar) return null;
        if (user.avatar.startsWith('http')) return user.avatar;
        return `${API_URL.replace('/api', '')}${user.avatar}`;
    };

    const pickAvatarFrom = async (source) => {
        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need permission to access your camera');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need permission to access your photos');
                    return;
                }
            }

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                });

            if (!result.canceled && result.assets?.[0]?.uri) {
                const uploadResult = await uploadAvatar(result.assets[0].uri);
                if (!uploadResult.success) {
                    Alert.alert('Error', uploadResult.message || 'Upload failed');
                }
            }
        } catch (e) {
            Alert.alert('Error', 'Unable to update photo.');
        }
    };

    const handlePickAvatar = () => {
        Alert.alert(
            'Update Photo',
            'Choose a source',
            [
                { text: 'Camera', onPress: () => pickAvatarFrom('camera') },
                { text: 'Gallery', onPress: () => pickAvatarFrom('library') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleSave = async () => {
        const result = await updateProfile({
            name,
            address,
            phoneNumber: phone
        });

        if (result.success) {
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } else {
            Alert.alert('Error', result.message || 'Failed to update profile');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                </View>

                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: colors.surface }]}> 
                        {getAvatarUri() ? (
                            <Image source={{ uri: getAvatarUri() }} style={styles.avatarImage} />
                        ) : (
                            <Text style={[styles.avatarText, { color: colors.primary }]}>{name.charAt(0).toUpperCase()}</Text>
                        )}
                        <TouchableOpacity
                            style={[styles.cameraIcon, { backgroundColor: colors.primary, borderColor: colors.background }]}
                            onPress={handlePickAvatar}
                        >
                            <Ionicons name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{email}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.textSecondary, borderColor: colors.border }]}
                            value={email}
                            editable={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Your phone number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Delivery Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Your delivery address"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        marginBottom: 20,
    },
    backBtn: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        marginTop: 4,
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 15,
        minHeight: 50,
        fontSize: 16,
        borderWidth: 1,
    },
    saveBtn: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditProfileScreen;
