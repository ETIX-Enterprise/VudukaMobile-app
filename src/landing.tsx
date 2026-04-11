import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';

// ── Design tokens (mirrors your dashboard) ─────────────────────────────────
const BLUE  = '#0075A8';
const BLUE2 = '#0075A8';

interface LandingProps {
  navigation: any;
}

export default function Landing({ navigation }: LandingProps) {
  // ── Animated values ──────────────────────────────────────────────────────
  const logoScale   = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const wordmarkY   = useRef(new Animated.Value(18)).current;
  const wordmarkOp  = useRef(new Animated.Value(0)).current;

  const taglineOp   = useRef(new Animated.Value(0)).current;

  const dividerW    = useRef(new Animated.Value(0)).current; // 0 → 1 (interpolated to px)

  const progress    = useRef(new Animated.Value(0)).current;

  // ── Orchestrate entrance ─────────────────────────────────────────────────
  useEffect(() => {
    // 1. Logo pop
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 70,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Wordmark rises
    Animated.parallel([
      Animated.timing(wordmarkOp, {
        toValue: 1,
        duration: 500,
        delay: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkY, {
        toValue: 0,
        duration: 500,
        delay: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Divider grows
    Animated.timing(dividerW, {
      toValue: 1,
      duration: 400,
      delay: 480,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width is layout
    }).start();

    // 4. Tagline fades
    Animated.timing(taglineOp, {
      toValue: 1,
      duration: 400,
      delay: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // 5. Progress bar — 10 s load gate
    Animated.timing(progress, {
      toValue: 1,
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);

  // ── Navigate after 10 s ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Splash'), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE2} />

      {/* ── Subtle dot-grid texture overlay ── */}
      <View style={s.texture} pointerEvents="none" />

      {/* ── Brand block ── */}
      <View style={s.brand}>

        {/* Logo mark */}
        <Animated.View
          style={[
         
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={require('../assets/logo.png')}
            style={s.logo}
            className='w-[40px] h-[40px]'
            resizeMode="contain"
          />
        </Animated.View>

        {/* Wordmark */}
        <Animated.View
          style={{
            opacity: wordmarkOp,
            transform: [{ translateY: wordmarkY }],
            alignItems: 'center',
          }}
        >
          <Text style={s.wordmark}>
            V<Text style={s.wordmarkAccent}>UDU</Text>KA
          </Text>
        </Animated.View>

        {/* Animated thin divider */}
        <Animated.View
          style={[
            s.divider,
            {
              width: dividerW.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 56],
              }),
            },
          ]}
        />

        {/* Tagline */}
        <Animated.Text style={[s.tagline, { opacity: taglineOp }]}>
          GERAYO AMAHORO TODAY
        </Animated.Text>
      </View>
      {/* ── iOS home indicator ── */}
      <View style={s.homeBar} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BLUE2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Faint repeating dot pattern for depth (pure CSS trick via borderRadius)
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
  },

  // ── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 60,
  },

  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    // subtle inner border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  logo: {
    width: 46,
    height: 46,
  },

  wordmark: {
    color: '#FFFFFF',
    fontSize: 38,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -1.2,
    lineHeight: 44,
  },

  wordmarkAccent: {
    color: "#008A75",      // slightly tinted — same trick as dashboard sidebar
    fontFamily: 'Inter-SemiBold',
  },

  divider: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
  },

  tagline: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // ── Progress ───────────────────────────────────────────────────────────────
  progressTrack: {
    position: 'absolute',
    bottom: 44,
    left: 36,
    right: 36,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },

  homeBar: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
});