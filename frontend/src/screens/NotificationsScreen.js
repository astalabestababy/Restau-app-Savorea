import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getAuthToken } from '../utils/authToken';
import API_URL from '../config/api';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadNotifications = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json().catch(() => []);
      setItems(res.ok && Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications(true);
    }, [loadNotifications])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadNotifications(true);
  }, [loadNotifications]);

  const markAllRead = React.useCallback(async () => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
      });
      setItems((prev) => prev.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  }, []);

  const openNotification = async (item) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/notifications/${item._id}/read`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    setItems((prev) => prev.map(entry => entry._id === item._id ? { ...entry, readAt: entry.readAt || new Date().toISOString() } : entry));
    navigation.navigate('NotificationDetails', { notification: item });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: item.readAt ? colors.border : colors.primary,
        }
      ]}
      onPress={() => openNotification(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        {!item.readAt ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      </View>
      <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>
      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
        {new Date(item.createdAt).toLocaleString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );

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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Order updates and promo alerts
            </Text>
          </View>
          {items.some(item => !item.readAt) ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={[styles.readAll, { color: colors.primary }]}>Mark all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-outline" size={64} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Admin order updates and promo announcements will show here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  readAll: { fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyList: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, paddingRight: 8 },
  cardBody: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  cardMeta: { marginTop: 10, fontSize: 12, fontWeight: '500' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 14 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});

export default NotificationsScreen;
