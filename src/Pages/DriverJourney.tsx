import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform,
  Modal,
  ActivityIndicator,
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

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:       '#003DD0',
  blueDark:   '#002BA0',
  blueLight:  '#003DD014',
  blueMid:    '#003DD008',
  white:      '#FFFFFF',
  bg:         '#F7F8FC',
  text:       '#0D0D1A',
  textSub:    '#9D9DA9',
  textMuted:  '#B4B4C0',
  border:     '#ECEEF5',
  cardBg:     '#FFFFFF',
  amber:      '#F5A623',
  amberLight: '#F5A62318',
  amberDark:  '#D4880A',
  green:      '#12B76A',
  greenLight: '#12B76A18',
  greenDark:  '#0A8A50',
  red:        '#F04438',
  redLight:   '#F0443818',
  redDark:    '#C0321F',
  teal:       '#0BA5C9',
  tealLight:  '#0BA5C918',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type JourneyStatus = 'completed' | 'cancelled';
type TabKey        = 'journey' | 'history';

interface Route {
  id:       string;
  label:    string;
  code:     string;
  distance: string;
  stops:    number;
}

interface ActiveJourney {
  id:        string;
  from:      string;
  to:        string;
  code:      string;
  distance:  string;
  busId:     string;
  startTime: string;
}

interface JourneyRecord {
  id:         string;
  route:      string;
  busId:      string;
  date:       string;
  startTime:  string;
  endTime:    string;
  duration:   string;
  passengers: number;
  status:     JourneyStatus;
  distance:   string;
}

interface ActiveJourneyCardProps {
  journey: ActiveJourney;
  elapsed: number;
  onEnd:   () => void;
}

interface RoutePickerModalProps {
  visible:    boolean;
  onClose:    () => void;
  onSelect:   (route: Route) => void;
  selectedId: string | null;
}

interface BusPickerModalProps {
  visible:    boolean;
  onClose:    () => void;
  onSelect:   (busId: string) => void;
  selectedId: string;
}

interface HistoryItemProps {
  item:  JourneyRecord;
  index: number;
}

interface StatsBarProps {
  history: JourneyRecord[];
}

interface ConfirmEndModalProps {
  visible:  boolean;
  onCancel: () => void;
  onConfirm: () => void;
  journey:  ActiveJourney | null;
  elapsed:  number;
}

