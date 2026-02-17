import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type ChartType = 'line' | 'bar' | 'pie';

interface ChartProps {
  type: ChartType;
  data: number[];
}

const Chart: React.FC<ChartProps> = ({ type, data }) => {
  return (
    <View style={styles.container}>
      <Svg width={200} height={200}>
        <Circle cx={100} cy={100} r={50} fill="#6C63FF" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Chart;