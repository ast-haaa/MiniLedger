import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { createLoan } from '../src/api';

interface AddLoanScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AddLoanScreen({ onBack, onSuccess }: AddLoanScreenProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format Date to YYYY-MM-DD
  const formatDateToIso = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  // Quick preset helper
  const handleQuickPreset = (days: number) => {
    const future = new Date();
    future.setDate(future.getDate() + days);
    setDueDate(formatDateToIso(future));
    setError(null);
  };

  const handleSaveLoan = async () => {
    setError(null);

    if (!friendName || friendName.trim().length === 0) {
      setError("Please enter the friend's name");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid loan amount greater than ₹0');
      return;
    }

    if (!dueDate || dueDate.trim().length === 0) {
      setError('Please specify a due date');
      return;
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      setError('Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    try {
      setLoading(true);
      await createLoan({
        friendName: friendName.trim(),
        amount: numAmount,
        dueDate: parsedDate.toISOString(),
        notes: notes ? notes.trim() : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Record New Loan</Text>
            <Text style={styles.headerSubtitle}>
              Keep transparent track of money lent to friends
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Prominent Amount Box */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>AMOUNT LENT</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    setError(null);
                  }}
                  autoFocus
                />
              </View>
            </View>

            {/* Friend Name */}
            <Text style={styles.inputLabel}>FRIEND'S NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#475569"
              value={friendName}
              onChangeText={(text) => {
                setFriendName(text);
                setError(null);
              }}
            />

            {/* Due Date & Quick Presets */}
            <Text style={styles.inputLabel}>RETURN DUE DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#475569"
              value={dueDate}
              onChangeText={(text) => {
                setDueDate(text);
                setError(null);
              }}
            />

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              <Text style={styles.presetLabel}>Presets:</Text>
              <TouchableOpacity
                style={styles.presetButton}
                activeOpacity={0.7}
                onPress={() => handleQuickPreset(7)}
              >
                <Text style={styles.presetButtonText}>+7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                activeOpacity={0.7}
                onPress={() => handleQuickPreset(14)}
              >
                <Text style={styles.presetButtonText}>+14 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                activeOpacity={0.7}
                onPress={() => handleQuickPreset(30)}
              >
                <Text style={styles.presetButtonText}>+30 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <Text style={styles.inputLabel}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Dinner bill split, trip advance"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              activeOpacity={0.85}
              onPress={handleSaveLoan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Confirm & Save Loan</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
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
  amountBox: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B5CF6',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    padding: 0,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#F8FAFC',
    marginBottom: 16,
  },
  textArea: {
    height: 72,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
  presetLabel: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 8,
    fontWeight: '600',
  },
  presetButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 6,
  },
  presetButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
