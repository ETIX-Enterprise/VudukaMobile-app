import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from './theme';
import { BUSES, FILTERS } from './data';
import type { Bus, FilterKey, RootStackParamList } from './types';
import BusCard from '../components/Buscard';
import PaymentModal from '../components/Paymentmodal';

type Props = NativeStackScreenProps<RootStackParamList, 'Discover'>;

const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter]         = useState<FilterKey>('all');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const filtered: Bus[] = BUSES.filter(b => {
    if (filter === 'available') return b.seats > 0;
    if (filter === 'express')   return b.type === 'Express';
    if (filter === 'vip')       return b.type === 'VIP';
    return true;
  });

  const totalSeatsLeft = BUSES.reduce((acc, b) => acc + b.seats, 0);
  const fullCount      = BUSES.filter(b => b.seats === 0).length;

  const stats = [
    { label: 'Arriving Today',  value: BUSES.length, color: Colors.blue },
    { label: 'Seats Available', value: totalSeatsLeft, color: Colors.green },
    { label: 'Fully Booked',    value: fullCount,    color: Colors.amberDark },
  ];

  const handleSelectBus = (bus: Bus): void => {
    if (bus.seats > 0) setSelectedBus(bus);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[Colors.blue, Colors.blueDark]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          {/* Title row */}
          <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={13} className='text-white' />
            </TouchableOpacity>
            <View>
              <Text className='font-inter-bold text-white text-[18px]'>Discover</Text>
            </View>

          </View>
        </LinearGradient>

        {/* ── Filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          style={styles.filtersScroll}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip,
                filter === f.id && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.id && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── List Header ── */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderCount}>
            {filtered.length} bus{filtered.length !== 1 ? 'es' : ''} found
          </Text>
          <Text className='text-[12px] text-gray-500'>Updated just now</Text>
        </View>

        {/* ── Bus Cards ── */}
        <View style={styles.cardList}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No buses match this filter</Text>
              <Text style={styles.emptySub}>Try a different category</Text>
            </View>
          ) : (
            filtered.map(bus => (
              <BusCard
                key={bus.id}
                bus={bus}
                onSelect={() => handleSelectBus(bus)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Payment Modal ── */}
      {selectedBus !== null && (
        <PaymentModal
          bus={selectedBus}
          visible={selectedBus !== null}
          onClose={() => setSelectedBus(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -90,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.7,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.62)',
    marginTop: 3,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204,26,26,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(204,26,26,0.45)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reportBtnIcon: {
    fontSize: 13,
  },
  reportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB3B3',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    padding: 12,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 1,
    letterSpacing: -0.3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  liveText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  // Filters
  filtersScroll: {
    marginTop: 14,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 26,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '400',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  // List
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  listHeaderCount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  listHeaderSub: {
    fontSize: 12,
    color: Colors.textSub,
  },
  cardList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSub,
    marginTop: 6,
  },
});

export default DiscoverScreen;