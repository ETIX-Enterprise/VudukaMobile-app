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
  Keyboard,
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

// ── Design Tokens (mirrored from HomeScreen) ──────────────────────────────────
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
};

// ── Types ─────────────────────────────────────────────────────────────────────
type TicketStatus = 'idle' | 'loading' | 'valid' | 'invalid';

interface TicketEntry {
  id: string;
  code: string;
  status: TicketStatus;
  passengerName?: string;
  route?: string;
  seat?: string;
  date?: string;
  errorMsg?: string;
}

// ── Mock verification logic (replace with real API) ───────────────────────────
const MOCK_VALID_CODES: Record<string, Omit<TicketEntry, 'id' | 'code' | 'status'>> = {
  'KGL-001-A': { passengerName: 'Alice Uwimana',   route: 'Kigali → Nyabihu',  seat: '12A', date: 'Dec 21, 2025' },
  'KGL-002-B': { passengerName: 'Bruno Hakizimana', route: 'Kigali → Musanze',  seat: '04C', date: 'Dec 21, 2025' },
  'KGL-003-C': { passengerName: 'Claire Nkurunziza',route: 'Kigali → Huye',    seat: '08B', date: 'Dec 21, 2025' },
  'NYB-004-D': { passengerName: 'David Mugabo',    route: 'Nyabihu → Kigali',  seat: '01A', date: 'Dec 22, 2025' },
};

async function verifyCode(code: string): Promise<Partial<TicketEntry>> {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
  const upper = code.trim().toUpperCase();
  const match = MOCK_VALID_CODES[upper];
  if (match) return { status: 'valid', ...match };
  return { status: 'invalid', errorMsg: 'Ticket not found or already used.' };
}

// ── Ticket Result Card ────────────────────────────────────────────────────────
function TicketResultCard({ entry, onRemove }: { entry: TicketEntry; onRemove: () => void }) {
  const slideAnim = useRef(new Animated.Value(18)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 340, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 16, stiffness: 180, useNativeDriver: true } as any),
    ]).start();
  }, []);

  const isValid   = entry.status === 'valid';
  const isInvalid = entry.status === 'invalid';
  const isLoading = entry.status === 'loading';

  const accentColor = isValid ? C.green : isInvalid ? C.red : C.blue;
  const bgColor     = isValid ? C.greenLight : isInvalid ? C.redLight : C.blueLight;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <View style={[tr.card, { borderLeftColor: accentColor }]}>

        {/* Code row */}
        <View style={tr.headerRow}>
          <View style={[tr.statusDot, { backgroundColor: bgColor }]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={C.blue} />
            ) : (
              <Ionicons
                name={isValid ? 'checkmark-circle' : isInvalid ? 'close-circle' : 'ellipse-outline'}
                size={20}
                color={accentColor}
              />
            )}
          </View>

          <View style={tr.codeBlock}>
            <Text style={tr.codeLabel}>TICKET CODE</Text>
            <Text style={tr.codeValue}>{entry.code.toUpperCase()}</Text>
          </View>

          <TouchableOpacity onPress={onRemove} style={tr.removeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={14} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* Status body */}
        {isLoading && (
          <View style={tr.loadingBody}>
            <Text style={tr.loadingText}>Verifying ticket…</Text>
          </View>
        )}

        {isValid && (
          <>
            <View style={tr.divider} />
            <View style={tr.infoGrid}>
              <View style={tr.infoItem}>
                <Ionicons name="person-outline" size={12} color={C.textSub} />
                <View>
                  <Text style={tr.infoLabel}>Passenger</Text>
                  <Text style={tr.infoValue}>{entry.passengerName}</Text>
                </View>
              </View>
              <View style={tr.infoItem}>
                <Ionicons name="bus-outline" size={12} color={C.textSub} />
                <View>
                  <Text style={tr.infoLabel}>Route</Text>
                  <Text style={tr.infoValue}>{entry.route}</Text>
                </View>
              </View>
              <View style={tr.infoItem}>
                <Ionicons name="bookmark-outline" size={12} color={C.textSub} />
                <View>
                  <Text style={tr.infoLabel}>Seat</Text>
                  <Text style={tr.infoValue}>{entry.seat}</Text>
                </View>
              </View>
              <View style={tr.infoItem}>
                <Ionicons name="calendar-outline" size={12} color={C.textSub} />
                <View>
                  <Text style={tr.infoLabel}>Date</Text>
                  <Text style={tr.infoValue}>{entry.date}</Text>
                </View>
              </View>
            </View>
            <View style={[tr.statusBanner, { backgroundColor: C.greenLight }]}>
              <Ionicons name="shield-checkmark" size={13} color={C.greenDark} />
              <Text style={[tr.statusBannerText, { color: C.greenDark }]}>Valid — Board Approved</Text>
            </View>
          </>
        )}

        {isInvalid && (
          <>
            <View style={tr.divider} />
            <View style={[tr.statusBanner, { backgroundColor: C.redLight }]}>
              <Ionicons name="alert-circle" size={13} color={C.redDark} />
              <Text style={[tr.statusBannerText, { color: C.redDark }]}>{entry.errorMsg}</Text>
            </View>
          </>
        )}

      </View>
    </Animated.View>
  );
}

