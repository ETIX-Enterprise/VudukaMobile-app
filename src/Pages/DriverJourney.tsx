import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Platform, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../contexts/authContext';

// ── Design tokens — exact parity with web dashboard ──────────────────────────
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
  errorBd:   '#FECACA',
  teal:      '#0BA5C9',
  tealSoft:  '#EFF6FF',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type JourneyStatus = 'completed' | 'cancelled';
type TabKey        = 'journey' | 'history';

interface Journey {
  id: string;
  journeyCode?: string;
  status: string;
  passengersCount?: number;
  departureTime?: string;
  arrivalTime?: string;
  route?: { name?: string; origin?: string; destination?: string } | null;
  bus?: { plateNumber?: string; capacity?: number } | null;
  driver?: { name?: string } | null;
}

interface JourneyRecord {
  id: string;
  route: string;
  busId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  passengers: number;
  status: JourneyStatus;
  distance: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

// ── Pulse dot — live indicator ────────────────────────────────────────────────
function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const op    = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.7, duration: 900, useNativeDriver: true }),
        Animated.timing(op,    { toValue: 0,   duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1,   duration: 0, useNativeDriver: true }),
        Animated.timing(op,    { toValue: 0.7, duration: 0, useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: C.green, opacity: op, transform: [{ scale }] }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
    </View>
  );
}

