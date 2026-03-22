import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as CartSQLite from '../services/CartSQLite';

console.log('CartContext.js running on platform:', Platform.OS);

const CartContext = createContext();

const initCart = () => CartSQLite.initCartSQLite();

const loadCartFromAsync = CartSQLite.loadCartFromSQLite;
const saveCartToAsync = CartSQLite.saveCartToSQLite;
const clearCartInAsync = CartSQLite.clearCartSQLite;

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [userId, setUserId] = useState(null);

    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        initCart().then(() => setDbReady(true)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!dbReady) return;
        (async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (!storedUser) {
                    setCart([]);
                    return;
                }
                const parsedUser = JSON.parse(storedUser);
                const id = parsedUser?._id || parsedUser?.id;
                if (!id) return;
                setUserId(String(id));
                const stored = await loadCartFromAsync(String(id));
                if (Array.isArray(stored)) setCart(stored);
            } catch (e) {
                console.error('Cart init error:', e);
            }
        })();
    }, [dbReady]);

    useEffect(() => {
        (async () => {
            try {
                if (!userId) return;
                await saveCartToAsync(userId, cart);
            } catch (e) {
                console.error('Cart save effect error:', e);
            }
        })();
    }, [cart, userId]);

    const getItemId = (item) => item._id || item.id;

    const addToCart = (item) => {
        setCart((prevCart) => {
            const itemId = getItemId(item);
            const existingItem = prevCart.find((i) => getItemId(i) === itemId);
            if (existingItem) {
                return prevCart.map((i) =>
                    getItemId(i) === itemId ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart((prevCart) => prevCart.filter((item) => getItemId(item) !== itemId));
    };

    const increaseQuantity = (itemId) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                getItemId(item) === itemId ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    }

    const decreaseQuantity = (itemId) => {
        setCart((prevCart) => {
            const item = prevCart.find(i => getItemId(i) === itemId);
            if (!item) return prevCart;
            if (item.quantity === 1) {
                return prevCart.filter(i => getItemId(i) !== itemId);
            }
            return prevCart.map(i => getItemId(i) === itemId ? { ...i, quantity: i.quantity - 1 } : i);
        });
    }

    const clearCart = async () => {
        setCart([]);
        try {
            if (userId) await clearCartInAsync(userId);
        } catch (e) {}
    };

    const getCartCalculations = () => {
        let subtotal = 0;
        let discountAmount = 0;
        let dessertUnitsCount = 0;

        const calculatedCart = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return { ...item, itemTotal };
        });

        return {
            subtotal,
            discountAmount: 0,
            cartTotal: subtotal
        };
    };

    const { subtotal, discountAmount, cartTotal } = getCartCalculations();
    const totalItems = cart.reduce((sum, item) => {
        const qty = Number(item.quantity);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
    }, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            increaseQuantity,
            decreaseQuantity,
            clearCart,
            subtotal,
            discountAmount,
            cartTotal,
            totalItems
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);

