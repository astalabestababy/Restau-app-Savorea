import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { fetchProducts } from '../redux/slices/productSlice';

const CATEGORIES = ['All', 'Main', 'Dessert', 'Drink'];

/** Defined at module scope so FlatList does not remount the header on every parent re-render (which was blurring TextInputs after one keystroke). */
function HomeListHeader({
    insets,
    colors,
    navigation,
    totalItems,
    displayName,
    query,
    setQuery,
    showFilters,
    setShowFilters,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    selectedCategory,
    setSelectedCategory,
    featuredItems,
    filteredCount,
}) {
    return (
        <View>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Ionicons name="menu-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Savorea</Text>
                    <View style={styles.cartButtonWrap}>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                            onPress={() => navigation.navigate('Cart')}
                        >
                            <Ionicons name="cart-outline" size={22} color={colors.text} />
                        </TouchableOpacity>
                        {totalItems > 0 && (
                            <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.cartBadgeText}>
                                    {totalItems > 99 ? '99+' : totalItems}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Kumusta, {displayName}. Ready to eat?</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Search and Filter</Text>
                    <TouchableOpacity onPress={() => setShowFilters((prev) => !prev)}>
                        <Text style={[styles.linkText, { color: colors.primary }]}>{showFilters ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search food or services"
                        placeholderTextColor={colors.textSecondary}
                        value={query}
                        onChangeText={setQuery}
                        style={[styles.searchInput, { color: colors.text }]}
                        returnKeyType="search"
                        blurOnSubmit={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {showFilters && (
                    <View style={styles.filterPanel}>
                        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Price Range</Text>
                        <View style={styles.priceRow}>
                            <View style={[styles.priceInputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                <Text style={[styles.pricePrefix, { color: colors.textSecondary }]}>P</Text>
                                <TextInput
                                    placeholder="Min"
                                    placeholderTextColor={colors.textSecondary}
                                    value={minPrice}
                                    onChangeText={setMinPrice}
                                    keyboardType="numeric"
                                    style={[styles.priceInput, { color: colors.text }]}
                                    blurOnSubmit={false}
                                />
                            </View>
                            <View style={[styles.priceInputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                <Text style={[styles.pricePrefix, { color: colors.textSecondary }]}>P</Text>
                                <TextInput
                                    placeholder="Max"
                                    placeholderTextColor={colors.textSecondary}
                                    value={maxPrice}
                                    onChangeText={setMaxPrice}
                                    keyboardType="numeric"
                                    style={[styles.priceInput, { color: colors.text }]}
                                    blurOnSubmit={false}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.clearBtn, { borderColor: colors.primary }]}
                                onPress={() => {
                                    setMinPrice('');
                                    setMaxPrice('');
                                    setSelectedCategory('All');
                                    setQuery('');
                                    Keyboard.dismiss();
                                }}
                            >
                                <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Category</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryRow}
                            keyboardShouldPersistTaps="handled"
                        >
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            { color: colors.text },
                                            selectedCategory === cat && { color: '#fff' }
                                        ]}
                                    >
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.heroText}>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Classic Filipino Comfort</Text>
                    <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Freshly cooked favorites, delivered to your door.</Text>
                    <TouchableOpacity
                        style={[styles.heroButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Text style={styles.heroButtonText}>Browse Menu</Text>
                    </TouchableOpacity>
                </View>
                <Image source={require('../../assets/icon.png')} style={styles.heroImage} />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Picks</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow} keyboardShouldPersistTaps="handled">
                    {featuredItems.map((item) => (
                        <TouchableOpacity
                            key={item._id || item.id}
                            style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => navigation.navigate('ProductDetails', { item })}
                        >
                            <Image
                                source={item.image ? { uri: item.image } : require('../../assets/icon.png')}
                                style={styles.featuredImage}
                            />
                            <Text numberOfLines={1} style={[styles.featuredName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.featuredPrice, { color: colors.primary }]}>P{item.price.toFixed(2)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>All Results</Text>
                    <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{filteredCount} items</Text>
                </View>
            </View>
        </View>
    );
}

const HomeScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { totalItems } = useCart();
    const { colors } = useTheme();
    const { items: menuItems, loading } = useSelector((state) => state.products);
    const insets = useSafeAreaInsets();

    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    const displayName = user?.name ? user.name.split(' ')[0] : 'Foodie';

    const parsedMin = Number(minPrice);
    const parsedMax = Number(maxPrice);

    const filteredItems = useMemo(() => {
        const list = Array.isArray(menuItems) ? menuItems : [];
        return list.filter((item) => {
            const matchesQuery = query.trim().length === 0
                || item.name.toLowerCase().includes(query.trim().toLowerCase())
                || item.description?.toLowerCase().includes(query.trim().toLowerCase());

            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

            const hasMin = minPrice.trim() !== '' && !Number.isNaN(parsedMin);
            const hasMax = maxPrice.trim() !== '' && !Number.isNaN(parsedMax);

            const matchesPrice = (!hasMin || item.price >= parsedMin) && (!hasMax || item.price <= parsedMax);

            return matchesQuery && matchesCategory && matchesPrice;
        });
    }, [menuItems, query, selectedCategory, minPrice, maxPrice, parsedMin, parsedMax]);

    const featuredItems = filteredItems.slice(0, 4);

    const renderMenuItem = ({ item }) => {
        const imageSource = item.image ? { uri: item.image } : require('../../assets/icon.png');

        return (
            <TouchableOpacity
                style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('ProductDetails', { item })}
            >
                <Image source={imageSource} style={styles.menuImage} />
                <View style={styles.menuInfo}>
                    <Text style={[styles.menuCategory, { color: colors.primary }]}>{item.category?.toUpperCase()}</Text>
                    <Text numberOfLines={1} style={[styles.menuName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.menuPrice, { color: colors.text }]}>P{item.price.toFixed(2)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingWrap, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={filteredItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item._id || item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
            style={{ backgroundColor: colors.background }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListHeaderComponent={
                <HomeListHeader
                    insets={insets}
                    colors={colors}
                    navigation={navigation}
                    totalItems={totalItems}
                    displayName={displayName}
                    query={query}
                    setQuery={setQuery}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    setMinPrice={setMinPrice}
                    setMaxPrice={setMaxPrice}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    featuredItems={featuredItems}
                    filteredCount={filteredItems.length}
                />
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try changing your search or filters.</Text>
                </View>
            }
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        paddingTop: 0,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 0,
        marginBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
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
    cartButtonWrap: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -6,
        right: -8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        elevation: 2,
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666',
    },
    section: {
        marginTop: 18,
        paddingHorizontal: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        height: 46,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    filterPanel: {
        marginTop: 14,
        paddingBottom: 4,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 10,
        height: 40,
        marginRight: 8,
        flex: 1,
    },
    pricePrefix: {
        fontSize: 12,
        marginRight: 6,
    },
    priceInput: {
        flex: 1,
        fontSize: 14,
    },
    clearBtn: {
        paddingHorizontal: 10,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryRow: {
        paddingBottom: 4,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginRight: 10,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    heroCard: {
        marginTop: 18,
        marginHorizontal: 20,
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    heroText: {
        flex: 1,
        paddingRight: 10,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    heroButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    heroButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    heroImage: {
        width: 110,
        height: 110,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    featuredRow: {
        paddingBottom: 6,
    },
    featuredCard: {
        width: 140,
        borderRadius: 16,
        borderWidth: 1,
        padding: 12,
        marginRight: 12,
    },
    featuredImage: {
        width: '100%',
        height: 80,
        borderRadius: 10,
        marginBottom: 8,
    },
    featuredName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    featuredPrice: {
        fontSize: 12,
        fontWeight: '700',
    },
    resultCount: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    menuCard: {
        width: '47%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    menuImage: {
        width: '100%',
        height: 110,
        resizeMode: 'cover',
    },
    menuInfo: {
        padding: 10,
    },
    menuCategory: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
    },
    menuName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    menuPrice: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyState: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        textAlign: 'center',
    },
});

export default HomeScreen;
