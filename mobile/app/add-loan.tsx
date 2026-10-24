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
  Image,
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
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
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

  // Handle Receipt photo selection (Bonus feature)
  const handlePickReceipt = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          setReceiptFileName(file.name);
          const reader = new FileReader();
          reader.onload = (event) => {
            setReceiptImage(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      fileInput.click();
    }
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
      const combinedNotes = [
        notes ? notes.trim() : null,
        receiptFileName ? `[Receipt: ${receiptFileName}]` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      await createLoan({
        friendName: friendName.trim(),
        amount: numAmount,
        dueDate: parsedDate.toISOString(),
        notes: combinedNotes || undefined,
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
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
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
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    setError(null);
                  }}
                />
              </View>
            </View>

            {/* Friend Name */}
            <Text style={styles.inputLabel}>FRIEND'S NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Receipt Photo Upload (Bonus) */}
            <Text style={styles.inputLabel}>RECEIPT PHOTO (OPTIONAL BONUS)</Text>
            {receiptImage ? (
              <View style={styles.receiptPreviewBox}>
                <Image source={{ uri: receiptImage }} style={styles.receiptThumbnail} />
                <View style={styles.receiptInfo}>
                  <Text style={styles.receiptFileName} numberOfLines={1}>
                    {receiptFileName || 'Receipt Attached'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setReceiptImage(null);
                      setReceiptFileName(null);
                    }}
                  >
                    <Text style={styles.removeReceiptText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadReceiptBtn}
                activeOpacity={0.75}
                onPress={handlePickReceipt}
              >
                <Text style={styles.uploadReceiptIcon}>📷</Text>
                <Text style={styles.uploadReceiptText}>Attach Receipt Photo</Text>
              </TouchableOpacity>
            )}

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
    backgroundColor: '#FAF5FF',
    width: '100%',
  },
  keyboardContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E4BD6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
    marginRight: 8,
  },
  errorText: {
    color: '#BE123C',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  amountBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    width: '100%',
    overflow: 'hidden',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9061F9',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#9061F9',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 32,
    fontWeight: '800',
    color: '#1E1B4B',
    padding: 0,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#FDFBFD',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E1B4B',
    marginBottom: 16,
    width: '100%',
    minWidth: 0,
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
    flexWrap: 'wrap',
  },
  presetLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '600',
  },
  presetButton: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  presetButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E4BD6',
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#9061F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 4,
    width: '100%',
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
  uploadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  uploadReceiptIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  uploadReceiptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E4BD6',
  },
  receiptPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 18,
  },
  receiptThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  receiptInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  receiptFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1B4B',
    marginBottom: 2,
  },
  removeReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});
