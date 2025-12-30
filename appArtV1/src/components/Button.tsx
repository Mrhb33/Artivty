import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS, TYPOGRAPHY, COMPONENT_TOKENS } from '../theme/design-system';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
  children?: ReactNode;
}

/**
 * PrimaryButton - Midnight Gallery Action
 * Sharp corners, Gold background, Black text.
 */
export const PrimaryButton: React.FC<ButtonProps> = ({
  title = 'Button',
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  fullWidth = true,
  children,
}) => {

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return COLORS.surface.secondary;
    switch (variant) {
      case 'primary': return COLORS.accent.primary; // Gold
      case 'secondary': return 'transparent';
      case 'danger': return COLORS.accent.danger;
      case 'ghost': return 'transparent';
      default: return COLORS.accent.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled && variant === 'secondary') return COLORS.border.medium;
    if (variant === 'secondary') return COLORS.border.light;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return COLORS.text.tertiary;
    if (variant === 'primary') return COLORS.text.inverse; // Black on Gold
    if (variant === 'danger') return COLORS.text.primary;
    return COLORS.text.primary; // White for others
  };

  const getContainerStyle = (): ViewStyle => {
    const basePadding = size === 'sm'
      ? { paddingVertical: 8, paddingHorizontal: 16 }
      : size === 'lg'
        ? { paddingVertical: 18, paddingHorizontal: 32 }
        : { paddingVertical: 14, paddingHorizontal: 24 };

    const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderRadius: BORDER_RADIUS.small, // Sharp/Small
      justifyContent: 'center',
      alignItems: 'center',
      ...basePadding,
      ...widthStyle,
      ...(variant === 'primary' && !disabled ? SHADOWS.glow : {}), // Glow for primary
    } as ViewStyle;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as keyof typeof Ionicons.glyphMap}
            size={size === 'sm' ? 16 : 18}
            color={getTextColor()}
            style={{ marginRight: 8 }}
          />
        )}
        {children ? (
          children
        ) : (
          <Text style={{
            color: getTextColor(),
            fontSize: size === 'sm' ? 12 : 14,
            fontWeight: '600',
            textAlign: 'center',
            letterSpacing: 1,
            textTransform: 'uppercase', // Editorial style
          }}>
            {title}
          </Text>
        )}
        {rightIcon && (
          <Ionicons
            name={rightIcon as keyof typeof Ionicons.glyphMap}
            size={size === 'sm' ? 16 : 18}
            color={getTextColor()}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    )}
  </TouchableOpacity>
);
};

export const SecondaryButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton {...props} variant="secondary" />
);

export const DangerButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton {...props} variant="danger" />
);

export const GhostButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton {...props} variant="ghost" />
);
