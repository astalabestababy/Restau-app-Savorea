import React from 'react';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/rootNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/redux/store';
import { fetchOrders } from './src/redux/slices/orderSlice';

import { CartProvider } from './src/context/CartContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { registerForPushNotificationsAsync } from './src/services/NotificationService';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OrderProvider } from './src/context/OrderContext';

import MainNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import AdminOrdersListScreen from './src/screens/admin/AdminOrdersListScreen';
import AdminMenuScreen from './src/screens/admin/AdminMenuScreen';
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen';
import AdminAnalyticsScreen from './src/screens/admin/AdminAnalyticsScreen';
import AdminReviewsScreen from './src/screens/admin/AdminReviewsScreen';
import AdminPromoScreen from './src/screens/admin/AdminPromoScreen';
import PromoDetailsScreen from './src/screens/PromoDetailsScreen';
import NotificationDetailsScreen from './src/screens/NotificationDetailsScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { loading, user } = useAuth();
  const { colors } = useTheme();
  const { updatePushToken } = useAuth(); 
  const userId = user?.id ?? user?._id;

  React.useEffect(() => {
    console.log('App useEffect, user:', user ? { name: user.name, pushToken: user.pushToken ? 'present' : 'null' } : 'null');
  }, [user]);

  // Register for push notifications on app start
  React.useEffect(() => {
    const registerToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await updatePushToken(token);
          console.log('Push token registered:', token.pushToken.slice(0, 20) + '...');
        }
      } catch (error) {
        console.error('Push registration failed:', error);
      }
    };
    registerToken();
  }, [updatePushToken]); 

  React.useEffect(() => {
    if (!userId) return undefined;

    const refreshOrders = () => {
      store.dispatch(fetchOrders());
    };

    refreshOrders();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshOrders();
      }
    });

    return () => subscription.remove();
  }, [userId]);

  // Handle notification tap: order updates or promo / discount broadcasts
  React.useEffect(() => {
    const refreshOrders = () => {
      if (userId) {
        store.dispatch(fetchOrders());
      }
    };

    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data || {};
      if (data.orderId) {
        refreshOrders();
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data || {};
      if (!navigationRef.current) return;

      if (data.notificationId) {
        navigationRef.current.navigate('NotificationDetails', {
          notificationId: data.notificationId,
          notificationData: {
            ...data,
            title: response.notification.request.content.title,
            body: response.notification.request.content.body,
          },
        });
        return;
      }

      if (data.orderId) {
        refreshOrders();
        navigationRef.current.navigate('OrderHistory', { orderId: data.orderId });
        return;
      }

      if (data.type === 'promo' && data.promoPayload) {
        try {
          const promo = JSON.parse(data.promoPayload);
          navigationRef.current.navigate('PromoDetails', promo);
        } catch (e) {
          navigationRef.current.navigate('PromoDetails', {
            title: 'Promotion',
            description: response.notification.request.content.body || '',
          });
        }
      }
    });
    return () => {
      foregroundSubscription.remove();
      subscription.remove();
    };
  }, [userId]); 

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#D72323" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminOrdersList" component={AdminOrdersListScreen} />
        <Stack.Screen name="AdminMenu" component={AdminMenuScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
        <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
        <Stack.Screen name="AdminPromo" component={AdminPromoScreen} />
        <Stack.Screen name="PromoDetails" component={PromoDetailsScreen} />
        <Stack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider>
          <ThemeProvider>
            <AuthProvider>
              <OrderProvider>
                <CartProvider>
                  <Navigation />
                  <StatusBar style="auto" />
                </CartProvider>
              </OrderProvider>
            </AuthProvider>
          </ThemeProvider>
        </PaperProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
