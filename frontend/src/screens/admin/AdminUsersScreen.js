import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getAuthToken } from '../../utils/authToken';
import API_URL from '../../config/api';

const AdminUsersScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (response.ok) {
                setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ role: newRole })
            });
            if (response.ok) {
                setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
                Alert.alert('Success', `User role updated to ${newRole}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderUserItem = ({ item }) => (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                    <TouchableOpacity onPress={() => toggleRole(item._id, item.role)}>
                        <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#D7232320' : '#71809620' }]}>
                            <Text style={[styles.roleText, { color: item.role === 'admin' ? '#D72323' : '#718096' }]}>{item.role.toUpperCase()}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.statusToggle}>
                    <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                    <Switch
                        value={item.isActive}
                        onValueChange={() => toggleUserStatus(item._id, item.isActive)}
                        trackColor={{ false: '#767577', true: colors.primary + '80' }}
                        thumbColor={item.isActive ? colors.primary : '#f4f3f4'}
                    />
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>User Management</Text>
            </View>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    userCard: {
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 12,
        marginBottom: 5,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusToggle: {
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 10,
        marginBottom: 2,
    }
});

export default AdminUsersScreen;
