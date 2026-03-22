import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getAuthToken } from '../../utils/authToken';
import * as ImagePicker from 'expo-image-picker';
import API_URL from '../../config/api';

const AdminMenuScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Main');
    const [existingImages, setExistingImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);

    useEffect(() => {
        fetchMenu();
    }, []);

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need permission to access your photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Multiple selection usually disables cropping
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets]);
        }
    };

    const captureImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need permission to use your camera');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });
        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets]);
        }
    };

    const removeExistingImage = (index) => {
        const newImages = [...existingImages];
        newImages.splice(index, 1);
        setExistingImages(newImages);
    };

    const removeSelectedImage = (index) => {
        const newImages = [...selectedImages];
        newImages.splice(index, 1);
        setSelectedImages(newImages);
    };

    const fetchMenu = async () => {
        try {
            const response = await fetch(`${API_URL}/menu`);
            const data = await response.json();
            if (response.ok) {
                setMenuItems(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setDescription(item.description);
            setPrice(item.price.toString());
            setCategory(item.category);
            // Handle legacy single image or new array
            let imgs = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
            setExistingImages(imgs);
            setSelectedImages([]); // Reset selected image
        } else {
            setEditingItem(null);
            setName('');
            setDescription('');
            setPrice('');
            setCategory('Main');
            setExistingImages([]);
            setSelectedImages([]);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name || !price || !category || (existingImages.length === 0 && selectedImages.length === 0)) {
            Alert.alert('Error', 'Please fill in all required fields and add at least one image');
            return;
        }

        const token = await getAuthToken();
        const formData = new FormData();
        
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('category', category);

        // Append existing images
        existingImages.forEach(img => {
            formData.append('existingImages', img);
        });

        // Append new images
        for (const img of selectedImages) {
            if (Platform.OS === 'web') {
                const res = await fetch(img.uri);
                const blob = await res.blob();
                const filename = 'upload-' + Date.now() + '.jpg';
                formData.append('images', blob, filename);
            } else {
                let filename = img.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image/jpeg`;
                if (!match) {
                    filename += '.jpg';
                }

                formData.append('images', {
                    uri: img.uri,
                    name: filename,
                    type: type,
                });
            }
        }

        try {
            const url = editingItem ? `${API_URL}/admin/menu/${editingItem._id}` : `${API_URL}/admin/menu`;
            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'x-auth-token': token
                },
                body: formData
            });

            if (response.ok) {
                const savedItem = await response.json();
                if (editingItem) {
                    setMenuItems(menuItems.map(m => m._id === editingItem._id ? savedItem : m));
                } else {
                    setMenuItems([...menuItems, savedItem]);
                }
                setModalVisible(false);
                Alert.alert('Success', `Item ${editingItem ? 'updated' : 'added'} successfully`);
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to save item');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => performDelete(id) }
            ]
        );
    };

    const performDelete = async (id) => {
        const token = await getAuthToken();
        try {
            const response = await fetch(`${API_URL}/admin/menu/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                setMenuItems(menuItems.filter(m => m._id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderMenuItem = ({ item }) => (
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemCategory, { color: colors.primary }]}>{item.category}</Text>
                <Text style={[styles.itemPrice, { color: colors.text }]}>{'\u20B1'}{item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.itemActions}>
                <TouchableOpacity style={styles.actionIconButton} onPress={() => handleOpenModal(item)}>
                    <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIconButton} onPress={() => handleDelete(item._id)}>
                    <Ionicons name="trash" size={20} color="#F56565" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Menu Management</Text>
                </View>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => handleOpenModal()}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={menuItems}
                renderItem={renderMenuItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Item name"
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, height: 80 }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Item description"
                                placeholderTextColor={colors.textSecondary}
                                multiline
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Price (\u20B1)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                                    <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}>
                                        <Text style={{ color: colors.text }}>{category}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>Images</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                                {existingImages.map((img, index) => (
                                    <View key={`existing-${index}`} style={styles.imageWrapper}>
                                        <Image source={{ uri: img }} style={styles.previewImageSmall} />
                                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeExistingImage(index)}>
                                            <Ionicons name="close-circle" size={24} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {selectedImages.map((img, index) => (
                                    <View key={`selected-${index}`} style={styles.imageWrapper}>
                                        <Image source={{ uri: img.uri }} style={styles.previewImageSmall} />
                                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeSelectedImage(index)}>
                                            <Ionicons name="close-circle" size={24} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={[styles.addImageBtn, { borderColor: colors.border }]} onPress={pickImage}>
                                    <Ionicons name="add" size={30} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Add</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.addImageBtn, { borderColor: colors.border }]} onPress={captureImage}>
                                    <Ionicons name="camera" size={28} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Camera</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    backButton: {
        padding: 5,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    menuCard: {
        flexDirection: 'row',
        borderRadius: 15,
        marginBottom: 15,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.00,
        elevation: 2,
        borderWidth: 1,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 12,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
    },
    itemActions: {
        justifyContent: 'space-around',
        paddingLeft: 10,
    },
    actionIconButton: {
        padding: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalForm: {
        maxHeight: 400,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e2e8f0',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#4a5568',
        fontWeight: 'bold',
    },
    saveButton: {
        marginLeft: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagesContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        height: 100,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        marginRight: 10,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImageSmall: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 12,
    },
    addImageBtn: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AdminMenuScreen;
