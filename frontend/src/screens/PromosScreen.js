import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import API_URL from '../config/api';

const PromosScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [promos, setPromos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadPromos = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/promos`);
      const data = await res.json().catch(() => []);
      if (res.ok) {
        setPromos(Array.isArray(data) ? data : []);
      } else {
        setPromos([]);
      }
    } catch (error) {
      console.error('Error loading promos:', error);
      setPromos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPromos(true);
    }, [loadPromos])
  );

  React.useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadPromos(true);
  }, [loadPromos]);

  const renderItem = ({ item }) => {
    const pct = Number(item.discountPercent) || 0;
    const hasImage = Array.isArray(item.imageUrls) && item.imageUrls[0];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('PromoDetails', item)}
      >
        <View style={styles.cardBody}>
          <View style={styles.copyWrap}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
            <View style={styles.metaRow}>
              {pct > 0 ? (
                <View style={[styles.discountBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.discountText, { color: colors.primary }]}>{pct}% OFF</Text>
                </View>
              ) : null}
              {item.expiresAt ? (
                <Text style={[styles.expiry, { color: colors.textSecondary }]}>
                  Ends {new Date(item.expiresAt).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              ) : (
                <Text style={[styles.expiry, { color: colors.textSecondary }]}>Ongoing promo</Text>
              )}
            </View>
          </View>
          {hasImage ? <Image source={{ uri: item.imageUrls[0] }} style={styles.image} /> : null}
        </View>
      </TouchableOpacity>
    );
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Promos & Discounts</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Latest offers available in the app
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={promos}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={promos.length === 0 ? styles.emptyList : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="pricetags-outline" size={64} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No promos right now</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                New discounts will show here even if you miss the push notification.
              </Text>
            </View>
          }
        />
      )}
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
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expiry: {
    fontSize: 12,
    fontWeight: '500',
  },
  image: {
    width: 78,
    height: 78,
    borderRadius: 12,
    marginLeft: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});

export default PromosScreen;
