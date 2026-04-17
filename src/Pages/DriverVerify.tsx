/**
 * TicketVerificationScreen.tsx
 * Production-ready · React Native · Expo · TypeScript
 * Styling: NativeWind (className) + StyleSheet
 * QR scanning: expo-camera (CameraView + barcode scanning)
 * Design: exact token parity with HomeScreen
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  TextInput,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — exact parity with HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  blue:       '#0075A8',
  blueSoft:   '#EEF6FB',
  blueDark:   '#005580',
  green:      '#008A75',
  greenSoft:  '#F0FAF7',
  greenDark:  '#006B5B',
  white:      '#FFFFFF',
  bg:         '#f8fafc',
  text:       '#0f172a',
  textSub:    '#64748b',
  textMuted:  '#94a3b8',
  border:     '#e2e8f0',
  error:      '#DC2626',
  errorBg:    '#FEF2F2',
  amber:      '#D97706',
  amberBg:    '#FEF9C3',
  overlay:    'rgba(15,23,42,0.60)',
} as const;

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type TicketStatus = 'loading' | 'valid' | 'invalid';

interface TicketEntry {
  id: string;
  code: string;
  status: TicketStatus;
  passengerName?: string;
  route?: string;
  seat?: string;
  date?: string;
  amount?: string;
  errorMsg?: string;
}

interface VerificationScreenProps {
  navigation?: any;
  authFetch?: (url: string, opts?: RequestInit) => Promise<any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock verification (swap for real authFetch call)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_DB: Record<string, Omit<TicketEntry, 'id' | 'code' | 'status'>> = {
  'KGL-001-A': { passengerName: 'Alice Uwimana',     route: 'Kigali → Nyabihu', seat: '12A', date: 'Apr 17, 2026', amount: '3,500 RWF' },
  'KGL-002-B': { passengerName: 'Bruno Hakizimana',  route: 'Kigali → Musanze', seat: '04C', date: 'Apr 17, 2026', amount: '2,800 RWF' },
  'KGL-003-C': { passengerName: 'Claire Nkurunziza', route: 'Kigali → Huye',    seat: '08B', date: 'Apr 17, 2026', amount: '4,000 RWF' },
  'NYB-004-D': { passengerName: 'David Mugabo',      route: 'Nyabihu → Kigali', seat: '01A', date: 'Apr 17, 2026', amount: '3,500 RWF' },
};

async function verifyTicket(
  code: string,
  authFetch?: VerificationScreenProps['authFetch'],
): Promise<Partial<TicketEntry>> {
  if (authFetch) {
    try {
      const res = await authFetch(`/tickets/verify/${encodeURIComponent(code)}`);
      if (res?.valid) {
        return {
          status: 'valid',
          passengerName: res.passengerName,
          route: res.route,
          seat: res.seat,
          date: res.date,
          amount: res.amount,
        };
      }
      return { status: 'invalid', errorMsg: res?.message ?? 'Ticket not found or already used.' };
    } catch (e: any) {
      return { status: 'invalid', errorMsg: e?.message ?? 'Verification failed.' };
    }
  }
  // Mock fallback
  await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
  const hit = MOCK_DB[code.trim().toUpperCase()];
  if (hit) return { status: 'valid', ...hit };
  return { status: 'invalid', errorMsg: 'Ticket not found or already used.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton pulse
// ─────────────────────────────────────────────────────────────────────────────
function Skel({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ width: w as any, height: h, borderRadius: r, backgroundColor: C.border, opacity: op }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary strip — mirrors HomeScreen StatsStrip
// ─────────────────────────────────────────────────────────────────────────────
function SummaryStrip({ tickets }: { tickets: TicketEntry[] }) {
  if (!tickets.length) return null;
  const valid   = tickets.filter(t => t.status === 'valid').length;
  const invalid = tickets.filter(t => t.status === 'invalid').length;
  const pending = tickets.filter(t => t.status === 'loading').length;

  const stats = [
    { label: 'Valid',   value: valid,   color: C.green },
    { label: 'Invalid', value: invalid, color: C.error },
    { label: 'Pending', value: pending, color: C.amber },
    { label: 'Total',   value: tickets.length, color: C.blue },
  ];

  return (
    <View style={strip.card}>
      {stats.map((it, i) => (
        <React.Fragment key={it.label}>
          <View style={strip.item}>
            <Text style={[strip.val, { color: it.color }]}>{it.value}</Text>
            <Text style={strip.lbl}>{it.label}</Text>
          </View>
          {i < stats.length - 1 && <View style={strip.sep} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const strip = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  val:  { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.8 },
  lbl:  {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sep: { width: 1, backgroundColor: C.border, marginVertical: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Code tag pill (queued codes)
// ─────────────────────────────────────────────────────────────────────────────
function CodeTag({ code, onRemove }: { code: string; onRemove: () => void }) {
  const scale = useRef(new Animated.Value(0.78)).current;
  const op    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 220, useNativeDriver: true }),
      Animated.timing(op,   { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: op, transform: [{ scale }] }}>
      <View style={ct.tag}>
        <View style={ct.dot} />
        <Text style={ct.text}>{code}</Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={14} color={C.blue} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const ct = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: `${C.blue}28`,
  },
  dot:  { width: 5, height: 5, borderRadius: 99, backgroundColor: C.blue },
  text: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.blue, letterSpacing: 0.5 },
});

// ─────────────────────────────────────────────────────────────────────────────
// QR Scanner Modal
// ─────────────────────────────────────────────────────────────────────────────
interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
}

function QRScannerModal({ visible, onClose, onScanned }: QRScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const frameScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true,
        }),
        Animated.spring(frameScale, {
          toValue: 1, damping: 18, stiffness: 180, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SH, duration: 260, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      onScanned(data.trim().toUpperCase());
    },
    [scanned, onScanned],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={qr.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[qr.sheet, { transform: [{ translateY: slideAnim }] }]}>

          {/* Header */}
          <View style={qr.header}>
            <View>
              <Text style={qr.title}>Scan QR Code</Text>
              <Text style={qr.sub}>Point camera at the ticket QR code</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={qr.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* Camera area */}
          <View style={qr.cameraWrap}>
            {!permission?.granted ? (
              <View style={qr.permBox}>
                <View style={qr.permIconWrap}>
                  <Ionicons name="camera-outline" size={36} color={C.blue} />
                </View>
                <Text style={qr.permTitle}>Camera access needed</Text>
                <Text style={qr.permSub}>
                  Allow camera access to scan QR codes on tickets.
                </Text>
                <TouchableOpacity
                  style={qr.permBtn}
                  onPress={requestPermission}
                  activeOpacity={0.87}
                >
                  <Text style={qr.permBtnText}>Grant access</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View style={[qr.frame, { transform: [{ scale: frameScale }] }]}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                />

                {/* Overlay cut-out corners */}
                <View style={qr.cornersWrap} pointerEvents="none">
                  {/* Top-left */}
                  <View style={[qr.corner, qr.cornerTL]} />
                  {/* Top-right */}
                  <View style={[qr.corner, qr.cornerTR]} />
                  {/* Bottom-left */}
                  <View style={[qr.corner, qr.cornerBL]} />
                  {/* Bottom-right */}
                  <View style={[qr.corner, qr.cornerBR]} />
                </View>

                {/* Scan line animation */}
                {!scanned && <ScanLine />}

                {/* Scanned overlay */}
                {scanned && (
                  <View style={qr.scannedOverlay}>
                    <View style={qr.scannedIcon}>
                      <Ionicons name="checkmark-circle" size={52} color={C.white} />
                    </View>
                    <Text style={qr.scannedText}>Code captured!</Text>
                  </View>
                )}
              </Animated.View>
            )}
          </View>

          {/* Bottom hint */}
          <View style={qr.footer}>
            <View style={qr.footerHint}>
              <Ionicons name="information-circle-outline" size={14} color={C.textSub} />
              <Text style={qr.footerHintText}>
                {scanned
                  ? 'Code scanned — close to verify'
                  : 'Hold steady 20–30 cm from the code'}
              </Text>
            </View>
            {scanned && (
              <TouchableOpacity
                style={qr.rescanBtn}
                onPress={() => setScanned(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={14} color={C.blue} />
                <Text style={qr.rescanText}>Scan another</Text>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Animated scan line ────────────────────────────────────────────────────────
function ScanLine() {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[qr.scanLine, { transform: [{ translateY }] }]}
    />
  );
}

const qr = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SH * 0.88,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cameraWrap: {
    padding: 24,
    alignItems: 'center',
  },
  frame: {
    width: SW - 80,
    height: SW - 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cornersWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: C.green,
  },
  cornerTL: {
    top: 12, left: 12,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 12, right: 12,
    borderTopWidth: 3, borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 12, left: 12,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 12, right: 12,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: C.green,
    borderRadius: 1,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${C.green}CC`,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scannedIcon: {},
  scannedText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },
  permBox: {
    width: SW - 80,
    height: SW - 80,
    borderRadius: 16,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  permIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  permTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    textAlign: 'center',
  },
  permSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 18,
  },
  permBtn: {
    marginTop: 8,
    backgroundColor: C.blue,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  permBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: C.white,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  footerHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSub,
    flex: 1,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
  },
  rescanText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.blue,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Ticket result card
// ─────────────────────────────────────────────────────────────────────────────
function TicketResultCard({
  entry,
  onRemove,
}: {
  entry: TicketEntry;
  onRemove: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const isValid   = entry.status === 'valid';
  const isInvalid = entry.status === 'invalid';
  const isLoading = entry.status === 'loading';

  const accent   = isValid ? C.green : isInvalid ? C.error : C.blue;
  const accentBg = isValid ? C.greenSoft : isInvalid ? C.errorBg : C.blueSoft;
  const accentDk = isValid ? C.greenDark : isInvalid ? '#B91C1C' : C.blueDark;

  return (
    <Animated.View
      style={[
        rc.wrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[rc.card, { borderLeftColor: accent }]}>

        {/* ── Header row ──────────────────────────────────────────────── */}
        <View style={rc.headerRow}>
          <View style={[rc.iconTile, { backgroundColor: accentBg }]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={C.blue} />
            ) : (
              <Ionicons
                name={isValid ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={accent}
              />
            )}
          </View>

          <View style={rc.codeBlock}>
            <Text style={rc.codeEyebrow}>TICKET CODE</Text>
            <Text style={rc.codeValue}>{entry.code}</Text>
          </View>

          <TouchableOpacity onPress={onRemove} style={rc.removeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={12} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {isLoading && (
          <View style={rc.bodyPad}>
            <View style={{ gap: 8 }}>
              <Skel w="60%" h={12} />
              <Skel w="45%" h={10} />
            </View>
          </View>
        )}

        {/* ── Valid ───────────────────────────────────────────────────── */}
        {isValid && (
          <>
            <View style={rc.divider} />

            <View style={rc.infoGrid}>
              {([
                { icon: 'person-outline'  as const, label: 'Passenger', value: entry.passengerName! },
                { icon: 'bus-outline'     as const, label: 'Route',     value: entry.route!         },
                { icon: 'bookmark-outline'as const, label: 'Seat',      value: entry.seat!          },
                { icon: 'cash-outline'    as const, label: 'Amount',    value: entry.amount!        },
              ]).map(row => (
                <View key={row.label} style={rc.infoItem}>
                  <View style={rc.infoIconWrap}>
                    <Ionicons name={row.icon} size={11} color={C.textSub} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={rc.infoLabel}>{row.label}</Text>
                    <Text style={rc.infoValue} numberOfLines={1}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[rc.banner, { backgroundColor: C.greenSoft }]}>
              <View style={[rc.bannerDot, { backgroundColor: C.green }]} />
              <Ionicons name="shield-checkmark" size={13} color={accentDk} />
              <Text style={[rc.bannerText, { color: accentDk }]}>
                Valid — Board approved · {entry.date}
              </Text>
            </View>
          </>
        )}

        {/* ── Invalid ─────────────────────────────────────────────────── */}
        {isInvalid && (
          <>
            <View style={rc.divider} />
            <View style={[rc.banner, { backgroundColor: C.errorBg }]}>
              <View style={[rc.bannerDot, { backgroundColor: C.error }]} />
              <Ionicons name="alert-circle" size={13} color={accentDk} />
              <Text style={[rc.bannerText, { color: accentDk }]}>{entry.errorMsg}</Text>
            </View>
          </>
        )}

      </View>
    </Animated.View>
  );
}

const infoItemWidth = (SW - 32 - 28 - 28) / 2;

const rc = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  codeBlock: { flex: 1 },
  codeEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    color: C.textMuted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  codeValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    letterSpacing: 1,
    marginTop: 2,
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
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },
  bodyPad: { paddingHorizontal: 14, paddingBottom: 14, marginTop: 4 },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    gap: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: infoItemWidth,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.text,
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  bannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    flex: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function TicketVerificationScreen({
  navigation,
  authFetch,
}: VerificationScreenProps) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [inputCode,    setInputCode]    = useState('');
  const [queuedCodes,  setQueuedCodes]  = useState<string[]>([]);
  const [tickets,      setTickets]      = useState<TicketEntry[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [qrVisible,    setQrVisible]    = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Entrance animations — same sequence as HomeScreen
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
        Animated.timing(cOp, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(cY,  { toValue: 0, duration: 360, useNativeDriver: true }),
        Animated.timing(bOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // ── Input helpers ───────────────────────────────────────────────────────────
  const handleInputChange = useCallback((val: string) => {
    if (val.endsWith(',') || val.endsWith(' ')) {
      const trimmed = val.replace(/[, ]/g, '').trim().toUpperCase();
      if (trimmed) addToQueue(trimmed);
    } else {
      setInputCode(val);
    }
  }, [queuedCodes]);

  const addToQueue = useCallback((code: string) => {
    const upper = code.trim().toUpperCase();
    if (!upper) return;
    setQueuedCodes(prev => {
      if (prev.includes(upper)) return prev;
      return [...prev, upper];
    });
    setInputCode('');
  }, []);

  const removeQueued = useCallback((code: string) => {
    setQueuedCodes(prev => prev.filter(c => c !== code));
  }, []);

  const removeTicket = useCallback((id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setTickets([]);
    setQueuedCodes([]);
    setInputCode('');
  }, []);

  // ── QR scan callback ────────────────────────────────────────────────────────
  const handleQRScanned = useCallback((code: string) => {
    setTimeout(() => {
      setQrVisible(false);
      addToQueue(code);
    }, 600);
  }, [addToQueue]);

  // ── Verify ──────────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    const raw = inputCode.trim().toUpperCase();
    const toVerify = raw
      ? [...queuedCodes.filter(c => c !== raw), raw]
      : [...queuedCodes];

    if (!toVerify.length) return;

    Keyboard.dismiss();
    setInputCode('');
    setQueuedCodes([]);

    const newEntries: TicketEntry[] = toVerify.map(code => ({
      id:     `${code}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      code,
      status: 'loading',
    }));

    setTickets(prev => [...newEntries, ...prev]);

    await Promise.all(
      newEntries.map(async entry => {
        const result = await verifyTicket(entry.code, authFetch);
        setTickets(prev =>
          prev.map(t => (t.id === entry.id ? { ...t, ...result } : t)),
        );
      }),
    );
  }, [inputCode, queuedCodes, authFetch]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const totalQueued  = queuedCodes.length + (inputCode.trim() ? 1 : 0);
  const hasResults   = tickets.length > 0;
  const hasAnyLoading = tickets.some(t => t.status === 'loading');

  if (!fontsLoaded) return null;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── HEADER — exact pattern from HomeScreen ──────────────────── */}
      <View style={s.header}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />

        <SafeAreaView>
          <Animated.View
            style={[s.headerInner, { opacity: hOp, transform: [{ translateY: hY }] }]}
          >
            {/* Back */}
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={s.backBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={17} color={C.white} />
            </TouchableOpacity>

            {/* Title block */}
            <View style={{ flex: 1 }}>
              {/* Eyebrow */}
              <View style={s.eyebrow}>
                <View style={s.eyebrowDot} />
                <Text style={s.eyebrowText}>TICKET VERIFICATION</Text>
              </View>
              <Text style={s.headerTitle}>Verify Tickets</Text>
              <Text style={s.headerSub}>Scan QR or enter codes manually</Text>
            </View>

            {/* Badge */}
            <View style={s.headerBadge}>
              <Ionicons name="shield-checkmark-outline" size={19} color={C.white} />
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── INPUT CARD (overlaps header, same -44 pull-up as HomeScreen) ─ */}
      <Animated.View
        style={[s.inputCard, { opacity: cOp, transform: [{ translateY: cY }] }]}
      >
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

        {/* Input row */}
        <View style={[s.inputRow, inputFocused && s.inputRowFocused]}>
          <View style={s.inputIconWrap}>
            <Ionicons
              name="ticket-outline"
              size={16}
              color={inputFocused ? C.blue : C.textMuted}
            />
          </View>

          <TextInput
            ref={inputRef}
            value={inputCode}
            onChangeText={handleInputChange}
            onSubmitEditing={() => {
              const t = inputCode.trim().toUpperCase();
              if (t) addToQueue(t);
            }}
            placeholder="e.g. KGL-001-A"
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

          {/* Divider */}
          <View style={s.inputDivider} />

          {/* QR scan button */}
          <TouchableOpacity
            onPress={() => setQrVisible(true)}
            style={s.qrBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={18} color={C.blue} />
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <Text style={s.hint}>
          {totalQueued > 0
            ? `${totalQueued} code${totalQueued !== 1 ? 's' : ''} ready — tap Verify to check all at once`
            : 'Enter code or tap the QR icon to scan a ticket'}
        </Text>

        {/* Action row */}
        <View style={s.actionRow}>
          {hasResults && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={s.clearBtn}
              activeOpacity={0.8}
              disabled={hasAnyLoading}
            >
              <Ionicons name="trash-outline" size={13} color={C.textSub} />
              <Text style={s.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleVerify}
            style={[s.verifyBtn, totalQueued === 0 && s.verifyBtnDisabled]}
            activeOpacity={totalQueued > 0 ? 0.87 : 1}
            disabled={totalQueued === 0}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={C.white} />
            <Text style={s.verifyBtnText}>
              {totalQueued > 1 ? `Verify ${totalQueued} tickets` : 'Verify ticket'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── RESULTS SCROLL ─────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: bOp }}>

          {/* Summary strip */}
          {hasResults && <SummaryStrip tickets={tickets} />}

          {/* Section header */}
          {hasResults && (
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Results</Text>
                <Text style={s.sectionSub}>
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} checked
                </Text>
              </View>
              {hasResults && (
                <TouchableOpacity
                  onPress={handleClearAll}
                  style={s.sectionClear}
                  activeOpacity={0.7}
                  disabled={hasAnyLoading}
                >
                  <Ionicons name="refresh-outline" size={13} color={C.blue} />
                  <Text style={s.sectionClearText}>New session</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Cards */}
          {tickets.map(entry => (
            <TicketResultCard
              key={entry.id}
              entry={entry}
              onRemove={() => removeTicket(entry.id)}
            />
          ))}

          {/* Empty state */}
          {!hasResults && (
            <View style={s.empty}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="ticket-outline" size={34} color={C.blue} />
              </View>
              <Text style={s.emptyTitle}>No verifications yet</Text>
              <Text style={s.emptySub}>
                Enter a ticket code above or scan a QR code to get started.
              </Text>

              {/* Quick-start options */}
              <View style={s.emptyActions}>
                <TouchableOpacity
                  style={s.emptyActionBtn}
                  onPress={() => setQrVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={[s.emptyActionIcon, { backgroundColor: C.greenSoft }]}>
                    <Ionicons name="qr-code-outline" size={17} color={C.green} />
                  </View>
                  <Text style={s.emptyActionText}>Scan QR code</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.emptyActionBtn}
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={0.85}
                >
                  <View style={[s.emptyActionIcon, { backgroundColor: C.blueSoft }]}>
                    <Ionicons name="keypad-outline" size={17} color={C.blue} />
                  </View>
                  <Text style={s.emptyActionText}>Enter code manually</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* ── QR SCANNER MODAL ─────────────────────────────────────────────── */}
      <QRScannerModal
        visible={qrVisible}
        onClose={() => setQrVisible(false)}
        onScanned={handleQRScanned}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.blue,
    overflow: 'hidden',
    paddingBottom: 50,
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
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${C.green}18`,
    top: 20,
    left: SW * 0.45,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: C.green,
  },
  eyebrowText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  // ── Input card ──────────────────────────────────────────────────────────────
  inputCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: -44,
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 6,
  },
  tagsScroll: { maxHeight: 40, marginBottom: 10 },
  tagsContent: { flexDirection: 'row', gap: 7, paddingHorizontal: 2 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: C.bg,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: C.blue,
    backgroundColor: '#EEF6FB',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconWrap: { width: 22, alignItems: 'center' },
  inputText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
    padding: 0,
  },
  addBtn: {
    backgroundColor: C.blueSoft,
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
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: C.border,
  },
  qrBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${C.blue}20`,
  },

  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textMuted,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
    lineHeight: 16,
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
    backgroundColor: C.green,
    paddingVertical: 13,
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

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
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
  sectionClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionClearText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.blue,
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    marginBottom: 24,
  },
  emptyActions: {
    width: '100%',
    gap: 10,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyActionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
});