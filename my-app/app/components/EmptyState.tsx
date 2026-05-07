import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingTop: 64,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
  },
  actionBtn: {
    marginTop: 20,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.accent,
  },
});