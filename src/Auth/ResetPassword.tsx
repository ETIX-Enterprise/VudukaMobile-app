import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator,
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
  success: '#16A34A',
};

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pwd: string): { label: string; color: string; pct: number } {
  if (!pwd)           return { label: '',           color: C.border,   pct: 0   };
  if (pwd.length < 6) return { label: 'Too short',  color: '#EF4444', pct: 15  };
  if (pwd.length < 8) return { label: 'Weak',       color: '#F97316', pct: 35  };
  const upper   = /[A-Z]/.test(pwd);
  const special = /[@#$%&*!?]/.test(pwd);
  const number  = /\d/.test(pwd);
  const score   = [upper, special, number].filter(Boolean).length;
  if (score === 3) return { label: 'Strong', color: C.blue,    pct: 100 };
  if (score === 2) return { label: 'Good',   color: '#22C55E', pct: 75  };
  return               { label: 'Fair',   color: '#EAB308', pct: 55  };
}

function StrengthBar({ password }: { password: string }) {
  const { label, color, pct } = getStrength(password);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 280, useNativeDriver: false }).start();
  }, [pct]);

  if (!password) return null;

  return (
    <View style={{ marginTop: 8, marginBottom: 2 }}>
      <View style={bar.track}>
        <Animated.View style={[bar.fill, {
          backgroundColor: color,
          width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
      <Text style={[bar.label, { color }]}>{label}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  track: { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  fill:  { height: '100%', borderRadius: 3 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 11 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ResetPasswordScreen({ navigation, route }: any) {
  // Both token and email passed from VerifyCode
  const token: string = route?.params?.token ?? '';
  const email: string = route?.params?.email ?? '';

  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scrollRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<Record<string, View | null>>({});
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  function scrollToField(key: string) {
    fieldRefs.current[key]?.measureLayout(
      scrollRef.current?.getInnerViewNode?.() as any,
      (_x, y) => scrollRef.current?.scrollTo({ y: y - 16, animated: true }),
      () => {},
    );
  }

  const strength       = getStrength(newPwd);
  const passwordsMatch = newPwd === confirmPwd && confirmPwd.length > 0;
  const canSubmit      = passwordsMatch && strength.pct >= 35 && !loading;

  async function handleSubmit() {
    setError(null);

    if (!token) { setError('Invalid or missing reset token. Please request a new link.'); return; }
    if (newPwd.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          token,
          newPassword:     newPwd,
          confirmPassword: confirmPwd,
        }),
      });

      const raw = await res.text();
      let json: any = {};
      try { json = JSON.parse(raw); } catch {}

      if (!res.ok) {
        // 400/410 → token expired or already used
        setError(json?.message ?? 'Failed to reset password. The link may have expired.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Unable to reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Invalid token guard ────────────────────────────────────────────────────
  if (!token) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }]}>
        <View style={[s.iconWrap, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
          <Ionicons name="close-circle" size={28} color={C.error} />
        </View>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: C.white, marginBottom: 8, textAlign: 'center' }}>
          Invalid Reset Link
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>
          This link is invalid or has already been used. Please request a new one.
        </Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={s.btnText}>Request a New Link</Text>
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

            {!success ? (
              /* ── Form ── */
              <>
                <View style={s.iconWrap}>
                  <Ionicons name="key" size={26} color={C.blue} />
                </View>

                <Text style={s.heading}>Reset Password</Text>
                <Text style={s.subheading}>
                  Choose a strong new password for{'\n'}
                  <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.text }}>{email}</Text>
                </Text>

                {error && (
                  <View style={s.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={C.error} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                {/* New password */}
                <View ref={(r) => { fieldRefs.current['new'] = r; }} style={{ marginBottom: 18 }}>
                  <Text style={s.label}>New Password <Text style={{ color: C.error }}>*</Text></Text>
                  <View style={[s.inputWrap, focused === 'new' && s.inputFocused]}>
                    <Ionicons name="lock-closed-outline" size={16} color={focused === 'new' ? C.blue : C.textMuted} />
                    <TextInput
                      value={newPwd}
                      onChangeText={(t) => { setNewPwd(t); setError(null); }}
                      placeholder="At least 8 characters"
                      placeholderTextColor={C.textMuted}
                      style={[s.input, { flex: 1 }]}
                      secureTextEntry={!showNew}
                      textContentType="newPassword"
                      returnKeyType="next"
                      onFocus={() => { setFocused('new'); scrollToField('new'); }}
                      onBlur={() => setFocused(null)}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNew(v => !v)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <StrengthBar password={newPwd} />
                </View>

                {/* Confirm password */}
                <View ref={(r) => { fieldRefs.current['confirm'] = r; }} style={{ marginBottom: 24 }}>
                  <Text style={s.label}>Confirm Password <Text style={{ color: C.error }}>*</Text></Text>
                  <View style={[
                    s.inputWrap,
                    focused === 'confirm' && s.inputFocused,
                    confirmPwd.length > 0 && !passwordsMatch && { borderColor: C.error },
                    confirmPwd.length > 0 && passwordsMatch  && { borderColor: C.success },
                  ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={focused === 'confirm' ? C.blue : C.textMuted} />
                    <TextInput
                      value={confirmPwd}
                      onChangeText={(t) => { setConfirmPwd(t); setError(null); }}
                      placeholder="Re-enter new password"
                      placeholderTextColor={C.textMuted}
                      style={[s.input, { flex: 1 }]}
                      secureTextEntry={!showConf}
                      textContentType="newPassword"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      onFocus={() => { setFocused('confirm'); scrollToField('confirm'); }}
                      onBlur={() => setFocused(null)}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConf(v => !v)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showConf ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {confirmPwd.length > 0 && (
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 6, color: passwordsMatch ? C.success : C.error }}>
                      {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.btn, !canSubmit && s.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.87}
                >
                  {loading
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <>
                        <Text style={s.btnText}>Reset Password</Text>
                        <Ionicons name="checkmark-circle-outline" size={16} color={C.white} />
                      </>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={s.backLink} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={s.backLinkText}>← Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Success state ── */
              <View style={{ alignItems: 'center', paddingTop: 16 }}>
                <View style={[s.iconWrap, { width: 76, height: 76, borderRadius: 24, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="checkmark-circle" size={36} color={C.success} />
                </View>

                <Text style={s.heading}>Password Reset!</Text>
                <Text style={[s.subheading, { textAlign: 'center' }]}>
                  Your password has been updated successfully.{'\n'}
                  You can now sign in with your new password.
                </Text>

                <TouchableOpacity
                  style={[s.btn, { width: '100%', marginTop: 8 }]}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.87}
                >
                  <Text style={s.btnText}>Go to Sign In</Text>
                  <Ionicons name="arrow-forward" size={16} color={C.white} />
                </TouchableOpacity>
              </View>
            )}

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
  subheading:   { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: C.textSub, lineHeight: 21, marginBottom: 24 },
  label:        { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text, marginBottom: 7 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, gap: 10, minHeight: 50 },
  inputFocused: { borderColor: '#0075A8', backgroundColor: '#EEF3FF' },
  input:        { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: C.text, paddingVertical: Platform.OS === 'ios' ? 14 : 12, margin: 0, padding: 0, includeFontPadding: false },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18 },
  errorText:    { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.error, flex: 1 },
  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0075A8', borderRadius: 13, paddingVertical: 15, shadowColor: '#0075A8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
  btnDisabled:  { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  btnText:      { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.white, letterSpacing: 0.1 },
  backLink:     { alignItems: 'center', marginTop: 18, paddingVertical: 6 },
  backLinkText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSub },
});