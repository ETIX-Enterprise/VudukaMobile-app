import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";


// ── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  blue:            "#003DD0",
  blueDisabled:    "#003DD02E",
  blueLight:       "#004BFF66",
  blueLightText:   "#6B87F0",
  white:           "#ffffff",
  text:            "#1a1a1a",
  textSub:         "#9D9DA9",
  textLabel:       "#2F2B3DB2",
  textPlaceholder: "#2F2B3D66",
  fieldBorder:     "#e2e5ec",
  fieldBorderFocus:"#2952E3",
};

export default function LoginScreen({ navigation }: any) {
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { height } = Dimensions.get("window");

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(30)).current;
  const HEADER_HEIGHT = 220;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(cardY,       { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  const canLogin =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.trim().length > 0;

  const focused = (field: string) => focusedField === field;

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />

      {/* ── BLUE HEADER ─────────────────────────────────────────── */}
    <View style={{ height: 200, backgroundColor: C.blue}}>
      <SafeAreaView>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back"  className="w-[56px] h-[56px] text-white"  />
          </TouchableOpacity>

          <Text className="text-white font-bold text-[16px]">
            Login
          </Text>

          <View style={s.backBtn} />
        </View>
      </SafeAreaView>
    </View>
    <View style={{flex:1, paddingLeft: 5 , paddingRight: 5}}>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────── */}
    <KeyboardAvoidingView
      style={{ flex: 1  , backgroundColor: "white"  , marginTop: -100, borderTopLeftRadius: 25, borderTopRightRadius: 25 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
          {/* ── WHITE CARD ── */}
          <Animated.View
           
            style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}
          >
            {/* Heading */}
            <Text className="text-[16px] font-semibold">Enter your credentials to continue</Text>
            <Text className={`text-[14px] font-normal text-[${C.textSub}]`}>Let's check it's you</Text>
            {/* ── Phone ── */}
            <View style={[s.fieldBlock, s.mt18]}>
              <Text style={s.fieldLabel}>Phone</Text>
              <View style={[s.fieldRow, focused("phone") && s.fieldRowFocused]}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="07888......"
                  placeholderTextColor={C.textPlaceholder}
                  keyboardType="phone-pad"
                  style={s.textInput}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField((p) => (p === "phone" ? null : p))}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* ── Password ── */}
            <View style={[s.fieldBlock, s.mt18]}>
              <Text style={s.fieldLabel}>Password</Text>
              <View style={[s.fieldRow, focused("password") && s.fieldRowFocused]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="A strong password"
                  placeholderTextColor={C.textPlaceholder}
                  secureTextEntry={!showPassword}
                  style={[
                    s.textInput,
                    password.length > 0 && !showPassword && { letterSpacing: 3 },
                  ]}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField((p) => (p === "password" ? null : p))}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={C.textPlaceholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Terms ── */}
            <View style={s.termsRow}>
              <Text className="text-black text-[14px]">
                By selecting Agree and continue, I agree to our{" "}
              </Text>
              <TouchableOpacity hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <Text className="text-blue-500 text-[14px] font-bold">Terms of Service</Text>
              </TouchableOpacity>
              <Text className="text-black text-[14px]"> and </Text>
              <TouchableOpacity hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <Text className="text-blue-500 text-[14px] font-bold">Privacy Policy.</Text>
              </TouchableOpacity>
            </View>

            {/* ── Login button ── */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation?.replace?.("Home")}
              
              style={[s.loginBtn, !canLogin && s.loginBtn]}
            >
              <Text style={s.loginBtnText}>Login</Text>
            </TouchableOpacity>

            {/* ── Ghost button ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation?.navigate?.("Signup")}
              style={s.ghostBtn}
            >
              <Text className="text-black text-[14px] font-inter-semibold">I don't have an account</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
      {/* ── HOME INDICATOR ── */}
      <View style={s.homeBar}>
        <View style={s.homeBarPill} />
      </View>
    </View>
  );
}

// ── Stylesheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: C.blue },

  // Header
  safeArea: {  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,

  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.2,
  },

  // Scroll
  scroll: { flexGrow: 2, padding: 5 , paddingBottom:80 },

  // White card
  card: {
    flex: 1,
    backgroundColor: C.white,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    borderTopLeftRadius:25,
    borderTopRightRadius:25,
    
  },

  // Heading
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    lineHeight: 27,
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: "400",
    marginBottom: 28,
  },

  // Fields
  fieldBlock: {},
  mt18: { marginTop: 18 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textLabel,
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: C.fieldBorder,
  },
  fieldRowFocused: {
    borderColor: C.fieldBorderFocus,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    fontWeight: "400",
  },

  // Terms
  termsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 28,
  },
  termsText: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    color: C.blue,
    fontWeight: "600",
    lineHeight: 18,
  },

  // Login button — solid blue
  loginBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnDisabled: {
    backgroundColor: C.blueDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.3,
  },

  // Ghost button — light blue
  ghostBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#003DD014",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Home indicator
homeBar: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  alignItems: "center",
  paddingVertical: 10,
  backgroundColor: "#003DD02E",
},
  homeBarPill: {
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: C.blue,
  },
});