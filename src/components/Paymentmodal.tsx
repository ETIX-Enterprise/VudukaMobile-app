import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../Pages/theme';
import { PAY_METHODS } from '../Pages/data';
import type { Bus, PayMethod, PayStep } from '../Pages/types';

interface PaymentModalProps {
  bus: Bus;
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PaymentModal: React.FC<PaymentModalProps> = ({
  bus,
  visible,
  onClose,
}) => {
  const [step, setStep]         = useState<PayStep>('details');
  const [payMethod, setPayMethod] = useState<PayMethod>('momo');
  const [phone, setPhone]       = useState<string>('');
  const sheetAnim               = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim             = useRef(new Animated.Value(0)).current;
  const progressAnim            = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('details');
      setPhone('');
      setPayMethod('momo');
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayAnim, sheetAnim]);

  useEffect(() => {
    if (step === 'confirm') {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 0.7,
        duration: 1500,
        useNativeDriver: false,
      }).start();
      const timer = setTimeout(() => setStep('success'), 1800);
      return () => clearTimeout(timer);
    }
  }, [step, progressAnim]);

  const handlePay = () => setStep('confirm');

  // ── Details Step ────────────────────────────────────────────────────────────
  if (step === 'details' || step === 'confirm' || step === 'success') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Overlay */}
        <Animated.View
          style={[styles.overlay, { opacity: overlayAnim }]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.overlayPressable} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <View style={styles.body}>
              <View style={styles.successCheckWrap}>
                <Text style={styles.successCheckIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Booking Confirmed!</Text>
              <Text style={styles.successSub}>
                Your seat on <Text style={styles.bold}>{bus.number}</Text> has
                been reserved. Show this confirmation to the driver.
              </Text>
              <View style={styles.summaryBox}>
                {[
                  { label: 'Bus',          value: bus.number },
                  { label: 'Route',        value: `${bus.from} → Kigali` },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{value}</Text>
                  </View>
                ))}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid</Text>
                  <Text style={[styles.summaryValue, styles.summaryPrice]}>
                    RWF {bus.price}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── PROCESSING ── */}
          {step === 'confirm' && (
            <View style={styles.body}>
              <View style={styles.processingIconWrap}>
                <Text style={styles.processingIcon}>⏳</Text>
              </View>
              <Text style={styles.processingTitle}>Processing Payment</Text>
              <Text style={styles.processingSub}>
                Confirming with{' '}
                {payMethod === 'momo' ? 'MTN MoMo' : 'Airtel Money'}…
              </Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* ── DETAILS ── */}
          {step === 'details' && (
            <View style={styles.body}>
              {/* Header */}
              <View style={styles.payHeader}>
                <View>
                  <Text style={styles.payTitle}>Book Your Seat</Text>
                  <Text className='font-inter'>
                    {bus.company} · {bus.number}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Route Summary */}
              <View style={styles.routeSummary}>
                <View style={styles.rsTop}>
                  <View>
                    <Text className='font-inter-semibold'>From</Text>
                    <Text style={styles.rsValue}>{bus.from}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} className='w-5 h-5' />
                  <View style={styles.rsToCol}>
                    <Text className='font-inter-semibold'>To</Text>
                    <Text style={[styles.rsValue, { color: Colors.blue }]}>
                      Kigali Centre
                    </Text>
                  </View>
                </View>
                <View style={styles.rsDivider} />
                <View style={styles.rsBottom}>
                  <Text className='font-inter'>Arrives at</Text>
                  <Text style={styles.rsArrival}>{bus.arrivalTime}</Text>
                </View>
              </View>

              {/* Payment Method */}
              <Text style={styles.sectionTitle}>Payment Method</Text>
              {PAY_METHODS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.methodRow,
                    payMethod === m.id && styles.methodRowSelected,
                  ]}
                  onPress={() => setPayMethod(m.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.methodIcon,
                      { backgroundColor: `${m.color}18` },
                    ]}
                  >
                    <Text style={styles.methodEmoji}>{m.emoji}</Text>
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{m.label}</Text>
                    <Text className='font-inter'>Instant payment</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      payMethod === m.id && styles.radioSelected,
                    ]}
                  >
                    {payMethod === m.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Phone */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Mobile Number
              </Text>
              <View style={styles.phoneWrap}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+250</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="7XX XXX XXX"
                  className='font-inter'
                  keyboardType="phone-pad"
                  maxLength={12}
                />
              </View>

              {/* Pay button */}
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePay}
                activeOpacity={0.85}
              >
                <View>
                  <Text style={styles.payAmountLabel}>Total amount</Text>
                  <Text style={styles.payAmountValue}>RWF {bus.price}</Text>
                </View>
                <View style={styles.payNow}>
                  <Text style={styles.payNowText}>Pay Now </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayPressable: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: Colors.border,
  },
  body: {
    padding: 24,
    paddingTop: 20,
  },

  // ── Success
  successCheckWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
  },
  successCheckIcon: {
    fontSize: 28,
    color: Colors.green,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
  summaryBox: {
    backgroundColor: Colors.blueLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSub,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.blue,
  },
  doneBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Processing
  processingIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  processingIcon: {
    fontSize: 24,
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  processingSub: {
    fontSize: 13,
    color: Colors.textSub,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 99,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginTop: 28,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.blue,
    borderRadius: 99,
  },

  // ── Details
  payHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  payTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  paySub: {
    fontSize: 13,
    color: Colors.textSub,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textSub,
    lineHeight: 22,
  },
  routeSummary: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rsToCol: {
    alignItems: 'flex-end',
  },
  rsLabel: {
    fontSize: 12,
    color: Colors.textSub,
  },
  rsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  rsArrow: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  rsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  rsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rsArrival: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  methodRowSelected: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blueLight,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodEmoji: {
    fontSize: 18,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  methodSub: {
    fontSize: 12,
    color: Colors.textSub,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.blue,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blue,
  },
  phoneWrap: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  phonePrefix: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.bg,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Courier',
  },
  payBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payAmountLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  payAmountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  payNow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  payNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default PaymentModal;