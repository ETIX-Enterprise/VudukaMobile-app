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

const { width } = Dimensions.get('window');

// ── Design tokens — dashboard parity ─────────────────────────────────────────
// Primary: #003DD0 (brand blue) · Secondary: #008A75 (nav-active green)
const C = {
  blue:        '#003DD0',
  blueAccent:  '#0075A8',
  blueLight:   '#003DD010',
  blueMid:     '#003DD008',
  green:       '#008A75',
  greenLight:  '#008A7512',
  greenDark:   '#006B5B',
  white:       '#FFFFFF',
  bg:          '#f8fafc',   // dashboard sidebar bg
  text:        '#0f172a',   // dashboard main text
  textSub:     '#64748b',   // dashboard .nav-link
  textMuted:   '#94a3b8',   // dashboard .sec-label
  border:      '#e2e8f0',   // dashboard .nav-div
  amber:       '#F5A623',
  amberLight:  '#F5A62318',
  amberDark:   '#D4880A',
};

// ── Mock Data ─────────────────────────────────────────────────────────────────
const ROUTES = [
  {
    id: '1',
    from: 'Kigali',      fromSub: 'Nyabugogo',
    to:   'Nyabihu',     toSub:   'City Centre',
    dep:  '08:00',       arr:     '10:30',
    date: 'Dec 21, 2025', duration: '2h 30m',
    seats: 4,            price: '3,500',
  },
  {
    id: '2',
    from: 'Kigali',      fromSub: 'Nyabugogo',
    to:   'Musanze',     toSub:   'Main Terminal',
    dep:  '09:00',       arr:     '11:15',
    date: 'Dec 21, 2025', duration: '2h 15m',
    seats: 2,            price: '2,800',
  },
  {
    id: '3',
    from: 'Kigali',      fromSub: 'Nyabugogo',
    to:   'Huye',        toSub:   'Bus Park',
    dep:  '07:30',       arr:     '10:00',
    date: 'Dec 21, 2025', duration: '2h 30m',
    seats: 8,            price: '2,200',
  },
];

const QUICK_ACTIONS = [
  { id: 'a', label: 'Book Seat',  icon: 'bus-outline'      as const, color: C.blue  },
  { id: 'b', label: 'My Trips',   icon: 'receipt-outline'  as const, color: C.green },
  { id: 'c', label: 'Discover',   icon: 'compass-outline'  as const, color: C.blue  },
  { id: 'd', label: 'Support',    icon: 'headset-outline'  as const, color: C.green },
];

