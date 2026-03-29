import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:          "#003DD0",
  blueLight:     "#004BFF66",
  blueLightText: "#6B87F0",
  white:         "#ffffff",
  textSub:       "rgba(255,255,255,0.65)",
};

// ── Floating Card Component ───────────────────────────────────────────────────
function FloatCard({
  style,
  delay = 0,
  checks = [],
  lines = [],
}: {
  style: object;
  delay?: number;
  checks?: boolean[];
  lines?: number[];
}) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -10, duration: 1800, delay, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0,   duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[s.floatCard, style, { transform: [{ translateY: y }] }]}>
      {checks.map((done, i) => (
        <View key={i} style={s.checkRow}>
          <View style={[s.checkCircle, done && s.checkCircleDone]}>
            {done && <Ionicons name="checkmark" size={9} color={C.blue} />}
          </View>
          {lines[i] !== undefined && (
            <View style={[s.cardLine, { width: lines[i] }]} />
          )}
        </View>
      ))}
      {checks.length === 0 &&
        lines.map((w, i) => (
          <View key={i} style={[s.cardLine, { width: w, opacity: i % 2 === 1 ? 0.6 : 1 }]} />
        ))}
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LandingScreen({ navigation }: any) {
  const titleY   = useRef(new Animated.Value(24)).current;
  const titleOp  = useRef(new Animated.Value(0)).current;
  const subY     = useRef(new Animated.Value(18)).current;
  const subOp    = useRef(new Animated.Value(0)).current;
  const btnOp    = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY,  { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subOp,  { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(subY,   { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOp,    { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={s.safeArea}>

        {/* ── HERO ── */}
        <View style={s.heroWrap}>
          {/* Background glow */}
          <View style={s.heroGlow} />

          {/* Floating doc cards */}
          <FloatCard
            style={s.card1}
            delay={0}
            checks={[true, true, false]}
            lines={[60, 50, 40]}
          />
          <FloatCard
            style={s.card2}
            delay={300}
            lines={[70, 50, 0]}
            checks={[false, false, true]}
          />
          <FloatCard
            style={s.card3}
            delay={600}
            checks={[true, true]}
            lines={[55, 40]}
          />
          <FloatCard
            style={s.card4}
            delay={900}
            lines={[60, 0]}
            checks={[false, true]}
          />

          {/* Centre phone illustration */}
          <View style={s.phoneIllo}>
            <View style={s.phonePill} />
            {[
              { label: "Booked",   done: true },
              { label: "Verified", done: true },
              { label: "Ready",    done: false },
            ].map(({ label, done }) => (
              <View key={label} style={s.checkItem}>
                <View style={[s.checkCircle, done && s.checkCircleDone]}>
                  {done
                    ? <Ionicons name="checkmark" size={10} color={C.blue} />
                    : <View style={s.dotInner} />}
                </View>
                <Text style={s.checkLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── COPY ── */}
        <View style={s.copyWrap}>
          <Animated.Text
            style={[s.title, { opacity: titleOp, transform: [{ translateY: titleY }] }]}
          >
            Book Student Tickets for easy travel to their Destine
          </Animated.Text>

          <Animated.Text
            style={[s.sub, { opacity: subOp, transform: [{ translateY: subY }] }]}
          >
            Vuduka gives a friendly experience{"\n"}for seamless ticket booking of your student travels
          </Animated.Text>
        </View>

        {/* ── CTA ── */}
        <Animated.View style={[s.ctaWrap, { opacity: btnOp, transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={s.getStartedBtn}
            onPress={() => navigation?.navigate?.("Login")}
          >
            <Text style={s.getStartedText}>Get started</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>

      {/* Home bar */}
      <View style={s.homeBar}>
        <View style={s.homeBarPill} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HERO_H = Math.min(height * 0.44, 340);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.blue },
  safeArea: { flex: 1 },

  // Hero
  heroWrap: {
    height: HERO_H,
    margin: 20,
    marginTop: 12,
    borderRadius: 24,
    backgroundColor: "#0030b0",
    overflow: "hidden",
    position: "relative",
  },
  heroGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1a52e0",
    top: "20%",
    left: "25%",
    opacity: 0.5,
  },

  // Floating cards
  floatCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  card1: { width: 110, top: "8%",  left: "4%"  },
  card2: { width: 90,  top: "5%",  right: "6%" },
  card3: { width: 100, bottom: "10%", left: "6%"  },
  card4: { width: 85,  bottom: "12%", right: "4%" },

  checkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleDone: {
    backgroundColor: C.white,
    borderColor: C.white,
  },
  cardLine: {
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  // Centre phone
  phoneIllo: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -55,
    marginTop: -95,
    width: 110,
    height: 190,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 16,
  },
  phonePill: {
    position: "absolute",
    top: 8,
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 80,
  },
  checkLabel: {
    color: C.white,
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.9,
  },
  dotInner: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  // Copy
  copyWrap: { paddingHorizontal: 28, marginTop: 8, flex: 1 },
  title: {
    fontSize: width < 360 ? 21 : 24,
    fontWeight: "800",
    color: C.white,
    lineHeight: width < 360 ? 28 : 32,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sub: {
    fontSize: width < 360 ? 13 : 14,
    color: C.textSub,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "center",
  },

  // CTA
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  getStartedBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Home bar
  homeBar: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(0,61,208,0.18)",
  },
  homeBarPill: {
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});