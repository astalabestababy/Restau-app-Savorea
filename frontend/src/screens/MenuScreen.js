import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../redux/slices/productSlice';

const MenuScreen = ({ route }) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { colors } = useTheme();

    const { items: menuItems, loading } = useSelector(state => state.products);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(route?.params?.category || 'All');

    const categories = ['All', 'Main', 'Dessert', 'Drink'];

    useEffect(() => {
        if (route?.params?.category) {
            setSelectedCategory(route.params.category);
        }
    }, [route?.params?.category]);

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    useEffect(() => {
        if (Array.isArray(menuItems)) {
            if (selectedCategory === 'All') {
                setFilteredItems(menuItems);
            } else {
                setFilteredItems(menuItems.filter(item => item.category === selectedCategory));
            }
        } else {
            setFilteredItems([]);
        }
    }, [selectedCategory, menuItems]);

    const onRefresh = () => {
        dispatch(fetchProducts());
    };


    const renderCategoryHeader = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryContainer}
        >
            {categories.map((cat) => (
                <TouchableOpacity
                    key={cat}
                    style={[
                        styles.categoryButton, 
                        { backgroundColor: colors.surface },
                        selectedCategory === cat && [styles.selectedCategoryButton, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                >
                    <Text style={[
                        styles.categoryText, 
                        { color: colors.textSecondary },
                        selectedCategory === cat && styles.selectedCategoryText
                    ]}>
                        {cat}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderItem = ({ item }) => {
        const imageSource = item.image ? { uri: item.image } : require('../../assets/icon.png');
        
        return (
            <TouchableOpacity 
                style={[styles.itemContainer, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => navigation.navigate('ProductDetails', { item })}
            >
                <Image 
                    source={imageSource} 
                    style={styles.image}
                />
                <View style={styles.infoContainer}>
                    <Text style={[styles.categoryLabel, { color: colors.primary }]}>{item.category.toUpperCase()}</Text>
                    <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.text }]}>{'\u20B1'}{item.price.toFixed(2)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Our Menu</Text>
                        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Find the best Filipino flavors</Text>
                    </View>
                </View>
            </View>

            {renderCategoryHeader()}

            <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={onRefresh}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 80, // Increased for more breathing room
    },
    header: {
        paddingHorizontal: 24, // Matches typical design spacing
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
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
        fontSize: 34, // Slightly larger
        fontWeight: 'bold',
        lineHeight: 40, // Prevents cutting
    },
    headerSub: {
        fontSize: 16, // Slightly larger
        marginTop: 6,
    },
    categoryContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        height: 60, // Fixed height to prevent cutting
    },
    categoryButton: {
        height: 44, // Fixed height for consistency
        paddingHorizontal: 24,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedCategoryButton: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    categoryText: {
        fontWeight: '700', // Bolder
        fontSize: 15,
    },
    selectedCategoryText: {
        color: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    itemContainer: {
        width: '47%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    image: {
        width: '100%',
        height: 130,
        resizeMode: 'cover',
    },
    infoContainer: {
        padding: 12,
    },
    categoryLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MenuScreen;