// ── Active journey card — web card style ──────────────────────────────────────
function ActiveCard({ journey, elapsed, onEnd }: {
  journey: Journey; elapsed: number; onEnd: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* web card: white, 14px radius, 1px border, shadow — with green top bar */}
      <View style={ac.card}>
        <View style={ac.topBar} />

        <View style={ac.headerRow}>
          <PulseDot />
          <Text style={ac.liveLabel}>LIVE JOURNEY</Text>
          <View style={{ flex: 1 }} />
          <View style={ac.liveBadge}>
            <Text style={ac.liveBadgeText}>In Progress</Text>
          </View>
        </View>

        {/* Route block — mirrors web route connector */}
        <View style={ac.routeBlock}>
          <View style={ac.routePins}>
            <View style={[ac.pinDot, { backgroundColor: C.green }]} />
            <View style={ac.pinLine} />
            <View style={[ac.pinDot, { backgroundColor: C.blue }]} />
          </View>
          <View style={ac.routeLabels}>
            <Text style={ac.routeCity}>{journey.route?.origin ?? '—'}</Text>
            <Text style={ac.routeCity}>{journey.route?.destination ?? '—'}</Text>
          </View>
          <View style={ac.routeMeta}>
            <Text style={ac.routeCode}>{journey.journeyCode ?? journey.id.slice(0, 8)}</Text>
            <Text style={ac.routeBus}>{journey.bus?.plateNumber ?? 'TBA'}</Text>
          </View>
        </View>

        <View style={ac.divider} />

        {/* Stats row — mirrors web StatSummaryCard rows */}
        <View style={ac.statsRow}>
          {[
            { icon: 'time-outline' as const,            label: 'Elapsed',  value: fmtDuration(elapsed)           },
            { icon: 'bus-outline' as const,              label: 'Bus',      value: journey.bus?.plateNumber ?? '—' },
            { icon: 'people-outline' as const,           label: 'Pax',      value: `${journey.passengersCount ?? 0}` },
          ].map((it, i, arr) => (
            <React.Fragment key={it.label}>
              <View style={ac.stat}>
                <Ionicons name={it.icon} size={13} color={C.textSub} />
                <View>
                  <Text style={ac.statLabel}>{it.label}</Text>
                  <Text style={ac.statValue}>{it.value}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={ac.statSep} />}
            </React.Fragment>
          ))}
        </View>

        <View style={ac.divider} />

        {/* End button */}
        <TouchableOpacity onPress={onEnd} style={ac.endBtn} activeOpacity={0.85}>
          <Ionicons name="stop-circle-outline" size={16} color={C.error} />
          <Text style={ac.endBtnText}>End Journey</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const ac = StyleSheet.create({
  card:         { backgroundColor: C.white, marginHorizontal: 16, marginTop: -28, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5, marginBottom: 20 },
  topBar:       { height: 4, backgroundColor: C.green },
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  liveLabel:    { fontFamily: 'Inter_700Bold', fontSize: 11, color: C.green, letterSpacing: 1.2 },
  liveBadge:    { backgroundColor: C.greenSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  liveBadgeText:{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.green },
  routeBlock:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  routePins:    { alignItems: 'center', gap: 2 },
  pinDot:       { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)' },
  pinLine:      { width: 2, height: 24, backgroundColor: C.border },
  routeLabels:  { flex: 1, gap: 18 },
  routeCity:    { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  routeMeta:    { alignItems: 'flex-end', gap: 18 },
  routeCode:    { fontFamily: 'Inter_700Bold', fontSize: 10, color: C.textSub, letterSpacing: 0.8 },
  routeBus:     { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted },
  divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  statsRow:     { flexDirection: 'row', paddingVertical: 12 },
  stat:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statSep:      { width: 1, backgroundColor: C.border, marginVertical: 4 },
  statLabel:    { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.textSub },
  statValue:    { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.text },
  endBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, margin: 16, marginTop: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: `${C.error}40`, backgroundColor: C.errorBg },
  endBtnText:   { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.error },
});

// ── History item — web table row → mobile card ────────────────────────────────
function HistoryItem({ item, index }: { item: JourneyRecord; index: number }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 55, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  const done      = item.status === 'completed';
  const sBg       = done ? '#dcfce7' : '#fee2e2';
  const sColor    = done ? '#16a34a' : C.error;
  const sIcon     = done ? 'checkmark-circle' as const : 'close-circle' as const;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* web card style */}
      <View style={hi.card}>
        <View style={hi.topRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={hi.route}>{item.route}</Text>
            <Text style={hi.meta}>{item.date} · {item.startTime}</Text>
          </View>
          <View style={[hi.badge, { backgroundColor: sBg }]}>
            <Ionicons name={sIcon} size={11} color={sColor} />
            <Text style={[hi.badgeText, { color: sColor }]}>
              {done ? 'Completed' : 'Cancelled'}
            </Text>
          </View>
        </View>
        <View style={hi.divider} />
        <View style={hi.chipRow}>
          {[
            { icon: 'bus-outline' as const,    text: item.busId      },
            done && { icon: 'time-outline' as const,   text: item.duration },
            done && { icon: 'people-outline' as const, text: `${item.passengers} pax` },
          ].filter(Boolean).map((chip: any, i) => (
            <View key={i} style={hi.chip}>
              <Ionicons name={chip.icon} size={11} color={C.textMuted} />
              <Text style={hi.chipText}>{chip.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
const hi = StyleSheet.create({
  card:     { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginHorizontal: 16, marginBottom: 10, overflow: 'hidden' },
  topRow:   { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  route:    { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  meta:     { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textSub, marginTop: 2 },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  badgeText:{ fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  divider:  { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: C.border },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: C.textSub },
});

// ── Stats bar — mirrors web StatSummaryCard ───────────────────────────────────
function StatsBar({ history }: { history: JourneyRecord[] }) {
  const done   = history.filter(h => h.status === 'completed');
  const pax    = done.reduce((a, h) => a + h.passengers, 0);
  const kmStr  = done.reduce((a, h) => a + parseInt(h.distance || '0', 10), 0);

  return (
    <View style={sb.card}>
      {[
        { label: 'Trips',   value: done.length, color: C.blue  },
        { label: 'Pax',     value: pax,         color: C.green },
        { label: 'Km',      value: kmStr,       color: C.blue  },
      ].map((it, i, arr) => (
        <React.Fragment key={it.label}>
          <View style={sb.item}>
            <Text style={[sb.value, { color: it.color }]}>{it.value}</Text>
            <Text style={sb.label}>{it.label}</Text>
          </View>
          {i < arr.length - 1 && <View style={sb.sep} />}
        </React.Fragment>
      ))}
    </View>
  );
}
const sb = StyleSheet.create({
  card:  { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginHorizontal: 16, marginBottom: 16, paddingVertical: 14 },
  item:  { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -1 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textSub },
  sep:   { width: 1, backgroundColor: C.border, marginVertical: 4 },
});

// ── Confirm end modal — web modal card style ──────────────────────────────────
function ConfirmEndModal({ visible, onCancel, onConfirm, journey, elapsed }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void;
  journey: Journey | null; elapsed: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={cm.overlay}>
        <View style={cm.card}>
          <View style={[cm.iconWrap, { backgroundColor: C.errorBg }]}>
            <Ionicons name="stop-circle" size={32} color={C.error} />
          </View>
          <Text style={cm.title}>End This Journey?</Text>
          <Text style={cm.sub}>
            {`Route: `}
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.text }}>
              {journey?.route?.origin} → {journey?.route?.destination}
            </Text>
          </Text>
          {/* Summary box — web table style */}
          <View style={cm.summaryBox}>
            {[
              { label: 'Duration', value: fmtDuration(elapsed) },
              { label: 'Bus',      value: journey?.bus?.plateNumber ?? '—' },
              { label: 'Code',     value: journey?.journeyCode ?? '—' },
            ].map(row => (
              <View key={row.label} style={cm.summaryRow}>
                <Text style={cm.summaryLabel}>{row.label}</Text>
                <Text style={cm.summaryValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={cm.btnRow}>
            <TouchableOpacity onPress={onCancel} style={cm.cancelBtn} activeOpacity={0.8}>
              <Text style={cm.cancelText}>Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={cm.confirmBtn} activeOpacity={0.85}>
              <Ionicons name="stop-circle-outline" size={15} color={C.white} />
              <Text style={cm.confirmText}>End Journey</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:         { backgroundColor: C.white, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  iconWrap:     { width: 70, height: 70, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:        { fontFamily: 'Inter_700Bold', fontSize: 19, color: C.text, letterSpacing: -0.4, marginBottom: 8 },
  sub:          { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub, textAlign: 'center', marginBottom: 20 },
  summaryBox:   { width: '100%', backgroundColor: C.bg, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.border, gap: 10 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub },
  summaryValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
  btnRow:       { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn:    { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center' },
  cancelText:   { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.textSub },
  confirmBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.error },
  confirmText:  { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.white },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function JourneyManagementScreen({ navigation }: any) {
  const { authFetch } = useAuth();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [activeJourney, setActiveJourney]   = useState<Journey | null>(null);
  const [elapsed,       setElapsed]         = useState(0);
  const [history,       setHistory]         = useState<JourneyRecord[]>([]);
  const [liveJourneys,  setLiveJourneys]    = useState<Journey[]>([]);
  const [loading,       setLoading]         = useState(true);
  const [refreshing,    setRefreshing]      = useState(false);
  const [showConfirm,   setShowConfirm]     = useState(false);
  const [activeTab,     setActiveTab]       = useState<TabKey>('journey');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Header anims
  const hOp = useRef(new Animated.Value(0)).current;
  const hY  = useRef(new Animated.Value(-16)).current;
  const cOp = useRef(new Animated.Value(0)).current;
  const cY  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(hOp, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(hY,  { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cOp, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(cY,  { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Timer
  useEffect(() => {
    if (activeJourney) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeJourney]);

  // ── Fetch live journeys ───────────────────────────────────────────────────
  const fetchJourneys = useCallback(async () => {
    try {
      const res = await authFetch('/journeys?status=in_progress&limit=10');
      const data: Journey[] = Array.isArray(res?.data) ? res.data : [];
      setLiveJourneys(data);
      // If driver has an active journey, pick first one
      if (data.length > 0 && !activeJourney) {
        setActiveJourney(data[0]);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [authFetch, activeJourney]);

  useEffect(() => { fetchJourneys(); }, [fetchJourneys]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJourneys();
    setRefreshing(false);
  }, [fetchJourneys]);

  // ── End journey ───────────────────────────────────────────────────────────
  const handleConfirmEnd = useCallback(async () => {
    if (!activeJourney) return;
    try {
      await authFetch(`/journeys/${activeJourney.id}/complete`, { method: 'POST' });
    } catch { /* optimistic */ }

    const now     = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hrs     = Math.floor(elapsed / 3600);
    const mins    = Math.floor((elapsed % 3600) / 60);
    const dur     = hrs > 0 ? `${hrs}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;

    const entry: JourneyRecord = {
      id:         activeJourney.id,
      route:      [activeJourney.route?.origin, activeJourney.route?.destination].filter(Boolean).join(' → ') || '—',
      busId:      activeJourney.bus?.plateNumber ?? '—',
      date:       'Today',
      startTime:  activeJourney.departureTime
        ? new Date(activeJourney.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '—',
      endTime:    timeStr,
      duration:   dur,
      passengers: activeJourney.passengersCount ?? 0,
      status:     'completed',
      distance:   '—',
    };

    setHistory(prev => [entry, ...prev]);
    setActiveJourney(null);
    setShowConfirm(false);
    setActiveTab('history');
  }, [activeJourney, elapsed, authFetch]);

  const todayHistory  = history.filter(h => h.date === 'Today');
  const olderHistory  = history.filter(h => h.date !== 'Today');
  const completedToday = todayHistory.filter(h => h.status === 'completed').length;

  if (!fontsLoaded) return null;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── Header — web: C.blue bg ── */}
      <View style={s.header}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <SafeAreaView>
          <Animated.View style={[s.headerInner, { opacity: hOp, transform: [{ translateY: hY }] }]}>
            <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color={C.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Journey Management</Text>
              <Text style={s.headerSub}>
                {activeJourney
                  ? '1 active journey in progress'
                  : `${completedToday} trips completed today`}
              </Text>
            </View>
            <View style={[s.headerBadge, activeJourney ? { backgroundColor: C.greenSoft } : null]}>
              {activeJourney
                ? <PulseDot />
                : <Ionicons name="map-outline" size={20} color={C.white} />}
            </View>
          </Animated.View>

          {/* Tab bar — web: frosted tab pill inside header */}
          <Animated.View style={[s.tabBar, { opacity: hOp }]}>
            {(['journey', 'history'] as TabKey[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[s.tab, activeTab === tab && s.tabActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab === 'journey' ? 'Journey' : 'History'}
                </Text>
                {tab === 'history' && history.length > 0 && (
                  <View style={s.tabBadge}>
                    <Text style={s.tabBadgeText}>{history.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Active/start card — overlaps header ── */}
      {activeJourney ? (
        <Animated.View style={{ opacity: cOp, transform: [{ translateY: cY }] }}>
          <ActiveCard journey={activeJourney} elapsed={elapsed} onEnd={() => setShowConfirm(true)} />
        </Animated.View>
      ) : (
        <Animated.View style={[s.startCard, { opacity: cOp, transform: [{ translateY: cY }] }]}>
          <View style={s.startCardHeader}>
            <View style={s.startIconWrap}>
              <Ionicons name="play-circle" size={22} color={C.blue} />
            </View>
            <View>
              <Text style={s.startCardTitle}>No Active Journey</Text>
              <Text style={s.startCardSub}>
                {loading ? 'Checking active journeys…' : `${liveJourneys.length} live journeys available`}
              </Text>
            </View>
          </View>
          {liveJourneys.length > 0 && (
            <>
              <View style={s.startDivider} />
              {liveJourneys.slice(0, 3).map(j => (
                <TouchableOpacity
                  key={j.id}
                  style={s.journeyPickRow}
                  activeOpacity={0.75}
                  onPress={() => setActiveJourney(j)}
                >
                  <View style={s.journeyPickIcon}>
                    <Ionicons name="navigate-outline" size={14} color={C.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.journeyPickRoute} numberOfLines={1}>
                      {[j.route?.origin, j.route?.destination].filter(Boolean).join(' → ') || j.journeyCode || '—'}
                    </Text>
                    <Text style={s.journeyPickMeta}>{j.bus?.plateNumber ?? 'Bus TBA'} · {j.passengersCount ?? 0} pax</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </Animated.View>
      )}

      {/* ── Tab content ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} colors={[C.blue]} />
        }
      >
        {/* Journey tab */}
        {activeTab === 'journey' && (
          <>
            {todayHistory.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Today's Summary</Text>
                <StatsBar history={todayHistory} />
              </>
            )}
            {!activeJourney && (
              // web: info tip card
              <View style={s.tipCard}>
                <Ionicons name="information-circle-outline" size={15} color={C.teal} />
                <Text style={s.tipText}>
                  Select a journey above to start tracking, or view completed trips in the History tab.
                </Text>
              </View>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <>
            <StatsBar history={history.filter(h => h.date === 'Today')} />

            {todayHistory.length > 0 && (
              <>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Today</Text>
                  <Text style={s.sectionCount}>{todayHistory.length} trip{todayHistory.length !== 1 ? 's' : ''}</Text>
                </View>
                {todayHistory.map((item, i) => <HistoryItem key={item.id} item={item} index={i} />)}
              </>
            )}

            {olderHistory.length > 0 && (
              <>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Earlier</Text>
                  <Text style={s.sectionCount}>{olderHistory.length} trip{olderHistory.length !== 1 ? 's' : ''}</Text>
                </View>
                {olderHistory.map((item, i) => (
                  <HistoryItem key={item.id} item={item} index={i + todayHistory.length} />
                ))}
              </>
            )}

            {history.length === 0 && (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Ionicons name="map-outline" size={34} color={C.blue} />
                </View>
                <Text style={s.emptyTitle}>No journeys yet</Text>
                <Text style={s.emptySub}>Completed journeys will appear here.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmEndModal
        visible={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmEnd}
        journey={activeJourney}
        elapsed={elapsed}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_H = Platform.OS === 'ios' ? 220 : 200;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header — web: C.blue
  header:       { height: HEADER_H, backgroundColor: C.blue, overflow: 'hidden' },
  circle1:      { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.05)', top: -100, right: -50 },
  circle2:      { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, left: -40 },
  headerInner:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 12 : 44, gap: 14 },
  backBtn:      { width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontFamily: 'Inter_700Bold', fontSize: 17, color: C.white, letterSpacing: -0.3 },
  headerSub:    { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  headerBadge:  { width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // Tab bar — web: inside blue header
  tabBar:        { flexDirection: 'row', marginHorizontal: 20, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 3 },
  tab:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 10, gap: 6 },
  tabActive:     { backgroundColor: C.white },
  tabText:       { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: C.blue },
  tabBadge:      { backgroundColor: C.blue, borderRadius: 99, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabBadgeText:  { fontFamily: 'Inter_700Bold', fontSize: 10, color: C.white },

  // Start card
  startCard:       { backgroundColor: C.white, marginHorizontal: 16, marginTop: -28, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 5 },
  startCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  startIconWrap:   { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  startCardTitle:  { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.text },
  startCardSub:    { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub, marginTop: 2 },
  startDivider:    { height: 1, backgroundColor: C.border, marginBottom: 12 },
  journeyPickRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderRadius: 10, paddingHorizontal: 4 },
  journeyPickIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  journeyPickRoute:{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
  journeyPickMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textSub, marginTop: 2 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 0, paddingBottom: 16 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
  sectionTitle:  { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.text, paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
  sectionCount:  { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub },

  // Tip card — web: info box with teal colour
  tipCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.tealSoft, marginHorizontal: 16, marginTop: 4, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: `${C.teal}25` },
  tipText:  { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: C.teal, lineHeight: 18 },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 24, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: C.text, marginBottom: 8 },
  emptySub:   { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
});