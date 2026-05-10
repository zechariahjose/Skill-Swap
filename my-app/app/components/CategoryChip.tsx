import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';
import { CATEGORIES, Category } from '../../src/types';

interface CategoryChipProps {
  label: Category | 'All';
  selected?: boolean;
  onPress?: () => void;
}

export default function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  const cat = CATEGORIES.find((c) => c.label === label);
  const emoji = cat?.emoji ?? '✦';

  return (
    <TouchableOpacity
      style={[styles.chip, { borderColor: colors.border, backgroundColor: selected ? colors.softSurface : colors.surface }, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{label === 'All' ? '✦' : emoji}</Text>
      <Text style={[styles.label, { color: selected ? colors.ink : colors.body }, selected && styles.labelSelected]}>{label}</Text>
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
    marginRight: 8,
  },
  chipSelected: {
    borderWidth: 1,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    letterSpacing: 0.2,
  },
  labelSelected: {
    fontFamily: 'Nunito_700Bold',
  },
});
