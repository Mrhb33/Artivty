import React, { ReactNode } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { TYPOGRAPHY, COLORS, getTypography, getColor } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

export type TextVariant =
  | 'hero'
  | 'title'    // Headlines, main content headers (20px)
  | 'subtitle'
  | 'body'     // Primary content text (16px)
  | 'caption'  // Secondary text, labels (14px)
  | 'micro';   // Smallest text, metadata (12px)

export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface CustomTextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger' | 'background.tertiary';
  align?: 'left' | 'center' | 'right';
  includeFontPadding?: boolean;
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Text - Enforces typography system
 *
 * Every <Text> must belong to one of the predefined variants:
 * - Title: hero scale (32-40px) for main headings
 * - Section Title: section scale (18-20px) for headers
 * - Body: body scale (15-16px) for content
 * - Caption: caption scale (12-13px) for metadata/labels
 */
export const Text: React.FC<CustomTextProps> = ({
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  children,
  style,
  ...props
}) => {
  const { isRTL } = useLanguage();

  // Get base typography styles from design system
  // Use Arabic variants for RTL languages
  let typographyVariant = variant as any;
  if (isRTL) {
    switch (variant) {
      case 'hero':
        typographyVariant = 'heroArabic';
        break;
      case 'title':
        typographyVariant = 'titleArabic';
        break;
      case 'subtitle':
        typographyVariant = 'subtitleArabic';
        break;
      case 'body':
        typographyVariant = 'bodyArabic';
        break;
      case 'caption':
        typographyVariant = 'captionArabic';
        break;
      default:
        typographyVariant = variant as any;
    }
  }

  const typographyStyles = getTypography(typographyVariant);

  // Override fontWeight if specified
  const weightMap = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  const finalStyles = StyleSheet.flatten([
    typographyStyles,
    {
      fontWeight: weightMap[weight] as TextStyle['fontWeight'],
      color: color.includes('.') ? (COLORS as any)[color.split('.')[0]][color.split('.')[1]] : getColor(`text.${color}`),
      textAlign: align,
    },
    style,
  ]);

  return (
    <RNText
      style={finalStyles}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Convenience components for common use cases
export const Title: React.FC<CustomTextProps> = (props) => (
  <Text variant="title" {...props} />
);

export const Body: React.FC<CustomTextProps> = (props) => (
  <Text variant="body" {...props} />
);

export const Caption: React.FC<CustomTextProps> = (props) => (
  <Text variant="caption" {...props} />
);

export const Micro: React.FC<CustomTextProps> = (props) => (
  <Text variant="micro" {...props} />
);

export const BodySmall: React.FC<CustomTextProps> = (props) => (
  <Text variant="caption" {...props} />
);
