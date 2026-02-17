import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimerProps {
  duration: number;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, isActive }) => {
  return (
    <View style={styles.container}>
      <Svg width={200} height={200}>
        <Circle cx={100} cy={100} r={80} stroke="#6C63FF" strokeWidth={8} fill="none" />
      </Svg>
      <Text style={styles.timeText}>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    position: 'absolute',
  },
});

export default Timer;