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
  const emoji = cat?.emoji ?? '✦';

  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{label === 'All' ? '✦' : emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: Colors.softSurface,
    borderColor: Colors.border,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.body,
    letterSpacing: 0.2,
  },
  labelSelected: {
    color: Colors.ink,
    fontFamily: 'Nunito_700Bold',
  },
});