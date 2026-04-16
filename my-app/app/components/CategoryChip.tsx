import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { CATEGORIES, Category } from '../types';
import { Theme } from '../constants/Theme';

interface CategoryChipProps {
  label: Category | 'All';
  selected?: boolean;
  onPress?: () => void;
}

export default function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const cat = CATEGORIES.find((c) => c.label === label);
  const emoji = cat?.emoji ?? '🌟';
  const accentColor = cat?.color ?? Colors.terracotta;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && { backgroundColor: accentColor, borderColor: accentColor },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.emoji}>{label === 'All' ? '✨' : emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.sand,
    borderWidth: 1.5,
    borderColor: Colors.sandDark,
    marginRight: 8,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.charcoal,
  },
  labelSelected: {
    color: Colors.white,
  },
});