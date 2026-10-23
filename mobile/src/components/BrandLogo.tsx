import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

interface BrandLogoProps {
  size?: number;
  onPress?: () => void;
}

/**
 * Modern Minimalist Fintech Logo for MiniLedger
 * Features three ascending geometric ledger balance pillars inside a light violet squircle.
 * Clicking redirects to the landing page if onPress is supplied.
 */
export default function BrandLogo({ size = 52, onPress }: BrandLogoProps) {
  const borderRadius = Math.round(size * 0.28);
  const pillWidth = Math.max(3, Math.round(size * 0.11));
  const pillGap = Math.max(2, Math.round(size * 0.08));

  const content = (
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
      <View style={styles.pillarGroup}>
        {/* Left balance pillar */}
        <View
          style={[
            styles.pillar,
            {
              width: pillWidth,
              height: size * 0.38,
              backgroundColor: '#DDD6FE', // Soft lilac tint
              marginRight: pillGap,
            },
          ]}
        />
        {/* Center executive ledger pillar */}
        <View
          style={[
            styles.pillar,
            {
              width: pillWidth,
              height: size * 0.54,
              backgroundColor: '#FFFFFF', // Crisp white core
              marginRight: pillGap,
            },
          ]}
        />
        {/* Right settlement pillar */}
        <View
          style={[
            styles.pillar,
            {
              width: pillWidth,
              height: size * 0.44,
              backgroundColor: '#6EE7B7', // Fresh light mint accent
            },
          ]}
        />
      </View>
      {/* Sleek bottom baseline */}
      <View
        style={[
          styles.baseline,
          {
            width: size * 0.52,
            height: Math.max(2, Math.round(size * 0.05)),
          },
        ]}
      />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#9061F9', // Modern lighter, friendlier vibrant violet
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
  },
  pillarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 3,
  },
  pillar: {
    borderRadius: 99,
  },
  baseline: {
    backgroundColor: '#EDE9FE',
    borderRadius: 99,
    opacity: 0.85,
  },
});
