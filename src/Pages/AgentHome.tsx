import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Animated, RefreshControl, Dimensions,
  Modal, FlatList, ActivityIndicator, KeyboardAvoidingView,
  Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../contexts/authContext';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:      '#0075A8',
  green:     '#008A75',
  blueSoft:  '#EEF6FB',
  greenSoft: '#F0FAF7',
  white:     '#FFFFFF',
  bg:        '#f8fafc',
  text:      '#0f172a',
  textSub:   '#64748b',
  textMuted: '#94a3b8',
  border:    '#e2e8f0',
  error:     '#DC2626',
  errorBg:   '#FEF2F2',
  amber:     '#D97706',
  amberBg:   '#FEF9C3',
  overlay:   'rgba(15,23,42,0.55)',
};

const { width: SW, height: SH } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────────────────────
interface Journey {
  id: string;
  journeyCode?: string;
  status: string;
  type?: string;
  passengersCount?: number;
  departureTime?: string;
  scheduledDeparture?: string;
  route?: { id?: string; name?: string; origin?: string; destination?: string } | null;
  bus?: { plateNumber?: string; capacity?: number } | null;
  driver?: { name?: string } | null;
}

interface RoutePrice {
  id: string;
  name: string;
  corridorKey: string;
  startPoint: string;
  endPoint: string;
  price: number;
}

// Booking flow steps
type BookingStep = 'idle' | 'selectRoute' | 'selectJourney' | 'passengerDetails' | 'payment' | 'success';

interface BookingState {
  step: BookingStep;
  selectedRoute: RoutePrice | null;
  selectedJourney: Journey | null;
  passengerName: string;
  passengerPhone: string;
  payerPhone: string;
  payerName: string;
  // result
  ticketCode: string | null;
  bookingCode: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Good night';
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' });
}

function seatsLeft(j: Journey): number | null {
  if (!j.bus?.capacity) return null;
  return Math.max(0, j.bus.capacity - (j.passengersCount ?? 0));
}

function fmtRWF(amount: number): string {
  return `${amount.toLocaleString('en-RW')} RWF`;
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skel({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: C.border, opacity: op }} />;
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip({ journeys }: { journeys: Journey[] }) {
  const live     = journeys.filter(j => j.status === 'in_progress').length;
  const totalPax = journeys.reduce((a, j) => a + (j.passengersCount ?? 0), 0);
  const done     = journeys.filter(j => j.status === 'completed').length;
  return (
    <View style={strip.card}>
      {[
        { label: 'Active', value: journeys.length, color: C.blue  },
        { label: 'Live',   value: live,            color: C.green },
        { label: 'Pax',    value: totalPax,        color: C.blue  },
        { label: 'Done',   value: done,            color: C.green },
      ].map((it, i, arr) => (
        <React.Fragment key={it.label}>
          <View style={strip.item}>
            <Text style={[strip.val, { color: it.color }]}>{it.value}</Text>
            <Text style={strip.lbl}>{it.label}</Text>
          </View>
          {i < arr.length - 1 && <View style={strip.sep} />}
        </React.Fragment>
      ))}
    </View>
  );
}
const strip = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 14, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  val:  { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.8 },
  lbl:  { fontFamily: 'Inter_400Regular', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.5 },
  sep:  { width: 1, backgroundColor: C.border, marginVertical: 4 },
});

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction }: {
  title: string; sub?: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={sh.row}>
      <View style={{ flex: 1 }}>
        <Text style={sh.title}>{title}</Text>
        {sub && <Text style={sh.sub}>{sub}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={onAction} style={sh.btn} activeOpacity={0.7}>
          <Text style={sh.btnText}>{action}</Text>
          <Ionicons name="chevron-forward" size={12} color={C.blue} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  title:   { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.text, letterSpacing: -0.3 },
  sub:     { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textSub, marginTop: 2 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.blue },
});

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'book',    label: 'Book a Seat',  icon: 'bus-outline'      as const, color: C.blue  },
  { id: 'trips',   label: 'My Bookings',  icon: 'receipt-outline'  as const, color: C.green },
  { id: 'scan',    label: 'Scan Ticket',  icon: 'qr-code-outline'  as const, color: C.blue  },
  { id: 'support', label: 'Get Support',  icon: 'headset-outline'  as const, color: C.green },
];

function ActionBtn({ item, onPress }: { item: typeof QUICK_ACTIONS[0]; onPress?: () => void }) {
  const isBlue = item.color === C.blue;
  return (
    <TouchableOpacity style={ab.btn} activeOpacity={0.75} onPress={onPress}>
      <View style={[ab.icon, { backgroundColor: isBlue ? C.blueSoft : C.greenSoft }]}>
        <Ionicons name={item.icon} size={17} color={item.color} />
      </View>
      <Text style={ab.label}>{item.label}</Text>
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  btn:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 11 },
  icon:  { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.text, flex: 1 },
});

