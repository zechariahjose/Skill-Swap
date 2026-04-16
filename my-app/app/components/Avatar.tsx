import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
}

const AVATAR_COLORS = [
  '#C4623A', '#7A9E7E', '#9B7BB8', '#4A90A4',
  '#C4923A', '#5A7A8F', '#8F6B5A', '#B8845A',
];

function getColor(initials: string): string {
  const idx = (initials.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Avatar({ initials, size = 42, color }: AvatarProps) {
  const bg = color ?? getColor(initials);
  const fontSize = size * 0.38;

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
    letterSpacing: 0.5,
  },
});