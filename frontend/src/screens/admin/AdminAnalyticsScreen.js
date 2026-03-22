import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getAuthToken } from '../../utils/authToken';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import API_URL from '../../config/api';

const { width } = Dimensions.get('window');

const AdminAnalyticsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('daily'); // 'daily' or 'monthly'
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/admin/analytics?period=${period}`, {
                headers: { 'x-auth-token': token }
            });
            const result = await response.json();
            if (response.ok) {
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => colors.primary, // Brand color
        labelColor: (opacity = 1) => colors.textSecondary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    const labels = data.map(item => item.label);
    const revenueData = data.map(item => item.revenue);
    const ordersData = data.map(item => item.orders);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {period === 'daily' ? 'Last 7 Days Performance' : 'Last 6 Months Performance'}
                    </Text>
                </View>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={[styles.filterButton, period === 'daily' && { backgroundColor: colors.primary }]}
                    onPress={() => setPeriod('daily')}
                >
                    <Text style={[styles.filterText, period === 'daily' ? { color: '#fff' } : { color: colors.text }]}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterButton, period === 'monthly' && { backgroundColor: colors.primary }]}
                    onPress={() => setPeriod('monthly')}
                >
                    <Text style={[styles.filterText, period === 'monthly' ? { color: '#fff' } : { color: colors.text }]}>Monthly</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>Revenue Trend</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: revenueData }]
                    }}
                    width={width - 40}
                    height={220}
                    yAxisLabel="\u20B1"
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                />
            </View>

            <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>Orders Count</Text>
                <BarChart
                    data={{
                        labels: labels,
                        datasets: [{ data: ordersData }]
                    }}
                    width={width - 40}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(45, 55, 72, ${opacity})`, // Dark gray for bars
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#e2e8f0', // default light gray
    },
    filterText: {
        fontWeight: '600',
    },
    chartContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginLeft: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
});

export default AdminAnalyticsScreen;
