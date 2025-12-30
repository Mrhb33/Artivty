import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, COMPONENT_TOKENS } from '../theme';

interface AppShellProps {
  children: ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  noPadding?: boolean;
}

/**
 * AppShell - Core layout component
 * Provides consistent background, safe area handling, and screen padding
 * Handles RTL/LTR spacing automatically
 * Midnight Gallery theme: Soft Charcoal background (#1E1E1E)
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  style,
  backgroundColor = COLORS.background.primary,
  noPadding = false,
}) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }
      ]}
    >
      <View
        style={[
          styles.container,
          !noPadding && styles.padded,
          isRTL && styles.rtl,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: COMPONENT_TOKENS.screen.padding,
    paddingVertical: 8,
  },
  rtl: {
    // RTL adjustments if needed
  },
});
