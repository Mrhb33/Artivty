import React, { useState } from 'react';
import { View, Image, StyleSheet, Animated, ImageSourcePropType } from 'react-native';

interface ProgressiveImageProps {
  source: ImageSourcePropType;
  placeholderSource?: ImageSourcePropType;
  style?: any;
  blurRadius?: number;
}

/**
 * ProgressiveImage - Instagram-style image loading
 * 
 * Luxury UX principle: Never show spinners
 * Shows cached low-quality preview → fades in sharp version
 * 
 * The transition is so smooth the user barely notices it loaded
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  placeholderSource,
  style,
  blurRadius = 10,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const handleLoad = () => {
    setIsLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const placeholderBlur = isLoaded ? 0 : blurRadius;
  const placeholderOpacity = isLoaded ? 0 : 1;

  return (
    <View style={style}>
      <Animated.Image
        source={placeholderSource ?? source}
        style={[
          StyleSheet.absoluteFill,
          style,
          { opacity: placeholderOpacity },
        ]}
        blurRadius={placeholderBlur}
      />

      <Animated.Image
        source={source}
        style={[StyleSheet.absoluteFill, style, { opacity: fadeAnim }]}
        onLoad={handleLoad}
      />
    </View>
  );
};

export default ProgressiveImage;

