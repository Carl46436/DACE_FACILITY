// ============================================================
// ImagePickerButton Component
// Button to select images from camera or gallery
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

const ImagePickerButton = ({ images = [], onImagesChange, maxImages = 5 }) => {
  const isWeb = Platform.OS === 'web';

  const pickImage = async (source) => {
    try {
      let result;
      if (source === 'camera') {
        if (isWeb) {
          Alert.alert('Not Supported', 'Camera capture is not available on web. Please use Gallery.');
          return;
        }
        const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera access is required to take photos.');
          return;
        }
        result = await ExpoImagePicker.launchCameraAsync({
          mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        if (!isWeb) {
          const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery access is required to select photos.');
            return;
          }
        }
        result = await ExpoImagePicker.launchImageLibraryAsync({
          mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: maxImages - images.length,
        });
      }

      if (!result.canceled && result.assets) {
        const newImages = [...images, ...result.assets].slice(0, maxImages);
        onImagesChange(newImages);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const showOptions = () => {
    if (isWeb) {
      pickImage('gallery');
      return;
    }
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage('camera') },
      { text: 'Gallery', onPress: () => pickImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photos ({images.length}/{maxImages})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < maxImages && (
          <TouchableOpacity style={styles.addButton} onPress={showOptions} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scrollView: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  addText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
});

export default ImagePickerButton;
