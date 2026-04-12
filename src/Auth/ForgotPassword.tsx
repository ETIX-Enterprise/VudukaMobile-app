import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
// Re-use the same API_BASE as authContext — keep in sync or export from there
const API_BASE = 'http://192.168.0.166:5000/api';

const C = {
  blue: '#0075A8', white: '#FFFFFF', bg: '#f8fafc',
  text: '#0f172a', textSub: '#64748b', textMuted: '#94a3b8',
  border: '#e2e8f0', error: '#DC2626', errorBg: '#FEF2F2', errorBorder: '#FECACA',
};

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [focused,   setFocused]   = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      // Read as text first — guards against non-JSON error pages
      const raw = await res.text();
      let json: any = {};
      try { json = JSON.parse(raw); } catch {}

      if (!res.ok) {
        // 404 → email not registered; show generic message to avoid enumeration
        setError(json?.message ?? 'Something went wrong. Please try again.');
        return;
      }

      // Server returns 200 regardless of whether email exists (enumeration guard)
      setSubmitted(true);
    } catch {
      setError('Unable to reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
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

            {!submitted ? (
              /* ── Request form ── */
              <>
                <View style={s.iconWrap}>
                  <Ionicons name="lock-open-outline" size={26} color={C.blue} />
                </View>

                <Text style={s.heading}>Forgot Password?</Text>
                <Text style={s.subheading}>
                  Enter your registered email and we'll send you a 6-digit reset code.
                </Text>

                {error && (
                  <View style={s.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={C.error} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={s.label}>
                  Email Address <Text style={{ color: C.error }}>*</Text>
                </Text>
                <View style={[s.inputWrap, focused && s.inputFocused]}>
                  <Ionicons name="mail-outline" size={16} color={focused ? C.blue : C.textMuted} />
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
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.87}
                >
                  {loading
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <>
                        <Text style={s.btnText}>Send Reset Code</Text>
                        <Ionicons name="send-outline" size={16} color={C.white} />
                      </>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                  <Text style={s.backLinkText}>← Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Success / check email ── */
              <View style={{ alignItems: 'center' }}>
                <View style={[s.iconWrap, { width: 72, height: 72, borderRadius: 22 }]}>
                  <Ionicons name="mail" size={32} color={C.blue} />
                </View>

                <Text style={s.heading}>Check Your Email</Text>
                <Text style={[s.subheading, { textAlign: 'center' }]}>
                  If <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.text }}>{email}</Text> is
                  registered, a 6-digit code has been sent.{'\n'}It expires in 15 minutes.
                </Text>

                <TouchableOpacity
                  style={[s.btn, { width: '100%', marginTop: 4 }]}
                  onPress={() => navigation.navigate('VerifyCode', { email: email.trim().toLowerCase(), mode: 'reset' })}
                  activeOpacity={0.87}
                >
                  <Text style={s.btnText}>Enter Code</Text>
                  <Ionicons name="arrow-forward" size={16} color={C.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.backLink}
                  onPress={() => { setSubmitted(false); setEmail(''); setError(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.backLinkText}>← Use a different email</Text>
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
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, gap: 10, minHeight: 50, marginBottom: 20 },
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