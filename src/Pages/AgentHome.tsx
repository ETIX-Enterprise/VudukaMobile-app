import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import AppLoading from 'expo-app-loading';

const { width, height } = Dimensions.get('window');

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:         '#003DD0',
  blueDark:     '#002BA0',
  blueLight:    '#003DD014',
  blueMid:      '#003DD008',
  white:        '#FFFFFF',
  bg:           '#F7F8FC',
  text:         '#0D0D1A',
  textSub:      '#9D9DA9',
  textMuted:    '#B4B4C0',
  border:       '#ECEEF5',
  cardBg:       '#FFFFFF',
  // Accent — used sparingly
  amber:        '#F5A623',
  amberLight:   '#F5A62318',
  amberDark:    '#D4880A',
};

// ── Mock Data ─────────────────────────────────────────────────────────────────
const ROUTES = [
  {
    id: '1',
    from: 'Kigali',
    fromSub: 'Pere Stadium',
    to: 'Nyabihu',
    toSub: 'City Centre',
    dep: '08:00',
    arr: '10:30',
    date: 'Dec 21, 2025',
    duration: '3h 30m',
    seats: 4,
    price: '3,500',
  },
  {
    id: '2',
    from: 'Kigali',
    fromSub: 'Pere Stadium',
    to: 'Musanze',
    toSub: 'Main Terminal',
    dep: '09:00',
    arr: '11:15',
    date: 'Dec 21, 2025',
    duration: '2h 15m',
    seats: 2,
    price: '2,800',
  },
  {
    id: '3',
    from: 'Kigali',
    fromSub: 'Nyabugogo',
    to: 'Huye',
    toSub: 'Bus Park',
    dep: '07:30',
    arr: '10:00',
    date: 'Dec 21, 2025',
    duration: '2h 30m',
    seats: 8,
    price: '2,200',
  },
];

const QUICK_ACTIONS = [
  { id: 'a', label: 'Book Seat', icon: 'bus-outline' as const },
  { id: 'b', label: 'Trips', icon: 'receipt-outline' as const },
  { id: 'c', label: 'Discover', icon: 'compass-outline' as const },
  { id: 'd', label: 'Support', icon: 'headset-outline' as const }
];

