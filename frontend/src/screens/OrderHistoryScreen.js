import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput
} from 'react-native';
import * as Linking from 'expo-linking';
import { getAuthToken } from '../utils/authToken';
import API_URL from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../redux/slices/orderSlice';
import { fetchRatings } from '../redux/slices/ratingSlice';
import { useAuth } from '../context/AuthContext';

const OrderHistoryScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const userId = user?.id ?? user?._id;
    const { items: orders, loading } = useSelector(state => state.orders);
    const { colors } = useTheme();
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [activeItemName, setActiveItemName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [existingReviewId, setExistingReviewId] = useState(null);
    const [reviewedByItem, setReviewedByItem] = useState({});
    const countWords = (text) => {
        if (!text) return 0;
        const trimmed = text.trim();
        if (!trimmed) return 0;
        try {
            const matches = trimmed.match(/[\p{L}\p{N}]+/gu);
            return matches ? matches.length : 0;
        } catch (e) {
            const matches = trimmed.match(/[A-Za-z0-9]+/g);
            return matches ? matches.length : 0;
        }
    };

    useEffect(() => {
        if (userId) {
            dispatch(fetchOrders());
        }
    }, [userId, dispatch]);

    const onRefresh = () => {
        if (userId) {
            dispatch(fetchOrders());
        }
    };

    useEffect(() => {
        const preloadReviews = async () => {
            if (!userId || !Array.isArray(orders) || orders.length === 0) return;
            const token = await getAuthToken();
            const pairs = [];
            orders.forEach(order => {
                if (order.status !== 'Delivered') return;
                (order.items || []).forEach(food => {
                    const key = `${order._id}::${food.name}`;
                    if (!(key in reviewedByItem)) {
                        pairs.push({ orderId: order._id, itemName: food.name, key });
                    }
                });
            });
            if (pairs.length === 0) return;
            const next = { ...reviewedByItem };
            await Promise.all(pairs.map(async (p) => {
                try {
                    const res = await fetch(`${API_URL}/reviews?orderId=${p.orderId}&itemName=${encodeURIComponent(p.itemName)}`, {
                        headers: { 'x-auth-token': token }
                    });
                    const data = await res.json();
                    if (res.ok && data) {
                        next[p.key] = data;
                    }
                } catch (e) {}
            }));
            setReviewedByItem(next);
        };
        preloadReviews();
    }, [orders, userId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#FFA500';
            case 'Processing': return colors.primary;
            case 'Delivered': return colors.success;
            case 'Cancelled': return colors.error;
            default: return colors.textSecondary;
        }
    };

    const renderOrderItem = ({ item }) => (
        <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={[styles.orderNumber, { color: colors.text }]}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.itemsList}>
                {item.items.map((food, index) => {
                    const key = `${item._id}::${food.name}`;
                    const isReviewed = !!reviewedByItem[key];
                    return (
                        <View key={index} style={styles.foodRow}>
                            <View style={styles.foodMainRow}>
                                <Text style={[styles.foodName, { color: colors.text }]}>
                                    {food.quantity}x {food.name}
                                </Text>
                                <Text style={[styles.foodPrice, { color: colors.textSecondary }]}>
                                    ?{(food.price * food.quantity).toFixed(2)}
                                </Text>
                            </View>
                            {item.status === 'Delivered' && (
                                <TouchableOpacity
                                    style={[styles.reviewItemBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={() => openReviewModal(item._id, food.name)}
                                >
                                    <Ionicons name={isReviewed ? 'checkmark-circle' : 'star-outline'} size={16} color={colors.primary} />
                                    <Text style={[styles.reviewItemText, { color: colors.primary }]}>
                                        {isReviewed ? 'Edit Review' : 'Review'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {isReviewed && reviewedByItem[key]?.comment ? (
                                <Text style={[styles.reviewPreview, { color: colors.textSecondary }]}>
                                    {reviewedByItem[key].comment}
                                </Text>
                            ) : null}
                        </View>
                    );
                })}
            </View>

            <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
                <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.address}
                    </Text>
                </View>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                    ?{item.totalAmount.toFixed(2)}
                </Text>
            </View>

            {item.status === 'Delivered' && (
                <>
                    <TouchableOpacity
                        style={[styles.actionButton, { borderTopColor: colors.border }]}
                        onPress={async () => {
                            const token = await getAuthToken();
                            const url = `${API_URL}/orders/${item._id}/receipt?token=${token}`;
                            Linking.openURL(url);
                        }}
                    >
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Download Receipt</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    const openReviewModal = async (orderId, itemName) => {
        setActiveOrderId(orderId);
        setActiveItemName(itemName);
        setRating(5);
        setComment('');
        setExistingReviewId(null);
        try {
            const token = await getAuthToken();
            const res = await fetch(`${API_URL}/reviews?orderId=${orderId}&itemName=${encodeURIComponent(itemName)}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok && data) {
                const key = `${orderId}::${itemName}`;
                setExistingReviewId(data._id);
                setRating(data.rating);
                setComment(data.comment || '');
                setReviewedByItem(prev => ({ ...prev, [key]: data }));
            } else {
                const key = `${orderId}::${itemName}`;
                setReviewedByItem(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
            }
        } catch (e) {}
        setReviewModalVisible(true);
    };

    const saveReview = async () => {
        try {
            const wordCount = countWords(comment);
            if (wordCount < 3) {
                Alert.alert('Invalid Comment', 'Comment must be at least 3 words.');
                return;
            }
            const token = await getAuthToken();
            const payload = { orderId: activeOrderId, itemName: activeItemName, rating, comment };
            let res;
            if (existingReviewId) {
                res = await fetch(`${API_URL}/reviews/${existingReviewId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ rating, comment })
                });
            } else {
                res = await fetch(`${API_URL}/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify(payload)
                });
            }
            if (res.ok) {
                const saved = await res.json();
                const key = `${activeOrderId}::${activeItemName}`;
                setReviewModalVisible(false);
                setReviewedByItem(prev => ({ ...prev, [key]: saved }));
                dispatch(fetchRatings(activeItemName));
            } else {
                const data = await res.json();
                Alert.alert('Save Failed', data?.message || 'Unable to save review.');
            }
        } catch (e) {
            Alert.alert('Save Failed', 'Unable to save review. Please try again.');
        }
    };

    const deleteReview = async () => {
        if (!existingReviewId) {
            setReviewModalVisible(false);
            return;
        }
        try {
            const token = await getAuthToken();
            const res = await fetch(`${API_URL}/reviews/${existingReviewId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const key = `${activeOrderId}::${activeItemName}`;
                setReviewModalVisible(false);
                setReviewedByItem(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
                dispatch(fetchRatings(activeItemName));
            }
        } catch (e) {}
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Ionicons name="menu-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Order History</Text>
                    </View>
                </View>
            </View>

            {loading && orders.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={80} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>No orders yet</Text>
                    <TouchableOpacity
                        style={[styles.shopBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('MainTabs')}
                    >
                        <Text style={styles.shopBtnText}>Start Ordering</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                />
            )}
            <Modal
                transparent
                animationType="fade"
                visible={reviewModalVisible}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Review: {activeItemName}</Text>
                        <View style={styles.ratingRow}>
                            {[1,2,3,4,5].map(i => (
                                <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starBtn}>
                                    <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={24} color="#F6AD55" />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder="Write your thoughts..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={comment}
                            onChangeText={setComment}
                        />
                        <View style={styles.modalActions}>
                            {existingReviewId && (
                                <TouchableOpacity 
                                    style={[styles.deleteBtn, { backgroundColor: colors.error }]} 
                                    onPress={deleteReview}
                                >
                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity 
                                style={[styles.cancelBtn, { borderColor: colors.border }]} 
                                onPress={() => setReviewModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
                                onPress={saveReview}
                            >
                                <Text style={styles.saveBtnText}>{existingReviewId ? 'Update' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 80,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
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
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    orderCard: {
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    orderDate: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    itemsList: {
        marginBottom: 15,
    },
    foodRow: {
        marginBottom: 10,
    },
    foodMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    foodName: {
        fontSize: 14,
    },
    foodPrice: {
        fontSize: 14,
    },
    reviewItemBtn: {
        marginTop: 6,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    reviewItemText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
    },
    reviewPreview: {
        marginTop: 6,
        fontSize: 12,
        fontStyle: 'italic',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    addressText: {
        fontSize: 12,
        marginLeft: 4,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
    },
    shopBtn: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    shopBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    actionText: {
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 480,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    ratingRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    starBtn: {
        marginRight: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        minHeight: 90,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    saveBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelBtn: {
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelBtnText: {
        fontWeight: 'bold',
    },
    deleteBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    deleteBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default OrderHistoryScreen;
