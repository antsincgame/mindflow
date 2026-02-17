import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export interface WeeklyDataPoint {
  day: string;
  value: number;
  date: Date;
}

interface WeeklyChartProps {
  data: WeeklyDataPoint[];
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View key={index} style={styles.bar}>
          <Animated.View style={[styles.barFill, { height: item.value }]} />
          <Text style={styles.label}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  bar: {
    alignItems: 'center',
  },
  barFill: {
    width: 30,
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
  },
});

export default WeeklyChart;