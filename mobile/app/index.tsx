import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { sendOtp, verifyOtp } from '../src/api';

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setErrorMessage(null);
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits)');
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(phoneNumber.trim());
      setIsOtpSent(true);
      if (res.mockOtp) {
        setMockOtpHint(res.mockOtp);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || 'Unable to connect to backend server. Make sure it is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!otp || otp.trim().length < 4) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(phoneNumber.trim(), otp.trim());
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || 'Invalid verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardContainer}>
            {/* Ambient Brand Header */}
            <View style={styles.brandHeader}>
              <View style={styles.logoRing}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoText}>₹</Text>
                </View>
              </View>
              <Text style={styles.brandName}>MiniLedger</Text>
              <Text style={styles.brandTagline}>Sleek & effortless peer lending tracker</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {isOtpSent ? 'Verify Phone' : 'Welcome Back'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isOtpSent
                    ? `Enter the 6-digit code sent to ${phoneNumber}`
                    : 'Sign in with your phone number to access your ledger'}
                </Text>
              </View>

              {/* Error Alert */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Dev Mock OTP Helper Pill */}
              {mockOtpHint && isOtpSent && (
                <TouchableOpacity
                  style={styles.mockOtpPill}
                  activeOpacity={0.8}
                  onPress={() => setOtp(mockOtpHint)}
                >
                  <View style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>DEV CODE</Text>
                  </View>
                  <Text style={styles.mockOtpCode}>{mockOtpHint}</Text>
                  <Text style={styles.mockOtpAction}>Tap to auto-fill →</Text>
                </TouchableOpacity>
              )}

              {!isOtpSent ? (
                // Step 1: Phone input
                <View style={styles.formSection}>
                  <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="98765 43210"
                      placeholderTextColor="#475569"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={(t) => {
                        setPhoneNumber(t);
                        setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.disabledButton]}
                    activeOpacity={0.85}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // Step 2: OTP input
                <View style={styles.formSection}>
                  <Text style={styles.inputLabel}>6-DIGIT CODE</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="••••••"
                    placeholderTextColor="#334155"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(t) => {
                      setOtp(t);
                      setErrorMessage(null);
                    }}
                    autoFocus
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.disabledButton]}
                    activeOpacity={0.85}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                      setIsOtpSent(false);
                      setOtp('');
                      setMockOtpHint(null);
                      setErrorMessage(null);
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.linkButtonText}>Change phone number</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Footer */}
            <Text style={styles.footerNote}>
              Private • Peer-to-Peer Ledger • Offline Resilient
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: '#090D16', // Deep Obsidian Black
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440, // Elegant phone container on desktop
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
    marginRight: 8,
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  mockOtpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  pillBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mockOtpCode: {
    color: '#DDD6FE',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  mockOtpAction: {
    marginLeft: 'auto',
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '600',
  },
  formSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  countryCodeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  otpInput: {
    height: 52,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 12,
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  linkButtonText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    marginTop: 24,
  },
});
