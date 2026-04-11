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

// ── Design tokens — dashboard parity ─────────────────────────────────────────
const C = {
  blue:        '#003DD0',
  blueAccent:  '#0075A8',
  blueLight:   '#003DD010',
  green:       '#008A75',
  greenLight:  '#008A7512',
  greenDark:   '#006B5B',
  white:       '#FFFFFF',
  bg:          '#f8fafc',
  text:        '#0f172a',
  textSub:     '#64748b',
  textMuted:   '#94a3b8',
  border:      '#e2e8f0',
  red:         '#F04438',
  redLight:    '#F0443812',
  redDark:     '#C0321F',
  amber:       '#F5A623',
  amberLight:  '#F5A62318',
  amberDark:   '#D4880A',
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

// ── Mock verification ─────────────────────────────────────────────────────────
const MOCK_VALID: Record<string, Omit<TicketEntry, 'id' | 'code' | 'status'>> = {
  'KGL-001-A': { passengerName: 'Alice Uwimana',    route: 'Kigali → Nyabihu', seat: '12A', date: 'Dec 21, 2025' },
  'KGL-002-B': { passengerName: 'Bruno Hakizimana', route: 'Kigali → Musanze', seat: '04C', date: 'Dec 21, 2025' },
  'KGL-003-C': { passengerName: 'Claire Nkurunziza',route: 'Kigali → Huye',   seat: '08B', date: 'Dec 21, 2025' },
  'NYB-004-D': { passengerName: 'David Mugabo',     route: 'Nyabihu → Kigali', seat: '01A', date: 'Dec 22, 2025' },
};

async function verifyCode(code: string): Promise<Partial<TicketEntry>> {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
  const match = MOCK_VALID[code.trim().toUpperCase()];
  if (match) return { status: 'valid', ...match };
  return { status: 'invalid', errorMsg: 'Ticket not found or already used.' };
}

// ── Ticket Result Card ────────────────────────────────────────────────────────
function TicketResultCard({ entry, onRemove }: { entry: TicketEntry; onRemove: () => void }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const isValid   = entry.status === 'valid';
  const isInvalid = entry.status === 'invalid';
  const isLoading = entry.status === 'loading';

  // Color set per status
  const accent = isValid ? C.green : isInvalid ? C.red : C.blue;
  const accentBg = isValid ? C.greenLight : isInvalid ? C.redLight : C.blueLight;
  const accentDark = isValid ? C.greenDark : isInvalid ? C.redDark : C.blueAccent;

  return (
    <Animated.View style={[tr.wrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[tr.card, { borderLeftColor: accent }]}>

        {/* ── Header row ── */}
        <View style={tr.headerRow}>
          {/* Status icon */}
          <View style={[tr.iconTile, { backgroundColor: accentBg }]}>
            {isLoading
              ? <ActivityIndicator size="small" color={C.blue} />
              : <Ionicons
                  name={isValid ? 'checkmark-circle' : isInvalid ? 'close-circle' : 'ellipse-outline'}
                  size={20}
                  color={accent}
                />
            }
          </View>

          {/* Code */}
          <View style={tr.codeBlock}>
            <Text style={tr.codeEyebrow}>TICKET CODE</Text>
            <Text style={tr.codeValue}>{entry.code.toUpperCase()}</Text>
          </View>

          {/* Remove */}
          <TouchableOpacity onPress={onRemove} style={tr.removeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={13} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* ── Loading body ── */}
        {isLoading && (
          <View style={tr.loadingRow}>
            <Text style={tr.loadingText}>Verifying ticket…</Text>
          </View>
        )}

        {/* ── Valid body ── */}
        {isValid && (
          <>
            <View style={tr.divider} />
            <View style={tr.infoGrid}>
              {[
                { icon: 'person-outline',   label: 'Passenger', value: entry.passengerName! },
                { icon: 'bus-outline',       label: 'Route',     value: entry.route!          },
                { icon: 'bookmark-outline',  label: 'Seat',      value: entry.seat!           },
                { icon: 'calendar-outline',  label: 'Date',      value: entry.date!           },
              ].map(row => (
                <View key={row.label} style={tr.infoItem}>
                  <View style={tr.infoIconWrap}>
                    <Ionicons name={row.icon as any} size={11} color={C.textSub} />
                  </View>
                  <View>
                    <Text style={tr.infoLabel}>{row.label}</Text>
                    <Text style={tr.infoValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={[tr.statusBanner, { backgroundColor: C.greenLight }]}>
              <Ionicons name="shield-checkmark" size={13} color={C.greenDark} />
              <Text style={[tr.statusBannerText, { color: C.greenDark }]}>
                Valid — Board approved
              </Text>
            </View>
          </>
        )}

        {/* ── Invalid body ── */}
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

// ── Code Tag ──────────────────────────────────────────────────────────────────
function CodeTag({ code, onRemove }: { code: string; onRemove: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 200, useNativeDriver: true } as any),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <View style={ct.tag}>
        <Text style={ct.tagText}>{code.toUpperCase()}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={14} color={C.blue} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Summary Bar — mirrors dashboard StatSummaryCard ───────────────────────────
function SummaryBar({ tickets }: { tickets: TicketEntry[] }) {
  const valid   = tickets.filter(t => t.status === 'valid').length;
  const invalid = tickets.filter(t => t.status === 'invalid').length;
  const pending = tickets.filter(t => t.status === 'loading').length;
  if (!tickets.length) return null;

  return (
    <View style={sb.bar}>
      {[
        { label: 'Valid',   count: valid,   color: C.green },
        { label: 'Invalid', count: invalid, color: C.red   },
        { label: 'Pending', count: pending, color: C.amber },
      ].map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={sb.sep} />}
          <View style={sb.item}>
            <Text style={[sb.count, { color: item.color }]}>{item.count}</Text>
            <Text style={sb.label}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
const HEADER_H = Platform.OS === 'ios' ? 185 : 165;

export default function TicketVerificationScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [inputCode,    setInputCode]    = useState('');
  const [queuedCodes,  setQueuedCodes]  = useState<string[]>([]);
  const [tickets,      setTickets]      = useState<TicketEntry[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-14)).current;
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

  const handleInputChange = (val: string) => {
    if (val.endsWith(',') || val.endsWith(' ')) {
      addToQueue(val.replace(/[, ]/g, '').trim());
    } else {
      setInputCode(val);
    }
  };

  const addToQueue = (code: string) => {
    if (!code) return;
    const upper = code.toUpperCase();
    if (queuedCodes.includes(upper)) { setInputCode(''); return; }
    setQueuedCodes(prev => [...prev, upper]);
    setInputCode('');
  };

  const removeQueued  = (code: string) => setQueuedCodes(prev => prev.filter(c => c !== code));
  const removeTicket  = (id: string)   => setTickets(prev => prev.filter(t => t.id !== id));
  const handleClearAll = () => { setTickets([]); setQueuedCodes([]); setInputCode(''); };

  const handleVerify = async () => {
    const toVerify = inputCode.trim()
      ? [...queuedCodes, inputCode.trim().toUpperCase()]
      : [...queuedCodes];
    if (!toVerify.length) return;

    Keyboard.dismiss();
    setInputCode('');
    setQueuedCodes([]);

    const newEntries: TicketEntry[] = toVerify.map(code => ({
      id: `${code}-${Date.now()}-${Math.random()}`,
      code,
      status: 'loading',
    }));
    setTickets(prev => [...newEntries, ...prev]);

    await Promise.all(
      newEntries.map(async entry => {
        const result = await verifyCode(entry.code);
        setTickets(prev => prev.map(t => t.id === entry.id ? { ...t, ...result } : t));
      })
    );
  };

  const totalQueued = queuedCodes.length + (inputCode.trim() ? 1 : 0);
  const hasResults  = tickets.length > 0;

  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── HEADER ── */}
      <View style={[s.header, { height: HEADER_H }]}>
        <View style={s.circle1} />
        <View style={s.circle2} />

        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View style={[s.headerInner, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>

            {/* Back */}
            <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={17} color={C.white} />
            </TouchableOpacity>

            {/* Title block */}
            <View style={s.headerTextBlock}>
              {/* Eyebrow — mirrors dashboard .sec-label */}
              <View style={s.eyebrow}>
                <View style={s.eyebrowDot} />
                <Text style={s.eyebrowText}>VERIFICATION</Text>
              </View>
              <Text style={s.headerTitle}>Ticket Verification</Text>
              <Text style={s.headerSub}>Scan or enter codes to verify</Text>
            </View>

            {/* Badge icon */}
            <View style={s.headerBadge}>
              <Ionicons name="shield-checkmark-outline" size={19} color={C.white} />
            </View>

          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── INPUT CARD (overlaps header) ── */}
      <Animated.View style={[s.inputCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>

        {/* Queued tags */}
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

        {/* Input row */}
        <View style={[s.inputRow, inputFocused && s.inputRowFocused]}>
          <View style={s.inputIconWrap}>
            <Ionicons name="qr-code-outline" size={17} color={inputFocused ? C.blue : C.textSub} />
          </View>
          <TextInput
            ref={inputRef}
            value={inputCode}
            onChangeText={handleInputChange}
            onSubmitEditing={() => inputCode.trim() && addToQueue(inputCode.trim())}
            placeholder="Enter code — e.g. KGL-001-A"
            placeholderTextColor={C.textMuted}
            style={s.inputText}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {inputCode.length > 0 && (
            <TouchableOpacity
              onPress={() => addToQueue(inputCode)}
              style={s.addBtn}
              activeOpacity={0.8}
            >
              <Text style={s.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hint — mirrors dashboard .sec-label style */}
        <Text style={s.hint}>
          {queuedCodes.length > 0
            ? `${totalQueued} code${totalQueued > 1 ? 's' : ''} ready — tap verify to check all at once`
            : 'Type a code and press + Add, or use comma to add multiple'}
        </Text>

        {/* Action row */}
        <View style={s.actionRow}>
          {hasResults && (
            <TouchableOpacity onPress={handleClearAll} style={s.clearBtn} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={13} color={C.textSub} />
              <Text style={s.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleVerify}
            style={[s.verifyBtn, totalQueued === 0 && s.verifyBtnDisabled]}
            activeOpacity={totalQueued > 0 ? 0.87 : 1}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={C.white} />
            <Text style={s.verifyBtnText}>
              {totalQueued > 1 ? `Verify ${totalQueued} tickets` : 'Verify ticket'}
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* ── RESULTS ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasResults && (
          <>
            <SummaryBar tickets={tickets} />

            {/* Section header — matches dashboard sectionHeader pattern */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Results</Text>
              <Text style={s.sectionCount}>
                {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
              </Text>
            </View>

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
            <View style={s.emptyIconWrap}>
              <Ionicons name="ticket-outline" size={36} color={C.blue} />
            </View>
            <Text style={s.emptyTitle}>No verifications yet</Text>
            <Text style={s.emptySub}>
              Enter one or more ticket codes above{'\n'}and tap Verify to get started.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Ticket Result Card Styles ─────────────────────────────────────────────────
const tr = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,      // matches dashboard icon tiles (borderRadius: 9)
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBlock: { flex: 1 },
  codeEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    color: C.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  codeValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
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
    gap: 7,
    width: (width - 32 - 28 - 12) / 2,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: C.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  loadingRow: {
    paddingHorizontal: 14,
    paddingBottom: 12,
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
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${C.blue}20`,
  },
  tagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.blue,
    letterSpacing: 0.5,
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
  count: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -1,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -55,
    left: -30,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  headerTextBlock: { flex: 1 },

  // Eyebrow — .sec-label equivalent
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: C.green,    // #008A75
  },
  eyebrowText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  // ── Input Card ─────────────────────────────────────────────────────────────
  inputCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -44,
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

  tagsScroll: {
    maxHeight: 42,
    marginBottom: 10,
  },
  tagsContent: {
    flexDirection: 'row',
    gap: 7,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: C.bg,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: C.blue,
    backgroundColor: '#EEF3FF',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconWrap: {
    width: 22,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${C.blue}20`,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.blue,
  },

  // Hint — matches .sec-label sizing/spacing
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textMuted,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
    letterSpacing: 0.1,
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
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
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
    backgroundColor: C.green,      // green primary CTA — nav-active color
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnDisabled: {
    backgroundColor: C.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.1,
  },

  // ── Results ────────────────────────────────────────────────────────────────
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
    fontSize: 15,
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

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: `${C.blue}14`,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
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