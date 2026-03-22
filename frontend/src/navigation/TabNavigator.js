import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../components/CustomDrawerContent';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Drawer = createDrawerNavigator();

const MainNavigator = () => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const isAdmin = user && user.role === 'admin';

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'slide',
                drawerStyle: {
                    backgroundColor: colors.background,
                    width: '75%',
                },
            }}
        >
            <Drawer.Screen name="Home" component={HomeScreen} />
            <Drawer.Screen name="Menu" component={MenuScreen} />
            <Drawer.Screen name="Cart" component={CartScreen} />
            <Drawer.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Drawer.Screen name="Profile" component={ProfileScreen} />
            {isAdmin && (
                <Drawer.Screen 
                    name="Admin" 
                    component={AdminDashboard}
                />
            )}
        </Drawer.Navigator>
    );
};

export default MainNavigator;
