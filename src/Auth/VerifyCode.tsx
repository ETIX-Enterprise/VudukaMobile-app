import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

const API_BASE = 'http://192.168.0.166:5000/api';

const C = {
  blue: '#0075A8', white: '#FFFFFF', bg: '#f8fafc',
  text: '#0f172a', textSub: '#64748b', textMuted: '#94a3b8',
  border: '#e2e8f0', error: '#DC2626', errorBg: '#FEF2F2', errorBorder: '#FECACA',
  infoBg: '#EFF6FF', infoBorder: '#BFDBFE', info: '#1D4ED8',
};

// ── OTP boxes — same pattern as LoginScreen ──────────────────────────────────
function OtpInput({ value, onChange, disabled, onFocus }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; onFocus?: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits   = value.padEnd(6, ' ').split('');

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={otp.row}>
      {digits.map((d, i) => (
        <View key={i} style={[
          otp.box,
          value.length === i ? otp.boxActive : null,
          d.trim()           ? otp.boxFilled : null,
        ]}>
          <Text style={otp.digit}>{d.trim()}</Text>
          {value.length === i && <View style={otp.cursor} />}
        </View>
      ))}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={otp.hidden}
        editable={!disabled}
        onFocus={onFocus}
        caretHidden
      />
    </TouchableOpacity>
  );
}

const otp = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 8 },
  box:       { width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: C.blue, backgroundColor: '#EEF3FF' },
  boxFilled: { borderColor: C.blue, backgroundColor: C.white },
  digit:     { fontSize: 22, fontWeight: '700', color: C.text },
  cursor:    { position: 'absolute', bottom: 10, width: 2, height: 20, backgroundColor: C.blue, borderRadius: 1 },
  hidden:    { position: 'absolute', width: 0, height: 0, opacity: 0 },
});

export default function VerifyCodeScreen({ navigation, route }: any) {
  // Params passed from ForgotPassword
  const email: string = route?.params?.email ?? '';
  const mode:  string = route?.params?.mode  ?? 'reset';

  const [otpValue,  setOtpValue]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [resent,    setResent]    = useState(false);
  const [cooldown,  setCooldown]  = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ── Resend ────────────────────────────────────────────────────────────────
  async function handleResend() {
    if (cooldown > 0 || !email) return;
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      // Server always 200 — don't check res.ok (enumeration guard)
      setResent(true);
      setCooldown(60);
      setOtpValue('');
      setError(null);
    } catch {
      // Silent — no internet will surface on the next verify attempt
    }
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  async function handleVerify() {
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-code`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, code: otpValue }),
      });

      const raw = await res.text();
      let json: any = {};
      try { json = JSON.parse(raw); } catch {}

      if (!res.ok) {
        setError(json?.message ?? 'Invalid or expired code. Please try again.');
        setOtpValue('');
        return;
      }

      // Server returns resetToken — pass it to the next screen
      const resetToken = json?.data?.resetToken ?? json?.resetToken;

      if (!resetToken) {
        setError('Verification succeeded but no reset token was returned. Please try again.');
        return;
      }

      navigation.navigate('ResetPassword', { token: resetToken, email });
    } catch {
      setError('Unable to reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Guard: no email = user navigated here directly
  if (!email) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }]}>
        <Ionicons name="alert-circle-outline" size={44} color="rgba(255,255,255,0.7)" />
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.white, fontSize: 16, marginTop: 12, textAlign: 'center', lineHeight: 24 }}>
          Session expired.{'\n'}Please restart the password reset.
        </Text>
        <TouchableOpacity style={[s.btn, { marginTop: 28, paddingHorizontal: 28 }]}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={s.btnText}>Go to Forgot Password</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={s.wordmark}>VU<Text style={{ color: '#008A75' }}>DU</Text>KA</Text>
          <Text style={s.tagline}>TRANSPORT MANAGEMENT</Text>
        </View>
      </Animated.View>

<ScrollView
  contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardHeight }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
>
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={s.iconWrap}>
              <Ionicons name="shield-checkmark" size={28} color={C.blue} />
            </View>

            <Text style={s.heading}>Enter Verification Code</Text>
            <Text style={s.subheading}>
              A 6-digit code was sent to{'\n'}
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.text }}>{email}</Text>
              {'\n'}It expires in 15 minutes.
            </Text>

            {/* Resent confirmation */}
            {resent && (
              <View style={s.infoBox}>
                <Ionicons name="checkmark-circle-outline" size={14} color={C.info} />
                <Text style={s.infoText}>A new code has been sent to your email.</Text>
              </View>
            )}

            {error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={C.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <Text style={[s.label, { textAlign: 'center', marginBottom: 4 }]}>Verification Code</Text>

            <OtpInput
              value={otpValue}
              onChange={(v) => { setOtpValue(v); setError(null); }}
              disabled={loading}
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
              }}
            />

            <Text style={s.otpHint}>Tap the boxes and enter your code</Text>

            <TouchableOpacity
              style={[s.btn, { marginTop: 24 }, (loading || otpValue.length !== 6) && s.btnDisabled]}
              onPress={handleVerify}
              disabled={loading || otpValue.length !== 6}
              activeOpacity={0.87}
            >
              {loading
                ? <ActivityIndicator color={C.white} size="small" />
                : <>
                    <Text style={s.btnText}>Verify Code</Text>
                    <Ionicons name="shield-checkmark-outline" size={16} color={C.white} />
                  </>
              }
            </TouchableOpacity>

            {/* Resend + back row */}
            <View style={s.resendRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={s.backLinkText}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0}
                activeOpacity={0.7}
              >
                <Text style={[s.resendText, cooldown > 0 && { opacity: 0.4 }]}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't receive it? Resend"}
                </Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0075A8' },
  header:       { paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 36, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  wordmark:     { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.white, letterSpacing: -0.8 },
  tagline:      { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: 'rgba(255,255,255,0.50)', letterSpacing: 2, marginTop: 2 },
  card:         { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 34, paddingBottom: 48, minHeight: 520 },
  iconWrap:     { width: 60, height: 60, borderRadius: 18, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#D6E0FF' },
  heading:      { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text, letterSpacing: -0.6, marginBottom: 6 },
  subheading:   { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: C.textSub, lineHeight: 21, marginBottom: 20 },
  label:        { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text, marginBottom: 7 },
  otpHint:      { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 8 },
  infoBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.infoBg, borderWidth: 1, borderColor: C.infoBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  infoText:     { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.info, flex: 1 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  errorText:    { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.error, flex: 1 },
  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0075A8', borderRadius: 13, paddingVertical: 15, shadowColor: '#0075A8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
  btnDisabled:  { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  btnText:      { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.white, letterSpacing: 0.1 },
  resendRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingHorizontal: 4 },
  backLinkText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSub },
  resendText:   { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#0075A8' },
});