// ── Route Card ────────────────────────────────────────────────────────────────
function RouteCard({ item, index }: { item: typeof ROUTES[0]; index: number }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1,    duration: 400, delay: 200 + index * 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,    duration: 400, delay: 200 + index * 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, delay: 200 + index * 100, useNativeDriver: true, damping: 14, stiffness: 160 } as any),
    ]).start();
  }, []);

  const isLowSeats = item.seats <= 3;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }], marginHorizontal: 20, marginBottom: 14 }}>
      <TouchableOpacity activeOpacity={0.92} style={rc.card}>

        {/* Top strip — price + seats badge */}
        <View style={rc.topRow}>
          <View style={rc.priceBadge}>
            <Text className='font-inter-semibold text-[16px] '>RWF</Text>
            <Text style={rc.priceValue}>{item.price}</Text>
          </View>

          <View style={[rc.seatsBadge, isLowSeats && rc.seatsBadgeLow]}>
            <Ionicons name="people-outline" size={11} color={isLowSeats ? C.amber : C.blue} />
            <Text style={[rc.seatsText, isLowSeats && rc.seatsTextLow]}>
              {item.seats} {isLowSeats ? 'seats left' : 'seats'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={rc.divider} />

        {/* Route block */}
        <View style={rc.routeBlock}>

          {/* FROM */}
          <View style={rc.routeCol}>
            <Text style={rc.routeTime}>{item.dep}</Text>
            <Text style={rc.routeCity}>{item.from}</Text>
            <Text className='font-inter text-[13px] text-[#666]'>{item.fromSub}</Text>
          </View>

          {/* Track connector */}
          <View style={rc.connector}>
            <View style={rc.connDot} />
            <View style={rc.connLineWrap}>
              <View style={rc.connLine} />
              <View style={rc.connPill}>
                <Ionicons name="time-outline" size={10} color={C.amber} />
                <Text style={rc.connDuration}>{item.duration}</Text>
              </View>
              <View style={rc.connLine} />
            </View>
            <View style={[rc.connDot, { backgroundColor: C.blue }]} />
          </View>

          {/* TO */}
          <View style={[rc.routeCol, rc.routeColRight]}>
            <Text style={[rc.routeTime, { color: C.blue }]}>{item.arr}</Text>
            <Text style={[rc.routeCity, { color: C.blue }]}>{item.to}</Text>
            <Text className='font-inter text-[13px] text-[#666]'>{item.toSub}</Text>
          </View>

        </View>

        {/* Bottom row */}
        <View style={rc.bottomRow}>
          <View style={rc.dateRow}>
            <Ionicons name="calendar-outline" size={12} />
            <Text className='font-inter text-[13px] text-[#666]'>{item.date}</Text>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Quick Action Chip ─────────────────────────────────────────────────────────
function QuickAction({ item }: { item: typeof QUICK_ACTIONS[0] }) {
  return (
    <TouchableOpacity style={qa.wrap} activeOpacity={0.82}>
      <View style={qa.icon}>
        <Ionicons name={item.icon} size={20} color={C.blue} />
      </View>
      <Text style={qa.label}>{item.label}</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [from,         setFrom]         = useState('');
  const [destination,  setDestination]  = useState('');
  const [date,         setDate]         = useState('');
  const [activeTab,    setActiveTab]    = useState('Home');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Entrance animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-16)).current;
  const cardOp   = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(headerY,  { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardY,  { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!fontsLoaded) return <AppLoading />;

  const focused = (f: string) => focusedField === f;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Decorative circle */}
        <View style={s.headerCircle} />

        <SafeAreaView>
          <Animated.View style={[s.headerInner, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>

            {/* Avatar */}
            <View style={s.avatar}>
              <Ionicons name="person" size={19} color={C.blue} />
            </View>

            {/* Greeting */}
            <View style={s.greetBlock}>
              <Text style={s.greetHello}>Good morning 👋</Text>
              <Text style={s.greetSub}>Find where you're heading</Text>
            </View>

            {/* Notification bell */}
            <TouchableOpacity style={s.bellWrap} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={20} color={C.white} />
              {/* Unread dot */}
              <View style={s.notifDot} />
            </TouchableOpacity>

          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── SEARCH CARD ─────────────────────────────────────────────────── */}
      <Animated.View style={[s.searchCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>

        {/* Input cluster — connected pill style */}
        <View style={s.inputCluster}>

          {/* From */}
          <View style={[s.inputRow, focused('from') && s.inputRowFocused]}>
            <View style={s.inputDot}>
              <View style={s.dotInnerHollow} />
            </View>
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="Pick-up point"
              
              style={s.inputText}
              onFocus={() => setFocusedField('from')}
              onBlur={() => setFocusedField(p => p === 'from' ? null : p)}
            />
          </View>

          {/* Connector line between inputs */}
          <View style={s.inputConnector}>
            <View style={s.inputConnectorLine} />
            <TouchableOpacity style={s.swapBtn} activeOpacity={0.75}>
              <Ionicons name="swap-vertical" size={14} color={C.blue} />
            </TouchableOpacity>
          </View>

          {/* Destination */}
          <View style={[s.inputRow, focused('dest') && s.inputRowFocused]}>
            <View style={s.inputDot}>
              <View style={s.dotInnerFilled} />
            </View>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Where to?"
              style={s.inputText}
              onFocus={() => setFocusedField('dest')}
              onBlur={() => setFocusedField(p => p === 'dest' ? null : p)}
            />
          </View>
        </View>

        {/* Date row + Search */}
        <View style={s.bottomInputRow}>
          <TouchableOpacity style={[s.dateInput, focused('date') && s.dateInputFocused]} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={15}  />
            <Text style={[ date ? { color: C.text } : {}]}>
              {date || 'Select date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.searchBtn} activeOpacity={0.87}>
            <Text className='text-white font-inter text-[13px]'>Search Now</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Quick Actions */}
        <View style={s.quickRow}>
          {QUICK_ACTIONS.map(item => <QuickAction key={item.id} item={item} />)}
        </View>

        {/* Section header */}
        <View style={s.sectionHeader}>
          <View>
            <Text className='text-[15px] font-inter font-medium'>Active Routes</Text>
          </View>
          <TouchableOpacity style={s.seeAllBtn} activeOpacity={0.7}>
            <Text className='text-[#003DD0] font-inter font-medium'>See All</Text>
            <Ionicons name="chevron-forward" size={13} color={C.blue} />
          </TouchableOpacity>
        </View>

        {/* Route cards */}
        {ROUTES.map((item, index) => (
          <RouteCard key={item.id} item={item} index={index} />
        ))}

        <View style={{ height: 110 }} />
      </ScrollView>



    </View>
  );
}

// ── Route Card Styles ─────────────────────────────────────────────────────────
const rc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceCurrency: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.textSub,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.5,
  },

  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: C.blueLight,
  },
  seatsBadgeLow: {
    backgroundColor: C.amberLight,
  },
  seatsText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.blue,
  },
  seatsTextLow: {
    color: C.amberDark,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 16,
  },

  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  routeCol: { flex: 1 },
  routeColRight: { alignItems: 'flex-end' },

  routeTime: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: C.text,
    letterSpacing: -1,
    lineHeight: 28,
  },
  routeCity: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.text,
    marginTop: 2,
  },
  routeSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
    marginTop: 1,
  },

  connector: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: C.textMuted,
  },
  connLineWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  connLine: {
    width: '100%',
    height: 1,
    backgroundColor: C.border,
  },
  connPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: C.amberLight,
    marginVertical: 4,
  },
  connDuration: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: C.amberDark,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
  },

  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.blue,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
  },
  bookBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.white,
  },
});

