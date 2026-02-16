import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

interface SessionButtonProps {
  onPress: () => void;
  isActive?: boolean;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export const SessionButton: React.FC<SessionButtonProps> = ({
  onPress,
  isActive = false,
  isLoading = false,
  title = 'Начать сессию',
  subtitle = 'Сосредоточьтесь и работайте',
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const animatedStyle = {
    transform: [
      { scale: Animated.multiply(scaleAnim, pulseAnim) },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseBackground,
          isActive && styles.pulseBackgroundActive,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />

      <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.button,
            isActive && styles.buttonActive,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <Text style={[styles.title, isActive && styles.titleActive]}>
                {title}
              </Text>
              <Text
                style={[styles.subtitle, isActive && styles.subtitleActive]}
              >
                {subtitle}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {isActive && (
        <View style={styles.indicator}>
          <View style={styles.indicatorDot} />
          <Text style={styles.indicatorText}>Сессия активна</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  pulseBackground: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  pulseBackgroundActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  buttonWrapper: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    borderRadius: 120,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonActive: {
    backgroundColor: '#45a049',
    shadowOpacity: 0.35,
    elevation: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleActive: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  subtitleActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
});