import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

/**
 * TopBar - Minimal navigation header
 * Clean, gallery-grade design with optional back button and right action
 */
export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack = false,
  rightAction,
  style,
}) => {
  const navigation = useNavigation();
  const { isRTL } = useLanguage();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left side - Back button or spacer */}
      <View style={styles.placeholder}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color="#111111"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Center - Title */}
      <View style={styles.titleContainer}>
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right side - Action button or spacer */}
      <View style={styles.placeholder}>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={rightAction.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color="#111111"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  placeholder: {
    width: 40,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
  },
});
