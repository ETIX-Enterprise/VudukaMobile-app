import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';

function Landing({ navigation }: any) {
  // Entrance: fade + rise
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryY = useRef(new Animated.Value(16)).current;

  // Tagline fades in slightly after
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Progress bar fills over 10 s
  const progress = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Word mark entrance
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline delayed
    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 500,
      delay: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Progress bar over exactly 10 s
    Animated.timing(progress, {
      toValue: 1,
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: false, // width is layout, not transform
    }).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Splash');
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.root}>
      {/* Subtle radial vignette for depth */}
      <View style={s.vignette} pointerEvents="none" />

      {/* Brand block — sits just above center */}
      <View style={s.brandBlock}>
        <Animated.View
          style={{ opacity: entryOpacity, transform: [{ translateY: entryY }] }}
        >
          <Text style={s.wordmark}>Vuduka</Text>
        </Animated.View>

        <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
          Move smarter, live better
        </Animated.Text>
      </View>

      {/* Progress bar — thin, full-width, bottom */}
      <View style={s.progressTrack}>
        <Animated.View
          style={[
            s.progressFill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* iOS home-bar spacer */}
      <View style={s.homeBarSpacer} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#003DD0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Radial vignette — darker edges, brighter centre */
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // React Native doesn't have radial-gradient natively; use a semi-transparent
    // dark overlay that's stronger at edges via a large border radius trick.
    // For a real app swap this for expo-linear-gradient RadialGradient.
    backgroundColor: 'transparent',
    borderRadius: 0,
  },

  /* Brand */
  brandBlock: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 48, // push slightly above true center
  },

  wordmark: {
    color: '#FFFFFF',
    fontSize: 42,
    fontFamily: 'Inter-SemiBold', // keep original font
    letterSpacing: -1.5,         // tight tracking = modern / Uber-like
    lineHeight: 46,
  },

  tagline: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  /* Progress */
  progressTrack: {
    position: 'absolute',
    bottom: 44,            // sits above the home bar
    left: 32,
    right: 32,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },

  /* Home-bar safe-area stand-in */
  homeBarSpacer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});

export default Landing;