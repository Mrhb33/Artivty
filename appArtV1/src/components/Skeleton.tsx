import React from 'react';
import { View, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton - Premium loading placeholder
 * Uses shimmer animation for elegant loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const skeletonStyle: ViewStyle = {
    height,
    borderRadius,
  };

  if (typeof width === 'number') {
    skeletonStyle.width = width;
  }

  return (
    <View
      style={[
        skeletonStyle,
        {
          backgroundColor: COLORS.surface.secondary, // Dark theme color
          borderWidth: 1,
          borderColor: COLORS.border.light,
          overflow: 'hidden',
        },
        typeof width === 'string' ? { width: width as any } : {},
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.surface.tertiary,
            opacity: 0.3,
            transform: [{ translateX: -100 }],
          }}
        />
      </View>
    </View>
  );
};

interface SkeletonCardProps {
  style?: ViewStyle;
}

/**
 * SkeletonCard - Card-shaped skeleton for list items (Dark theme)
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => (
  <View
    style={[
      {
        backgroundColor: COLORS.surface.secondary,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border.light,
      },
      style,
    ]}
  >
    <Skeleton width="100%" height={120} borderRadius={8} />
    <View style={{ marginTop: 12 }}>
      <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} />
    </View>
  </View>
);

interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
}

/**
 * SkeletonText - Multi-line text skeleton
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, style }) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? 140 : undefined} // 60% of typical width, or full width
        height={16}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);