// ── Journey card ──────────────────────────────────────────────────────────────
function JourneyCard({ item, onBook }: { item: Journey; onBook: (j: Journey) => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const seats     = seatsLeft(item);
  const isLow     = seats !== null && seats > 0 && seats <= 5;
  const isFull    = seats === 0;
  const seatColor = isFull ? C.error : isLow ? C.amber : C.green;
  const seatBg    = isFull ? C.errorBg : isLow ? C.amberBg : C.greenSoft;
  const dep       = item.scheduledDeparture ?? item.departureTime;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 12 }}>
      <View style={jc.card}>
        <View style={jc.topRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={jc.routeName} numberOfLines={1}>
              {item.route?.name
                ?? [item.route?.origin, item.route?.destination].filter(Boolean).join(' → ')
                ?? '—'}
            </Text>
            <Text style={jc.code}>{item.journeyCode ?? item.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          {seats !== null && (
            <View style={[jc.badge, { backgroundColor: seatBg }]}>
              <Ionicons name="people-outline" size={10} color={seatColor} />
              <Text style={[jc.badgeText, { color: seatColor }]}>
                {isFull ? 'Full' : `${seats} left`}
              </Text>
            </View>
          )}
        </View>
        <View style={jc.divider} />
        <View style={jc.routeRow}>
          <View style={{ flex: 1 }}>
            <Text style={jc.time}>{fmtTime(dep)}</Text>
            <Text style={jc.city} numberOfLines={1}>{item.route?.origin ?? '—'}</Text>
          </View>
          <View style={jc.connector}>
            <View style={[jc.dot, { backgroundColor: C.textMuted }]} />
            <View style={jc.connTrack}>
              <View style={jc.line} />
              <View style={jc.pill}>
                <Ionicons name="bus-outline" size={9} color={C.blue} />
                <Text style={jc.pillText}>{item.bus?.plateNumber ?? 'TBA'}</Text>
              </View>
              <View style={jc.line} />
            </View>
            <View style={[jc.dot, { backgroundColor: C.green }]} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[jc.time, { color: C.green }]}>—</Text>
            <Text style={[jc.city, { color: C.green, textAlign: 'right' }]} numberOfLines={1}>
              {item.route?.destination ?? '—'}
            </Text>
          </View>
        </View>
        <View style={jc.divider} />
        <View style={jc.bottomRow}>
          <View style={jc.driverRow}>
            <Ionicons name="person-circle-outline" size={14} color={C.textMuted} />
            <Text style={jc.driverText} numberOfLines={1}>{item.driver?.name ?? 'Driver TBA'}</Text>
          </View>
          <TouchableOpacity
            style={[jc.bookBtn, isFull && jc.bookBtnFull]}
            activeOpacity={0.85}
            disabled={isFull}
            onPress={() => onBook(item)}
            onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, damping: 20 }).start()}
            onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 20 }).start()}
          >
            <Text style={jc.bookBtnText}>{isFull ? 'Full' : 'Book now'}</Text>
            {!isFull && <Ionicons name="arrow-forward" size={12} color={C.white} />}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
