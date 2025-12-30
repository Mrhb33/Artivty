import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme/design-system';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  onRightIconPress?: () => void;
}

/**
 * Input - Midnight Gallery Form
 * Minimalist, underline-only, high contrast.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  multiline = false,
  numberOfLines = 1,
  onRightIconPress,
  style,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const message = error ? error : helperText && !error ? helperText : '';

  // Stable Layout Style - No dynamic size changes
  const getContainerStyles = () => {
    const base = {
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(255,255,255,0.04)', // Fixed background
      borderColor: 'rgba(255,255,255,0.10)', // Fixed border color
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: multiline ? 100 : 56,
      opacity: textInputProps.editable === false ? 0.5 : 1,
    };

    return base;
  };

  // Focus ring - absolute positioned, no layout impact
  const focusRingStyle = isFocused ? {
    position: 'absolute' as const,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    zIndex: -1,
  } : null;

  return (
    <View style={[{ marginBottom: SPACING.medium }, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={{
          color: COLORS.text.secondary, // Fixed color - no focus changes
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
          {label}
        </Text>
      )}

      {/* Input Field Box with Focus Ring */}
      <View style={{ position: 'relative' }}>
        <View style={getContainerStyles()}>
          {/* Left Icon */}
          {leftIcon && (
            <Ionicons
              name={leftIcon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={COLORS.text.secondary} // Fixed color - no focus changes
              style={{ marginRight: 12 }}
            />
          )}

          {/* Text Input */}
          <TextInput
            {...textInputProps}
            style={[{
              flex: 1,
              color: COLORS.text.primary,
              fontSize: 16,
              fontWeight: '400',
              padding: 0,
            }, style]}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            placeholderTextColor={COLORS.text.tertiary}
            onFocus={(e) => {
              setIsFocused(true);
              textInputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              textInputProps.onBlur?.(e);
            }}
          />

          {/* Right Icon */}
          {rightIcon && onRightIconPress && (
            <Pressable onPress={onRightIconPress} hitSlop={10}>
              <Ionicons
                name={rightIcon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={COLORS.text.secondary}
                style={{ marginLeft: 12 }}
              />
            </Pressable>
          )}
        </View>

        {/* Focus Ring - Absolutely positioned, no layout impact */}
        {focusRingStyle && <View style={focusRingStyle} />}
      </View>

      {/* Helper/Error placeholder to prevent layout jumps */}
      <View style={{ minHeight: 18, marginTop: 4 }}>
        {message ? (
          <Text style={{ color: error ? COLORS.accent.danger : COLORS.text.tertiary, fontSize: 12 }}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
