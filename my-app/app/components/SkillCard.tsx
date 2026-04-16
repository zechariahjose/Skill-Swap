import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme, globalStyles } from '../constants/Theme';
import { Skill, CATEGORIES } from '../types';
import Avatar from './Avatar';

interface SkillCardProps {
  skill: Skill;
  onSwapPress?: (skill: Skill) => void;
  isOwn?: boolean;
  onDeletePress?: (id: string) => void;
}

export default function SkillCard({ skill, onSwapPress, isOwn, onDeletePress }: SkillCardProps) {
  const cat = CATEGORIES.find((c) => c.label === skill.category);
  const catColor = cat?.color ?? Colors.terracotta;
  const emoji    = cat?.emoji ?? '⭐';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={[globalStyles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
        <View style={globalStyles.row}>
          <Avatar initials={skill.userInitials} size={38} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.userName}>{skill.userName}</Text>
            <Text style={styles.timeAgo}>
              {skill.type === 'offer' ? '🙋 Offering' : '🔍 Looking for'}
            </Text>
          </View>
        </View>

        {/* Category badge */}
        <View style={[styles.catBadge, { backgroundColor: catColor + '20', borderColor: catColor + '40' }]}>
          <Text style={styles.catEmoji}>{emoji}</Text>
          <Text style={[styles.catLabel, { color: catColor }]}>{skill.category}</Text>
        </View>
      </View>

      {/* Skill title */}
      <Text style={styles.title}>{skill.title}</Text>

      {/* Description */}
      {skill.description ? (
        <Text style={styles.description} numberOfLines={2}>{skill.description}</Text>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Action */}
      {isOwn ? (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDeletePress?.(skill.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnText}>🗑  Remove</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={() => onSwapPress?.(skill)}
          activeOpacity={0.75}
        >
          <Text style={styles.swapBtnText}>Request Swap  →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.sand,
    borderRadius: Theme.borderRadius.lg,
    padding: 18,
    marginBottom: 14,
    ...Theme.shadow.card,
  },
  userName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.charcoal,
  },
  timeAgo: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 12 },
  catLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: Colors.charcoal,
    marginBottom: 6,
    lineHeight: 26,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.sandDark,
    marginVertical: 12,
  },
  swapBtn: {
    backgroundColor: Colors.terracotta,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 11,
    alignItems: 'center',
    ...Theme.shadow.btn,
  },
  swapBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.sandDark,
  },
  deleteBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
  },
});