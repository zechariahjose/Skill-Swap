import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabRoute = {
  key: string;
  name: string;
};

type FloatingTabBarProps = {
  state: { routes: TabRoute[]; index: number };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

function getIcon(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  const map: Record<string, [string, string]> = {
    home:        ['compass',         'compass-outline'],
    requests:    ['swap-horizontal', 'swap-horizontal-outline'],
    connections: ['people',          'people-outline'],
    create:      ['add',             'add'],
    profile:     ['person',          'person-outline'],
  };
  const [active, inactive] = map[routeName] ?? ['ellipse', 'ellipse-outline'];
  return (focused ? active : inactive) as keyof typeof Ionicons.glyphMap;
}

// ─── Animated Create FAB ──────────────────────────────────────────────────────

function CreateFAB({ onPress, colors }: { onPress: () => void; colors: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Subtle breathing glow loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.91,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Derive accent color tints for gradient
  const accentColor = colors.accent ?? '#6C63FF';

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.fabWrapper}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.fabGlowRing,
          {
            borderColor: accentColor,
            opacity: glowAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />

      {/* FAB body */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: scaleAnim }],
            shadowColor: accentColor,
          },
        ]}
      >
        <LinearGradient
          colors={[lighten(accentColor, 0.25), accentColor, darken(accentColor, 0.18)]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.fabGradient}
        >
          {/* Inner shimmer highlight */}
          <View style={styles.fabShimmer} />

          {/* Icon */}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

function lighten(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch { return hex; }
}

function darken(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch { return hex; }
}

// ─── Floating Tab Bar ─────────────────────────────────────────────────────────

function FloatingTabBar({ state, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, themeMode } = useTheme();

  const visibleRoutes = state.routes.filter(route =>
    ['home', 'requests', 'connections', 'create', 'profile'].includes(route.name)
  );

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 20 }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={24}
          tint={themeMode === 'dark' ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, styles.blurClip]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.androidBg,
            { backgroundColor: colors.surface },
          ]}
        />
      )}

      <View
        style={[
          styles.borderOverlay,
          {
            borderColor:
              themeMode === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.08)',
          },
        ]}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        {visibleRoutes.map((route) => {
          const realIndex = state.routes.findIndex(r => r.key === route.key);
          const isFocused = state.index === realIndex;
          const isCreate  = route.name === 'create';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCreate) {
            return <CreateFAB key={route.key} onPress={onPress} colors={colors} />;
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <Ionicons
                name={getIcon(route.name, isFocused)}
                size={22}
                color={isFocused ? colors.accent : colors.muted}
              />
              {isFocused && (
                <View
                  style={[styles.activeDot, { backgroundColor: colors.accent }]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Tabs Layout ──────────────────────────────────────────────────────────────

export default function TabsLayout() {
  const { firebaseUser, loading } = useAuthContext();

  if (!loading && !firebaseUser) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as unknown as FloatingTabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"        />
      <Tabs.Screen name="requests"    />
      <Tabs.Screen name="connections" />
      <Tabs.Screen name="create"      />
      <Tabs.Screen name="profile"     />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 64;
const FAB_SIZE   = 56;
const FAB_LIFT   = 22;
const BAR_RADIUS = 28;

const styles = StyleSheet.create({
  wrapper: {
    position:      'absolute',
    left:          20,
    right:         20,
    height:        BAR_HEIGHT,
    borderRadius:  BAR_RADIUS,
    overflow:      'visible',
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.48,
    shadowRadius:  28,
    elevation:     18,
  },
  blurClip: {
    borderRadius: BAR_RADIUS,
    overflow:     'hidden',
  },
  androidBg: {
    borderRadius: BAR_RADIUS,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_RADIUS,
    borderWidth:  1,
  },
  inner: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 8,
    overflow:          'visible',
  },
  tabItem: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 4,
    gap:             5,
  },
  activeDot: {
    width:        4,
    height:       3,
    borderRadius: 2,
  },

  // ── Create FAB ──
  fabWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'visible',
  },
  fabGlowRing: {
    position:     'absolute',
    width:        FAB_SIZE + 14,
    height:       FAB_SIZE + 14,
    borderRadius: (FAB_SIZE + 14) / 2,
    borderWidth:  1.5,
    top:          -(FAB_LIFT * 2) - 7,
  },
  fabContainer: {
    width:         FAB_SIZE,
    height:        FAB_SIZE,
    borderRadius:  FAB_SIZE / 2,
    marginTop:     -(FAB_LIFT * 2),
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius:  18,
    elevation:     20,
    overflow:      'visible',
  },
  fabGradient: {
    width:          FAB_SIZE,
    height:         FAB_SIZE,
    borderRadius:   FAB_SIZE / 2,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  fabShimmer: {
    position:     'absolute',
    top:          4,
    left:         10,
    width:        FAB_SIZE * 0.55,
    height:       FAB_SIZE * 0.38,
    borderRadius: FAB_SIZE,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform:    [{ rotate: '-20deg' }],
  },
});