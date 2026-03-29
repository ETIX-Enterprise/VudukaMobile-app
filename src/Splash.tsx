import { View, Text, TouchableOpacity, Animated, Image, StyleSheet, Dimensions } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const imageScale   = useRef(new Animated.Value(1.08)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const contentY     = useRef(new Animated.Value(32)).current;
  const contentOp    = useRef(new Animated.Value(0)).current;
  const taglineOp    = useRef(new Animated.Value(0)).current;
  const buttonOp     = useRef(new Animated.Value(0)).current;
  const buttonY      = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    // 1. Image fades + settles
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1, duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 1, duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Headline
    Animated.parallel([
      Animated.timing(contentOp, {
        toValue: 1, duration: 500, delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0, duration: 500, delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Tagline
    Animated.timing(taglineOp, {
      toValue: 1, duration: 400, delay: 500,
      useNativeDriver: true,
    }).start();

    // 4. Button
    Animated.parallel([
      Animated.timing(buttonOp, {
        toValue: 1, duration: 400, delay: 650,
        useNativeDriver: true,
      }),
      Animated.timing(buttonY, {
        toValue: 0, duration: 400, delay: 650,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── FULL-BLEED IMAGE (top 55%) ── */}
      <Animated.View style={[s.imageWrap, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}>
        <Image
          source={require('../assets/land.jpg')}
          style={s.image}
          resizeMode="cover"
        />
        {/* gradient scrim so text below reads cleanly */}
        <View style={s.scrim} />
      </Animated.View>

      {/* ── PILL BADGE ── */}
      <Animated.View style={[s.badge, { opacity: taglineOp }]}>
        <Text style={s.badgeText}>STUDENT TRAVEL</Text>
      </Animated.View>

      {/* ── CONTENT CARD ── */}
      <View style={s.card}>
        {/* Headline */}
        <Animated.Text
          style={[s.headline, { opacity: contentOp, transform: [{ translateY: contentY }] }]}
        >
          Travel smarter,{'\n'}arrive confident.
        </Animated.Text>

        {/* Sub-copy */}
        <Animated.Text style={[s.body, { opacity: taglineOp }]}>
          Vuduka makes student ticket booking seamless — from campus to destination.
        </Animated.Text>

        {/* Divider */}
        <View style={s.divider} />

        {/* CTA */}
        <Animated.View style={{ opacity: buttonOp, transform: [{ translateY: buttonY }] }}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Login')}
            style={s.cta}
          >
            <Text style={s.ctaText}>Get started</Text>
            <Text style={s.ctaArrow}>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.6)" />
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Existing-account nudge */}
        <Animated.Text style={[s.signIn, { opacity: buttonOp }]}>
          Already have an account?{' '}
          <Text style={s.signInLink}>Sign in</Text>
        </Animated.Text>
      </View>

      {/* Home bar spacer */}
      <View style={s.homeBar} />
    </View>
  );
}

const CARD_RADIUS = 28;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#003DD0',
  },

  /* Image */
  imageWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.54,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // fades from transparent at top to brand-blue at bottom
    backgroundColor: 'transparent',
    // RN doesn't support CSS gradients natively — swap for expo-linear-gradient:
    // <LinearGradient colors={['transparent','#003DD0']} style={StyleSheet.absoluteFill} />
  },

  /* Badge */
  badge: {
    position: 'absolute',
    top: height * 0.54 - 18,   // straddles image / card seam
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#003DD0',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 2,
  },

  /* Card */
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: height * 0.5,
    backgroundColor: '#003DD0',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 28,
    paddingTop: 36,
  },

  headline: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -1.2,
    lineHeight: 40,
    marginBottom: 14,
  },

  body: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontFamily: 'Inter',
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 28,
  },

  /* CTA */
  cta: {
    backgroundColor: '#203464',
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // subtle inner highlight
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.3,
  },
  ctaArrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
  },

  /* Sign in */
  signIn: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.1,
  },
  signInLink: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },

  /* Home bar */
  homeBar: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});