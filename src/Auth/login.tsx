import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/authContext'; // ← adjust path if needed
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  blue:        '#0075A8',
  blueAccent:  '#008A75',
  white:       '#FFFFFF',
  bg:          '#f8fafc',
  text:        '#0f172a',
  textSub:     '#64748b',
  textMuted:   '#94a3b8',
  border:      '#e2e8f0',
  error:       '#DC2626',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
};

// ── OTP digit boxes ────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled, onFocus }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; onFocus?: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits   = value.padEnd(6, ' ').split('');

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={otp.row}>
      {digits.map((d, i) => (
        <View
          key={i}
          style={[otp.box, value.length === i && otp.boxActive, d.trim() && otp.boxFilled]}
        >
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
  box:       { width: 44, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: C.blue, backgroundColor: '#EEF3FF' },
  boxFilled: { borderColor: C.blue, backgroundColor: C.white },
  digit:     { fontSize: 22, fontWeight: '700', color: C.text },
  cursor:    { position: 'absolute', bottom: 10, width: 2, height: 20, backgroundColor: C.blue, borderRadius: 1 },
  hidden:    { position: 'absolute', width: 0, height: 0, opacity: 0 },
});

// ── Reusable sub-components ────────────────────────────────────────────────────
function FieldWrapper({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={s.errorBox}>
      <Ionicons name="alert-circle-outline" size={14} color={C.error} />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

function PrimaryButton({ label, iconName, loading = false, disabled = false, onPress, extraStyle }: {
  label: string; iconName: string; loading?: boolean; disabled?: boolean;
  onPress: () => void; extraStyle?: object;
}) {
  const inactive = loading || disabled;
  return (
    <TouchableOpacity onPress={onPress} disabled={inactive} activeOpacity={0.87}
      style={[s.btn, inactive && s.btnDisabled, extraStyle]}>
      {loading
        ? <ActivityIndicator color={C.white} size="small" />
        : <><Text style={s.btnText}>{label}</Text><Ionicons name={iconName as any} size={16} color={C.white} /></>
      }
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: any) {
  // ── Auth context ─────────────────────────────────────────────────────────────
  // login()     → calls /auth/login, persists tokens, updates isAuthenticated
  // verifyOtp() → calls /auth/verify-otp, persists tokens, updates isAuthenticated
  // isLoading   → driven by context so spinner is consistent app-wide
  //
  // Navigation back to the app happens automatically: AuthGate in AppNavigator
  // watches `isAuthenticated` and swaps the stack to <RoleBasedTabs /> the
  // moment either action succeeds — no navigation.replace() needed here.
  const { login, verifyOtp, isLoading } = useAuth();

  // ── Step 1 — credentials ──────────────────────────────────────────────────
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);

  // ── Step 2 — OTP ──────────────────────────────────────────────────────────
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail,    setOtpEmail]    = useState('');
  const [otpValue,    setOtpValue]    = useState('');

  // ── Shared UI state ────────────────────────────────────────────────────────
  const [error,        setError]        = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const keyboardHeight = useKeyboardHeight();
  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const stepAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  function transitionStep(fn: () => void) {
    Animated.timing(stepAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(stepAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  const isFocused = (f: string) => focusedField === f;

  // ── Step 1: submit credentials ─────────────────────────────────────────────
  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);

    const result = await login(email.trim().toLowerCase(), password, rememberMe);

    if (!result.ok) {
      setError(result.error ?? 'Login failed. Please try again.');
      return;
    }

    if (result.otpRequired) {
      // Admin-role flow: slide to OTP step.
      // Tokens are NOT yet persisted — AuthContext waits for verifyOtp().
      transitionStep(() => {
        setOtpEmail(result.email ?? email.trim().toLowerCase());
        setOtpRequired(true);
      });
      return;
    }

    // Non-OTP roles (driver, pickup_agent…): tokens are already persisted by
    // AuthContext.persist(). AuthGate detects isAuthenticated → true and
    // navigates automatically. Nothing else needed here.
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError(null);

    const result = await verifyOtp(otpEmail, otpValue);

    if (!result.ok) {
      setError(result.error ?? 'Verification failed. Please try again.');
      setOtpValue('');
      return;
    }

    // Success: AuthContext.persist() has stored tokens + user.
    // AuthGate re-renders automatically — no navigation call required.
  }

  // Add at the top of the component, alongside your other refs
const scrollRef = useRef<ScrollView>(null);
const fieldRefs = useRef<Record<string, View | null>>({});

// Helper — measures the field's Y position and scrolls to it
function scrollToField(key: string) {
  fieldRefs.current[key]?.measureLayout(
    // @ts-ignore — ScrollView's internal node
    scrollRef.current?.getInnerViewNode?.(),
    (_x, y) => {
      scrollRef.current?.scrollTo({ y: y - 16, animated: true });
    },
    () => {},
  );
}

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* ── Blue header ── */}
      <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.brandRow}>
          <View>
            <Text style={s.wordmark}>VU<Text style={{ color: '#008A75' }}>DU</Text>KA</Text>
            <Text style={s.tagline}>TRANSPORT MANAGEMENT</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── White card ── */}
<ScrollView
  contentContainerStyle={[
    { flexGrow: 1 },
    { paddingBottom: keyboardHeight }, // ← pushes content up above keyboard
  ]}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
>
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={{ opacity: stepAnim }}>

              {/* ══════════ STEP 1 — Credentials ══════════ */}
              {!otpRequired ? (
                <>
                  <Text style={s.heading}>Welcome back 👋</Text>
                  <Text style={s.subheading}>Sign in to your Vuduka account to continue.</Text>

                  {error && <ErrorBanner message={error} />}
                 <View ref={(r) => { fieldRefs.current['email'] = r; }}>
                  <FieldWrapper label="Email address" required>
                    <View style={[s.inputWrap, isFocused('email') && s.inputFocused]}>
                      <Ionicons name="mail-outline" size={16} color={isFocused('email') ? C.blue : C.textMuted} />
                      <TextInput
                        value={email}
                        onChangeText={(t) => { setEmail(t); setError(null); }}
                        placeholder="you@example.com"
                        placeholderTextColor={C.textMuted}
                        style={s.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="next"
                        
                        editable={!isLoading}
                      />
                    </View>
                  </FieldWrapper>
                  </View>
                  <View ref={(r) => { fieldRefs.current['email'] = r; }}>
                  <FieldWrapper label="Password" required>
                    <View style={[s.inputWrap, isFocused('pwd') && s.inputFocused]}>
                      <Ionicons name="lock-closed-outline" size={16} color={isFocused('pwd') ? C.blue : C.textMuted} />
                      <TextInput
                        value={password}
                        onChangeText={(t) => { setPassword(t); setError(null); }}
                        placeholder="••••••••"
                        placeholderTextColor={C.textMuted}
                        style={[s.input, { flex: 1 }]}
                        secureTextEntry={!showPwd}
                        textContentType="password"
                        onFocus={() => setFocusedField('pwd')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        editable={!isLoading}
                      />
                      <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </FieldWrapper>
                  </View>
                  <View style={s.rememberRow}>
                    <TouchableOpacity style={s.checkRow} onPress={() => setRememberMe(v => !v)} activeOpacity={0.7}>
                      <View style={[s.checkbox, rememberMe && s.checkboxOn]}>
                        {rememberMe && <Ionicons name="checkmark" size={11} color={C.white} />}
                      </View>
                      <Text style={s.rememberText}>Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
                      <Text style={s.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

                  <PrimaryButton label="Sign In" iconName="arrow-forward" loading={isLoading} onPress={handleLogin} />

                  <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Text style={s.backLinkText}>← Back to welcome</Text>
                  </TouchableOpacity>
                </>
              ) : (

              /* ══════════ STEP 2 — OTP ══════════ */
                <>
                  <View style={s.shieldWrap}>
                    <Ionicons name="shield-checkmark" size={28} color={C.blue} />
                  </View>

                  <Text style={s.heading}>Verify your identity</Text>
                  <Text style={s.subheading}>
                    A 6-digit code was sent to{'\n'}
                    <Text style={s.boldEmail}>{otpEmail}</Text>
                    {'\n'}It expires in 5 minutes.
                  </Text>

                  {error && <ErrorBanner message={error} />}
                <View ref={(r) => { fieldRefs.current['otp'] = r; }}>
                  <OtpInput
                    value={otpValue}
                    onChange={(v) => { setOtpValue(v); setError(null); }}
                    disabled={isLoading}
                  />
                  </View>
                  <Text style={s.otpHint}>Tap the boxes and enter your code</Text>

                  <PrimaryButton
                    label="Verify & Sign In"
                    iconName="shield-checkmark-outline"
                    loading={isLoading}
                    disabled={otpValue.length !== 6}
                    onPress={handleVerifyOtp}
                    extraStyle={{ marginTop: 20 }}
                  />

                  <TouchableOpacity
                    style={s.backLink}
                    onPress={() => transitionStep(() => { setOtpRequired(false); setOtpValue(''); setError(null); })}
                    activeOpacity={0.7}
                  >
                    <Text style={s.backLinkText}>← Use a different account</Text>
                  </TouchableOpacity>
                </>
              )}

            </Animated.View>
          </Animated.View>
        </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles (unchanged from original) ──────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.blue },
  header: { paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 36, overflow: 'hidden' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  wordmark: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.white, letterSpacing: -0.8 },
  tagline: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: 'rgba(255,255,255,0.50)', letterSpacing: 2, marginTop: 2 },
  card: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 34, paddingBottom: 48, minHeight: 700 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text, letterSpacing: -0.6, marginBottom: 6 },
  subheading: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: C.textSub, lineHeight: 21, marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.error, flex: 1 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text, marginBottom: 7 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, gap: 10, minHeight: 50 },
  inputFocused: { borderColor: C.blue, backgroundColor: '#EEF3FF' },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: C.text, paddingVertical: Platform.OS === 'ios' ? 14 : 12, margin: 0, padding: 0, includeFontPadding: false },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: C.blue, borderColor: C.blue },
  rememberText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub },
  forgotText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.blueAccent },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, borderRadius: 13, paddingVertical: 15, shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
  btnDisabled: { opacity: 0.50, shadowOpacity: 0, elevation: 0 },
  btnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: C.white, letterSpacing: 0.1 },
  backLink: { alignItems: 'center', marginTop: 18, paddingVertical: 6 },
  backLinkText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSub },
  shieldWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#D6E0FF' },
  boldEmail: { fontFamily: 'Inter_600SemiBold', color: C.text },
  otpHint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 8 },
});