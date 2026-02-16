import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface EmotionCardProps {
  emotion: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    gradientColors: string[];
    description: string;
  };
  index: number;
  totalCards: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPress?: () => void;
  isActive: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const EmotionCard: React.FC<EmotionCardProps> = ({
  emotion,
  index,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  isActive,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, {
          duration: 300,
        });
        translateY.value = withTiming(event.translationY, { duration: 300 });

        setTimeout(() => {
          if (direction > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (direction < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }, 300);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(isActive)
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      if (onPress) {
        onPress();
      }
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => {
    const stackOffset = (totalCards - index - 1) * 10;
    const stackScale = 1 - (totalCards - index - 1) * 0.05;

    return {
      transform: [
        { translateX: isActive ? translateX.value : 0 },
        { translateY: isActive ? translateY.value : stackOffset },
        { rotate: isActive ? `${rotate.value}deg` : '0deg' },
        { scale: isActive ? scale.value : stackScale },
      ],
      opacity: interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [1, 0.5],
        Extrapolate.CLAMP
      ),
      zIndex: totalCards - index,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <AnimatedTouchable
        style={[styles.card, cardStyle]}
        activeOpacity={1}
        disabled={!isActive}
      >
        <LinearGradient
          colors={emotion.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{emotion.emoji}</Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.emotionName}>{emotion.name}</Text>
              <Text style={styles.emotionDescription}>
                {emotion.description}
              </Text>
            </View>

            <View style={styles.swipeHint}>
              <Text style={styles.swipeHintText}>
                Свайп влево/вправо или нажмите
              </Text>
            </View>
          </View>

          <Animated.View style={[styles.likeLabel, likeOpacityStyle]}>
            <Text style={styles.labelText}>✓ ВЫБРАТЬ</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeLabel, nopeOpacityStyle]}>
            <Text style={styles.labelText}>✗ ПРОПУСТИТЬ</Text>
          </Animated.View>
        </LinearGradient>
      </AnimatedTouchable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  emojiContainer: {
    marginTop: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emotionName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emotionDescription: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
    opacity: 0.95,
  },
  swipeHint: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 20,
  },
  swipeHintText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    borderWidth: 4,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    transform: [{ rotate: '15deg' }],
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    borderWidth: 4,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    transform: [{ rotate: '-15deg' }],
  },
  labelText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});