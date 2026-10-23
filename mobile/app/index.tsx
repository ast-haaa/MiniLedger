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

  // Request 6-digit mock OTP
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
        err.response?.data?.error || 'Failed to send OTP. Please ensure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!otp || otp.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(phoneNumber.trim(), otp.trim());
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || 'Invalid OTP code. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>₹</Text>
          </View>
          <Text style={styles.title}>MiniLedger</Text>
          <Text style={styles.subtitle}>Track money lent to friends with clarity</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isOtpSent ? 'Verify Phone' : 'Sign In'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isOtpSent
              ? `Enter the 6-digit code sent to ${phoneNumber}`
              : 'Enter your phone number to receive a mock OTP'}
          </Text>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Mock OTP Helper Banner */}
          {mockOtpHint && isOtpSent && (
            <View style={styles.hintBanner}>
              <Text style={styles.hintLabel}>Mock OTP (Printed in server terminal):</Text>
              <TouchableOpacity onPress={() => setOtp(mockOtpHint)}>
                <Text style={styles.hintOtpCode}>{mockOtpHint} (Tap to auto-fill)</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isOtpSent ? (
            // Phone Number Input
            <View>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setErrorMessage(null);
                }}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // OTP Code Input
            <View>
              <Text style={styles.inputLabel}>6-Digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setErrorMessage(null);
                }}
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setIsOtpSent(false);
                  setOtp('');
                  setMockOtpHint(null);
                  setErrorMessage(null);
                }}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer info */}
        <Text style={styles.footerText}>
          Secure & lightweight • Built for seamless peer ledger tracking
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF', // Lavender background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  logoBadgeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A', // Dark navy text
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  hintBanner: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  hintLabel: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '600',
  },
  hintOtpCode: {
    color: '#4C1D95',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 18,
  },
  otpInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#7C3AED', // Purple button
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 28,
  },
});
