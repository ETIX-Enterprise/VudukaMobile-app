import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../Pages/theme';

interface SeatBarProps {
  seats: number;
  total: number;
  accent: string;
}

const SeatBar: React.FC<SeatBarProps> = ({ seats, total, accent }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.round(((total - seats) / total) * 100);

  const labelColor =
    seats === 0 ? Colors.red : seats <= 4 ? Colors.amberDark : Colors.green;
  const barColor =
    seats === 0 ? Colors.red : seats <= 4 ? Colors.amber : accent;
  const label = seats === 0 ? 'Full' : `${seats} left`;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct, fillAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text className='text-[14px] font-inter'>Seat availability</Text>
        <Text style={[styles.headerCount, { color: labelColor }]}>{label}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: fillAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    color: Colors.textSub,
    fontWeight: '500',
  },
  headerCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 5,
    borderRadius: 99,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});

export default SeatBar;