// ── Quick Action Styles ───────────────────────────────────────────────────────
const qa = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.text,
    letterSpacing: 0.1,
  },
});

// ── Main Styles ───────────────────────────────────────────────────────────────
const HEADER_H = Platform.OS === 'ios' ? 210 : 190;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "white",
  },

  // ── Header
  header: {
    height: HEADER_H,
    backgroundColor: C.blue,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100,
    right: -60,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 44,
    gap: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  greetBlock: { flex: 1 },
  greetHello: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: C.white,
    letterSpacing: -0.3,
  },
  greetSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  bellWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: C.amber,
    borderWidth: 1.5,
    borderColor: C.blue,
  },

  // ── Search Card
  searchCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -64,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },

  // Uber-style connected inputs
  inputCluster: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: C.bg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.white,
  },
  inputRowFocused: {
    backgroundColor: '#F0F4FF',
  },
  inputDot: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  dotInnerHollow: {
    width: 10,
    height: 10,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: C.textSub,
  },
  dotInnerFilled: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: C.blue,
  },
  inputText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    padding: 0,
  },

  inputConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 10,
    height: 1,
    backgroundColor: C.border,
  },
  inputConnectorLine: {
    flex: 1,
  },
  swapBtn: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginVertical: -14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Date + Search row
  bottomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bg,
  },
  dateInputFocused: {
    borderColor: C.blue,
  },
  dateInputText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textMuted,
  },

  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.blue,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  searchBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.1,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  // ── Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.blue,
  },

  // ── Bottom Nav
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 14 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navIconWrap: {
    width: 40,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: C.blueLight,
  },
  navLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textSub,
  },
  navLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: C.blue,
  },
});