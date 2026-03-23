import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const NotificationDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();

  const notification = route.params?.notification || null;
  const fallbackData = route.params?.notificationData || {};
  const title = notification?.title || fallbackData.title || 'Notification';
  const body = notification?.body || fallbackData.body || 'No details available.';
  const data = notification?.data || fallbackData;

  const openRelated = () => {
    if (data?.promo) {
      navigation.navigate('PromoDetails', data.promo);
      return;
    }
    if (data?.promoPayload) {
      try {
        navigation.navigate('PromoDetails', JSON.parse(data.promoPayload));
        return;
      } catch (error) {}
    }
    if (data?.orderId) {
      navigation.navigate('OrderHistory', { orderId: data.orderId });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>

          {data?.status ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Latest status</Text>
              <Text style={[styles.value, { color: colors.primary }]}>{data.status}</Text>
            </View>
          ) : null}

          {data?.orderCode ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Order</Text>
              <Text style={[styles.value, { color: colors.text }]}>{data.orderCode}</Text>
            </View>
          ) : null}

          {(data?.orderId || data?.promo || data?.promoPayload) ? (
            <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={openRelated}>
              <Text style={styles.ctaText}>{data?.orderId ? 'Open Order' : 'Open Promo'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, marginTop: 12 },
  row: { marginTop: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  cta: { marginTop: 24, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default NotificationDetailsScreen;
