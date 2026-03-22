import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const PromoDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
const promo = route.params || {};
const { title = 'Promotion', description = 'Check out our latest promotions!', discountPercent = 0, imageUrls = [], expiresAt } = promo;
  const pct = Number(discountPercent) || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.content}>
<Text style={[styles.bodyText, { color: colors.text }]}>{description}</Text>
{pct > 0 ? (
          <Text style={[styles.discountText, { color: colors.primary }]}>
            Save {pct}% off your order!
            {expiresAt ? ` • Expires ${new Date(expiresAt).toLocaleDateString()}` : ''}
          </Text>
        ) : (
          <Text style={[styles.bundleHint, { color: colors.textSecondary }]}>
            {expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString()}` : 'Limited-time offer'}
          </Text>
        )}
{imageUrls[0] && (
  <Image source={{ uri: imageUrls[0] }} style={styles.promoImage} />
)}
        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.ctaText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: { padding: 20, flex: 1 },
  bodyText: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
  discountText: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  bundleHint: { fontSize: 15, marginBottom: 16 },
  promoImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  ctaBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default PromoDetailsScreen;
