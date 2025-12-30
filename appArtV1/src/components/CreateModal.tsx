import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, COMPONENT_TOKENS } from '../theme';
import { Body, Caption, Title } from './Text';
import { Input } from './Input';
import { PrimaryButton, SecondaryButton } from './Button';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ visible, onClose }) => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<'request' | 'post' | null>(null);

  const createOptions = [
    {
      type: 'request' as const,
      title: 'Create Request',
      description: 'Commission artwork from artists',
      icon: 'document-text-outline',
    },
    {
      type: 'post' as const,
      title: 'Share Artwork',
      description: 'Post your artwork to the feed',
      icon: 'image-outline',
    },
  ];

  const handleCreate = (type: 'request' | 'post') => {
    // TODO: Navigate to appropriate screen based on type
    if (type === 'request') {
      // Navigate to CreateRequestScreen
      console.log('Navigate to Create Request');
    } else {
      // Navigate to CreatePostScreen
      console.log('Navigate to Create Post');
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Title align="center">Create</Title>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {createOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.option}
                onPress={() => handleCreate(option.type)}
                activeOpacity={0.8}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon as any} size={32} color={COLORS.accent.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Body weight="semibold" style={{ marginBottom: SPACING.micro }}>
                    {option.title}
                  </Body>
                  <Caption color="secondary">
                    {option.description}
                  </Caption>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: COMPONENT_TOKENS.screen.padding,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.large,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: SPACING.micro,
  },
  options: {
    gap: SPACING.medium,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    backgroundColor: COLORS.surface.primary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  optionContent: {
    flex: 1,
  },
});
