import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import API_URL from '../config/api';
import { navigateRoot } from '../navigation/rootNavigation';

const CustomDrawerContent = (props) => {
  const { user, logout } = useAuth();
  const { totalItems, clearCart } = useCart();
  const { colors, theme, toggleTheme } = useTheme();
  const baseUrl = API_URL.replace('/api', '');
  const avatarUri = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${baseUrl}${user.avatar}`)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.profileContainer}>
            {avatarUri ? (
              <Image 
                source={{ uri: avatarUri }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() || 'G'}</Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user ? user.name : 'Welcome Guest'}</Text>
              <Text style={styles.userEmail}>{user ? user.email : 'Login to order'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.drawerItems}>
          {user?.role === 'admin' ? (
            <>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => props.navigation.navigate('Admin')}
              >
                <Ionicons name="home-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => navigateRoot('AdminOrdersList')}
              >
                <Ionicons name="receipt-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Manage Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => navigateRoot('AdminMenu')}
              >
                <Ionicons name="restaurant-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Manage Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => navigateRoot('AdminUsers')}
              >
                <Ionicons name="people-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Manage Users</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => navigateRoot('AdminReviews')}
              >
                <Ionicons name="star-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Manage Reviews</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => navigateRoot('AdminPromo')}
              >
                <Ionicons name="megaphone-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Promos & discounts</Text>
              </TouchableOpacity>
            </>

          ) : (
            <>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => props.navigation.navigate('Home')}
              >
                <Ionicons name="home-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => props.navigation.navigate('Menu')}
              >
                <Ionicons name="restaurant-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Our Menu</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => props.navigation.navigate('Cart')}
              >
                <Ionicons name="cart-outline" size={22} color={colors.textSecondary} />
                <View style={styles.cartRow}>
                  <Text style={[styles.drawerItemText, { color: colors.text }]}>My Cart</Text>
                  {totalItems > 0 && (
                    <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.cartBadgeText}>
                        {totalItems > 99 ? '99+' : totalItems}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => props.navigation.navigate('OrderHistory')}
              >
                <MaterialCommunityIcons name="history" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Order History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => props.navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => props.navigation.navigate('Promos')}
              >
                <Ionicons name="pricetags-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Promos & discounts</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => props.navigation.navigate('Profile')}
              >
                <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>Profile Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={toggleTheme}
              >
                <Ionicons name={theme === 'light' ? "moon-outline" : "sunny-outline"} size={22} color={colors.textSecondary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </DrawerContentScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {user ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
            await clearCart();
            await logout();
          }}>
            <Ionicons name="log-out-outline" size={22} color={colors.primary} />
            <Text style={[styles.logoutText, { color: colors.primary }]}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={() => props.navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={22} color={colors.primary} />
            <Text style={[styles.logoutText, { color: colors.primary }]}>Login / Register</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 25,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D72323',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  drawerItems: {
    padding: 20,
    paddingTop: 30,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 5,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
  },
});

export default CustomDrawerContent;
