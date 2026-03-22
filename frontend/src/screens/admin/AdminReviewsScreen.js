import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getAuthToken } from '../../utils/authToken';
import API_URL from '../../config/api';

const AdminReviewsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        try {
            const token = await getAuthToken();
            const res = await fetch(`${API_URL}/admin/reviews`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            if (res.ok) {
                setReviews(data);
            }
        } catch (e) {} finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const deleteReview = async (id) => {
        try {
            const token = await getAuthToken();
            const res = await fetch(`${API_URL}/admin/reviews/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
            if (res.ok) {
                setReviews(reviews.filter(r => r._id !== id));
                Alert.alert('Deleted', 'Review removed');
            }
        } catch (e) {}
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.orderRef, { color: colors.text }]}>Order #{item.order?._id?.slice(-6).toUpperCase()}</Text>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#F6AD55" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>
            {item.itemName ? (
                <Text style={[styles.itemName, { color: colors.text }]}>{item.itemName}</Text>
            ) : null}
            <Text style={[styles.userText, { color: colors.textSecondary }]}>{item.user?.name} • {item.user?.email}</Text>
            {item.comment ? <Text style={[styles.comment, { color: colors.text }]}>{item.comment}</Text> : null}
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.deleteBtn]} onPress={() => deleteReview(item._id)}>
                    <Ionicons name="trash" size={16} color="#fff" />
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Manage Reviews</Text>
            </View>
            <FlatList
                data={reviews}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    backBtn: { marginRight: 12 },
    title: { fontSize: 24, fontWeight: 'bold' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderRef: { fontSize: 16, fontWeight: 'bold' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { marginLeft: 4, fontWeight: '700', color: '#C05621' },
    itemName: { marginTop: 6, fontSize: 14, fontWeight: '600' },
    userText: { marginTop: 4, fontSize: 12 },
    comment: { marginTop: 8, fontSize: 14 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    deleteBtn: { backgroundColor: '#E53E3E', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
    deleteText: { color: '#fff', marginLeft: 6, fontWeight: 'bold' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default AdminReviewsScreen;
