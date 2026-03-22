import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getAuthToken } from '../../utils/authToken';
import API_URL from '../../config/api';

const AdminOrdersListScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/orders`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                setOrders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
                Alert.alert('Success', `Order status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setStatusModalVisible(true);
    };

    const closeStatusModal = () => {
        setStatusModalVisible(false);
        setSelectedOrder(null);
    };

    const handleSelectStatus = async (status) => {
        if (!selectedOrder) return;
        await updateStatus(selectedOrder._id, status);
        closeStatusModal();
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => openStatusModal(item)}
            activeOpacity={0.85}
            style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={[styles.orderNumber, { color: colors.text }]}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={[styles.customerName, { color: colors.textSecondary }]}>{item.user?.name || 'Guest'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.orderFooter}>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>{'\u20B1'}{item.totalAmount.toFixed(2)}</Text>
                <View style={styles.actionButtons}>
                    {item.status === 'Pending' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#48BB78' }]} onPress={() => updateStatus(item._id, 'Confirmed')}>
                            <Ionicons name="checkmark" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {item.status === 'Confirmed' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4299E1' }]} onPress={() => updateStatus(item._id, 'Delivered')}>
                            <Ionicons name="bicycle" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#ECC94B';
            case 'Processing': return '#38B2AC';
            case 'Confirmed': return '#48BB78';
            case 'Delivered': return '#4299E1';
            case 'Cancelled': return '#F56565';
            default: return '#718096';
        }
    };

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
                <Text style={[styles.title, { color: colors.text }]}>Orders Management</Text>
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
            <Modal
                animationType="slide"
                transparent
                visible={statusModalVisible}
                onRequestClose={closeStatusModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Change Order Status</Text>
                        <View style={styles.statusOptions}>
                            {['Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled']
                                .filter(option => {
                                    if (selectedOrder && selectedOrder.status === 'Delivered') {
                                        return option === 'Cancelled' || option === 'Delivered';
                                    }
                                    if (selectedOrder && selectedOrder.status === 'Cancelled') {
                                        return option === 'Out for Delivery' || option === 'Delivered';
                                    }
                                    return true;
                                })
                                .map(option => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.statusOption,
                                        { borderColor: colors.border, backgroundColor: colors.background }
                                    ]}
                                    onPress={() => handleSelectStatus(option)}
                                >
                                    <Text style={[styles.statusOptionText, { color: colors.text }]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={closeStatusModal}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    orderCard: {
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 15,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    customerName: {
        fontSize: 14,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statusOptions: {
        marginBottom: 8,
    },
    statusOption: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    statusOptionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    closeBtn: {
        alignSelf: 'center',
        backgroundColor: '#D72323',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        marginTop: 4,
        marginBottom: 10,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

export default AdminOrdersListScreen;
