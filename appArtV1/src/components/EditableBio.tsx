import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../theme';

interface EditableBioProps {
  bio: string | undefined;
  onSave: (bio: string) => void;
  maxLength?: number;
  placeholder?: string;
}

/**
 * EditableBio - Inline bio editing with luxury UX
 * 
 * Luxury principles:
 * - Inline editing (no modal)
 * - Character limit invisible but enforced
 * - Silent save (no popup)
 * - Smooth transitions
 * - Luxury apps assume intelligence
 */
const EditableBio: React.FC<EditableBioProps> = ({
  bio,
  onSave,
  maxLength = 150,
  placeholder = 'Write something about yourself...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(bio || '');
  const [showCharCount, setShowCharCount] = useState(false);

  useEffect(() => {
    setText(bio || '');
  }, [bio]);

  const handleSave = () => {
    const trimmedText = text.trim();
    if (trimmedText !== bio) {
      onSave(trimmedText);
    }
    setIsEditing(false);
    setShowCharCount(false);
  };

  const handleCancel = () => {
    setText(bio || '');
    setIsEditing(false);
    setShowCharCount(false);
  };

  const handleFocus = () => {
    setShowCharCount(true);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onFocus={handleFocus}
          multiline
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.tertiary}
          autoFocus
        />
        {showCharCount && (
          <Text style={styles.charCount}>
            {text.length}/{maxLength}
          </Text>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.7}>
      <View style={styles.displayContainer}>
        {bio ? (
          <Text style={styles.bioText}>{bio}</Text>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <Ionicons
          name="create-outline"
          size={14}
          color={COLORS.text.tertiary}
          style={styles.editIcon}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
    flex: 1,
  },
  editIcon: {
    marginLeft: 6,
    marginTop: 2,
  },
  editContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0095F6',
    borderRadius: 6,
  },
  saveText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default EditableBio;

