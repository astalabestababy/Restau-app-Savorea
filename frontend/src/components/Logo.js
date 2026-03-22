import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Logo = ({ size = 100 }) => {
    const iconSize = size * 0.5;

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.25 }]}>
            {/* Flames background */}
            <View style={styles.flameContainer}>
                <Ionicons
                    name="flame"
                    size={iconSize * 0.9}
                    color="#D72323"
                />
            </View>

            {/* The Pan Body */}
            <View style={styles.panBody}>
                <Ionicons
                    name="restaurant"
                    size={iconSize * 0.6}
                    color="#333"
                />
            </View>

            {/* Custom Pan Handle (Stylized) */}
            <View style={styles.handleContainer}>
                <View style={styles.handle} />
                <View style={styles.handHint} />
            </View>

            {/* Shine/Accent */}
            <View style={styles.shine} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 12,
        shadowColor: '#D72323',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        overflow: 'hidden',
    },
    flameContainer: {
        position: 'absolute',
        top: '15%',
    },
    panBody: {
        marginTop: 15,
        backgroundColor: '#f5f5f5',
        padding: 5,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#333',
        width: '45%',
        height: '45%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    handleContainer: {
        position: 'absolute',
        bottom: '28%',
        right: '18%',
        flexDirection: 'row',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
    },
    handle: {
        width: 25,
        height: 6,
        backgroundColor: '#333',
        borderRadius: 3,
    },
    handHint: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D72323',
        opacity: 0.4,
        position: 'absolute',
        right: -5,
    },
    shine: {
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: 10,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 2,
        transform: [{ rotate: '-45deg' }],
    }
});

export default Logo;
