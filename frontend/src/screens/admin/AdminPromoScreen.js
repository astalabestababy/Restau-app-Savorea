import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, FlatList, Modal, ScrollView, Image, Dimensions, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getAuthToken } from '../../utils/authToken';
import API_URL from '../../config/api';

const WINDOW_H = Dimensions.get('window').height;

const AdminPromoScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', discountPercent: '', expiresAt: '', imageUrls: '' });

  const [quickCode, setQuickCode] = useState('');
  const [quickDiscount, setQuickDiscount] = useState(20);
  const [sending, setSending] = useState(false);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/admin/promos`, {
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setPromos(Array.isArray(data) ? data : []);
      } else {
        const errText = await res.text();
        let msg = 'Could not load promotions';
        try {
          msg = JSON.parse(errText).message || msg;
        } catch (e2) {}
        Alert.alert('Promotions', res.status === 401 || res.status === 403 ? 'Admin session expired. Log in again.' : msg);
        setPromos([]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPromos();
    }, [fetchPromos])
  );

  const sendQuickPromo = async () => {
    if (!quickCode.trim() || quickDiscount <= 0) {
      Alert.alert('Missing', 'Enter a promo code and pick a discount %');
      return;
    }
    setSending(true);
    try {
      const token = await getAuthToken();
      const code = quickCode.trim().toUpperCase();
      const body = {
        title: code,
        description: `Use ${quickCode.trim()} at checkout for ${quickDiscount}% OFF your order!`,
        discountPercent: quickDiscount
      };
      const res = await fetch(`${API_URL}/admin/promos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        const n = Number(data.notificationsSent) || 0;
        Alert.alert(
          'Success',
          n > 0
            ? `Promo ${code} saved. Push queued for ${n} device(s).`
            : `Promo ${code} saved. No devices had push tokens — customers need the app on a phone with notifications enabled.`
        );
        setQuickCode('');
        setQuickDiscount(20);
        fetchPromos();
      } else {
        Alert.alert('Error', data.message || 'Failed to send promo');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Check backend.');
    } finally {
      setSending(false);
    }
  };

  const createPromo = async () => {
    const { title, description, discountPercent, expiresAt, imageUrls } = form;
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing', 'Title and description are required.');
      return;
    }
    setCreating(true);
    try {
      const token = await getAuthToken();
      const imageUrlsArr = imageUrls.split(',').map(url => url.trim()).filter(Boolean);
      const pct = discountPercent.trim() === '' ? NaN : parseFloat(discountPercent);
      const body = {
        title: title.trim(),
        description: description.trim(),
        imageUrls: imageUrlsArr,
        ...(expiresAt && { expiresAt })
      };
      if (!Number.isNaN(pct) && pct > 0) {
        body.discountPercent = pct;
      }
      const res = await fetch(`${API_URL}/admin/promos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        const n = Number(data.notificationsSent) || 0;
        Alert.alert(
          'Success',
          n > 0
            ? `Saved. Push notifications queued for ${n} device(s).`
            : 'Saved. No customer devices have a push token yet (use a real device and allow notifications).'
        );
        setForm({ title: '', description: '', discountPercent: '', expiresAt: '', imageUrls: '' });
        setShowModal(false);
        fetchPromos();
      } else {
        Alert.alert('Error', data.message || 'Failed to create promo');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    } finally {
      setCreating(false);
    }
  };

  const quickBlock = (
    <View style={[styles.quickPromoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.quickSectionTitle, { color: colors.text }]}>Quick notify all users</Text>
      <Text style={[styles.quickSectionSub, { color: colors.textSecondary }]}>
        Saves a discount promo and sends a push to every customer device that has allowed notifications.
      </Text>
      <TextInput
        placeholder="Promo code (e.g. SAVE20)"
        placeholderTextColor={colors.textSecondary}
        value={quickCode}
        onChangeText={setQuickCode}
        autoCapitalize="characters"
        style={[styles.quickInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
      />
      <Text style={[styles.quickSectionLabel, { color: colors.textSecondary }]}>Discount</Text>
      <View style={styles.discountRow}>
        {[10, 15, 20, 25].map((pct) => (
          <TouchableOpacity
            key={pct}
            style={[
              styles.discountChip,
              { borderColor: colors.border },
              quickDiscount === pct && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setQuickDiscount(pct)}
          >
            <Text style={[styles.discountChipText, { color: quickDiscount === pct ? '#fff' : colors.text }]}>{pct}%</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: sending ? 0.7 : 1 }]}
        onPress={sendQuickPromo}
        disabled={sending}
      >
        <Text style={styles.sendBtnText}>{sending ? 'Sending…' : 'Send & notify all'}</Text>
      </TouchableOpacity>
    </View>
  );

  const listHeader = (
    <View>
      {quickBlock}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>History</Text>
    </View>
  );

  const pctLabel = (() => {
    const p = parseFloat(form.discountPercent);
    if (form.discountPercent.trim() !== '' && !Number.isNaN(p) && p > 0) return `Create & notify (${p}% off)`;
    return 'Create & notify (bundle / special)';
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
          Promos & discounts
        </Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[styles.headerAddBtn, { backgroundColor: colors.primary }]}
          accessibilityLabel="Create promotion or discount"
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={promos}
        keyExtractor={(item) => String(item._id || item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPromos} tintColor={colors.primary} />}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.promoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('PromoDetails', item)}
          >
            <View>
              <Text style={[styles.promoTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.promoDesc, { color: colors.textSecondary }]}>{item.description}</Text>
              <View style={styles.promoMeta}>
                {item.discountPercent > 0 && (
                  <Text style={[styles.promoDiscount, { color: colors.primary }]}>{item.discountPercent}% OFF</Text>
                )}
                <Text style={[styles.promoDate, { color: colors.textSecondary }]}> 
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {item.imageUrls?.[0] ? (
              <Image source={{ uri: item.imageUrls[0] }} style={styles.promoImage} />
            ) : null}
          </TouchableOpacity>
        )}
        style={styles.list}
        contentContainerStyle={{ padding: 20, paddingTop: 0, flexGrow: 1 }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.listLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading promos…</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 12 }}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No promos yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Use quick send above or tap + for a custom bundle, images, or expiry.
              </Text>
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: colors.primary }]}
                onPress={() => setShowModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.emptyCtaText}>Custom promo</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New promo or discount</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: WINDOW_H * 0.52 }}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>Title / promo code</Text>
              <TextInput
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. SUMMER20 or Barkada Bundle"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
                style={[styles.textarea, { borderColor: colors.border, color: colors.text }]}
                placeholder="What customers get (discount rules, bundle details, etc.)"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Discount % (optional)</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Leave empty for a bundle or special with no percentage off.
              </Text>
              <TextInput
                value={form.discountPercent}
                onChangeText={(text) => setForm({ ...form, discountPercent: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 20 (optional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Expires (optional)</Text>
              <TextInput
                value={form.expiresAt}
                onChangeText={(text) => setForm({ ...form, expiresAt: text })}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="2024-12-31"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Image URLs (comma separated, optional)</Text>
              <TextInput
                value={form.imageUrls}
                onChangeText={(text) => setForm({ ...form, imageUrls: text })}
                style={[styles.textarea, { borderColor: colors.border, color: colors.text }]}
                placeholder="https://example.com/img1.jpg"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
              onPress={createPromo} 
              disabled={creating}
            >
              {creating ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.modalBtnText}>{pctLabel}</Text>
              )}
            </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, justifyContent: 'space-between' },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  headerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickPromoSection: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  quickSectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  quickSectionSub: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  quickSectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  quickInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
    minHeight: 40,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  discountChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  discountChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  listLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  list: { flex: 1 },
  promoItem: { 
    flexDirection: 'row', 
    padding: 16, 
    marginBottom: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    alignItems: 'center',
    gap: 12
  },
  promoTitle: { fontSize: 18, fontWeight: 'bold' },
  promoDesc: { fontSize: 14, marginTop: 4 },
  promoMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  promoDiscount: { fontSize: 16, fontWeight: 'bold' },
  promoDate: { fontSize: 12 },
  promoImage: { width: 60, height: 60, borderRadius: 8 },
  emptyText: { fontSize: 18, fontWeight: '500', marginTop: 12 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    minHeight: Math.min(WINDOW_H * 0.45, 380),
    maxHeight: WINDOW_H * 0.92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, paddingRight: 8 },
  modalScrollContent: { paddingHorizontal: 20, paddingBottom: 12 },
  label: { marginTop: 14, marginBottom: 6, fontSize: 14, fontWeight: '500' },
  hint: { fontSize: 12, marginBottom: 6, marginTop: -4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 8 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 8 },
  modalBtn: { marginTop: 12, marginHorizontal: 20, marginBottom: 20, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
});

export default AdminPromoScreen;
