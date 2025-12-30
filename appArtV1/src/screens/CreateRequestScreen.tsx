import React, { useState } from 'react';
import { View, ScrollView, Alert, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { CreateRequestData } from '../types/api';
import { useCreateRequest } from '../hooks/useRequests';
import { AppShell, AppHeader, Input, PrimaryButton, Title, Body, Caption, BodySmall } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, COMPONENT_TOKENS, BORDER_RADIUS, SHADOWS } from '../theme';

const CreateRequestScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const createRequestMutation = useCreateRequest();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<CreateRequestData>({
    title: '',
    description: '',
    dimensions_width: undefined,
    dimensions_height: undefined,
    dimensions_unit: 'cm',
    style: '',
    colors: '',
    deadline: undefined,
    reference_images: [],
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert(t('common.error'), 'Please fill in title and description');
      return;
    }

    try {
      await createRequestMutation.mutateAsync(formData);
      Alert.alert(t('common.success'), 'Your request has been created!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to create request. Please try again.');
    }
  };

  const updateFormData = (field: keyof CreateRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImages = [...selectedImages, result.assets[0].uri];
      setSelectedImages(newImages);
      setFormData(prev => ({
        ...prev,
        reference_images: newImages
      }));
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setFormData(prev => ({
      ...prev,
      reference_images: newImages
    }));
  };

  const artStyles = [
    'Realistic', 'Anime', 'Abstract', 'Digital', 'Oil', 'Sketch', 'Minimal', 'Other'
  ];

  return (
    <AppShell noPadding>
      <AppHeader
        title="New Request"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Subtitle */}
        <View style={styles.headerSubtitle}>
          <Body color="secondary" align="center">
            Commission your perfect artwork
          </Body>
        </View>

        {/* Form Surfaces */}
        <View style={styles.formContainer}>

          {/* 1. Basics Surface */}
          <View style={styles.surface}>
            <Text style={styles.sectionLabel}>The Vision</Text>

            <View style={styles.inputGroup}>
              <Input
                label="Title"
                placeholder="e.g. Portrait of my cat"
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                style={styles.inputClean}
              />
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Description"
                placeholder="Describe the mood, subject, and scene..."
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                multiline
                numberOfLines={5}
                style={styles.inputClean}
              />
            </View>
          </View>

          {/* 2. Details Surface */}
          <View style={styles.surface}>
            <Text style={styles.sectionLabel}>Details</Text>

            <Caption weight="medium" style={styles.fieldLabel}>Dimensions</Caption>
            <View style={styles.dimensionsRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Width"
                  keyboardType="numeric"
                  value={formData.dimensions_width?.toString() || ''}
                  onChangeText={(value) => updateFormData('dimensions_width', parseFloat(value))}
                />
              </View>
              <Text style={{ alignSelf: 'center', color: COLORS.text.tertiary }}>×</Text>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Height"
                  keyboardType="numeric"
                  value={formData.dimensions_height?.toString() || ''}
                  onChangeText={(value) => updateFormData('dimensions_height', parseFloat(value))}
                />
              </View>
              <View style={styles.unitToggle}>
                {['cm', 'in'].map(unit => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => updateFormData('dimensions_unit', unit)}
                    style={[styles.unitBtn, formData.dimensions_unit === unit && styles.unitBtnActive]}
                  >
                    <Text style={[styles.unitText, formData.dimensions_unit === unit && styles.unitTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Caption weight="medium" style={styles.fieldLabel}>Style</Caption>
            <View style={styles.chipsRow}>
              {artStyles.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.chip, formData.style === style && styles.chipActive]}
                  onPress={() => updateFormData('style', style)}
                >
                  <Caption style={formData.style === style ? { color: COLORS.text.inverse } : { color: COLORS.text.primary }}>
                    {style}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. Visuals Surface */}
          <View style={styles.surface}>
            <Text style={styles.sectionLabel}>References</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.refImage} />
                  <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(index)}>
                    <Ionicons name="close" size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="add" size={32} color={COLORS.text.tertiary} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Submit Action */}
          <View style={styles.footer}>
            <PrimaryButton
              title="Publish Request"
              onPress={handleSubmit}
              loading={createRequestMutation.isPending}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  headerSubtitle: {
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.small,
    paddingBottom: SPACING.medium,
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.xl,
  },
  surface: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    ...SHADOWS.subtle,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.medium,
  },
  inputGroup: {
    marginBottom: SPACING.medium,
  },
  inputClean: {
    backgroundColor: COLORS.surface.secondary,
    borderWidth: 0,
  },
  fieldLabel: {
    marginBottom: SPACING.small,
    marginTop: SPACING.small,
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: SPACING.small,
    marginBottom: SPACING.medium,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.secondary,
    borderRadius: BORDER_RADIUS.small,
    padding: 2,
    height: 48, // Match input height roughly
    alignItems: 'center',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.small - 2,
  },
  unitBtnActive: {
    backgroundColor: COLORS.surface.primary,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  unitTextActive: {
    color: COLORS.text.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  chip: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.surface.secondary,
  },
  chipActive: {
    backgroundColor: COLORS.text.primary,
    borderColor: COLORS.text.primary,
  },
  imageScroll: {
    gap: SPACING.medium,
    paddingVertical: SPACING.small,
  },
  imageWrapper: {
    position: 'relative',
  },
  refImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.small,
  },
  removeIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.accent.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface.primary,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.secondary,
  },
  footer: {
    marginTop: SPACING.medium,
    marginBottom: SPACING.xl,
  },
});

export default CreateRequestScreen;