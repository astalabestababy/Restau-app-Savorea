import React, { useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import API_URL from '../config/api';
import { getAuthToken } from '../utils/authToken';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../redux/slices/orderSlice';

const ProfileScreen = () => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { items: orders } = useSelector(state => state.orders);

    const userId = user?.id ?? user?._id;

    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState('');

    const getAvatarUri = () => {
        if (!user?.avatar) return null;
        if (user.avatar.startsWith('http')) return user.avatar;
        return `${API_URL.replace('/api', '')}${user.avatar}`;
    };

    const loadReviews = useCallback(async () => {
        if (!userId) return;
        setReviewsLoading(true);
        setReviewsError('');
        try {
            const token = await getAuthToken();
            if (!token) {
                setReviews([]);
                setReviewsError('Missing auth token');
                return;
            }
            const res = await fetch(`${API_URL}/reviews/my`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setReviews(Array.isArray(data) ? data : []);
            } else {
                setReviews([]);
                setReviewsError(`(${res.status}) ${data?.message || 'Unable to load reviews'}`);
            }
        } catch (e) {
            setReviews([]);
            setReviewsError(e?.message ? `Unable to load reviews: ${e.message}` : 'Unable to load reviews');
        } finally {
            setReviewsLoading(false);
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            loadReviews();
            if (userId) dispatch(fetchOrders());
        }, [userId, dispatch, loadReviews])
    );

    const sortedOrders = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders]);

    const latestOrder = sortedOrders[0] || null;
    const statusSteps = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];
    const statusLabel = latestOrder?.status || '';
    const activeIndex = statusSteps.indexOf(statusLabel);
    const isCancelled = latestOrder?.status === 'Cancelled';

    const mostOrdered = useMemo(() => {
        const counts = {};
        sortedOrders.forEach(order => {
            (order.items || []).forEach(item => {
                counts[item.name] = (counts[item.name] || 0) + item.quantity;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, qty]) => ({ name, qty }));
    }, [sortedOrders]);

    return (
        <ScrollView style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Ionicons name="menu-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.getParent()?.navigate('EditProfile')}>
                        <Text style={[styles.editBtn, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Latest Order Status</Text>
                {latestOrder ? (
                    <>
                        <View style={styles.trackerRow}>
                            {statusSteps.map((step, idx) => {
                                const isActive = !isCancelled && activeIndex >= idx;
                                const isComplete = !isCancelled && activeIndex > idx;
                                return (
                                    <View key={step} style={styles.trackerStep}>
                                        <View style={styles.trackerDotWrap}>
                                            <View style={[
                                                styles.trackerDot,
                                                { backgroundColor: isActive ? colors.primary : colors.border }
                                            ]} />
                                        </View>
                                        {idx < statusSteps.length - 1 && (
                                            <View style={[
                                                styles.trackerLine,
                                                { backgroundColor: isComplete ? colors.primary : colors.border }
                                            ]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.trackerLabelsRow}>
                            {statusSteps.map(step => (
                                <View key={step} style={styles.trackerLabelWrap}>
                                    <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>{step}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.trackerMeta, { color: colors.textSecondary }]}>
                            Order #{latestOrder._id.slice(-6).toUpperCase()} • {latestOrder.status}
                        </Text>
                    </>
                ) : (
                    <Text style={[styles.trackerMeta, { color: colors.textSecondary }]}>No orders yet</Text>
                )}
            </View>

            <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}> 
                    {getAvatarUri() ? (
                        <Image source={{ uri: getAvatarUri() }} style={styles.avatarImage} />
                    ) : (
                        <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.name?.charAt(0).toUpperCase() || 'G'}</Text>
                    )}
                </View>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Guest'}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Most Ordered</Text>
                {mostOrdered.length > 0 ? (
                    mostOrdered.map((item) => (
                        <View key={item.name} style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{item.qty}x</Text>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.cardHint, { color: colors.textSecondary }]}>No orders yet</Text>
                )}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <Text style={[styles.cardTitle, { color: colors.text }]}>Your Reviews</Text>
                {reviewsLoading ? (
                    <Text style={[styles.cardHint, { color: colors.textSecondary }]}>Loading reviews...</Text>
                ) : reviewsError ? (
                    <Text style={[styles.cardHint, { color: colors.error || colors.textSecondary }]}>{reviewsError}</Text>
                ) : reviews.length > 0 ? (
                    reviews.slice(0, 3).map((rev) => (
                        <View key={rev._id} style={styles.reviewRow}>
                            <View style={styles.reviewHeader}>
                                <Text style={[styles.reviewItem, { color: colors.text }]}>{rev.itemName || 'Reviewed item'}</Text>
                                <View style={styles.reviewRating}>
                                    <Ionicons name="star" size={14} color="#F6AD55" />
                                    <Text style={[styles.reviewScore, { color: colors.textSecondary }]}>{rev.rating}</Text>
                                </View>
                            </View>
                            {rev.comment ? (
                                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{rev.comment}</Text>
                            ) : null}
                        </View>
                    ))
                ) : (
                    <Text style={[styles.cardHint, { color: colors.textSecondary }]}>No reviews yet</Text>
                )}
            </View>

            <View style={{ height: 80 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
        marginTop: 60,
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
    editBtn: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardHint: {
        fontSize: 12,
        fontWeight: '500',
    },
    trackerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    trackerStep: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    trackerDotWrap: {
        width: 16,
        alignItems: 'center',
    },
    trackerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    trackerLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 6,
        borderRadius: 2,
    },
    trackerLabelsRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    trackerLabelWrap: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    trackerLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    trackerMeta: {
        marginTop: 8,
        fontSize: 12,
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
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        marginTop: 4,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    reviewRow: {
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    reviewItem: {
        fontSize: 14,
        fontWeight: '600',
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewScore: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    reviewComment: {
        fontSize: 12,
        lineHeight: 16,
    },
});

export default ProfileScreen;
