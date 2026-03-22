import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LocationPicker = ({ visible, onClose, onSelectAddress }) => {
    const [location, setLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addressPreview, setAddressPreview] = useState('Tap on the map to select a location');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (visible) {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission denied', 'Allow location access to use the map.');
                    setLoading(false);
                    return;
                }

                try {
                    let currentLocation = await Location.getCurrentPositionAsync({});
                    const initialRegion = {
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    };
                    setLocation(initialRegion);
                    setSelectedLocation(initialRegion);
                    reverseGeocode(initialRegion.latitude, initialRegion.longitude);
                } catch (error) {
                    console.error(error);
                    // Default to Manila if location fails
                    const manila = {
                        latitude: 14.5995,
                        longitude: 120.9842,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    };
                    setLocation(manila);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [visible]);

    const reverseGeocode = async (latitude, longitude) => {
        setSearching(true);
        try {
            let result = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (result.length > 0) {
                const addr = result[0];
                const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.district || addr.city || ''}, ${addr.region || ''}`.trim().replace(/^ ,/, '');
                setAddressPreview(formattedAddress || 'Unknown Location');
            }
        } catch (error) {
            setAddressPreview('Could not determine address');
        } finally {
            setSearching(false);
        }
    };

    const handleMapPress = (e) => {
        const coords = e.nativeEvent.coordinate;
        setSelectedLocation({
            ...coords,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        });
        reverseGeocode(coords.latitude, coords.longitude);
    };

    const handleConfirm = () => {
        if (selectedLocation && addressPreview !== 'Tap on the map to select a location') {
            onSelectAddress(addressPreview);
            onClose();
        } else {
            Alert.alert('Select Location', 'Please tap on the map to select your delivery point.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#D72323" />
                        <Text style={{ marginTop: 10 }}>Getting your location...</Text>
                    </View>
                ) : (
                    <>
                        <MapView
                            style={styles.map}
                            initialRegion={location}
                            onPress={handleMapPress}
                        >
                            {selectedLocation && (
                                <Marker
                                    coordinate={selectedLocation}
                                    title="Delivery Point"
                                    description={addressPreview}
                                />
                            )}
                        </MapView>

                        <View style={styles.topContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={onClose}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Select Delivery Point</Text>
                        </View>

                        <View style={styles.bottomContainer}>
                            <View style={styles.addressBox}>
                                <Text style={styles.addressLabel}>Selected Address:</Text>
                                {searching ? (
                                    <ActivityIndicator size="small" color="#D72323" />
                                ) : (
                                    <Text style={styles.addressValue} numberOfLines={2}>
                                        {addressPreview}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                <Text style={styles.confirmText}>Confirm Location</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: width,
        height: height,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 10,
        borderRadius: 15,
        elevation: 5,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#333',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    addressBox: {
        marginBottom: 15,
    },
    addressLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    addressValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#D72323',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LocationPicker;
