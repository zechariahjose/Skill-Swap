import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

export default function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: anim }]}>
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.line, { width: '50%' }]} />
          <View style={[styles.line, { width: '30%', height: 10 }]} />
        </View>
      </View>
      <View style={[styles.line, { width: '80%', height: 22, marginBottom: 8 }]} />
      <View style={[styles.line, { width: '100%' }]} />
      <View style={[styles.line, { width: '60%' }]} />
      <View style={[styles.line, { height: 40, borderRadius: 99, marginTop: 12 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.sand,
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
    backgroundColor: Colors.sandDark,
  },
  line: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.sandDark,
  },
});