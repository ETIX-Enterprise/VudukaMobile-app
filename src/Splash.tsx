import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Design tokens (mirrors your dashboard) ─────────────────────────────────
const BLUE  = '#0075A8';
const BLUE2 = '#0075A8';
const GREEN = '#008A75';

const { width, height } = Dimensions.get('window');
const CARD_TOP    = height * 0.50;
const CARD_RADIUS = 28;
const IMAGE_H     = height * 0.54;

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  // ── Animated values ────────────────────────────────────────────────────────
  const imageOp     = useRef(new Animated.Value(0)).current;
  const imageScale  = useRef(new Animated.Value(1.06)).current;

  const badgeOp     = useRef(new Animated.Value(0)).current;
  const badgeY      = useRef(new Animated.Value(8)).current;

  const headlineOp  = useRef(new Animated.Value(0)).current;
  const headlineY   = useRef(new Animated.Value(24)).current;

  const bodyOp      = useRef(new Animated.Value(0)).current;

  const pillsOp     = useRef(new Animated.Value(0)).current;
  const pillsY      = useRef(new Animated.Value(12)).current;

  const ctaOp       = useRef(new Animated.Value(0)).current;
  const ctaY        = useRef(new Animated.Value(16)).current;

  const signInOp    = useRef(new Animated.Value(0)).current;

  // ── Orchestrate entrance ───────────────────────────────────────────────────
  useEffect(() => {
    // Image settle
    Animated.parallel([
      Animated.timing(imageOp,    { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(imageScale, { toValue: 1, duration: 950, easing: Animated.timing.prototype?.easing, useNativeDriver: true }),
    ]).start();

    // Badge
    Animated.parallel([
      Animated.timing(badgeOp, { toValue: 1, duration: 400, delay: 250, useNativeDriver: true }),
      Animated.timing(badgeY,  { toValue: 0, duration: 400, delay: 250, useNativeDriver: true }),
    ]).start();

    // Headline
    Animated.parallel([
      Animated.timing(headlineOp, { toValue: 1, duration: 480, delay: 350, useNativeDriver: true }),
      Animated.timing(headlineY,  { toValue: 0, duration: 480, delay: 350, useNativeDriver: true }),
    ]).start();

    // Body copy
    Animated.timing(bodyOp, { toValue: 1, duration: 380, delay: 480, useNativeDriver: true }).start();

    // Feature pills
    Animated.parallel([
      Animated.timing(pillsOp, { toValue: 1, duration: 380, delay: 560, useNativeDriver: true }),
      Animated.timing(pillsY,  { toValue: 0, duration: 380, delay: 560, useNativeDriver: true }),
    ]).start();

    // CTA button
    Animated.parallel([
      Animated.timing(ctaOp, { toValue: 1, duration: 380, delay: 660, useNativeDriver: true }),
      Animated.timing(ctaY,  { toValue: 0, duration: 380, delay: 660, useNativeDriver: true }),
    ]).start();

    // Sign-in link
    Animated.timing(signInOp, { toValue: 1, duration: 360, delay: 750, useNativeDriver: true }).start();
  }, []);

  // ── Feature pill data ──────────────────────────────────────────────────────
  const features = [
    { icon: 'shield-checkmark-outline', label: 'Safe rides'  },
    { icon: 'location-outline',         label: 'Live tracking' },
    { icon: 'card-outline',             label: 'Easy payments' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── HERO IMAGE ── */}
      <Animated.View
        style={[
          { opacity: imageOp, transform: [{ scale: imageScale }] },
        ]}
      >
        <Image
          source={require('../assets/land.jpg')}
          className='w-[40px] h-[40px]'
          style={s.image}
          resizeMode="cover"
        />
        {/* Bottom-fade scrim — replace with expo-linear-gradient for production */}
        <View style={s.scrim} />
      </Animated.View>

      {/* ── FLOATING BADGE (straddles image/card seam) ── */}
      <Animated.View
        style={[
          s.badge,
          { opacity: badgeOp, transform: [{ translateY: badgeY }] },
        ]}
      >
        {/* Green dot indicator */}
        <View style={s.badgeDot} />
        <Text style={s.badgeText}>STUDENT TRANSPORT</Text>
      </Animated.View>

      {/* ── CONTENT CARD ── */}
      <View style={s.card}>

        {/* Headline */}
        <Animated.Text
          style={[
            s.headline,
            { opacity: headlineOp, transform: [{ translateY: headlineY }] },
          ]}
        >
          Travel smarter,{'\n'}arrive confident.
        </Animated.Text>

        {/* Body copy */}
        <Animated.Text style={[s.body, { opacity: bodyOp }]}>
          Vuduka makes student ticket booking seamless — from campus to destination.
        </Animated.Text>


        {/* Divider */}
        <View style={s.divider} />

        {/* CTA */}
        <Animated.View
          style={{ opacity: ctaOp, transform: [{ translateY: ctaY }] }}
        >
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => navigation.navigate('Login')}
            style={s.cta}
          >
            <View style={s.ctaLeft}>
              <View style={s.ctaIconWrap}>
                <Ionicons name="rocket-outline" size={16} color="#FFFFFF" />
              </View>
              <Text style={s.ctaText}>Get started</Text>
            </View>
            <View style={s.ctaArrowWrap}>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.70)" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Secondary: sign in */}
        <Animated.View style={[s.signInRow, { opacity: signInOp }]}>
          <Text style={s.signInText}>Already have an account? </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={s.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Home indicator ── */}
      <View style={s.homeBar} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BLUE2,
  },

  // ── Image ─────────────────────────────────────────────────────────────────
  imageWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: IMAGE_H,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Fades image into card — swap for expo-linear-gradient in prod
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // Simulate gradient: top transparent, bottom brand-blue
    // For real gradient: <LinearGradient colors={['transparent', BLUE2]} />
    backgroundColor: 'transparent',
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    position: 'absolute',
    top: IMAGE_H - 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  badgeText: {
    color: BLUE2,
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: CARD_TOP,
    backgroundColor: BLUE2,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 28,
    paddingTop: 38,
    paddingBottom: 24,
  },

  headline: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -1.1,
    lineHeight: 38,
    marginBottom: 12,
  },

  body: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 13.5,
    fontFamily: 'Inter',
    lineHeight: 21,
    letterSpacing: 0.1,
    marginBottom: 18,
  },

  // ── Feature pills ─────────────────────────────────────────────────────────
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginVertical: 22,
  },

  // ── CTA button ────────────────────────────────────────────────────────────
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BLUE,           // #0075A8 — same as dashboard accent
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    // Subtle glow
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  },
  ctaArrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sign in ───────────────────────────────────────────────────────────────
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  signInText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    fontFamily: 'Inter',
    letterSpacing: 0.1,
  },
  signInLink: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.1,
  },

  // ── Home bar ──────────────────────────────────────────────────────────────
  homeBar: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});