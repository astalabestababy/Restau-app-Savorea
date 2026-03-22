import React, { createContext, useState, useContext } from 'react';
import API_URL from '../config/api';
import { getAuthToken } from '../utils/authToken';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/orders/myorders`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const placeOrder = async (orderData) => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(orderData)
            });
            const data = await response.json();
            if (response.ok) {
                setOrders([data, ...orders]);
                return { success: true, order: data };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Error placing order:', error);
            return { success: false, message: 'Network error' };
        }
    };

    return (
        <OrderContext.Provider value={{ orders, loading, fetchOrders, placeOrder }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => useContext(OrderContext);