// ── Code Input Tag ────────────────────────────────────────────────────────────
function CodeTag({ code, onRemove }: { code: string; onRemove: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 200, useNativeDriver: true } as any),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <View style={ct.tag}>
        <Text style={ct.tagText}>{code.toUpperCase()}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={14} color={C.blue} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Summary Bar ───────────────────────────────────────────────────────────────
function SummaryBar({ tickets }: { tickets: TicketEntry[] }) {
  const valid   = tickets.filter(t => t.status === 'valid').length;
  const invalid = tickets.filter(t => t.status === 'invalid').length;
  const pending = tickets.filter(t => t.status === 'loading').length;

  if (tickets.length === 0) return null;

  return (
    <View style={sb.bar}>
      <View style={sb.item}>
        <Text style={[sb.count, { color: C.green }]}>{valid}</Text>
        <Text style={sb.label}>Valid</Text>
      </View>
      <View style={sb.sep} />
      <View style={sb.item}>
        <Text style={[sb.count, { color: C.red }]}>{invalid}</Text>
        <Text style={sb.label}>Invalid</Text>
      </View>
      <View style={sb.sep} />
      <View style={sb.item}>
        <Text style={[sb.count, { color: C.amber }]}>{pending}</Text>
        <Text style={sb.label}>Pending</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TicketVerificationScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [inputCode, setInputCode]     = useState('');
  const [queuedCodes, setQueuedCodes] = useState<string[]>([]);
  const [tickets, setTickets]         = useState<TicketEntry[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Entrance anims
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

  // Add code to queue on comma / space / Enter or 9+ chars auto-detect
  const handleInputChange = (val: string) => {
    if (val.endsWith(',') || val.endsWith(' ')) {
      addToQueue(val.replace(/[, ]/g, '').trim());
    } else {
      setInputCode(val);
    }
  };

  const handleSubmitEditing = () => {
    if (inputCode.trim()) addToQueue(inputCode.trim());
  };

  const addToQueue = (code: string) => {
    if (!code) return;
    const upper = code.toUpperCase();
    if (queuedCodes.includes(upper)) { setInputCode(''); return; }
    setQueuedCodes(prev => [...prev, upper]);
    setInputCode('');
  };

  const removeQueued = (code: string) => {
    setQueuedCodes(prev => prev.filter(c => c !== code));
  };

  const removeTicket = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  const handleVerify = async () => {
    const toVerify = inputCode.trim()
      ? [...queuedCodes, inputCode.trim().toUpperCase()]
      : [...queuedCodes];

    if (toVerify.length === 0) return;

    Keyboard.dismiss();
    setInputCode('');
    setQueuedCodes([]);

    // Seed loading states
    const newEntries: TicketEntry[] = toVerify.map(code => ({
      id: `${code}-${Date.now()}-${Math.random()}`,
      code,
      status: 'loading',
    }));
    setTickets(prev => [...newEntries, ...prev]);

    // Verify concurrently
    await Promise.all(
      newEntries.map(async entry => {
        const result = await verifyCode(entry.code);
        setTickets(prev =>
          prev.map(t => t.id === entry.id ? { ...t, ...result } : t)
        );
      })
    );
  };

  const handleClearAll = () => {
    setTickets([]);
    setQueuedCodes([]);
    setInputCode('');
  };

  const totalQueued  = queuedCodes.length + (inputCode.trim() ? 1 : 0);
  const hasResults   = tickets.length > 0;

  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerCircle} />
        <View style={s.headerCircle2} />

        <SafeAreaView>
          <Animated.View style={[s.headerInner, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>

            {/* Back button */}
            <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color={C.white} />
            </TouchableOpacity>

            <View style={s.headerTextBlock}>
              <Text style={s.headerTitle}>Ticket Verification</Text>
              <Text style={s.headerSub}>Scan or enter codes to verify</Text>
            </View>

            {/* Badge icon */}
            <View style={s.headerBadge}>
              <Ionicons name="shield-checkmark-outline" size={20} color={C.white} />
            </View>

          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── INPUT CARD ─────────────────────────────────────────────────── */}
      <Animated.View style={[s.inputCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>

        {/* Queued code tags */}
        {queuedCodes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.tagsScroll}
            contentContainerStyle={s.tagsContent}
          >
            {queuedCodes.map(code => (
              <CodeTag key={code} code={code} onRemove={() => removeQueued(code)} />
            ))}
          </ScrollView>
        )}

        {/* Text Input */}
        <View style={[s.inputRow, inputFocused && s.inputRowFocused]}>
          <View style={s.inputIcon}>
            <Ionicons name="qr-code-outline" size={18} color={inputFocused ? C.blue : C.textSub} />
          </View>

          <TextInput
            ref={inputRef}
            value={inputCode}
            onChangeText={handleInputChange}
            onSubmitEditing={handleSubmitEditing}
            placeholder="Enter ticket code (e.g. VDK-001)"
            className='text-[10px] font-inter'
            style={s.inputText}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />

          {inputCode.length > 0 && (
            <TouchableOpacity onPress={() => addToQueue(inputCode)} style={s.addBtn} activeOpacity={0.8}>
              <Text className='text-[14px] font-inter-semibold'>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hint */}
        <Text className='text-[12px] font-inter p-3'>
          {queuedCodes.length > 0
            ? `${totalQueued} code${totalQueued > 1 ? 's' : ''} ready — tap verify to check all at once`
            : 'Type a code and press + Add or use comma/space to add multiple'}
        </Text>

        {/* Action Buttons */}
        <View style={s.actionRow}>
          {hasResults && (
            <TouchableOpacity onPress={handleClearAll} style={s.clearBtn} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={14} color={C.textSub} />
              <Text style={s.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleVerify}
            style={[s.verifyBtn, totalQueued === 0 && s.verifyBtnDisabled]}
            activeOpacity={totalQueued > 0 ? 0.87 : 1}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={C.white} />
            <Text className='text-[15px] font-inter-semibold text-white'>
              {totalQueued > 1 ? `Verify ${totalQueued} Tickets` : 'Verify Ticket'}
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* ── RESULTS ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasResults && (
          <>
            {/* Summary bar */}
            <SummaryBar tickets={tickets} />

            {/* Section header */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Results</Text>
              <Text style={s.sectionCount}>{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</Text>
            </View>

            {/* Cards */}
            <View style={s.cardsWrap}>
              {tickets.map(entry => (
                <TicketResultCard
                  key={entry.id}
                  entry={entry}
                  onRemove={() => removeTicket(entry.id)}
                />
              ))}
            </View>
          </>
        )}

        {/* Empty state */}
        {!hasResults && (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="ticket-outline" size={38} color={C.blue} />
            </View>
            <Text style={s.emptyTitle}>No verifications yet</Text>
            <Text className='font-inter text-[12px]'>Enter one or more ticket codes above{'\n'}and tap Verify to get started.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

    </View>
  );
}

// ── Ticket Result Card Styles ─────────────────────────────────────────────────
const tr = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  statusDot: {
    width: 36,
    height: 36,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBlock: { flex: 1 },
  codeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    color: C.textSub,
    letterSpacing: 1.2,
  },
  codeValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    letterSpacing: 1,
    marginTop: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: (width - 32 - 20 - 28 - 12) / 2,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textSub,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.text,
    marginTop: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  loadingBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
  },
});

// ── Code Tag Styles ───────────────────────────────────────────────────────────
const ct = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: `${C.blue}22`,
  },
  tagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.blue,
    letterSpacing: 0.6,
  },
});

// ── Summary Bar Styles ────────────────────────────────────────────────────────
const sb = StyleSheet.create({
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
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  count: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -1,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textSub,
  },
  sep: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
});

// ── Main Styles ───────────────────────────────────────────────────────────────
const HEADER_H = Platform.OS === 'ios' ? 190 : 170;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    height: HEADER_H,
    backgroundColor: C.blue,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100,
    right: -50,
  },
  headerCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -60,
    left: -40,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 44,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Input Card
  inputCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -54,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },

  tagsScroll: {
    maxHeight: 44,
    marginBottom: 10,
  },
  tagsContent: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 0,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: C.bg,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: C.blue,
    backgroundColor: '#F0F4FF',
  },
  inputIcon: {
    width: 24,
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
    padding: 0,
  },
  addBtn: {
    backgroundColor: C.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.blue,
  },

  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textMuted,
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  clearBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.textSub,
  },
  verifyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.blue,
    paddingVertical: 12,
    borderRadius: 12,
  },
  verifyBtnDisabled: {
    backgroundColor: C.textMuted,
  },
  verifyBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.1,
  },

  // Scroll / Results
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
  },
  cardsWrap: {
    paddingHorizontal: 16,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
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