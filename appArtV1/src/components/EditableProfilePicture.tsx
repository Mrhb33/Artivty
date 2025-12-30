import React from 'react';
import { TouchableOpacity, View, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ProgressiveImage from './ProgressiveImage';
import { COLORS } from '../theme';

interface EditableProfilePictureProps {
  imageUrl: string | undefined;
  onImageChange: (imageUrl: string) => void;
  size?: number;
  editable?: boolean;
}

/**
 * EditableProfilePicture - Luxury profile picture with instant updates
 * 
 * Luxury UX principles:
 * - Tap to edit (no separate button)
 * - Options appear elegantly
 * - Upload happens in background
 * - UI updates immediately (optimistic)
 * - User never waits. Waiting is poverty.
 */
const EditableProfilePicture: React.FC<EditableProfilePictureProps> = ({
  imageUrl,
  onImageChange,
  size = 86,
  editable = true,
}) => {
  const defaultImage = 'https://via.placeholder.com/100x100.png?text=👤';

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // In production, you'd upload to a CDN here
        // For now, use local URI (optimistic update)
        const newImageUri = result.assets[0].uri;
        onImageChange(newImageUri);

        // TODO: Upload to backend/CDN in background
        // uploadToServer(newImageUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Change Photo',
          onPress: pickImage,
        },
        imageUrl && {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onImageChange(defaultImage),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ].filter(Boolean) as any
    );
  };

  return (
    <TouchableOpacity
      onPress={editable ? showOptions : undefined}
      activeOpacity={editable ? 0.8 : 1}
      disabled={!editable}
    >
      <View style={[styles.container, { width: size, height: size }]}>
        <ProgressiveImage
          source={{ uri: imageUrl || defaultImage }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          blurRadius={5}
        />
        {editable && (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={12} color="#FFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
  },
});

export default EditableProfilePicture;