interface ScreenProps {
  navigation?: { goBack: () => void };
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const ROUTES: Route[] = [
  { id: 'R1', label: 'Kigali → Musanze',  code: 'KGL-MSZ', distance: '102 km', stops: 5 },
  { id: 'R2', label: 'Kigali → Huye',     code: 'KGL-HYE', distance: '135 km', stops: 7 },
  { id: 'R3', label: 'Kigali → Nyabihu',  code: 'KGL-NYB', distance: '112 km', stops: 6 },
  { id: 'R4', label: 'Musanze → Kigali',  code: 'MSZ-KGL', distance: '102 km', stops: 5 },
  { id: 'R5', label: 'Huye → Kigali',     code: 'HYE-KGL', distance: '135 km', stops: 7 },
  { id: 'R6', label: 'Kigali → Rubavu',   code: 'KGL-RBV', distance: '157 km', stops: 8 },
];

const BUS_IDS: string[] = ['RW-1042-A', 'RW-2387-B', 'RW-0954-C', 'RW-3761-D'];

const MOCK_HISTORY: JourneyRecord[] = [
  {
    id: 'J001', route: 'Kigali → Musanze', busId: 'RW-1042-A',
    date: 'Today', startTime: '06:00 AM', endTime: '08:45 AM',
    duration: '2h 45m', passengers: 42, status: 'completed', distance: '102 km',
  },
  {
    id: 'J002', route: 'Musanze → Kigali', busId: 'RW-1042-A',
    date: 'Today', startTime: '09:30 AM', endTime: '12:10 PM',
    duration: '2h 40m', passengers: 38, status: 'completed', distance: '102 km',
  },
  {
    id: 'J003', route: 'Kigali → Huye', busId: 'RW-2387-B',
    date: 'Yesterday', startTime: '07:15 AM', endTime: '10:30 AM',
    duration: '3h 15m', passengers: 51, status: 'completed', distance: '135 km',
  },
  {
    id: 'J004', route: 'Kigali → Nyabihu', busId: 'RW-0954-C',
    date: 'Yesterday', startTime: '02:00 PM', endTime: '—',
    duration: '—', passengers: 29, status: 'cancelled', distance: '112 km',
  },
  {
    id: 'J005', route: 'Huye → Kigali', busId: 'RW-3761-D',
    date: 'Dec 19', startTime: '08:00 AM', endTime: '11:20 AM',
    duration: '3h 20m', passengers: 44, status: 'completed', distance: '135 km',
  },
];

// ── Utility ───────────────────────────────────────────────────────────────────
function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

// ── Pulse Dot ─────────────────────────────────────────────────────────────────
function PulseDot(): React.JSX.Element {
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim,   { toValue: 1.7, duration: 900, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim,   { toValue: 1,   duration: 0,   useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.7, duration: 0,   useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: C.green,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
    </View>
  );
}

// ── Active Journey Card ───────────────────────────────────────────────────────
function ActiveJourneyCard({ journey, elapsed, onEnd }: ActiveJourneyCardProps): React.JSX.Element {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 16, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <View style={ac.card}>
        <View style={ac.topBar} />

        <View style={ac.headerRow}>
          <PulseDot />
          <Text style={ac.liveLabel}>LIVE JOURNEY</Text>
          <View style={{ flex: 1 }} />
          <View style={ac.badge}>
            <Text style={ac.badgeText}>In Progress</Text>
          </View>
        </View>

        <View style={ac.routeRow}>
          <View style={ac.routePin}>
            <View style={ac.dotGreen} />
            <View style={ac.routeLine} />
            <View style={ac.dotBlue} />
          </View>
          <View style={ac.routeLabels}>
            <Text style={ac.routeFrom}>{journey.from}</Text>
            <Text style={ac.routeTo}>{journey.to}</Text>
          </View>
          <View style={ac.routeMeta}>
            <Text style={ac.routeCode}>{journey.code}</Text>
            <Text style={ac.routeDistance}>{journey.distance}</Text>
          </View>
        </View>

        <View style={ac.divider} />

        <View style={ac.statsRow}>
          <View style={ac.stat}>
            <Ionicons name="time-outline" size={13} color={C.textSub} />
            <View>
              <Text style={ac.statLabel}>Elapsed</Text>
              <Text style={ac.statValue}>{formatDuration(elapsed)}</Text>
            </View>
          </View>
          <View style={ac.statSep} />
          <View style={ac.stat}>
            <Ionicons name="bus-outline" size={13} color={C.textSub} />
            <View>
              <Text style={ac.statLabel}>Bus ID</Text>
              <Text style={ac.statValue}>{journey.busId}</Text>
            </View>
          </View>
          <View style={ac.statSep} />
          <View style={ac.stat}>
            <Ionicons name="calendar-outline" size={13} color={C.textSub} />
            <View>
              <Text style={ac.statLabel}>Started</Text>
              <Text style={ac.statValue}>{journey.startTime}</Text>
            </View>
          </View>
        </View>

        <View style={ac.divider} />

        <TouchableOpacity onPress={onEnd} style={ac.endBtn} activeOpacity={0.85}>
          <Ionicons name="stop-circle-outline" size={16} color={C.red} />
          <Text style={ac.endBtnText}>End Journey</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Route Picker Modal ────────────────────────────────────────────────────────
function RoutePickerModal({ visible, onClose, onSelect, selectedId }: RoutePickerModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rp.overlay}>
        <View style={rp.sheet}>
          <View style={rp.handle} />
          <Text style={rp.title}>Select Route</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ROUTES.map((route: Route) => {
              const isSelected = route.id === selectedId;
              return (
                <TouchableOpacity
                  key={route.id}
                  onPress={() => { onSelect(route); onClose(); }}
                  style={[rp.row, isSelected && rp.rowSelected]}
                  activeOpacity={0.75}
                >
                  <View style={rp.rowLeft}>
                    <View style={[rp.codeTag, isSelected && rp.codeTagSelected]}>
                      <Text style={[rp.codeText, isSelected && rp.codeTextSelected]}>
                        {route.code}
                      </Text>
                    </View>
                    <View>
                      <Text style={[rp.routeLabel, isSelected && rp.routeLabelSelected]}>
                        {route.label}
                      </Text>
                      <Text style={rp.routeMeta}>{route.distance} · {route.stops} stops</Text>
                    </View>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.blue} />}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Bus Picker Modal ──────────────────────────────────────────────────────────
function BusPickerModal({ visible, onClose, onSelect, selectedId }: BusPickerModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rp.overlay}>
        <View style={[rp.sheet, { maxHeight: 360 }]}>
          <View style={rp.handle} />
          <Text style={rp.title}>Select Bus</Text>
          {BUS_IDS.map((busId: string) => {
            const isSelected = busId === selectedId;
            return (
              <TouchableOpacity
                key={busId}
                onPress={() => { onSelect(busId); onClose(); }}
                style={[rp.row, isSelected && rp.rowSelected]}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[rp.codeTag, isSelected && rp.codeTagSelected]}>
                    <Ionicons
                      name="bus-outline"
                      size={12}
                      color={isSelected ? C.blue : C.textSub}
                    />
                  </View>
                  <Text style={[rp.routeLabel, isSelected && rp.routeLabelSelected]}>{busId}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.blue} />}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 24 }} />
        </View>
      </View>
    </Modal>
  );
}

// ── History Item ──────────────────────────────────────────────────────────────
function HistoryItem({ item, index }: HistoryItemProps): React.JSX.Element {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const isCompleted = item.status === 'completed';
  const statusColor = isCompleted ? C.greenDark : C.redDark;
  const statusBg    = isCompleted ? C.greenLight : C.redLight;
  const statusIcon  = isCompleted
    ? ('checkmark-circle' as const)
    : ('close-circle'     as const);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={hi.card}>
        <View style={hi.topRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={hi.route}>{item.route}</Text>
            <Text style={hi.meta}>{item.date} · {item.startTime}</Text>
          </View>
          <View style={[hi.badge, { backgroundColor: statusBg }]}>
            <Ionicons name={statusIcon} size={11} color={statusColor} />
            <Text style={[hi.badgeText, { color: statusColor }]}>
              {isCompleted ? 'Completed' : 'Cancelled'}
            </Text>
          </View>
        </View>

        <View style={hi.divider} />

        <View style={hi.bottomRow}>
          <View style={hi.chip}>
            <Ionicons name="bus-outline" size={11} color={C.textSub} />
            <Text style={hi.chipText}>{item.busId}</Text>
          </View>
          {isCompleted && (
            <>
              <View style={hi.chip}>
                <Ionicons name="time-outline" size={11} color={C.textSub} />
                <Text style={hi.chipText}>{item.duration}</Text>
              </View>
              <View style={hi.chip}>
                <Ionicons name="people-outline" size={11} color={C.textSub} />
                <Text style={hi.chipText}>{item.passengers} pax</Text>
              </View>
            </>
          )}
          <View style={hi.chip}>
            <Ionicons name="navigate-outline" size={11} color={C.textSub} />
            <Text style={hi.chipText}>{item.distance}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Summary Stats Bar ─────────────────────────────────────────────────────────
function StatsBar({ history }: StatsBarProps): React.JSX.Element {
  const completed = history.filter((h: JourneyRecord) => h.status === 'completed').length;
  const totalPax  = history
    .filter((h: JourneyRecord) => h.status === 'completed')
    .reduce((acc: number, h: JourneyRecord) => acc + h.passengers, 0);
  const totalKm   = history
    .filter((h: JourneyRecord) => h.status === 'completed')
    .reduce((acc: number, h: JourneyRecord) => acc + parseInt(h.distance, 10), 0);

  return (
    <View style={st.bar}>
      <View style={st.item}>
        <Text style={st.value}>{completed}</Text>
        <Text style={st.label}>Trips Today</Text>
      </View>
      <View style={st.sep} />
      <View style={st.item}>
        <Text style={st.value}>{totalPax}</Text>
        <Text style={st.label}>Passengers</Text>
      </View>
      <View style={st.sep} />
      <View style={st.item}>
        <Text style={[st.value, { color: C.teal }]}>{totalKm} km</Text>
        <Text style={st.label}>Distance</Text>
      </View>
    </View>
  );
}

// ── Confirm End Modal ─────────────────────────────────────────────────────────
function ConfirmEndModal({ visible, onCancel, onConfirm, journey, elapsed }: ConfirmEndModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={ce.overlay}>
        <View style={ce.sheet}>
          <View style={[ce.iconWrap, { backgroundColor: C.redLight }]}>
            <Ionicons name="stop-circle" size={32} color={C.red} />
          </View>

          <Text style={ce.title}>End This Journey?</Text>
          <Text style={ce.sub}>
            {'You\'re about to end the journey on\n'}
            <Text style={{ color: C.text, fontFamily: 'Inter_600SemiBold' }}>
              {journey?.from} → {journey?.to}
            </Text>
          </Text>

          <View style={ce.summaryBox}>
            <View style={ce.summaryRow}>
              <Text style={ce.summaryLabel}>Duration</Text>
              <Text style={ce.summaryValue}>{formatDuration(elapsed)}</Text>
            </View>
            <View style={ce.summaryRow}>
              <Text style={ce.summaryLabel}>Bus</Text>
              <Text style={ce.summaryValue}>{journey?.busId}</Text>
            </View>
            <View style={ce.summaryRow}>
              <Text style={ce.summaryLabel}>Route</Text>
              <Text style={ce.summaryValue}>{journey?.code}</Text>
            </View>
          </View>

          <View style={ce.btnRow}>
            <TouchableOpacity onPress={onCancel} style={ce.cancelBtn} activeOpacity={0.8}>
              <Text style={ce.cancelText}>Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={ce.confirmBtn} activeOpacity={0.85}>
              <Ionicons name="stop-circle-outline" size={15} color={C.white} />
              <Text style={ce.confirmText}>End Journey</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function JourneyManagementScreen({ navigation }: ScreenProps): React.JSX.Element {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [activeJourney, setActiveJourney]     = useState<ActiveJourney | null>(null);
  const [elapsed, setElapsed]                 = useState<number>(0);
  const [history, setHistory]                 = useState<JourneyRecord[]>(MOCK_HISTORY);
  const [selectedRoute, setSelectedRoute]     = useState<Route | null>(null);
  const [selectedBus, setSelectedBus]         = useState<string>(BUS_IDS[0]);
  const [showRoutePicker, setShowRoutePicker] = useState<boolean>(false);
  const [showBusPicker, setShowBusPicker]     = useState<boolean>(false);
  const [showConfirmEnd, setShowConfirmEnd]   = useState<boolean>(false);
  const [starting, setStarting]               = useState<boolean>(false);
  const [activeTab, setActiveTab]             = useState<TabKey>('journey');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entrance animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-16)).current;
  const cardOp   = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(headerY,  { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(cardY,  { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Live journey timer
  useEffect(() => {
    if (activeJourney) {
      timerRef.current = setInterval(() => setElapsed((e: number) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeJourney]);

  const handleStartJourney = async (): Promise<void> => {
    if (!selectedRoute || !selectedBus) return;
    setStarting(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    const now     = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const [from, to] = selectedRoute.label.split(' → ');

    setActiveJourney({
      id:        `J${Date.now()}`,
      from,
      to,
      code:      selectedRoute.code,
      distance:  selectedRoute.distance,
      busId:     selectedBus,
      startTime: timeStr,
    });
    setStarting(false);
    setActiveTab('journey');
  };

  const handleEndJourney = (): void => setShowConfirmEnd(true);

  const handleConfirmEnd = (): void => {
    if (!activeJourney) return;

    const now     = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hrs     = Math.floor(elapsed / 3600);
    const mins    = Math.floor((elapsed % 3600) / 60);
    const dur     = hrs > 0
      ? `${hrs}h ${String(mins).padStart(2, '0')}m`
      : `${mins}m`;

    const entry: JourneyRecord = {
      id:         activeJourney.id,
      route:      `${activeJourney.from} → ${activeJourney.to}`,
      busId:      activeJourney.busId,
      date:       'Today',
      startTime:  activeJourney.startTime,
      endTime:    timeStr,
      duration:   dur,
      passengers: Math.floor(Math.random() * 30) + 20,
      status:     'completed',
      distance:   activeJourney.distance,
    };

    setHistory((prev: JourneyRecord[]) => [entry, ...prev]);
    setActiveJourney(null);
    setSelectedRoute(null);
    setShowConfirmEnd(false);
    setActiveTab('history');
  };

  const todayHistory    = history.filter((h: JourneyRecord) => h.date === 'Today');
  const olderHistory    = history.filter((h: JourneyRecord) => h.date !== 'Today');
  const completedToday  = todayHistory.filter((h: JourneyRecord) => h.status === 'completed').length;

  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerCircle} />
        <View style={s.headerCircle2} />

        <SafeAreaView>
          <Animated.View
            style={[s.headerInner, { opacity: headerOp, transform: [{ translateY: headerY }] }]}
          >
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={s.backBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={C.white} />
            </TouchableOpacity>

            <View style={s.headerTextBlock}>
              <Text style={s.headerTitle}>Journey Management</Text>
              <Text style={s.headerSub}>
                {activeJourney
                  ? '1 active journey in progress'
                  : `${completedToday} trips completed today`}
              </Text>
            </View>

            <View style={[s.headerBadge, activeJourney ? { backgroundColor: C.greenLight } : null]}>
              {activeJourney
                ? <PulseDot />
                : <Ionicons name="map-outline" size={20} color={C.white} />}
            </View>
          </Animated.View>

          {/* Tab bar — lives inside the header */}
          <Animated.View style={[s.tabBar, { opacity: headerOp }]}>
            {(['journey', 'history'] as TabKey[]).map((tab: TabKey) => (
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

                {activeJourney ? (
            <Animated.View style={{ opacity: cardOp, transform: [{ translateY: cardY }] }}>
              <ActiveJourneyCard
                journey={activeJourney}
                elapsed={elapsed}
                onEnd={handleEndJourney}
              />
            </Animated.View>
          ) : (
            /* ── Start Journey Card ─────────────────────────────────────── */
            <Animated.View style={[s.startCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>
              <View style={s.startCardHeader}>
                <View style={s.startIconWrap}>
                  <Ionicons name="play-circle" size={22} color={C.blue} />
                </View>
                <View>
                  <Text style={s.startCardTitle}>Start New Journey</Text>
                  <Text style={s.startCardSub}>Select route and bus to begin</Text>
                </View>
              </View>

              <View style={s.startDivider} />

              {/* Route selector */}
              <Text style={s.fieldLabel}>ROUTE</Text>
              <TouchableOpacity
                onPress={() => setShowRoutePicker(true)}
                style={[s.selectorRow, selectedRoute ? s.selectorRowFilled : null]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={selectedRoute ? C.blue : C.textSub}
                />
                <View style={{ flex: 1 }}>
                  {selectedRoute ? (
                    <>
                      <Text style={s.selectorValue}>{selectedRoute.label}</Text>
                      <Text style={s.selectorMeta}>
                        {selectedRoute.distance} · {selectedRoute.stops} stops
                      </Text>
                    </>
                  ) : (
                    <Text style={s.selectorPlaceholder}>Choose a route…</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={14} color={C.textSub} />
              </TouchableOpacity>

              {/* Bus selector */}
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>BUS</Text>
              <TouchableOpacity
                onPress={() => setShowBusPicker(true)}
                style={[s.selectorRow, s.selectorRowFilled]}
                activeOpacity={0.8}
              >
                <Ionicons name="bus-outline" size={16} color={C.blue} />
                <Text style={[s.selectorValue, { flex: 1 }]}>{selectedBus}</Text>
                <Ionicons name="chevron-down" size={14} color={C.textSub} />
              </TouchableOpacity>

              <View style={s.startDivider} />

              {/* Start button */}
              <TouchableOpacity
                onPress={handleStartJourney}
                style={[s.startBtn, (!selectedRoute || starting) ? s.startBtnDisabled : null]}
                activeOpacity={selectedRoute && !starting ? 0.85 : 1}
                disabled={!selectedRoute || starting}
              >
                {starting ? (
                  <>
                    <ActivityIndicator size="small" color={C.white} />
                    <Text style={s.startBtnText}>Starting Journey…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="play-circle-outline" size={18} color={C.white} />
                    <Text style={s.startBtnText}>Start Journey</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

      {/* ── TAB: JOURNEY ────────────────────────────────────────────────── */}
      {activeTab === 'journey' && (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Today's recap */}
          {todayHistory.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Today's Summary</Text>
              </View>
              <StatsBar history={todayHistory} />
            </>
          )}

          {/* Info tip */}
          {!activeJourney && (
            <View style={s.tipCard}>
              <Ionicons name="information-circle-outline" size={15} color={C.teal} />
              <Text style={s.tipText}>
                You can view past journeys and export your daily report from the History tab.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── TAB: HISTORY ────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: cardOp, transform: [{ translateY: cardY }] }}>
            <StatsBar history={history.filter((h: JourneyRecord) => h.date === 'Today')} />
          </Animated.View>

          {todayHistory.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Today</Text>
                <Text style={s.sectionCount}>
                  {todayHistory.length} trip{todayHistory.length > 1 ? 's' : ''}
                </Text>
              </View>
              {todayHistory.map((item: JourneyRecord, i: number) => (
                <HistoryItem key={item.id} item={item} index={i} />
              ))}
            </>
          )}

          {olderHistory.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Earlier</Text>
                <Text style={s.sectionCount}>
                  {olderHistory.length} trip{olderHistory.length > 1 ? 's' : ''}
                </Text>
              </View>
              {olderHistory.map((item: JourneyRecord, i: number) => (
                <HistoryItem key={item.id} item={item} index={i + todayHistory.length} />
              ))}
            </>
          )}

          {history.length === 0 && (
            <View style={s.emptyState}>
              <View style={s.emptyIcon}>
                <Ionicons name="map-outline" size={38} color={C.blue} />
              </View>
              <Text style={s.emptyTitle}>No journeys yet</Text>
              <Text style={s.emptySub}>Your completed journeys{'\n'}will appear here.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <RoutePickerModal
        visible={showRoutePicker}
        onClose={() => setShowRoutePicker(false)}
        onSelect={setSelectedRoute}
        selectedId={selectedRoute?.id ?? null}
      />
      <BusPickerModal
        visible={showBusPicker}
        onClose={() => setShowBusPicker(false)}
        onSelect={setSelectedBus}
        selectedId={selectedBus}
      />
      <ConfirmEndModal
        visible={showConfirmEnd}
        onCancel={() => setShowConfirmEnd(false)}
        onConfirm={handleConfirmEnd}
        journey={activeJourney}
        elapsed={elapsed}
      />
    </View>
  );
}

// ── Active Journey Card Styles ────────────────────────────────────────────────
const ac = StyleSheet.create({
  // ↓ KEY CHANGE: negative marginTop pulls card up to overlap the header bottom
  card: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 5,
    marginBottom: 20,
  },
  topBar: {
    height: 4,
    backgroundColor: C.green,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: C.green,
    letterSpacing: 1.2,
  },
  badge: {
    backgroundColor: C.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.greenDark,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  routePin: { alignItems: 'center', gap: 3 },
  dotGreen: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.green,
    borderWidth: 2, borderColor: `${C.green}40`,
  },
  routeLine: { width: 2, height: 24, backgroundColor: C.border },
  dotBlue: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.blue,
    borderWidth: 2, borderColor: `${C.blue}40`,
  },
  routeLabels: { flex: 1, gap: 18 },
  routeFrom: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  routeTo: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  routeMeta: { alignItems: 'flex-end', gap: 18 },
  routeCode: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: C.textSub,
    letterSpacing: 0.8,
  },
  routeDistance: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textMuted,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  statsRow: { flexDirection: 'row', paddingVertical: 12 },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statSep: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textSub,
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.text,
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    margin: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${C.red}40`,
    backgroundColor: C.redLight,
  },
  endBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.red,
  },
});

// ── Route / Bus Picker Styles ─────────────────────────────────────────────────
const rp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: C.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: C.bg,
  },
  rowSelected: {
    backgroundColor: C.blueLight,
    borderWidth: 1,
    borderColor: `${C.blue}25`,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  codeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: C.border,
  },
  codeTagSelected: { backgroundColor: `${C.blue}20` },
  codeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: C.textSub,
    letterSpacing: 0.6,
  },
  codeTextSelected: { color: C.blue },
  routeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  routeLabelSelected: { color: C.blue },
  routeMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
});

// ── History Item Styles ───────────────────────────────────────────────────────
const hi = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  route: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.text,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.textSub,
  },
});

// ── Stats Bar Styles ──────────────────────────────────────────────────────────
const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: C.blue,
    letterSpacing: -1,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
  },
  sep: { width: 1, backgroundColor: C.border, marginVertical: 4 },
});

// ── Confirm End Modal Styles ──────────────────────────────────────────────────
const ce = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  iconWrap: {
    width: 70, height: 70,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    color: C.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textSub,
  },
  summaryValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.textSub,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.red,
  },
  confirmText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.white,
  },
});

// ── Main Screen Styles ────────────────────────────────────────────────────────

// ↓ KEY CHANGE: taller header gives the tab bar room to breathe inside the
//   blue block, so the card's negative marginTop can visually climb on top.
const HEADER_H: number = Platform.OS === 'ios' ? 220 : 200;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    height: HEADER_H,
    backgroundColor: C.blue,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100, right: -50,
  },
  headerCircle2: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -60, left: -40,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 44,
    gap: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: C.white,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  headerBadge: {
    width: 38, height: 38, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: { backgroundColor: C.white },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: { color: C.blue },
  tabBadge: {
    backgroundColor: C.blue,
    borderRadius: 99,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: C.white,
  },

  // ↓ KEY CHANGE: negative marginTop matches HomeScreen's search card pattern
  startCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
  },
  startCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  startIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  startCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.3,
  },
  startCardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  startDivider: { height: 1, backgroundColor: C.border, marginBottom: 16 },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: C.textSub,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 13,
    backgroundColor: C.bg,
  },
  selectorRowFilled: {
    borderColor: `${C.blue}30`,
    backgroundColor: `${C.blue}06`,
  },
  selectorValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  selectorMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  selectorPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textMuted,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.blue,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 4,
  },
  startBtnDisabled: { backgroundColor: C.textMuted },
  startBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.white,
    letterSpacing: 0.1,
  },
  scroll: { flex: 1 },
  // ↓ No top padding — card's negative margin handles the overlap
  scrollContent: { paddingTop: 0, paddingBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.tealLight,
    marginHorizontal: 16,
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${C.teal}25`,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.teal,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.blueLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
});