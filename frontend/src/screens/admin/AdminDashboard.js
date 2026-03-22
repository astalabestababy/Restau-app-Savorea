import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { getAuthToken } from '../../utils/authToken';
import { useTheme } from '../../context/ThemeContext';
import API_URL from '../../config/api';
import { navigateRoot } from '../../navigation/rootNavigation';

const { width } = Dimensions.get('window');

const AdminDashboard = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [stats, setStats] = useState({ 
        monthlyOrders: 0, 
        monthlyRevenue: 0, 
        totalUsers: 0, 
        totalMenuItems: 0, 
        pendingOrders: 0, 
        totalOrders: 0 
    });
    const [refreshing, setRefreshing] = useState(false);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [period, setPeriod] = useState('daily');
    const [analytics, setAnalytics] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    const fetchStats = async () => {
        try {
            const token = await getAuthToken();
            console.log('Fetching Admin Stats from:', `${API_URL}/admin/stats`, 'Token:', token ? 'Present' : 'Missing');
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Admin Stats Data:', data);
                // Ensure values are numbers
                setStats({
                    monthlyOrders: data.monthlyOrders || 0,
                    monthlyRevenue: data.monthlyRevenue || 0,
                    totalUsers: data.totalUsers || 0,
                    totalMenuItems: data.totalMenuItems || 0,
                    pendingOrders: data.pendingOrders || 0,
                    totalOrders: data.totalOrders || 0
                });
            } else {
                console.error('Failed to fetch stats:', data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/analytics?period=${period}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) setAnalytics(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalytics([]);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setOrdersLoading(true);
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/orders`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                setOrders(Array.isArray(data) ? data : []);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        await fetchAnalytics();
        await fetchOrders();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
            fetchAnalytics();
            fetchOrders();
        }, [])
    );

    const aovSeries = analytics.map((item) => {
        const ordersCount = Number(item.orders) || 0;
        const revenue = Number(item.revenue) || 0;
        return ordersCount > 0 ? Number((revenue / ordersCount).toFixed(2)) : 0;
    });

    const topItems = (() => {
        const counts = {};
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                const key = item.name || 'Item';
                const qty = Number(item.quantity) || 1;
                counts[key] = (counts[key] || 0) + qty;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, qty]) => ({ name, qty }));
    })();

    const statusCounts = (() => {
        const base = { Pending: 0, Processing: 0, 'Out for Delivery': 0, Delivered: 0, Cancelled: 0 };
        orders.forEach(order => {
            const status = order.status || 'Pending';
            if (base[status] !== undefined) base[status] += 1;
            else base[status] = (base[status] || 0) + 1;
        });
        return base;
    })();

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
        >
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Ionicons name="menu-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Dashboard</Text>
                    <View style={{ width: 44 }} />
                </View>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your restaurant system</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{stats.monthlyOrders}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Orders</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{'\u20B1'}{stats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Revenue</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigateRoot('AdminUsers')}
                >
                    <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalUsers}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigateRoot('AdminMenu')}
                >
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalMenuItems}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Menu Items</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigateRoot('AdminOrdersList')}
                >
                    <Text style={[styles.statValue, { color: colors.primary }]}>{stats.pendingOrders}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigateRoot('AdminOrdersList')}
                >
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalOrders}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.analyticsHeader}>
                <Text style={[styles.analyticsTitle, { color: colors.text }]}>Dashboard Analytics</Text>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterBtn, { borderColor: colors.border }, period === 'daily' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setPeriod('daily')}
                    >
                        <Text style={[styles.filterText, period === 'daily' ? { color: '#fff' } : { color: colors.text }]}>Daily</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, { borderColor: colors.border }, period === 'monthly' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setPeriod('monthly')}
                    >
                        <Text style={[styles.filterText, period === 'monthly' ? { color: '#fff' } : { color: colors.text }]}>Monthly</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {analyticsLoading ? (
                <View style={styles.analyticsLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            ) : (
                <>
                    <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Revenue Trend</Text>
                        <LineChart
                            data={{
                                labels: analytics.map(item => item.label),
                                datasets: [{ data: analytics.map(item => item.revenue) }]
                            }}
                            width={width - 40}
                            height={220}
                            yAxisLabel="\u20B1"
                            chartConfig={{
                                backgroundGradientFrom: colors.card,
                                backgroundGradientTo: colors.card,
                                color: () => colors.primary,
                                labelColor: () => colors.textSecondary,
                                strokeWidth: 2,
                                barPercentage: 0.5,
                                useShadowColorFromDataset: false,
                                decimalPlaces: 0,
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Orders Count</Text>
                        <BarChart
                            data={{
                                labels: analytics.map(item => item.label),
                                datasets: [{ data: analytics.map(item => item.orders) }]
                            }}
                            width={width - 40}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundGradientFrom: colors.card,
                                backgroundGradientTo: colors.card,
                                color: (opacity = 1) => `rgba(45, 55, 72, ${opacity})`,
                                labelColor: () => colors.textSecondary,
                                strokeWidth: 2,
                                barPercentage: 0.5,
                                useShadowColorFromDataset: false,
                                decimalPlaces: 0,
                            }}
                            style={styles.chart}
                            showValuesOnTopOfBars
                        />
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Average Order Value</Text>
                        <LineChart
                            data={{
                                labels: analytics.map(item => item.label),
                                datasets: [{ data: aovSeries }]
                            }}
                            width={width - 40}
                            height={220}
                            yAxisLabel="\u20B1"
                            chartConfig={{
                                backgroundGradientFrom: colors.card,
                                backgroundGradientTo: colors.card,
                                color: () => colors.primary,
                                labelColor: () => colors.textSecondary,
                                strokeWidth: 2,
                                barPercentage: 0.5,
                                useShadowColorFromDataset: false,
                                decimalPlaces: 2,
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                </>
            )}

            <View style={styles.analyticsHeader}>
                <Text style={[styles.analyticsTitle, { color: colors.text }]}>Operational Insights</Text>
            </View>

            {ordersLoading ? (
                <View style={styles.analyticsLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            ) : (
                <>
                    <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Top Selling Items</Text>
                        {topItems.length > 0 ? (
                            <BarChart
                                data={{
                                    labels: topItems.map(i => i.name.length > 8 ? `${i.name.slice(0, 8)}…` : i.name),
                                    datasets: [{ data: topItems.map(i => i.qty) }]
                                }}
                                width={width - 40}
                                height={240}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={{
                                    backgroundGradientFrom: colors.card,
                                    backgroundGradientTo: colors.card,
                                    color: (opacity = 1) => `rgba(45, 55, 72, ${opacity})`,
                                    labelColor: () => colors.textSecondary,
                                    strokeWidth: 2,
                                    barPercentage: 0.6,
                                    useShadowColorFromDataset: false,
                                    decimalPlaces: 0,
                                }}
                                style={styles.chart}
                                showValuesOnTopOfBars
                            />
                        ) : (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No order data yet</Text>
                        )}
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Order Status Breakdown</Text>
                        <PieChart
                            data={[
                                { name: 'Pending', value: statusCounts.Pending, color: '#F6AD55', legendFontColor: colors.textSecondary, legendFontSize: 12 },
                                { name: 'Processing', value: statusCounts.Processing, color: '#38B2AC', legendFontColor: colors.textSecondary, legendFontSize: 12 },
                                { name: 'Out for Delivery', value: statusCounts['Out for Delivery'], color: '#4299E1', legendFontColor: colors.textSecondary, legendFontSize: 12 },
                                { name: 'Delivered', value: statusCounts.Delivered, color: '#48BB78', legendFontColor: colors.textSecondary, legendFontSize: 12 },
                                { name: 'Cancelled', value: statusCounts.Cancelled, color: '#F56565', legendFontColor: colors.textSecondary, legendFontSize: 12 },
                            ].filter(d => d.value > 0)}
                            width={width - 40}
                            height={240}
                            chartConfig={{
                                backgroundGradientFrom: colors.card,
                                backgroundGradientTo: colors.card,
                                color: () => colors.primary,
                                labelColor: () => colors.textSecondary,
                            }}
                            accessor="value"
                            backgroundColor="transparent"
                            paddingLeft="10"
                            absolute
                        />
                    </View>
                </>
            )}

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        marginBottom: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
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
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    analyticsHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    analyticsTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    filterText: {
        fontWeight: '600',
        fontSize: 12,
    },
    analyticsLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    chartCard: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginLeft: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyText: {
        paddingVertical: 12,
        fontSize: 12,
        fontWeight: '600',
    },
    actionsGrid: {
        paddingHorizontal: 20,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 15,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    actionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    }
});

export default AdminDashboard;
