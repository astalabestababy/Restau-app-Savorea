import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LocationPicker = ({ visible, onClose }) => {
    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Map Selection</Text>
                </View>

                <View style={styles.content}>
                    <Ionicons name="map-outline" size={80} color="#ccc" />
                    <Text style={styles.message}>
                        The interactive map is only available on iOS and Android.
                    </Text>
                    <Text style={styles.subMessage}>
                        Please use the manual address entry on the Cart screen.
                    </Text>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100,
    },
    message: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
        color: '#333',
    },
    subMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        color: '#888',
    },
    closeBtn: {
        marginTop: 30,
        backgroundColor: '#D72323',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

export default LocationPicker;
