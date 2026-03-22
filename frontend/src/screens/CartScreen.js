import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, TextInput, Platform } from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import LocationPicker from '../components/LocationPicker';
import { useOrders } from '../context/OrderContext';
import { useTheme } from '../context/ThemeContext';

const CartScreen = () => {
    const navigation = useNavigation();
    const { cart, increaseQuantity, decreaseQuantity, removeFromCart, cartTotal, subtotal, clearCart } = useCart();
    const { user, updateProfile } = useAuth();
    const { placeOrder } = useOrders();
    const { colors } = useTheme();
    const [isEditingAddress, setIsEditingAddress] = React.useState(false);
    const [newAddress, setNewAddress] = React.useState(user?.address || '');
    const [updating, setUpdating] = React.useState(false);
    const [isMapVisible, setIsMapVisible] = React.useState(false);
    const [paymentMethod, setPaymentMethod] = React.useState('COD');

    const getItemId = (item) => item._id || item.id;

    const handleUpdateAddress = async () => {
        if (!newAddress.trim()) {
            Alert.alert('Error', 'Please enter a valid address');
            return;
        }
        setUpdating(true);
        const result = await updateProfile({ address: newAddress });
        setUpdating(false);
        if (result.success) {
            setIsEditingAddress(false);
        } else {
            Alert.alert('Error', result.message || 'Failed to update address');
        }
    };

    const handleMapSelect = (address) => {
        setNewAddress(address);
        setIsEditingAddress(true); // Ensure editing mode is on so the input shows the new address
    };

    const handleCheckout = () => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Mag-login muna para makapag-order!',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }

        if (!user.isVerified) {
            Alert.alert(
                'Verification Required',
                'You must verify your email before placing an order!',
                [{ text: 'OK', onPress: () => navigation.navigate('Verify', { email: user.email }) }]
            );
            return;
        }

        if (!user.address && !newAddress) {
            Alert.alert('Address Required', 'Please add a delivery address before checking out.');
            return;
        }

        Alert.alert(
            'Checkout',
            `Confirm order for \u20B1${cartTotal.toFixed(2)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Place Order',
                    onPress: async () => {
                        const orderData = {
                            items: cart.map(item => ({
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                                image: item.image
                            })),
                            totalAmount: cartTotal,
                            address: user.address || newAddress,
                            paymentMethod
                        };

                        const result = await placeOrder(orderData);
                        if (result.success) {
                            Alert.alert('Salamat!', 'Your order has been placed.');
                            clearCart();
                            navigation.navigate('OrderHistory');
                        } else {
                            Alert.alert('Error', result.message || 'Failed to place order');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{'\u20B1'}{item.price.toFixed(2)}</Text>

                <View style={styles.controlsRow}>
                    <View style={styles.quantityControls}>
                        <TouchableOpacity
                            onPress={() => decreaseQuantity(getItemId(item))}
                            style={styles.qtyButton}
                        >
                            <Ionicons name="remove" size={16} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <TouchableOpacity
                            onPress={() => increaseQuantity(getItemId(item))}
                            style={styles.qtyButton}
                        >
                            <Ionicons name="add" size={16} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => removeFromCart(getItemId(item))}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color="#D72323" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
                    </View>
                    {cart.length > 0 && (
                        <TouchableOpacity onPress={clearCart}>
                            <Text style={[styles.clearText, { color: colors.primary }]}>Clear All</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {cart.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color="#eee" />
                    <Text style={styles.emptyText}>Gutom na ba kayo?</Text>
                    <Text style={styles.emptySubText}>Add some delicious Filipino food!</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cart}
                        renderItem={renderItem}
                        keyExtractor={(item) => getItemId(item)}
                        contentContainerStyle={styles.listContent}
                    />
                    <View style={styles.footer}>
                        <View style={styles.addressSection}>
                            <View style={styles.addressHeader}>
                                <Ionicons name="location-outline" size={20} color="#D72323" />
                                <Text style={styles.addressTitle}>Delivery Address</Text>
                                <TouchableOpacity onPress={() => setIsEditingAddress(!isEditingAddress)}>
                                    <Text style={styles.editAddressText}>
                                        {user?.address ? 'Change' : 'Add Address'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setIsMapVisible(true)}
                                    style={styles.mapBtnIcon}
                                >
                                    <Ionicons name="map-outline" size={20} color="#D72323" />
                                </TouchableOpacity>
                            </View>

                            {isEditingAddress ? (
                                <View style={styles.addressEditContainer}>
                                    <View style={styles.addressInputContainer}>
                                        <TextInput
                                            style={styles.addressInput}
                                            placeholder="Enter your delivery address..."
                                            value={newAddress}
                                            onChangeText={setNewAddress}
                                            multiline
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.saveAddressBtn}
                                        onPress={handleUpdateAddress}
                                        disabled={updating}
                                    >
                                        <Text style={styles.saveAddressText}>
                                            {updating ? 'Saving...' : 'Save Address'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {user?.address || 'No address added yet. Please add your delivery address.'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.paymentSection}>
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                            <View style={styles.paymentOptions}>
                                <TouchableOpacity 
                                    style={[styles.paymentOption, paymentMethod === 'COD' && styles.selectedPayment]}
                                    onPress={() => setPaymentMethod('COD')}
                                >
                                    <Ionicons name="cash-outline" size={24} color={paymentMethod === 'COD' ? '#D72323' : '#666'} />
                                    <Text style={[styles.paymentText, paymentMethod === 'COD' && styles.selectedPaymentText]}>COD</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.paymentOption, paymentMethod === 'PayMaya' && styles.selectedPayment]}
                                    onPress={() => setPaymentMethod('PayMaya')}
                                >
                                    <Ionicons name="card-outline" size={24} color={paymentMethod === 'PayMaya' ? '#D72323' : '#666'} />
                                    <Text style={[styles.paymentText, paymentMethod === 'PayMaya' && styles.selectedPaymentText]}>PayMaya</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.subtotalValue}>{'\u20B1'}{subtotal.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.totalRow, { marginTop: 5, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 }]}>
                            <Text style={styles.totalLabelMain}>Total Amount</Text>
                            <Text style={styles.totalValue}>{'\u20B1'}{cartTotal.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.checkoutButton, !user && styles.guestButton]}
                            onPress={handleCheckout}
                        >
                            <Text style={styles.checkoutText}>
                                {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            <View style={{ height: 40 }} />

            <LocationPicker
                visible={isMapVisible}
                onClose={() => setIsMapVisible(false)}
                onSelectAddress={handleMapSelect}
            />
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
        marginBottom: 24,
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
        fontSize: 34,
        fontWeight: 'bold',
        lineHeight: 40,
    },
    clearText: {
        color: '#D72323',
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D72323',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 4,
    },
    qtyButton: {
        padding: 6,
    },
    quantity: {
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: 10,
        minWidth: 15,
        textAlign: 'center',
    },
    deleteButton: {
        padding: 4,
    },
    footer: {
        paddingTop: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 14,
        color: '#888',
    },
    subtotalValue: {
        fontSize: 16,
        color: '#444',
        fontWeight: '500',
    },
    discountLabel: {
        fontSize: 14,
        color: '#FF4D6D',
        fontWeight: '600',
    },
    discountValue: {
        fontSize: 16,
        color: '#FF4D6D',
        fontWeight: 'bold',
    },
    totalLabelMain: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D72323',
    },
    promoBadge: {
        backgroundColor: '#FFF0F3',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FFCCD5',
        alignItems: 'center',
    },
    promoBadgeText: {
        color: '#FF4D6D',
        fontSize: 12,
        fontWeight: 'bold',
    },
    paymentSection: {
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    paymentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    paymentOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginHorizontal: 5,
        backgroundColor: '#f9f9f9',
    },
    selectedPayment: {
        borderColor: '#D72323',
        backgroundColor: '#fff5f5',
    },
    paymentText: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#666',
    },
    selectedPaymentText: {
        color: '#D72323',
    },
    checkoutButton: {
        backgroundColor: '#D72323',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#D72323',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    guestButton: {
        backgroundColor: '#333',
    },
    checkoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addressSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    editAddressText: {
        color: '#D72323',
        fontSize: 14,
        fontWeight: '600',
    },
    mapBtnIcon: {
        marginLeft: 15,
        padding: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    addressEditContainer: {
        marginTop: 5,
    },
    addressInputContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 10,
    },
    addressInput: {
        fontSize: 14,
        color: '#333',
        height: 60,
        textAlignVertical: 'top',
    },
    saveAddressBtn: {
        backgroundColor: '#D72323',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveAddressText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default CartScreen;
