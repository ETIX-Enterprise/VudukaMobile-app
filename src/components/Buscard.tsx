import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../Pages/theme';
import type { Bus } from '../Pages/types';
import SeatBar from './Seatbar';

interface BusCardProps {
  bus: Bus;
  onSelect: () => void;
}

const BusCard: React.FC<BusCardProps> = ({ bus, onSelect }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isFull = bus.seats === 0;
  const isLow  = bus.seats > 0 && bus.seats <= 4;

  const handlePressIn = () => {
    if (isFull) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={isFull ? 1 : 0.95}
      onPress={isFull ? undefined : onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          isFull && styles.cardFull,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Top Row */}
        <View style={styles.topRow}>
          <View style={styles.identity}>
            <View style={[styles.busIcon, { backgroundColor: `${bus.color}18` }]}>
              <Text style={styles.busEmoji}>
                <Ionicons name="bus" size={20} color={bus.color} />
              </Text>
            </View>
            <View>
              <Text style={styles.busNumber}>{bus.number}</Text>
              <Text className='text-[14px] font-inter'>{bus.company}</Text>
            </View>
          </View>
          <View style={[styles.typeTag, { backgroundColor: `${bus.color}18` }]}>
            <Text style={[styles.typeTagText, { color: bus.color }]}>
              {bus.type}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Mid Row */}
        <View style={styles.midRow}>
          <View style={styles.route}>
            <View>
              <Text className='text-[10px] font-inter'>FROM</Text>
              <Text style={styles.routeValue}>{bus.from}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} className='w-4 h-4' />
            <View>
              <Text className='text-[10px] font-inter'>ETA</Text>
              <Text style={[styles.routeEta, { color: Colors.blue }]}>
                {bus.eta}
              </Text>
            </View>
          </View>
          <View style={styles.fare}>
            <Text className='text-[10px] font-inter'>FARE</Text>
            <Text style={styles.fareValue}>
              RWF{' '}
              <Text style={styles.fareAmount}>{bus.price}</Text>
            </Text>
          </View>
        </View>

        {/* Seat Bar */}
        <View style={styles.seatBarWrap}>
          <SeatBar seats={bus.seats} total={bus.totalSeats} accent={bus.color} />
        </View>

        {/* Bottom Row */}
        <View style={styles.bottomRow}>
          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text className='text-[13px] font-inter'>🕐 {bus.arrivalTime}</Text>
            </View>
            {isLow && (
              <View style={[styles.tag, styles.tagAmber]}>
                <Text style={[styles.tagText, styles.tagAmberText]}>
                  ⚡ Filling fast
                </Text>
              </View>
            )}
            {isFull && (
              <View style={[styles.tag, styles.tagRed]}>
                <Text style={[styles.tagText, styles.tagRedText]}>
                  Fully Booked
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardFull: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  busIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busEmoji: {
    fontSize: 20,
  },
  busNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  busCompany: {
    fontSize: 12,
    color: Colors.textSub,
    marginTop: 2,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLabel: {
    fontSize: 11,
    color: Colors.textSub,
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  routeArrow: {
    color: Colors.textMuted,
    paddingHorizontal: 4,
  },
  routeEta: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  fare: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    fontSize: 11,
    color: Colors.textSub,
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 1,
  },
  fareAmount: {
    fontSize: 18,
  },
  seatBarWrap: {
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSub,
    fontWeight: '500',
  },
  tagAmber: {
    backgroundColor: Colors.amberLight,
  },
  tagAmberText: {
    color: Colors.amberDark,
    fontWeight: '600',
  },
  tagRed: {
    backgroundColor: '#FEF2F2',
  },
  tagRedText: {
    color: Colors.red,
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default BusCard;