// ── Route Card ────────────────────────────────────────────────────────────────
function RouteCard({ item, index }: { item: typeof ROUTES[0]; index: number }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, delay: 100 + index * 90, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, delay: 100 + index * 90, useNativeDriver: true }),
    ]).start();
  }, []);

  const isLowSeats = item.seats <= 3;

  return (
    <Animated.View style={[rc.wrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.90} style={rc.card}>

        {/* ── Top row: price + seats badge ── */}
        <View style={rc.topRow}>
          <View style={rc.priceGroup}>
            <Text style={rc.priceCurrency}>RWF</Text>
            <Text style={rc.priceValue}>{item.price}</Text>
          </View>

          <View style={[rc.badge, isLowSeats ? rc.badgeAmber : rc.badgeGreen]}>
            <Ionicons name="people-outline" size={10} color={isLowSeats ? C.amberDark : C.greenDark} />
            <Text style={[rc.badgeText, { color: isLowSeats ? C.amberDark : C.greenDark }]}>
              {item.seats} {isLowSeats ? 'seats left' : 'available'}
            </Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={rc.divider} />

        {/* ── Route block ── */}
        <View style={rc.routeBlock}>

          {/* FROM */}
          <View style={rc.routeCol}>
            <Text style={rc.time}>{item.dep}</Text>
            <Text style={rc.city}>{item.from}</Text>
            <Text style={rc.sub}>{item.fromSub}</Text>
          </View>

          {/* Connector */}
          <View style={rc.connector}>
            <View style={[rc.connDot, { backgroundColor: C.textMuted }]} />
            <View style={rc.connTrack}>
              <View style={rc.connLine} />
              <View style={rc.connPill}>
                <Ionicons name="time-outline" size={9} color={C.amberDark} />
                <Text style={rc.connDuration}>{item.duration}</Text>
              </View>
              <View style={rc.connLine} />
            </View>
            <View style={[rc.connDot, { backgroundColor: C.green }]} />
          </View>

          {/* TO */}
          <View style={[rc.routeCol, rc.routeColRight]}>
            <Text style={[rc.time, { color: C.green }]}>{item.arr}</Text>
            <Text style={[rc.city, { color: C.green }]}>{item.to}</Text>
            <Text style={[rc.sub, { textAlign: 'right' }]}>{item.toSub}</Text>
          </View>
        </View>

        {/* ── Bottom row ── */}
        <View style={rc.divider} />
        <View style={rc.bottomRow}>
          <View style={rc.dateGroup}>
            <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
            <Text style={rc.dateText}>{item.date}</Text>
          </View>
          <TouchableOpacity style={rc.bookBtn} activeOpacity={0.85}>
            <Text style={rc.bookBtnText}>Book now</Text>
            <Ionicons name="arrow-forward" size={12} color={C.white} />
          </TouchableOpacity>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Quick Action ──────────────────────────────────────────────────────────────
function QuickAction({ item }: { item: typeof QUICK_ACTIONS[0] }) {
  const bg = item.color === C.green ? C.greenLight : C.blueLight;
  return (
    <TouchableOpacity style={qa.wrap} activeOpacity={0.80}>
      <View style={[qa.icon, { backgroundColor: bg }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={qa.label}>{item.label}</Text>
    </TouchableOpacity>
  );
}

// ── Stats Strip ───────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { label: 'Active Routes', value: '48',   color: C.blue  },
    { label: 'Students Safe', value: '2.4K', color: C.green },
    { label: 'On Time',        value: '97%',  color: C.blue  },
  ];
  return (
    <View style={ss.strip}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <View style={ss.sep} />}
          <View style={ss.item}>
            <Text style={[ss.value, { color: s.color }]}>{s.value}</Text>
            <Text style={ss.label}>{s.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
const HEADER_H = Platform.OS === 'ios' ? 220 : 200;

export default function HomeScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [from,         setFrom]         = useState('');
  const [destination,  setDestination]  = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-14)).current;
  const cardOp   = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerY,  { toValue: 0, duration: 500, useNativeDriver: true }),
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

      {/* ── HEADER ── */}
      <View style={[s.header, { height: HEADER_H }]}>
        {/* Decorative circles */}
        <View style={s.circle1} />
        <View style={s.circle2} />

        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View style={[s.headerInner, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>

            {/* Avatar */}
            <View style={s.avatar}>
              <Ionicons name="person" size={18} color={C.blue} />
            </View>

            {/* Greeting */}
            <View style={s.greetBlock}>
              {/* Eyebrow — mirrors dashboard .sec-label */}
              <View style={s.eyebrow}>
                <View style={s.eyebrowDot} />
                <Text style={s.eyebrowText}>STUDENT TRANSPORT</Text>
              </View>
              <Text style={s.greetHello}>Good morning 👋</Text>
              <Text style={s.greetSub}>Find where you're heading</Text>
            </View>

            {/* Bell */}
            <TouchableOpacity style={s.bellWrap} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={19} color={C.white} />
              <View style={s.notifDot} />
            </TouchableOpacity>

          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── SEARCH CARD (overlaps header) ── */}
      <Animated.View style={[s.searchCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>

        {/* Connected input cluster — Uber style */}
        <View style={s.inputCluster}>

          {/* From */}
          <View style={[s.inputRow, focused('from') && s.inputRowFocused]}>
            <View style={s.dotWrap}>
              <View style={s.dotHollow} />
            </View>
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="Pick-up point"
              placeholderTextColor={C.textMuted}
              style={s.inputText}
              onFocus={() => setFocusedField('from')}
              onBlur={() => setFocusedField(p => p === 'from' ? null : p)}
            />
          </View>

          {/* Divider + swap */}
          <View style={s.clusterSep}>
            <View style={s.clusterSepLine} />
            <TouchableOpacity style={s.swapBtn} activeOpacity={0.75}>
              <Ionicons name="swap-vertical" size={13} color={C.blue} />
            </TouchableOpacity>
          </View>

          {/* Destination */}
          <View style={[s.inputRow, focused('dest') && s.inputRowFocused]}>
            <View style={s.dotWrap}>
              <View style={s.dotFilled} />
            </View>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Where to?"
              placeholderTextColor={C.textMuted}
              style={s.inputText}
              onFocus={() => setFocusedField('dest')}
              onBlur={() => setFocusedField(p => p === 'dest' ? null : p)}
            />
          </View>
        </View>

        {/* Date + Search */}
        <View style={s.cardBottomRow}>
          <TouchableOpacity style={s.dateBtn} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={14} color={C.textSub} />
            <Text style={s.dateBtnText}>Select date</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.searchBtn} activeOpacity={0.87}>
            <Ionicons name="search-outline" size={14} color={C.white} />
            <Text style={s.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* ── SCROLLABLE BODY ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats strip — mirrors dashboard StatSummaryCard */}
        <StatsStrip />

        {/* Quick Actions */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Quick actions</Text>
        </View>
        <View style={s.quickRow}>
          {QUICK_ACTIONS.map(item => <QuickAction key={item.id} item={item} />)}
        </View>

        {/* Active Routes */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Active routes</Text>
            <Text style={s.sectionSub}>Today · Dec 21, 2025</Text>
          </View>
          <TouchableOpacity style={s.seeAllBtn} activeOpacity={0.7}>
            <Text style={s.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={12} color={C.blueAccent} />
          </TouchableOpacity>
        </View>

        {ROUTES.map((item, index) => (
          <RouteCard key={item.id} item={item} index={index} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Route Card Styles ─────────────────────────────────────────────────────────
const rc = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceCurrency: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: C.textSub,
    letterSpacing: 0.6,
  },
  priceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.text,
    letterSpacing: -0.8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeGreen: { backgroundColor: C.greenLight },
  badgeAmber: { backgroundColor: C.amberLight },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCol: { flex: 1 },
  routeColRight: { alignItems: 'flex-end' },
  time: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: C.text,
    letterSpacing: -1,
    lineHeight: 26,
  },
  city: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.text,
    marginTop: 2,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
    marginTop: 1,
  },
  connector: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  connTrack: {
    width: '100%',
    alignItems: 'center',
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
    fontSize: 9,
    color: C.amberDark,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
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
    backgroundColor: C.green,   // green CTA — mirrors nav-active
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    gap: 7,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 16,
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

// ── Stats Strip Styles ────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -1,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textSub,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  sep: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
});

// ── Main Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.blue,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -120,
    right: -70,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -60,
    left: -30,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 42,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  greetBlock: { flex: 1 },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: C.green,        // #008A75 — nav-active
  },
  eyebrowText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greetHello: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.4,
  },
  greetSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  bellWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: C.amber,
    borderWidth: 1.5,
    borderColor: C.blue,
  },

  // ── Search Card ─────────────────────────────────────────────────────────────
  searchCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -48,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 6,
  },

  inputCluster: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: C.bg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: C.white,
    gap: 12,
  },
  inputRowFocused: {
    backgroundColor: '#EEF3FF',
    borderColor: C.blue,
  },
  dotWrap: {
    width: 18,
    alignItems: 'center',
  },
  dotHollow: {
    width: 10,
    height: 10,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: C.textSub,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: C.green,    // destination dot = green
  },
  inputText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
    padding: 0,
  },

  clusterSep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 10,
    height: 1,
    backgroundColor: C.border,
  },
  clusterSepLine: { flex: 1 },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bg,
  },
  dateBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textMuted,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.blue,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: C.white,
    letterSpacing: 0.1,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
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
    fontSize: 12,
    color: C.blueAccent,   // #0075A8 — dashboard accent
  },
});