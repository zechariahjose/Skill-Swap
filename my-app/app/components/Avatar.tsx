import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
  // ring prop kept for API compat but not rendered in editorial v2
  ring?: boolean;
  ringColor?: string;
}

const AVATAR_COLORS = [
  '#8B7355', '#6B8F71', '#7A7A9B', '#5A8A9B',
  '#9B8B6B', '#6B7A8B', '#7A6B5A', '#8B7A6B',
];

function getColor(initials: string): string {
  const idx = (initials.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Avatar({ initials, size = 42, color }: AvatarProps) {
  const bg = color ?? getColor(initials);
  const fontSize = size * 0.36;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.white,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.3,
  },
});