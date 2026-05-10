import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';
import { Skill, CATEGORIES } from '../../src/types';

interface SkillCardProps {
  skill: Skill;
  onSwapPress?: (skill: Skill) => void;
  isOwn?: boolean;
  onDeletePress?: (id: string) => void;
}

export default function SkillCard({ skill, onSwapPress, isOwn, onDeletePress }: SkillCardProps) {
  const { colors } = useTheme();
  const cat = CATEGORIES.find((c) => c.label === skill.category);
  const emoji = cat?.emoji ?? '✦';
  const isOffer = skill.type === 'offer';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.nameRow}>
        <Text style={[styles.userName, { color: colors.body }]}>{skill.userName}</Text>
        <View style={[styles.typePill, { backgroundColor: colors.softSurface }]}> 
          <Text style={[styles.typeText, { color: colors.body }]}>{isOffer ? 'Offering' : 'Looking for'}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.ink }]}>{skill.title}</Text>

      {skill.description ? (
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>{skill.description}</Text>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.bottomRow}>
        <Text style={[styles.category, { color: colors.muted }]}>{emoji}  {skill.category}</Text>
        {isOwn ? (
          <TouchableOpacity onPress={() => onDeletePress?.(skill.id)} activeOpacity={0.6}>
            <Text style={[styles.removeLink, { color: colors.muted }]}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => onSwapPress?.(skill)} activeOpacity={0.7}>
            <Text style={[styles.swapLink, { color: colors.accent }]}>Let's swap →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  userName: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
  },
  typePill: {
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    lineHeight: 19.5,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  swapLink: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
  },
  removeLink: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
  },
});
