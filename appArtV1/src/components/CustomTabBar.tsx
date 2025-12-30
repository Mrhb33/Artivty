import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 4);

  // Shared value for direct animation without oscillation
  const indicatorPosition = useSharedValue(state.index);

  useEffect(() => {
    // Direct timing animation - no spring physics to avoid oscillation
    indicatorPosition.value = withTiming(state.index, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth easing curve
    });
  }, [state.index]);

  const getTabIcon = (routeName: string, focused: boolean): string => {
    const iconMap: Record<string, { active: string; inactive: string }> = {
      Home: { active: 'images', inactive: 'images-outline' },
      Requests: { active: 'images', inactive: 'images-outline' },
      Search: { active: 'search', inactive: 'search-outline' },
      Explore: { active: 'search', inactive: 'search-outline' },
      Order: { active: 'add-circle', inactive: 'add-circle-outline' },
      Create: { active: 'add-circle', inactive: 'add-circle-outline' },
      Activity: { active: 'file-tray-full', inactive: 'file-tray-full-outline' },
      Profile: { active: 'person', inactive: 'person-outline' },
      Default: { active: 'ellipse', inactive: 'ellipse-outline' },
    };

    const set = iconMap[routeName] ?? iconMap.Default;
    return focused ? set.active : set.inactive;
  };

  // Calculate indicator position
  const tabCount = state.routes.length;
  const tabWidth = 100 / tabCount;

  const indicatorStyle = useAnimatedStyle(() => {
    const position = indicatorPosition.value * tabWidth;

    return {
      left: `${position}%`,
      width: `${tabWidth}%`,
    };
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {/* Animated indicator - top line */}
      <Animated.View
        style={[
          styles.indicator,
          indicatorStyle,
        ]}
      />

      {/* Tab buttons */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Use the tabBarLabel if available, otherwise title, otherwise route name
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;
          // Check if this is the center CTA button (Order tab for users)
          const isCenter = route.name === 'Create' || route.name === 'Order';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
          <TabItem
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            icon={getTabIcon(route.name, isFocused)}
            label={label}
            isCenter={isCenter}
          />
          );
        })}
      </View>
    </View>
  );
};

// Individual tab component with luxury styling
const TabItem = ({ isFocused, onPress, icon, label, isCenter }: any) => {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withTiming(isFocused ? 0.92 : 1.08, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Luxury styling rules
  const iconSize = isCenter ? 30 : (isFocused ? 16 : 20);
  const iconColor = isFocused ? COLORS.accent.primary : 'rgba(255,255,255,0.55)';
  const labelColor = isFocused ? COLORS.accent.primary : 'rgba(255,255,255,0.45)';

  // Special center button styling
  const centerButtonStyle = isCenter ? {
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
    borderRadius: 21,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8, // Lift it up
  } : {};

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={[styles.tab, isCenter && styles.centerTab]}
      activeOpacity={0.7}
    >
      <Animated.View style={[animatedStyle, isCenter && centerButtonStyle]}>
        <View style={styles.tabContent}>
          <Ionicons
            name={icon as any}
            size={iconSize}
            color={iconColor}
          />
          {!isCenter && (
            <View style={styles.labelContainer}>
              <Animated.Text style={[styles.tabLabel, { color: labelColor }]}>
                {label}
              </Animated.Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.secondary,
    borderTopWidth: 0.33,
    borderTopColor: COLORS.border.light,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 2,
    backgroundColor: COLORS.accent.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTab: {
    flex: 0.8, // Make center tab slightly wider
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent.primary,
    marginTop: 2,
  },
});

export default CustomTabBar;
