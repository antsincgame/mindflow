import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';

interface MoodEmojiProps {
  emoji: string;
  size?: number;
  style?: ViewStyle;
  animationDuration?: number;
}

const MoodEmoji: React.FC<MoodEmojiProps> = ({
  emoji,
  size = 80,
  style,
  animationDuration = 300,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const prevEmoji = useRef(emoji);

  useEffect(() => {
    if (prevEmoji.current !== emoji) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.5,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      prevEmoji.current = emoji;
    }
  }, [emoji, scaleAnim, opacityAnim, animationDuration]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.emojiContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size }]}>{emoji}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});

export default MoodEmoji;