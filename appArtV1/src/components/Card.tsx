import React, { ReactNode } from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, COMPONENT_TOKENS } from '../theme';

type CardVariant = 'flat' | 'raised' | 'glass';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * Card - Premium card component using design system tokens
 * Three variants: flat (border only), raised (soft shadow), glass (special sections)
 * Uses design system for consistency across the app
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'flat',
  onPress,
  style,
  disabled = false,
}) => {
  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      backgroundColor: COLORS.surface.primary,
      borderRadius: BORDER_RADIUS.medium,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'flat':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: COLORS.border.light,
        };
      case 'raised':
        return {
          ...baseStyles,
          ...SHADOWS.medium,
        };
      case 'glass':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: COLORS.border.light,
          ...SHADOWS.subtle,
        };
      default:
        return baseStyles;
    }
  };

  const cardContent = (
    <View style={[getCardStyles(), style]}>
      {children}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
        style={{ borderRadius: BORDER_RADIUS.medium }}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

interface CardHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[{ paddingHorizontal: COMPONENT_TOKENS.card.padding, paddingVertical: 12 }, style]}>
    {children}
  </View>
);

interface CardContentProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[{ padding: COMPONENT_TOKENS.card.padding }, style]}>
    {children}
  </View>
);

interface CardFooterProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View style={[{ paddingHorizontal: COMPONENT_TOKENS.card.padding, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border.light }, style]}>
    {children}
  </View>
);
