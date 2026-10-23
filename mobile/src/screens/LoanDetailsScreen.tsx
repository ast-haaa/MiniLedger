import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { fetchLoanDetails, recordRepayment } from '../api';
import { LoanDetail } from '../types';

interface LoanDetailsScreenProps {
  loanId: string;
  onBack: () => void;
  onRepaymentRecorded: () => void;
}

export default function LoanDetailsScreen({
  loanId,
  onBack,
  onRepaymentRecorded,
}: LoanDetailsScreenProps) {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchLoanDetails(loanId);
      setLoan(data);
    } catch (err: any) {
      setError('Failed to load loan details.');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleQuickFullRepay = () => {
    if (!loan) return;
    setRepaymentAmount(loan.outstanding.toString());
    setError(null);
  };

  const handleRecordRepayment = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!loan) return;

    const numAmount = parseFloat(repaymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid repayment amount');
      return;
    }

    // Client-side prevention of overpayment
    if (numAmount > loan.outstanding) {
      setError(
        `Repayment amount (₹${numAmount.toLocaleString('en-IN')}) cannot exceed outstanding balance of ₹${loan.outstanding.toLocaleString('en-IN')}`
      );
      return;
    }

    try {
      setSubmitting(true);
      await recordRepayment(loan.id, numAmount);
      setRepaymentAmount('');
      setSuccessMsg(`Successfully recorded repayment of ₹${numAmount.toLocaleString('en-IN')}`);
      await loadDetails();
      onRepaymentRecorded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Loan record not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue = loan.status === 'OVERDUE';
  const isRepaid = loan.status === 'REPAID';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Loans</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
        </View>

        {/* Status & Loan Overview Card */}
        <View style={[styles.card, isOverdue && styles.overdueCardBorder]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {loan.friendName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{loan.friendName}</Text>
              <Text style={styles.dueDateText}>Due: {formatDate(loan.dueDate)}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isOverdue && styles.statusBadgeOverdue,
                isRepaid && styles.statusBadgeRepaid,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isOverdue && styles.statusTextOverdue,
                  isRepaid && styles.statusTextRepaid,
                ]}
              >
                {loan.status}
              </Text>
            </View>
          </View>

          {loan.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{loan.notes}</Text>
            </View>
          )}

          {/* 3 Metric Breakdown */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Original Amount</Text>
              <Text style={styles.metricValue}>₹{loan.amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Repaid</Text>
              <Text style={[styles.metricValue, styles.repaidValue]}>
                ₹{loan.totalRepaid.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Outstanding</Text>
              <Text
                style={[
                  styles.metricValue,
                  isOverdue ? styles.overdueText : styles.outstandingText,
                ]}
              >
                ₹{loan.outstanding.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Repayment Form or Settled Banner */}
        {!isRepaid ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Record Repayment</Text>
            <Text style={styles.sectionSubtitle}>
              Record a partial or full payment received from {loan.friendName}
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {successMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Quick full repayment button */}
            <TouchableOpacity
              style={styles.quickPayButton}
              onPress={handleQuickFullRepay}
            >
              <Text style={styles.quickPayButtonText}>
                ⚡ Pay Full Balance (₹{loan.outstanding.toLocaleString('en-IN')})
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Repayment Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder={`Max ₹${loan.outstanding}`}
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={repaymentAmount}
              onChangeText={(text) => {
                setRepaymentAmount(text);
                setError(null);
                setSuccessMsg(null);
              }}
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              onPress={handleRecordRepayment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Record Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.settledCard]}>
            <Text style={styles.settledTitle}>🎉 Loan Fully Settled!</Text>
            <Text style={styles.settledSubtitle}>
              All ₹{loan.amount.toLocaleString('en-IN')} has been repaid by {loan.friendName}.
            </Text>
          </View>
        )}

        {/* Repayment History Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repayment History</Text>
          {loan.repayments.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              No repayments have been recorded for this loan yet.
            </Text>
          ) : (
            loan.repayments.map((rep, idx) => (
              <View key={rep.id || idx} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyAmount}>
                    + ₹{rep.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(rep.repaidAt)}
                  </Text>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>Repaid</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF', // Lavender background
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6D28D9',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D28D9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  overdueCardBorder: {
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dueDateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  statusBadgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeRepaid: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  statusTextOverdue: {
    color: '#DC2626',
  },
  statusTextRepaid: {
    color: '#059669',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  repaidValue: {
    color: '#059669',
  },
  outstandingText: {
    color: '#7C3AED',
  },
  overdueText: {
    color: '#DC2626',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  quickPayButton: {
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  quickPayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settledCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    alignItems: 'center',
    paddingVertical: 24,
  },
  settledTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  settledSubtitle: {
    fontSize: 13,
    color: '#166534',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
