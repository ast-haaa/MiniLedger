import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import BrandLogo from '../src/components/BrandLogo';
import { isAuthenticated } from '../src/api';

interface HomeScreenProps {
  onOpenDashboard: () => void;
  onNavigateLogin: () => void;
}

export default function HomeScreen({
  onOpenDashboard,
  onNavigateLogin,
}: HomeScreenProps) {
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Authenticated users go straight to Dashboard; unauthenticated users go to Login
  const handleOpenDashboardPress = async () => {
    try {
      setCheckingAuth(true);
      const authed = await isAuthenticated();
      if (authed) {
        onOpenDashboard();
      } else {
        onNavigateLogin();
      }
    } catch {
      onNavigateLogin();
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navbar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={36} />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.brandSub}>Peer Ledger</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.navLoginBtn}
          activeOpacity={0.75}
          onPress={handleOpenDashboardPress}
        >
          <Text style={styles.navLoginText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balanced Centered Main Column */}
        <View style={styles.mainColumn}>
          {/* Centered Brand Tag */}
          <Text style={styles.brandKicker}>MiniLedger</Text>

          {/* Hero Headline */}
          <Text style={styles.heroHeadline}>
            Never lose track of money lent to friends.
          </Text>

          {/* Short Description */}
          <Text style={styles.heroDescription}>
            Track every loan, repayment, and pending balance in one place.
          </Text>

          {/* Primary Action Button: Get Started */}
          <TouchableOpacity
            style={[styles.getStartedBtn, checkingAuth && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleOpenDashboardPress}
            disabled={checkingAuth}
          >
            {checkingAuth ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.getStartedBtnText}>Get Started →</Text>
            )}
          </TouchableOpacity>

          {/* Trust Note */}
          <Text style={styles.heroNote}>
            Fast phone login · Zero password hassle
          </Text>

          {/* Hero Illustration */}
          <View style={styles.heroImageContainer}>
            <Image
              source={require('../assets/hero.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Live Preview Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewLabel}>LIVE SUMMARY PREVIEW</Text>
                <Text style={styles.previewAmount}>₹12,500</Text>
                <Text style={styles.previewSubtext}>Total outstanding balance</Text>
              </View>
              <View style={styles.previewStatusChip}>
                <Text style={styles.previewStatusText}>68% Settled</Text>
              </View>
            </View>

            {/* Mini Progress Bar */}
            <View style={styles.previewProgressTrack}>
              <View style={[styles.previewProgressFill, { width: '68%' }]} />
            </View>

            <View style={styles.previewStatsRow}>
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatLabel}>Total Lent</Text>
                <Text style={styles.previewStatVal}>₹38,000</Text>
              </View>
              <View style={styles.previewStatDivider} />
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatLabel}>Repaid</Text>
                <Text style={[styles.previewStatVal, { color: '#059669' }]}>
                  ₹25,500
                </Text>
              </View>
              <View style={styles.previewStatDivider} />
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatLabel}>Active Friends</Text>
                <Text style={styles.previewStatVal}>4</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <BrandLogo size={26} />
            <Text style={styles.footerBrand}>MiniLedger</Text>
            <Text style={styles.footerText}>
              Built for seamless peer ledger tracking · Private & reliable
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF', // Clean, warm light porcelain
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextCol: {
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9061F9',
    letterSpacing: 0.2,
  },
  navLoginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  navLoginText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E4BD6',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  mainColumn: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  brandKicker: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E4BD6',
    letterSpacing: 0.4,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: 10,
    maxWidth: 360,
  },
  heroDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 340,
  },
  getStartedBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#9061F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  getStartedBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  heroImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 28,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E4BD6',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  previewSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  previewStatusChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  previewProgressTrack: {
    height: 7,
    backgroundColor: '#F3E8FF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: '#9061F9',
    borderRadius: 4,
  },
  previewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  previewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  previewStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  previewStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    width: '100%',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
