import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    Platform,
    Alert,
    FlatList,
    Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRatings } from '../redux/slices/ratingSlice';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 450;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const ProductDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const { item } = route.params;
    const { addToCart, cart } = useCart();
    const { user } = useAuth();
    const { colors, theme } = useTheme();

    const { ratings: ratingsMap } = useSelector(state => state.ratings);
    const itemRatingData = ratingsMap[item.name] || { averageRating: 0, reviewCount: 0, reviews: [] };

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [qty, setQty] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    useEffect(() => {
        dispatch(fetchRatings(item.name));
    }, [dispatch, item.name]);

    // Mock data for UI enhancement
    const calories = item.calories || '250kcal';
    const time = item.time || '15min';
    const averageRating = itemRatingData.averageRating || 4.8;
    const reviewCount = itemRatingData.reviewCount || 0;
    const scrollY = useRef(new Animated.Value(0)).current;
    const ingredients = item.ingredients || [
        { id: 1, name: 'Premium Meat', icon: 'food-steak' },
        { id: 2, name: 'Local Veggies', icon: 'carrot' },
        { id: 3, name: 'Secret Sauce', icon: 'pot-steam' },
        { id: 4, name: 'Fresh Herbs', icon: 'leaf' },
    ];
    const allergens = item.allergens || ['Dairy', 'Gluten', 'Nuts', 'Egg'];
    const pairings = item.pairings || [
        { id: 1, name: 'Iced Tea', price: 45, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80' },
        { id: 2, name: 'Garlic Rice', price: 30, image: 'https://images.unsplash.com/photo-1601356616077-695728ecf769?auto=format&fit=crop&w=500&q=80' },
        { id: 3, name: 'Fresh Juice', price: 65, image: 'https://images.unsplash.com/photo-1621506289937-4c1d48721332?auto=format&fit=crop&w=500&q=80' },
    ];

    const headerTranslate = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [0, -HEADER_SCROLL_DISTANCE],
        extrapolate: 'clamp',
    });

    const imageOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
    });

    const imageTranslate = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 100],
        extrapolate: 'clamp',
    });

    const placeholderImage = require('../../assets/icon.png');
    const itemImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.image ? [item.image] : [null]);

    const handleAddToCart = () => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        setQty(1);
        setShowQtyModal(true);
    };

    const confirmAddToCart = () => {
        for (let i = 0; i < qty; i += 1) {
            addToCart(item);
        }
        setShowQtyModal(false);
        Alert.alert('Added to Cart', `${qty}x ${item.name} added to your cart.`);
    };

    const itemId = item._id || item.id;
    const inCartQty = cart?.find(c => (c._id || c.id) === itemId)?.quantity || 0;

    const renderIngredient = ({ item: ingredient }) => (
        <View style={[styles.ingredientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ingredientIconContainer}>
                <MaterialCommunityIcons name={ingredient.icon} size={28} color={colors.primary} />
            </View>
            <Text style={[styles.ingredientName, { color: colors.textSecondary }]} numberOfLines={2}>
                {ingredient.name}
            </Text>
        </View>
    );

    const renderPairing = ({ item: pairing }) => (
        <TouchableOpacity style={[styles.pairingCard, { backgroundColor: colors.surface }]}>
            <Image source={{ uri: pairing.image }} style={styles.pairingImage} />
            <TouchableOpacity style={styles.pairingWish}>
                <Ionicons name="heart-outline" size={16} color="#fff" />
            </TouchableOpacity>
            <View style={styles.pairingInfo}>
                <Text style={[styles.pairingName, { color: colors.text }]} numberOfLines={1}>{pairing.name}</Text>
                <Text style={[styles.pairingPrice, { color: colors.primary }]}>{'\u20B1'}{pairing.price}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.ScrollView
                contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT - 30 }}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <View style={styles.mainInfo}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{averageRating}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <MaterialCommunityIcons name="fire" size={18} color={colors.primary} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{calories}</Text>
                            </View>
                            <View style={[styles.metaItem, { marginLeft: 16 }]}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{time}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={isDescriptionExpanded ? 0 : 3}>
                            {item.description}
                        </Text>
                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                            <Text style={[styles.readMore, { color: colors.text }]}>
                                {isDescriptionExpanded ? 'Read less' : 'Read more'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Ingredients</Text>
                        <FlatList
                            data={ingredients}
                            renderItem={renderIngredient}
                            keyExtractor={i => i.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Allergens*</Text>
                        <View style={styles.tagContainer}>
                            {allergens.map(tag => (
                                <View key={tag} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews ({reviewCount})</Text>
                        </View>
                        {itemRatingData.reviews?.length > 0 ? (
                            itemRatingData.reviews.slice(0, 3).map((rev, idx) => (
                                <View key={idx} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={[styles.reviewerName, { color: colors.text }]}>{rev.userName || 'User'}</Text>
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={14} color="#FFD700" />
                                            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{rev.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{rev.comment}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.noReviews, { color: colors.textSecondary }]}>No reviews yet. Be the first to review!</Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pairing Suggestion</Text>
                        <FlatList
                            data={pairings}
                            renderItem={renderPairing}
                            keyExtractor={p => p.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </Animated.ScrollView>

            {/* Header Image */}
            <Animated.View
                style={[
                    styles.header,
                    { transform: [{ translateY: headerTranslate }] },
                ]}
            >
                <Animated.View
                    style={[
                        styles.headerImageWrapper,
                        {
                            opacity: imageOpacity,
                            transform: [{ translateY: imageTranslate }],
                        },
                    ]}
                >
                    <FlatList
                        data={itemImages}
                        keyExtractor={(img, idx) => `${itemId || 'item'}-img-${idx}`}
                        horizontal
                        pagingEnabled
                        scrollEnabled={itemImages.length > 1}
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(nextIndex);
                        }}
                        renderItem={({ item: img }) => (
                            <Image
                                source={img ? { uri: img } : placeholderImage}
                                style={styles.headerImage}
                            />
                        )}
                    />
                    {itemImages.length > 1 && (
                        <View style={styles.dotsRow}>
                            {itemImages.map((_, idx) => (
                                <View
                                    key={`dot-${idx}`}
                                    style={[
                                        styles.dot,
                                        idx === activeImageIndex && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </Animated.View>
                <View style={styles.imageOverlay} pointerEvents="none" />
            </Animated.View>

            {/* Top Bar Navigation */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={30} tint="dark" style={styles.blurWrapper}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn}>
                    <BlurView intensity={30} tint="dark" style={styles.blurWrapper}>
                        <Ionicons name="heart-outline" size={22} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {/* Sticky Bottom Bar */}
            <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <View style={styles.priceContainer}>
                    <Text style={[styles.bottomTotalLabel, { color: colors.textSecondary }]}>Total Price</Text>
                    <Text style={[styles.bottomPrice, { color: colors.text }]}>{'\u20B1'}{item.price.toFixed(2)}</Text>
                    {inCartQty > 0 && (
                        <Text style={[styles.inCartText, { color: colors.primary }]}>
                            In cart: {inCartQty}
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAddToCart}>
                    <Text style={styles.addBtnText}>Add to Cart</Text>
                    <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            {/* Quantity Modal */}
            <Modal
                transparent
                animationType="fade"
                visible={showQtyModal}
                onRequestClose={() => setShowQtyModal(false)}
            >
                <View style={styles.qtyOverlay}>
                    <View style={[styles.qtyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.qtyTitle, { color: colors.text }]}>Choose quantity</Text>
                        <View style={styles.qtyRow}>
                            <TouchableOpacity
                                style={[styles.qtyBtn, { borderColor: colors.border }]}
                                onPress={() => setQty((q) => Math.max(1, q - 1))}
                            >
                                <Ionicons name="remove" size={18} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyValue, { color: colors.text }]}>{qty}</Text>
                            <TouchableOpacity
                                style={[styles.qtyBtn, { borderColor: colors.border }]}
                                onPress={() => setQty((q) => q + 1)}
                            >
                                <Ionicons name="add" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.qtyActions}>
                            <TouchableOpacity
                                style={[styles.qtyCancel, { borderColor: colors.border }]}
                                onPress={() => setShowQtyModal(false)}
                            >
                                <Text style={[styles.qtyCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.qtyConfirm, { backgroundColor: colors.primary }]}
                                onPress={confirmAddToCart}
                            >
                                <Text style={styles.qtyConfirmText}>Add</Text>
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
        backgroundColor: '#fff',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        height: HEADER_MAX_HEIGHT,
        overflow: 'hidden',
    },
    headerImageWrapper: {
        width: '100%',
        height: HEADER_MAX_HEIGHT,
    },
    headerImage: {
        width,
        height: HEADER_MAX_HEIGHT,
        resizeMode: 'cover',
    },
    dotsRow: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        width: 18,
        backgroundColor: '#fff',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    topBar: {
        position: 'absolute',
        top: 60,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 100,
    },
    blurWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconBtn: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        padding: 24,
        paddingTop: 35, // More breathing room
        minHeight: Dimensions.get('window').height - HEADER_MIN_HEIGHT,
    },
    mainInfo: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    name: {
        fontSize: 30, // Larger title
        fontWeight: 'bold',
        color: '#1a1a1a',
        flex: 1,
        marginRight: 10,
        lineHeight: 36, // Prevents cutting
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 14,
        marginLeft: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#666',
    },
    readMore: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
    horizontalList: {
        paddingRight: 20,
    },
    ingredientCard: {
        width: 100,
        height: 110,
        borderRadius: 20,
        borderWidth: 1,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    ingredientIconContainer: {
        marginBottom: 8,
    },
    ingredientName: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 13,
    },
    pairingCard: {
        width: 160,
        borderRadius: 20,
        marginRight: 16,
        overflow: 'hidden',
    },
    pairingImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    pairingWish: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 6,
        borderRadius: 15,
    },
    pairingInfo: {
        padding: 12,
    },
    pairingName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    pairingPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderTopWidth: 1,
    },
    priceContainer: {
        flex: 1,
    },
    bottomTotalLabel: {
        fontSize: 12,
    },
    bottomPrice: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    inCartText: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '700',
    },
    qtyOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    qtyCard: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    qtyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    qtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyValue: {
        fontSize: 18,
        fontWeight: '700',
        marginHorizontal: 18,
    },
    qtyActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    qtyCancel: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    qtyCancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    qtyConfirm: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 16,
        borderRadius: 18,
        elevation: 5,
        shadowColor: '#D72323',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    reviewCard: {
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    reviewerName: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
    },
    noReviews: {
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
});

export default ProductDetailsScreen;
