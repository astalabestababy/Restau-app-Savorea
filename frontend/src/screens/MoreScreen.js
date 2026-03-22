import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const MoreScreen = () => {
    const navigation = useNavigation();
    const { logout, user } = useAuth();
    const { theme, colors, toggleTheme } = useTheme();
    const { clearCart } = useCart();

    const menuItems = [
        { id: 'profile', title: 'My Profile', icon: 'person-outline', route: 'Profile', color: colors.textSecondary },
        { id: 'orders', title: 'Order History', icon: 'receipt-outline', route: 'OrderHistory', color: colors.textSecondary },
        { id: 'address', title: 'Saved Addresses', icon: 'location-outline', route: 'Profile', color: colors.textSecondary },
        { id: 'settings', title: theme === 'light' ? 'Dark Mode' : 'Light Mode', icon: theme === 'light' ? 'moon-outline' : 'sunny-outline', route: 'toggleTheme', color: colors.textSecondary },
        ...(user && user.role === 'admin' ? [{ id: 'admin', title: 'Admin Dashboard', icon: 'shield-checkmark-outline', route: 'AdminDashboard', color: colors.primary }] : []),
        { id: 'support', title: 'Help & Support', icon: 'help-circle-outline', route: null, color: colors.textSecondary },
    ];

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Seryoso ka ba? Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: async () => {
                    await clearCart();
                    await logout();
                }}
            ]
        );
    };

    const renderMenuItem = (item) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
            onPress={() => {
                if (item.route === 'toggleTheme') {
                    toggleTheme();
                } else if (item.route) {
                    navigation.navigate(item.route);
                }
            }}
        >
            <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color={item.color} />
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Ionicons name="menu-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>More Options</Text>
                    </View>
                </View>
                {user ? (
                    <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.guestLoginCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Ionicons name="person-circle-outline" size={50} color={colors.primary} />
                        <View style={{ marginLeft: 15 }}>
                            <Text style={[styles.guestTitle, { color: colors.text }]}>Login or Register</Text>
                            <Text style={[styles.guestSub, { color: colors.textSecondary }]}>Join us to save your orders!</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.menuContainer}>
                {menuItems.filter(item => user || (item.id !== 'profile' && item.id !== 'orders')).map(renderMenuItem)}
            </View>

            {user && (
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.primary + '15' }]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={colors.primary} />
                    <Text style={[styles.logoutText, { color: colors.primary }]}>Logout</Text>
                </TouchableOpacity>
            )}

            <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0 • Made with ❤️ for Foodies</Text>
            <View style={{ height: 120 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 80,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        lineHeight: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#D72323',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#888',
    },
    guestLoginCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    guestTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    guestSub: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    menuContainer: {
        paddingHorizontal: 10,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemTitle: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        paddingVertical: 15,
        marginHorizontal: 20,
        borderRadius: 15,
        backgroundColor: '#FFF1F1',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D72323',
        marginLeft: 10,
    },
    versionText: {
        textAlign: 'center',
        color: '#bbb',
        fontSize: 12,
        marginTop: 30,
    }
});

export default MoreScreen;

