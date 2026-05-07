import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { Skill, CATEGORIES } from '../types';

interface SkillCardProps {
  skill: Skill;
  onSwapPress?: (skill: Skill) => void;
  isOwn?: boolean;
  onDeletePress?: (id: string) => void;
}

export default function SkillCard({ skill, onSwapPress, isOwn, onDeletePress }: SkillCardProps) {
  const cat = CATEGORIES.find((c) => c.label === skill.category);
  const emoji = cat?.emoji ?? '✦';
  const isOffer = skill.type === 'offer';

  return (
    <View style={styles.card}>
      {/* Row 1: name + type badge */}
      <View style={styles.nameRow}>
        <Text style={styles.userName}>{skill.userName}</Text>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{isOffer ? 'Offering' : 'Looking for'}</Text>
        </View>
      </View>

      {/* Row 2: dominant title */}
      <Text style={styles.title}>{skill.title}</Text>

      {/* Row 3: description */}
      {skill.description ? (
        <Text style={styles.description} numberOfLines={2}>{skill.description}</Text>
      ) : null}

      {/* Row 4: subtle divider */}
      <View style={styles.divider} />

      {/* Row 5: category + action */}
      <View style={styles.bottomRow}>
        <Text style={styles.category}>{emoji}  {skill.category}</Text>
        {isOwn ? (
          <TouchableOpacity onPress={() => onDeletePress?.(skill.id)} activeOpacity={0.6}>
            <Text style={styles.removeLink}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => onSwapPress?.(skill)} activeOpacity={0.7}>
            <Text style={styles.swapLink}>Let's swap →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.body,
  },
  typePill: {
    backgroundColor: Colors.softSurface,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.body,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: Colors.ink,
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.muted,
    lineHeight: 19.5,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
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
    color: Colors.muted,
    letterSpacing: 0.2,
  },
  swapLink: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.accent,
  },
  removeLink: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.muted,
  },
});