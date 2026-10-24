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
          <BrandLogo size={32} />
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
              <Text style={styles.getStartedBtnText}>Get Started</Text>
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
              resizeMode="contain"
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
            <BrandLogo size={22} />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextCol: {
    marginLeft: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9061F9',
    letterSpacing: 0.2,
  },
  navLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  navLoginText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E4BD6',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  mainColumn: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
  },
  brandKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E4BD6',
    letterSpacing: 0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroHeadline: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 27,
    letterSpacing: -0.5,
    marginBottom: 6,
    maxWidth: 340,
  },
  heroDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    maxWidth: 330,
  },
  getStartedBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#9061F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  getStartedBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroImageContainer: {
    width: '100%',
    height: 165,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E4BD6',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  previewAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  previewSubtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  previewStatusChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  previewStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  previewProgressTrack: {
    height: 5,
    backgroundColor: '#F3E8FF',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: '#9061F9',
    borderRadius: 2,
  },
  previewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  previewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  previewStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  previewStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 16,
    width: '100%',
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 3,
    marginBottom: 2,
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
