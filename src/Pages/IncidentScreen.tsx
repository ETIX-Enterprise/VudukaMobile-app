import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from './theme';
import { INCIDENT_TYPES, SEVERITIES } from './data';
import type { RootStackParamList, SeverityLevel } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Incident'>;

const IncidentScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedType, setSelectedType]   = useState<string | null>(null);
  const [busPlate, setBusPlate]           = useState<string>('');
  const [description, setDescription]     = useState<string>('');
  const [severity, setSeverity]           = useState<SeverityLevel>('medium');
  const [submitted, setSubmitted]         = useState<boolean>(false);
  const [submitting, setSubmitting]       = useState<boolean>(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const refNumber   = useRef<number>(Math.floor(Math.random() * 90000) + 10000);

  const isValid: boolean = Boolean(selectedType && description.trim());

  const handleSubmit = (): void => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      Animated.spring(successAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 150,
        useNativeDriver: true,
      }).start();
    }, 2000);
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.redBg }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successScreen}>
          <Animated.View
            style={[
              styles.successCheckRing,
              {
                transform: [
                  {
                    scale: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
                opacity: successAnim,
              },
            ]}
          >
            <Text style={styles.successCheckText}>✓</Text>
          </Animated.View>
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successSub}>
            Thank you for helping keep our roads safe. Our team will review
            your report and take appropriate action within 24 hours.
          </Text>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>REFERENCE NUMBER</Text>
            <Text style={styles.refValue}>INC-{refNumber.current}</Text>
          </View>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.85}
          >
            <Text style={styles.backHomeBtnText}>Back to Discover</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form Screen ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.redBg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[Colors.red, Colors.redDark]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.circle1} />

          <View style={styles.headerNav}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Report Incident</Text>
              <Text style={styles.headerSub}>Help us keep roads safe</Text>
            </View>
          </View>


        </LinearGradient>

        {/* ── Form Body ── */}
        <View style={styles.formBody}>

          {/* Incident Type */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Incident Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeChip,
                    selectedType === t.id && styles.typeChipSelected,
                  ]}
                  onPress={() => setSelectedType(t.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.typeChipLabel,
                      selectedType === t.id && styles.typeChipLabelSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bus Plate */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bus Plate Number</Text>
            <TextInput
              style={styles.plateInput}
              value={busPlate}
              onChangeText={v => setBusPlate(v.toUpperCase())}
              placeholder="e.g. RAC 847 B"
              className='text-[14px] font-inter-semibold'
              autoCapitalize="characters"
              maxLength={12}
            />
            <Text className="font-inter text-[12px]">
              Optional but helps us identify the vehicle faster
            </Text>
          </View>

          {/* Severity */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Severity Level</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.severityChip,
                    severity === s.id && {
                      borderColor: s.activeColor,
                      backgroundColor: s.activeBg,
                    },
                  ]}
                  onPress={() => setSeverity(s.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.severityChipText,
                      severity === s.id && {
                        color: s.activeColor,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={v => {
                if (v.length <= 500) setDescription(v);
              }}
              placeholder="Describe what happened in as much detail as possible. Include time, location, and any other relevant information…"
              className='font-inter text-[12px]'
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.descFooter}>
              <Text
                className='text-[12px]'
                style={[
                  
                  isValid && { color: Colors.green },
                ]}
              >
                {isValid
                  ? '✓ Ready to submit'
                  : 'Please fill required fields marked with *'}
              </Text>
              <Text className='font-inter-semibold'>{description.length}/500</Text>
            </View>
          </View>

          {/* Location Note */}
          <View style={styles.locationNote}>
            <Text style={styles.locationNoteIcon}>📍</Text>
            <View>
              <Text style={styles.locationNoteTitle}>Location auto-attached</Text>
              <Text className='font-inter'>
                Your current location will be included
              </Text>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isValid && styles.submitBtnValid]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnIcon}>
              {submitting ? '⏳' : '🚨'}
            </Text>
            <Text style={[styles.submitBtnText, isValid && styles.submitBtnTextValid]}>
              {submitting ? 'Submitting Report…' : 'Submit Incident Report'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -85,
    right: -45,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    paddingTop: 30,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 17,
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.7,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  emergencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: 12,
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  emergencySub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    lineHeight: 16,
  },

  // Form
  formBody: {
    padding: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.red,
    marginBottom: 14,
  },
  required: {
    color: Colors.red,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.redBorder,
    backgroundColor: Colors.redBg,
  },
  typeChipSelected: {
    borderColor: Colors.red,
    backgroundColor: Colors.redLight,
  },
  typeChipIcon: {
    fontSize: 18,
  },
  typeChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    flexShrink: 1,
  },
  typeChipLabelSelected: {
    fontWeight: '700',
    color: Colors.red,
  },

  // Plate
  plateInput: {
    borderWidth: 1.5,
    borderColor: Colors.redBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.redBg,
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.textSub,
    marginTop: 8,
  },

  // Severity
  severityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  severityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.redBorder,
    backgroundColor: Colors.redBg,
  },
  severityChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSub,
  },

  // Description
  descInput: {
    borderWidth: 1.5,
    borderColor: Colors.redBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.redBg,
    minHeight: 120,
    lineHeight: 22,
  },
  descFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  descHint: {
    fontSize: 11,
    color: Colors.textSub,
    flex: 1,
  },
  descCount: {
    fontSize: 11,
    color: Colors.textSub,
  },

  // Location note
  locationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.redLight,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    borderRadius: 14,
    padding: 12,
  },
  locationNoteIcon: {
    fontSize: 18,
  },
  locationNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.red,
  },
  locationNoteDetail: {
    fontSize: 11,
    color: Colors.textSub,
    marginTop: 2,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FAD4D4',
  },
  submitBtnValid: {
    backgroundColor: Colors.red,
  },
  submitBtnIcon: {
    fontSize: 18,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#CC8888',
    letterSpacing: -0.3,
  },
  submitBtnTextValid: {
    color: Colors.white,
  },

  // Success
  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCheckRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successCheckText: {
    fontSize: 36,
    color: Colors.red,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.red,
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: Colors.textSub,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  refBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  refLabel: {
    fontSize: 11,
    color: Colors.textSub,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.red,
    letterSpacing: -0.5,
    fontFamily: 'Courier',
  },
  backHomeBtn: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: Colors.red,
    borderRadius: 14,
    alignItems: 'center',
  },
  backHomeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default IncidentScreen;