const jc = StyleSheet.create({
  card:      { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  routeName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  code:      { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 2 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  divider:   { height: 1, backgroundColor: C.border, marginVertical: 14 },
  routeRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time:      { fontFamily: 'Inter_700Bold', fontSize: 20, color: C.text, letterSpacing: -0.8 },
  city:      { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.text, marginTop: 2 },
  connector: { flex: 0.6, alignItems: 'center' },
  dot:       { width: 7, height: 7, borderRadius: 99 },
  connTrack: { width: '100%', alignItems: 'center', paddingVertical: 3 },
  line:      { width: '80%', height: 1, backgroundColor: C.border },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.blueSoft, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99, marginVertical: 4 },
  pillText:  { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: C.blue },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  driverText:{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub, flex: 1 },
  bookBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.green, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, shadowColor: C.green, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  bookBtnFull:{ backgroundColor: C.textMuted, shadowOpacity: 0, elevation: 0 },
  bookBtnText:{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.white },
});

// ── Search cluster ─────────────────────────────────────────────────────────────
function SearchCluster({ from, setFrom, to, setTo, focused, setFocused }: {
  from: string; setFrom: (v: string) => void;
  to: string;   setTo:   (v: string) => void;
  focused: string | null; setFocused: (v: string | null) => void;
}) {
  const f = (field: string) => focused === field;
  return (
    <View style={sc.cluster}>
      <View style={[sc.row, f('from') && sc.rowFocused]}>
        <View style={sc.dotHollow} />
        <TextInput
          value={from} onChangeText={setFrom}
          placeholder="From — pick-up point"
          placeholderTextColor={C.textMuted}
          style={sc.input}
          onFocus={() => setFocused('from')}
          onBlur={() => setFocused(null)}
          returnKeyType="next"
        />
      </View>
      <View style={sc.sepRow}>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        <TouchableOpacity
          style={sc.swapBtn} activeOpacity={0.75}
          onPress={() => { const t = from; setFrom(to); setTo(t); }}
        >
          <Ionicons name="swap-vertical" size={13} color={C.blue} />
        </TouchableOpacity>
      </View>
      <View style={[sc.row, f('to') && sc.rowFocused]}>
        <View style={sc.dotFilled} />
        <TextInput
          value={to} onChangeText={setTo}
          placeholder="To — destination"
          placeholderTextColor={C.textMuted}
          style={sc.input}
          onFocus={() => setFocused('to')}
          onBlur={() => setFocused(null)}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  cluster:   { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, overflow: 'hidden', backgroundColor: C.bg, marginBottom: 10 },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.white, gap: 12 },
  rowFocused:{ backgroundColor: '#EEF3FF', borderColor: C.blue },
  dotHollow: { width: 10, height: 10, borderRadius: 99, borderWidth: 2, borderColor: C.textSub },
  dotFilled: { width: 10, height: 10, borderRadius: 99, backgroundColor: C.green },
  input:     { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, padding: 0, margin: 0 },
  sepRow:    { flexDirection: 'row', alignItems: 'center', paddingLeft: 26, paddingRight: 10, height: 1, backgroundColor: C.border },
  swapBtn:   { width: 28, height: 28, borderRadius: 99, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginVertical: -14, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING FLOW MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  authFetch: (url: string, opts?: any) => Promise<any>;
  initialJourney?: Journey | null;
}

function BookingModal({ visible, onClose, authFetch, initialJourney }: BookingModalProps) {
  const slideAnim = useRef(new Animated.Value(SH)).current;

  const [step,            setStep]            = useState<BookingStep>(initialJourney ? 'passengerDetails' : 'selectRoute');
  const [selectedRoute,   setSelectedRoute]   = useState<RoutePrice | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(initialJourney ?? null);
  const [passengerName,   setPassengerName]   = useState('');
  const [payerPhone,      setPayerPhone]      = useState('');
  const [payerName,       setPayerName]       = useState('');
  const [routes,          setRoutes]          = useState<RoutePrice[]>([]);
  const [journeys,        setJourneys]        = useState<Journey[]>([]);
  const [routeSearch,     setRouteSearch]     = useState('');
  const [loading,         setLoading]         = useState(false);
  const [paying,          setPaying]          = useState(false);
  const [ticketCode,      setTicketCode]      = useState<string | null>(null);
  const [bookingCode,     setBookingCode]      = useState<string | null>(null);
  const [error,           setError]           = useState<string | null>(null);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }).start();
      // Reset if opened fresh (no initial journey)
      if (!initialJourney) {
        setStep('selectRoute');
        setSelectedRoute(null);
        setSelectedJourney(null);
      } else {
        setStep('passengerDetails');
        setSelectedJourney(initialJourney);
        setSelectedRoute(null);
      }
      setPassengerName('');
      setPayerPhone('');
      setPayerName('');
      setTicketCode(null);
      setBookingCode(null);
      setError(null);
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 280, useNativeDriver: true }).start();
    }
  }, [visible, initialJourney]);

  // Fetch routes
  useEffect(() => {
    if (visible && step === 'selectRoute') {
      setLoading(true);
      authFetch(`/route-prices/booking?limit=100&search=${encodeURIComponent(routeSearch)}`)
        .then((res: any) => setRoutes(res?.routes ?? []))
        .catch(() => setRoutes([]))
        .finally(() => setLoading(false));
    }
  }, [visible, step, routeSearch]);

  // Fetch journeys for selected route
  useEffect(() => {
    if (step === 'selectJourney' && selectedRoute) {
      setLoading(true);
      // Fetch pending/in_progress journeys matching the route's origin/destination
      authFetch(`/journeys?status=pending&limit=50`)
        .then((res: any) => {
          const all: Journey[] = Array.isArray(res?.data) ? res.data : [];
          // Filter to journeys whose route matches origin→destination
          const matched = all.filter(j => {
            const o = (j.route?.origin ?? '').toLowerCase();
            const d = (j.route?.destination ?? '').toLowerCase();
            return o.includes(selectedRoute.startPoint.toLowerCase()) &&
                   d.includes(selectedRoute.endPoint.toLowerCase());
          });
          setJourneys(matched);
        })
        .catch(() => setJourneys([]))
        .finally(() => setLoading(false));
    }
  }, [step, selectedRoute]);

  const handleSelectRoute = (route: RoutePrice) => {
    setSelectedRoute(route);
    setStep('selectJourney');
  };

  const handleSelectJourney = (journey: Journey) => {
    setSelectedJourney(journey);
    setStep('passengerDetails');
  };

  const handleProceedToPayment = () => {
    if (!passengerName.trim()) { setError('Please enter the passenger name'); return; }
    if (!payerPhone.trim())    { setError('Please enter payer phone number'); return; }
    if (payerPhone.replace(/\D/g, '').length < 10) { setError('Enter a valid phone number (e.g. 0788123456)'); return; }
    setError(null);
    setStep('payment');
  };

  const handlePay = async () => {
    if (!selectedJourney) return;
    if (!payerPhone.trim()) { setError('Payer phone is required'); return; }

    const amount = selectedRoute?.price ?? 0;
    if (amount <= 0) { setError('Invalid route price'); return; }

    setPaying(true);
    setError(null);

    try {
      // The backend createSingleBooking requires studentId — for individual/parent bookings
      // the passenger IS the student. We pass phone as studentId fallback.
      // The backend's SingleBookingService also needs a studentId (UUID), so we use
      // the user's own profile ID or a placeholder. In a real app you'd have a student
      // record tied to the parent's account. We send the request and let backend validate.
      const res = await authFetch('/bookings/single', {
        method: 'POST',
        body: JSON.stringify({
          journeyId:  selectedJourney.id,
          payerPhone: payerPhone.replace(/\s/g, ''),
          payerName:  payerName.trim() || passengerName.trim(),
          amount,
          // studentId is required by backend — in a real app this comes from the user's
          // linked student profile. We surface this field for proper integration:
          studentId: null, // Replace with actual student ID from user profile
        }),
      });

      const ticket = res?.ticketCode ?? res?.data?.ticketCode ?? null;
      const bCode  = res?.booking?.bookingCode ?? res?.data?.booking?.bookingCode ?? null;

      setTicketCode(ticket);
      setBookingCode(bCode);
      setStep('success');
    } catch (err: any) {
      setError(err?.message ?? 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // ── Step: Select Route ──────────────────────────────────────────────────────
  const renderSelectRoute = () => (
    <View style={{ flex: 1 }}>
      <ModalHeader
        title="Choose Route"
        subtitle="Select your origin → destination"
        onBack={handleClose}
        backLabel="Close"
      />
      <View style={bm.searchBox}>
        <Ionicons name="search-outline" size={15} color={C.textMuted} />
        <TextInput
          style={bm.searchInput}
          placeholder="Search routes..."
          placeholderTextColor={C.textMuted}
          value={routeSearch}
          onChangeText={setRouteSearch}
        />
        {routeSearch.length > 0 && (
          <TouchableOpacity onPress={() => setRouteSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={bm.center}>
          <ActivityIndicator color={C.blue} size="large" />
          <Text style={bm.loadingText}>Loading routes…</Text>
        </View>
      ) : routes.length === 0 ? (
        <View style={bm.center}>
          <Ionicons name="map-outline" size={40} color={C.textMuted} />
          <Text style={bm.emptyTitle}>No routes found</Text>
          <Text style={bm.emptySub}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={bm.routeCard} onPress={() => handleSelectRoute(item)} activeOpacity={0.8}>
              <View style={bm.routeTop}>
                <View style={{ flex: 1 }}>
                  <Text style={bm.routeName}>{item.name}</Text>
                  <Text style={bm.corridorKey}>{item.corridorKey}</Text>
                </View>
                <View style={bm.pricePill}>
                  <Text style={bm.priceText}>{fmtRWF(item.price)}</Text>
                </View>
              </View>
              <View style={bm.routeConnector}>
                <View style={{ flex: 1 }}>
                  <Text style={bm.point}>{item.startPoint}</Text>
                </View>
                <View style={bm.arrowTrack}>
                  <View style={bm.arrowLine} />
                  <Ionicons name="arrow-forward" size={14} color={C.blue} />
                  <View style={bm.arrowLine} />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[bm.point, { color: C.green }]}>{item.endPoint}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  // ── Step: Select Journey ────────────────────────────────────────────────────
  const renderSelectJourney = () => (
    <View style={{ flex: 1 }}>
      <ModalHeader
        title="Pick a Journey"
        subtitle={selectedRoute ? `${selectedRoute.startPoint} → ${selectedRoute.endPoint}` : ''}
        onBack={() => setStep('selectRoute')}
      />
      {loading ? (
        <View style={bm.center}>
          <ActivityIndicator color={C.blue} size="large" />
          <Text style={bm.loadingText}>Loading journeys…</Text>
        </View>
      ) : journeys.length === 0 ? (
        <View style={bm.center}>
          <Ionicons name="bus-outline" size={40} color={C.textMuted} />
          <Text style={bm.emptyTitle}>No journeys available</Text>
          <Text style={bm.emptySub}>No pending trips on this route right now</Text>
          <TouchableOpacity style={bm.retryBtn} onPress={() => setStep('selectRoute')}>
            <Text style={bm.retryBtnText}>Choose another route</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={journeys}
          keyExtractor={j => j.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const seats = seatsLeft(item);
            const isFull = seats === 0;
            const dep = item.scheduledDeparture ?? item.departureTime;
            return (
              <TouchableOpacity
                style={[bm.journeyCard, isFull && bm.journeyCardFull]}
                onPress={() => !isFull && handleSelectJourney(item)}
                activeOpacity={isFull ? 1 : 0.8}
              >
                <View style={bm.jTop}>
                  <Text style={bm.jCode}>{item.journeyCode ?? item.id.slice(0, 8).toUpperCase()}</Text>
                  {seats !== null && (
                    <View style={[bm.seatsBadge, { backgroundColor: isFull ? C.errorBg : C.greenSoft }]}>
                      <Text style={[bm.seatsText, { color: isFull ? C.error : C.green }]}>
                        {isFull ? 'Full' : `${seats} seats`}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <View>
                    <Text style={bm.jTime}>{fmtTime(dep)}</Text>
                    <Text style={bm.jLabel}>Departure</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="bus-outline" size={18} color={C.blue} />
                    <Text style={bm.jPlate}>{item.bus?.plateNumber ?? 'TBA'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[bm.jTime, { color: C.green }]}>{item.driver?.name ?? '—'}</Text>
                    <Text style={bm.jLabel}>Driver</Text>
                  </View>
                </View>
                {!isFull && (
                  <View style={bm.selectRow}>
                    <Text style={bm.selectText}>Select this journey</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.blue} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  // ── Step: Passenger Details ─────────────────────────────────────────────────
  const renderPassengerDetails = () => {
    const journey = selectedJourney;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ModalHeader
          title="Passenger Details"
          subtitle="Who is travelling?"
          onBack={() => initialJourney ? handleClose() : setStep('selectJourney')}
        />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          {/* Journey summary */}
          {journey && (
            <View style={bm.summaryCard}>
              <View style={bm.summaryRow}>
                <Ionicons name="bus-outline" size={16} color={C.blue} />
                <Text style={bm.summaryText}>
                  {journey.route?.name ?? [journey.route?.origin, journey.route?.destination].filter(Boolean).join(' → ') ?? 'Journey'}
                </Text>
              </View>
              {selectedRoute && (
                <View style={[bm.summaryRow, { marginTop: 6 }]}>
                  <Ionicons name="cash-outline" size={16} color={C.green} />
                  <Text style={[bm.summaryText, { color: C.green, fontFamily: 'Inter_700Bold' }]}>
                    {fmtRWF(selectedRoute.price)}
                  </Text>
                </View>
              )}
              <View style={[bm.summaryRow, { marginTop: 6 }]}>
                <Ionicons name="time-outline" size={16} color={C.textSub} />
                <Text style={[bm.summaryText, { color: C.textSub }]}>
                  {fmtTime(journey.scheduledDeparture ?? journey.departureTime)}
                </Text>
              </View>
            </View>
          )}

          {/* Passenger name */}
          <View>
            <Text style={bm.fieldLabel}>Passenger name *</Text>
            <View style={bm.fieldWrap}>
              <Ionicons name="person-outline" size={16} color={C.textMuted} />
              <TextInput
                style={bm.fieldInput}
                placeholder="Full name of traveller"
                placeholderTextColor={C.textMuted}
                value={passengerName}
                onChangeText={setPassengerName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Payer name */}
          <View>
            <Text style={bm.fieldLabel}>Payer name</Text>
            <View style={bm.fieldWrap}>
              <Ionicons name="card-outline" size={16} color={C.textMuted} />
              <TextInput
                style={bm.fieldInput}
                placeholder="Name on payment (optional)"
                placeholderTextColor={C.textMuted}
                value={payerName}
                onChangeText={setPayerName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Payer phone */}
          <View>
            <Text style={bm.fieldLabel}>Payer phone number *</Text>
            <View style={bm.fieldWrap}>
              <Ionicons name="call-outline" size={16} color={C.textMuted} />
              <TextInput
                style={bm.fieldInput}
                placeholder="e.g. 0788 123 456"
                placeholderTextColor={C.textMuted}
                value={payerPhone}
                onChangeText={setPayerPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            <Text style={bm.fieldHint}>MTN (078/079) or Airtel (072/073) Mobile Money</Text>
          </View>

          {error && (
            <View style={bm.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={bm.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={bm.primaryBtn} onPress={handleProceedToPayment} activeOpacity={0.87}>
            <Text style={bm.primaryBtnText}>Continue to Payment</Text>
            <Ionicons name="arrow-forward" size={16} color={C.white} />
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // ── Step: Payment ───────────────────────────────────────────────────────────
  const renderPayment = () => {
    const amount = selectedRoute?.price ?? 0;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ModalHeader
          title="Payment"
          subtitle="Review and confirm"
          onBack={() => setStep('passengerDetails')}
        />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">

          {/* Payment summary card */}
          <View style={bm.payCard}>
            <Text style={bm.payCardTitle}>Booking Summary</Text>
            <View style={bm.payDivider} />

            <PayRow label="Route" value={selectedRoute?.name ?? selectedJourney?.route?.name ?? '—'} />
            <PayRow label="From" value={selectedRoute?.startPoint ?? selectedJourney?.route?.origin ?? '—'} />
            <PayRow label="To" value={selectedRoute?.endPoint ?? selectedJourney?.route?.destination ?? '—'} />
            <PayRow label="Passenger" value={passengerName} />
            <PayRow label="Journey" value={selectedJourney?.journeyCode ?? '—'} />
            <PayRow label="Departure" value={fmtTime(selectedJourney?.scheduledDeparture ?? selectedJourney?.departureTime)} />

            <View style={bm.payDivider} />
            <View style={bm.payTotal}>
              <Text style={bm.payTotalLabel}>Total Amount</Text>
              <Text style={bm.payTotalValue}>{fmtRWF(amount)}</Text>
            </View>
          </View>

          {/* Payment method */}
          <View style={bm.payMethodCard}>
            <View style={bm.payMethodHeader}>
              <Ionicons name="phone-portrait-outline" size={18} color={C.blue} />
              <Text style={bm.payMethodTitle}>Mobile Money</Text>
            </View>
            <Text style={bm.payMethodSub}>Payment will be charged to: <Text style={{ fontFamily: 'Inter_700Bold', color: C.text }}>{payerPhone}</Text></Text>
            <View style={bm.escrowNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={C.green} />
              <Text style={bm.escrowText}>Funds are held securely in escrow and released to the agency when the driver scans your ticket.</Text>
            </View>
          </View>

          {error && (
            <View style={bm.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={bm.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[bm.primaryBtn, paying && bm.primaryBtnLoading]}
            onPress={handlePay}
            disabled={paying}
            activeOpacity={0.87}
          >
            {paying ? (
              <>
                <ActivityIndicator size="small" color={C.white} />
                <Text style={bm.primaryBtnText}>Processing…</Text>
              </>
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={16} color={C.white} />
                <Text style={bm.primaryBtnText}>Pay {fmtRWF(amount)}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={bm.payDisclaimer}>
            By paying you agree to the transport terms. Tickets are non-refundable after driver verification.
          </Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // ── Step: Success ───────────────────────────────────────────────────────────
  const successScale = useRef(new Animated.Value(0.6)).current;
  const successOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'success') {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 14 }),
        Animated.timing(successOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      successScale.setValue(0.6);
      successOp.setValue(0);
    }
  }, [step]);

  const renderSuccess = () => (
    <View style={{ flex: 1 }}>
      <View style={bm.successHeader}>
        <TouchableOpacity onPress={handleClose} style={bm.closeX}>
          <Ionicons name="close" size={20} color={C.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={bm.successBody}>
        <Animated.View style={[bm.successIconWrap, { transform: [{ scale: successScale }], opacity: successOp }]}>
          <Ionicons name="checkmark-circle" size={72} color={C.green} />
        </Animated.View>

        <Text style={bm.successTitle}>Booking Confirmed!</Text>
        <Text style={bm.successSub}>Your seat is reserved. Show the ticket code to the driver when boarding.</Text>

        {/* Ticket card */}
        <View style={bm.ticketCard}>
          <View style={bm.ticketTop}>
            <Text style={bm.ticketLabel}>TICKET CODE</Text>
            <Text style={bm.ticketCode}>{ticketCode ?? '—'}</Text>
          </View>
          <View style={bm.ticketDash} />
          <View style={bm.ticketBottom}>
            <View>
              <Text style={bm.ticketMeta}>Booking</Text>
              <Text style={bm.ticketMetaVal}>{bookingCode ?? '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={bm.ticketMeta}>Route</Text>
              <Text style={bm.ticketMetaVal} numberOfLines={1}>
                {selectedRoute?.name ?? selectedJourney?.route?.name ?? '—'}
              </Text>
            </View>
          </View>
          <View style={[bm.ticketBottom, { marginTop: 8 }]}>
            <View>
              <Text style={bm.ticketMeta}>Passenger</Text>
              <Text style={bm.ticketMetaVal}>{passengerName || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={bm.ticketMeta}>Amount Paid</Text>
              <Text style={[bm.ticketMetaVal, { color: C.green }]}>{fmtRWF(selectedRoute?.price ?? 0)}</Text>
            </View>
          </View>

          {/* Escrow status badge */}
          <View style={bm.escrowBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={C.green} />
            <Text style={bm.escrowBadgeText}>Payment held in escrow — released on boarding</Text>
          </View>
        </View>

        <TouchableOpacity style={[bm.primaryBtn, { marginTop: 24 }]} onPress={handleClose} activeOpacity={0.87}>
          <Text style={bm.primaryBtnText}>Done</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={bm.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={step === 'success' ? handleClose : undefined} />
        <Animated.View style={[bm.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Progress bar */}
          {step !== 'success' && (
            <View style={bm.progressBar}>
              {(['selectRoute','selectJourney','passengerDetails','payment'] as BookingStep[]).map((s, i) => (
                <View
                  key={s}
                  style={[bm.progressStep, {
                    backgroundColor: ['selectRoute','selectJourney','passengerDetails','payment'].indexOf(step) >= i ? C.blue : C.border,
                  }]}
                />
              ))}
            </View>
          )}

          {step === 'selectRoute'       && renderSelectRoute()}
          {step === 'selectJourney'     && renderSelectJourney()}
          {step === 'passengerDetails'  && renderPassengerDetails()}
          {step === 'payment'           && renderPayment()}
          {step === 'success'           && renderSuccess()}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Modal header ──────────────────────────────────────────────────────────────
function ModalHeader({ title, subtitle, onBack, backLabel }: {
  title: string; subtitle?: string; onBack: () => void; backLabel?: string;
}) {
  return (
    <View style={mh.wrap}>
      <TouchableOpacity style={mh.back} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name={backLabel ? 'close' : 'chevron-back'} size={20} color={C.text} />
        {backLabel && <Text style={mh.backLabel}>{backLabel}</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={mh.title}>{title}</Text>
        {subtitle ? <Text style={mh.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
const mh = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  back:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text },
  title:     { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.text },
  sub:       { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub, marginTop: 2 },
});

// ── Pay row helper ─────────────────────────────────────────────────────────────
function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub }}>{label}</Text>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text, flex: 1, textAlign: 'right' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ── Booking modal styles ──────────────────────────────────────────────────────
const bm = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet:          { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SH * 0.92, minHeight: SH * 0.6, overflow: 'hidden' },
  progressBar:    { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
  progressStep:   { flex: 1, height: 3, borderRadius: 99 },

  // Route cards
  searchBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 12, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.bg },
  searchInput:    { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, padding: 0 },
  routeCard:      { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  routeTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  routeName:      { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  corridorKey:    { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 2 },
  pricePill:      { backgroundColor: C.greenSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  priceText:      { fontFamily: 'Inter_700Bold', fontSize: 13, color: C.green },
  routeConnector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  point:          { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
  arrowTrack:     { flex: 0.6, flexDirection: 'row', alignItems: 'center' },
  arrowLine:      { flex: 1, height: 1, backgroundColor: C.border },

  // Journey cards
  journeyCard:     { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  journeyCardFull: { opacity: 0.5 },
  jTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jCode:           { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
  seatsBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  seatsText:       { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  jTime:           { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text, letterSpacing: -0.5 },
  jLabel:          { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.textMuted, marginTop: 2 },
  jPlate:          { fontFamily: 'Inter_500Medium', fontSize: 10, color: C.textSub, marginTop: 2 },
  selectRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, gap: 4 },
  selectText:      { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.blue },

  // Passenger form
  summaryCard:  { backgroundColor: C.blueSoft, borderRadius: 12, padding: 14 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText:  { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text, flex: 1 },
  fieldLabel:   { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  fieldWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.white },
  fieldInput:   { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, padding: 0 },
  fieldHint:    { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 4 },

  // Payment
  payCard:         { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  payCardTitle:    { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.text, marginBottom: 12 },
  payDivider:      { height: 1, backgroundColor: C.border, marginVertical: 10 },
  payTotal:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payTotalLabel:   { fontFamily: 'Inter_700Bold', fontSize: 14, color: C.text },
  payTotalValue:   { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.green, letterSpacing: -0.5 },
  payMethodCard:   { backgroundColor: C.blueSoft, borderRadius: 12, padding: 14 },
  payMethodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  payMethodTitle:  { fontFamily: 'Inter_700Bold', fontSize: 14, color: C.text },
  payMethodSub:    { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub },
  escrowNote:      { flexDirection: 'row', gap: 8, marginTop: 12, backgroundColor: C.greenSoft, borderRadius: 8, padding: 10 },
  escrowText:      { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub, flex: 1, lineHeight: 18 },
  payDisclaimer:   { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 16 },

  // Success
  successHeader: { paddingHorizontal: 16, paddingTop: 16, alignItems: 'flex-end' },
  closeX:        { width: 36, height: 36, borderRadius: 99, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  successBody:   { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
  successIconWrap:{ marginBottom: 16 },
  successTitle:  { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.text, textAlign: 'center', marginBottom: 8, letterSpacing: -0.4 },
  successSub:    { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  ticketCard:    { width: '100%', backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  ticketTop:     { backgroundColor: C.blue, padding: 20, alignItems: 'center' },
  ticketLabel:   { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 2, marginBottom: 6 },
  ticketCode:    { fontFamily: 'Inter_700Bold', fontSize: 28, color: C.white, letterSpacing: 3 },
  ticketDash:    { borderStyle: 'dashed', borderWidth: 1, borderColor: C.border, marginHorizontal: 16 },
  ticketBottom:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14 },
  ticketMeta:    { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  ticketMetaVal: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text, marginTop: 2 },
  escrowBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.greenSoft, margin: 14, borderRadius: 8, padding: 10 },
  escrowBadgeText:{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.green, flex: 1, lineHeight: 16 },

  // Shared
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  loadingText:  { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub, marginTop: 8 },
  emptyTitle:   { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.text },
  emptySub:     { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub, textAlign: 'center' },
  retryBtn:     { marginTop: 16, backgroundColor: C.blueSoft, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.blue },
  primaryBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, paddingVertical: 15, borderRadius: 12, shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnLoading: { backgroundColor: C.textMuted, shadowOpacity: 0 },
  primaryBtnText:    { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.white },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorBg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText:    { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.error, flex: 1 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }: any) {
  const { user, authFetch } = useAuth();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');
  const [focusField, setFocusField] = useState<string | null>(null);
  const [journeys,   setJourneys]   = useState<Journey[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Booking modal state
  const [bookingVisible,  setBookingVisible]  = useState(false);
  const [bookingJourney,  setBookingJourney]  = useState<Journey | null>(null);

  // Entrance anims
  const hOp = useRef(new Animated.Value(0)).current;
  const hY  = useRef(new Animated.Value(-14)).current;
  const cOp = useRef(new Animated.Value(0)).current;
  const cY  = useRef(new Animated.Value(28)).current;
  const bOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(hOp, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(hY,  { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cOp, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(cY,  { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(bOp, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const fetchJourneys = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch('/journeys?status=pending&limit=20');
      setJourneys(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError('Unable to load journeys. Pull down to try again.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchJourneys(); }, [fetchJourneys]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJourneys();
    setRefreshing(false);
  }, [fetchJourneys]);

  const handleSearch = useCallback(() => {
    setLoading(true);
    fetchJourneys();
  }, [fetchJourneys]);

  // Open booking modal — from "Book a Seat" quick action (no pre-selected journey)
  const openBookingFlow = useCallback(() => {
    setBookingJourney(null);
    setBookingVisible(true);
  }, []);

  // Open booking modal — from journey card "Book now" (pre-selected journey, skip to passenger details)
  const handleBook = useCallback((journey: Journey) => {
    setBookingJourney(journey);
    setBookingVisible(true);
  }, []);

  const filtered = journeys.filter(j => {
    const o = (j.route?.origin      ?? '').toLowerCase();
    const d = (j.route?.destination ?? '').toLowerCase();
    return (!from || o.includes(from.toLowerCase())) &&
           (!to   || d.includes(to.toLowerCase()));
  });

  if (!fontsLoaded) return null;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <SafeAreaView>
          <Animated.View style={[s.headerInner, { opacity: hOp, transform: [{ translateY: hY }] }]}>
            <TouchableOpacity style={s.avatar} activeOpacity={0.8}>
              <Ionicons name="person" size={18} color={C.blue} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.greetName}>{greeting()}, {firstName} 👋</Text>
              <Text style={s.greetSub}>Find and book your seat</Text>
            </View>
            <TouchableOpacity style={s.bell} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={19} color={C.white} />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Search card ── */}
      <Animated.View style={[s.searchCard, { opacity: cOp, transform: [{ translateY: cY }] }]}>
        <SearchCluster
          from={from} setFrom={setFrom}
          to={to}     setTo={setTo}
          focused={focusField} setFocused={setFocusField}
        />
        <View style={s.searchRow}>
          <TouchableOpacity style={s.dateBtn} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={14} color={C.textSub} />
            <Text style={s.dateBtnText}>Any date</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.searchBtn} activeOpacity={0.87} onPress={handleSearch}>
            <Ionicons name="search-outline" size={14} color={C.white} />
            <Text style={s.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Scroll body ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} colors={[C.blue]} />
        }
      >
        <Animated.View style={{ opacity: bOp }}>

          {!loading && journeys.length > 0 && <StatsStrip journeys={journeys} />}

          <SectionHead title="Quick actions" />
          <View style={s.actionsGrid}>
            {[QUICK_ACTIONS.slice(0, 2), QUICK_ACTIONS.slice(2)].map((row, ri) => (
              <View key={ri} style={s.actionsRow}>
                {row.map(item => (
                  <ActionBtn
                    key={item.id}
                    item={item}
                    onPress={item.id === 'book' ? openBookingFlow : undefined}
                  />
                ))}
              </View>
            ))}
          </View>

          <SectionHead
            title="Available journeys"
            sub={loading ? 'Loading routes…' : `${filtered.length} available`}
            action={!loading && filtered.length > 0 ? 'See all' : undefined}
            onAction={() => {}}
          />

          {error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleSearch}>
                <Text style={s.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && !error && Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={[jc.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ gap: 6 }}><Skel w={160} h={14} /><Skel w={90} h={11} /></View>
                <Skel w={70} h={26} r={99} />
              </View>
              <Skel w="100%" h={1} r={0} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, alignItems: 'center' }}>
                <View style={{ gap: 6 }}><Skel w={44} h={20} /><Skel w={76} h={12} /></View>
                <Skel w={80} h={34} r={99} />
              </View>
            </View>
          ))}

          {!loading && !error && filtered.length === 0 && (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="bus-outline" size={32} color={C.blue} />
              </View>
              <Text style={s.emptyTitle}>No journeys found</Text>
              <Text style={s.emptySub}>
                {(from || to)
                  ? 'Try adjusting your search, or pull down to refresh.'
                  : 'No active journeys right now. Pull down to refresh.'}
              </Text>
              <TouchableOpacity style={s.bookDirectBtn} onPress={openBookingFlow} activeOpacity={0.85}>
                <Ionicons name="bus-outline" size={15} color={C.white} />
                <Text style={s.bookDirectBtnText}>Book by Route</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && filtered.map(j => (
            <JourneyCard key={j.id} item={j} onBook={handleBook} />
          ))}

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Booking Flow Modal ── */}
      <BookingModal
        visible={bookingVisible}
        onClose={() => setBookingVisible(false)}
        authFetch={authFetch}
        initialJourney={bookingJourney}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  header:      { backgroundColor: C.blue, overflow: 'hidden', paddingBottom: 45 },
  circle1:     { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -120, right: -70 },
  circle2:     { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, left: -30 },
  headerInner: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 40, paddingBottom: 18, gap: 12 },
  avatar:      { width: 42, height: 42, borderRadius: 99, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  greetName:   { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.white, letterSpacing: -0.4 },
  greetSub:    { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  bell:        { width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  notifDot:    { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 99, backgroundColor: '#F59E0B', borderWidth: 1.5, borderColor: C.blue },
  searchCard:  { backgroundColor: C.white, marginHorizontal: 16, marginTop: -44, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.bg },
  dateBtnText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted },
  searchBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 4 },
  searchBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: C.white, letterSpacing: 0.1 },
  scroll:       { flex: 1, backgroundColor: 'white' },
  scrollContent:{ paddingHorizontal: 16, paddingBottom: 16 },
  actionsGrid:  { gap: 8, marginBottom: 24 },
  actionsRow:   { flexDirection: 'row', gap: 8 },
  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.error, flex: 1 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.blue },
  empty:      { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyIcon:  { width: 76, height: 76, borderRadius: 22, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.text, marginBottom: 8 },
  emptySub:   { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  bookDirectBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
  bookDirectBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.white },
});