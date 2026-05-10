import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';

export default function SkeletonCard() {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: anim, backgroundColor: colors.softSurface }]}> 
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.border }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.line, { width: '50%', backgroundColor: colors.border }]} />
          <View style={[styles.line, { width: '30%', height: 10, backgroundColor: colors.border }]} />
        </View>
      </View>
      <View style={[styles.line, { width: '80%', height: 22, marginBottom: 8, backgroundColor: colors.border }]} />
      <View style={[styles.line, { width: '100%', backgroundColor: colors.border }]} />
      <View style={[styles.line, { width: '60%', backgroundColor: colors.border }]} />
      <View style={[styles.line, { height: 40, borderRadius: 99, marginTop: 12, backgroundColor: colors.border }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.borderRadius.lg,
    padding: 18,
    marginBottom: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  line: {
    height: 14,
    borderRadius: 7,
  },
});
