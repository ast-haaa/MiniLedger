import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BrandLogoProps {
  size?: number;
}

/**
 * Premium Brand Logo for MiniLedger
 * Features a modern, geometric fintech vault emblem with jewel accents.
 */
export default function BrandLogo({ size = 52 }: BrandLogoProps) {
  const borderRadius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.48);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      {/* Ambient background glow ring */}
      <View
        style={[
          styles.innerSurface,
          {
            borderRadius: borderRadius - 2,
          },
        ]}
      >
        {/* Geometric Ledger Nodes */}
        <View style={styles.emblemContainer}>
          <View style={styles.topBar} />
          <View style={styles.middleRow}>
            <View style={styles.dotLeft} />
            <Text style={[styles.currencyGlyph, { fontSize: iconSize }]}>₹</Text>
            <View style={styles.dotRight} />
          </View>
          <View style={styles.bottomBar} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#A78BFA',
  },
  innerSurface: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    width: '42%',
    height: 2.5,
    backgroundColor: '#DDD6FE',
    borderRadius: 2,
    marginBottom: 1,
    opacity: 0.9,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLeft: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FDE047', // Warm gold accent dot
    marginRight: 2,
  },
  currencyGlyph: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -1,
  },
  dotRight: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#34D399', // Emerald accent dot
    marginLeft: 2,
  },
  bottomBar: {
    width: '56%',
    height: 2.5,
    backgroundColor: '#DDD6FE',
    borderRadius: 2,
    marginTop: 1,
    opacity: 0.9,
  },
});
