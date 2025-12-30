import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    useSharedValue,
    interpolateColor,
    interpolate
} from 'react-native-reanimated';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Caption } from './Text';

export interface Step {
    label: string;
    description?: string;
    icon?: string;
    count?: number; // New badge count
}

interface StepperProps {
    steps: Step[];
    activeIndex: number; // 0 to steps.length - 1
    onStepPress?: (index: number) => void;
    activeColor?: string;
    completedColor?: string;
    lockedColor?: string;
}

const STEP_SIZE = 32; // slightly larger for touch targets
const LINE_HEIGHT = 2;

const Stepper: React.FC<StepperProps> = ({
    steps,
    activeIndex,
    onStepPress,
    activeColor = COLORS.accent.primary,
    completedColor = COLORS.text.primary,
    lockedColor = 'rgba(255, 255, 255, 0.2)', // Faint
}) => {

    // Safety check
    const safeIndex = Math.max(0, Math.min(activeIndex, steps.length - 1));

    return (
        <View style={styles.container}>
            {/* Steps Row */}
            <View style={styles.stepsRow}>
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const status =
                        index < safeIndex ? 'completed'
                            : index === safeIndex ? 'active'
                                : 'locked';

                    return (
                        <React.Fragment key={index}>
                            <StepCircle
                                index={index}
                                status={status}
                                activeColor={activeColor}
                                completedColor={completedColor}
                                lockedColor={lockedColor}
                                onPress={() => onStepPress?.(index)}
                                icon={step.icon}
                                count={step.count}
                            />
                            {!isLast && (
                                <StepLine
                                    index={index}
                                    activeIndex={safeIndex}
                                    activeColor={activeColor}
                                    completedColor={completedColor}
                                    lockedColor={lockedColor}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>

            {/* Labels Row - aligned with circles */}
            <View style={styles.labelsContainer}>
                {steps.map((step, index) => {
                    const status =
                        index < safeIndex ? 'completed'
                            : index === safeIndex ? 'active'
                                : 'locked';

                    const labelColor =
                        status === 'active' ? activeColor
                            : status === 'completed' ? completedColor
                                : COLORS.text.tertiary;

                    const weight = status === 'active' ? 'bold' : 'medium';

                    return (
                        <View key={`label-${index}`} style={styles.labelWrapper}>
                            <Caption
                                weight={weight}
                                style={[
                                    styles.labelText,
                                    { color: labelColor, opacity: status === 'locked' ? 0.6 : 1 }
                                ]}
                                numberOfLines={1}
                            >
                                {step.label}
                            </Caption>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

// =============================================================================
// Sub-components
// =============================================================================

interface StepCircleProps {
    index: number;
    status: 'completed' | 'active' | 'locked';
    activeColor: string;
    completedColor: string;
    lockedColor: string;
    onPress?: () => void;
    icon?: string;
    count?: number;
}

const StepCircle: React.FC<StepCircleProps> = ({
    status,
    activeColor,
    completedColor,
    lockedColor,
    onPress,
    icon,
    count
}) => {
    // Shared values for animations
    const scale = useSharedValue(1);
    const borderOpacity = useSharedValue(0);

    useEffect(() => {
        if (status === 'active') {
            scale.value = withSpring(1.15, { damping: 15 }); // Subtle pop
            borderOpacity.value = withTiming(1, { duration: 400 });
        } else {
            scale.value = withTiming(1, { duration: 300 });
            borderOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [status]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            borderColor: status === 'active' ? activeColor :
                status === 'completed' ? completedColor : lockedColor,
            backgroundColor: status === 'completed' ? completedColor :
                status === 'active' ? COLORS.surface.primary : 'transparent', // Hollow for active/locked
            borderWidth: status === 'completed' ? 0 : 2, // Filled if completed
        };
    });

    const glowStyle = useAnimatedStyle(() => ({
        opacity: borderOpacity.value,
        shadowColor: activeColor,
        shadowOpacity: interpolate(borderOpacity.value, [0, 1], [0, 0.6]),
        shadowRadius: 8,
        elevation: 5
    }));

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={status === 'locked'}
            style={styles.circleWrapper}
        >
            <Animated.View style={[styles.circle, animatedStyle, glowStyle]}>
                {status === 'completed' ? (
                    <Ionicons name="checkmark" size={16} color={COLORS.text.primary} /> // Inverted check
                ) : status === 'active' ? (
                    // Active dot in middle
                    <View style={[styles.innerDot, { backgroundColor: activeColor }]} />
                ) : (
                    // Locked - nothing or icon
                    null
                )}
            </Animated.View>

            {/* Count Badge */}
            {count !== undefined && count > 0 && (
                <View style={styles.badge}>
                    <Caption style={styles.badgeText}>{count > 99 ? '99+' : count}</Caption>
                </View>
            )}
        </TouchableOpacity>
    );
};

interface StepLineProps {
    index: number;
    activeIndex: number;
    activeColor: string;
    completedColor: string;
    lockedColor: string;
}

const StepLine: React.FC<StepLineProps> = ({
    index,
    activeIndex,
    activeColor,
    completedColor,
    lockedColor
}) => {
    // If this line connects step i to i+1
    // It is 'filled' if index < activeIndex
    // It is 'faint' if index >= activeIndex

    // Logic from user: "Line before it is filled, line after is faint"
    // So if current step is 2:
    // Line 0->1: filled
    // Line 1->2: filled (this is the line entering the active step)
    // Line 2->3: faint

    const isFilled = index < activeIndex;

    const progress = useSharedValue(isFilled ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(isFilled ? 1 : 0, { duration: 500 }); // Smooth fill
    }, [isFilled]);

    const lineStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            progress.value,
            [0, 1],
            [lockedColor, completedColor] // Use completed color for filled lines
        );
        return {
            backgroundColor: color,
        };
    });

    return (
        <View style={styles.lineWrapper}>
            <Animated.View style={[styles.line, lineStyle]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: SPACING.medium,
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.small,
    },
    circleWrapper: {
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: STEP_SIZE,
        height: STEP_SIZE,
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    innerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    lineWrapper: {
        flex: 1,
        height: LINE_HEIGHT,
        marginHorizontal: 4, // smooth connection
        backgroundColor: 'transparent', // handled by inner view
        overflow: 'hidden',
    },
    line: {
        flex: 1,
        borderRadius: 1,
    },
    labelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.small,
    },
    labelWrapper: {
        width: 70, // Fixed width to align centered text
        alignItems: 'center',
    },
    labelText: {
        fontSize: 10,
        textAlign: 'center',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.accent.primary,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        zIndex: 20,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: COLORS.background.primary,
        lineHeight: 12, // Ensure vertical centering
    }
});

export default Stepper;
