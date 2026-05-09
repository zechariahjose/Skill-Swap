import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';
import { Redirect } from 'expo-router';
import { useAuthContext } from '../../src/context/AuthContext';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

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

// ─── Icon map ─────────────────────────────────────────────────────────────────

function getIcon(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  const map: Record<string, [string, string]> = {
    home:     ['compass',         'compass-outline'],
    requests: ['swap-horizontal', 'swap-horizontal-outline'],
    profile:  ['person',          'person-outline'],
  };
  const [active, inactive] = map[routeName] ?? ['ellipse', 'ellipse-outline'];
  return (focused ? active : inactive) as keyof typeof Ionicons.glyphMap;
}

// ─── Floating Tab Bar ─────────────────────────────────────────────────────────

function FloatingTabBar({ state, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 20 }]}>

      {/* Blur layer — iOS frosted glass, Android falls back to solid */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={24} tint="dark" style={[StyleSheet.absoluteFill, styles.blurClip]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}

      {/* Subtle border on top of blur */}
      <View style={styles.borderOverlay} pointerEvents="none" />

      {/* Tab items */}
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isCenter  = route.name === 'create';

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

          // ── Center FAB ────────────────────────────────────────────────
          if (isCenter) {
            return (
              <View key={route.key} style={styles.fabWrapper}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={styles.fab}
                >
                  <Ionicons name="add" size={26} color={Colors.base ?? '#111010'} />
                </TouchableOpacity>
              </View>
            );
          }

          // ── Regular tab ───────────────────────────────────────────────
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
                color={isFocused ? Colors.accent : Colors.muted}
              />
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

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
      <Tabs.Screen name="home"     />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="create"   />
      <Tabs.Screen name="profile"  />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 64;
const FAB_SIZE   = 54;
const FAB_LIFT   = 18;

// The single radius value applied everywhere — gives the bar its curved,
// squircle-like feel without being a harsh pill or a flat rectangle.
const BAR_RADIUS = 28;

const styles = StyleSheet.create({

  wrapper: {
    position:      'absolute',
    left:          20,
    right:         20,
    height:        BAR_HEIGHT,
    borderRadius:  BAR_RADIUS,   // ← curved, not a full pill (999)
    overflow:      'visible',
    // Layered shadow: deep primary + soft ambient
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.48,
    shadowRadius:  28,
    elevation:     18,
  },

  // BlurView needs the same radius to clip correctly on iOS
  blurClip: {
    borderRadius: BAR_RADIUS,
    overflow:     'hidden',
  },

  androidBg: {
    backgroundColor: 'rgba(26, 25, 24, 0.96)',
    borderRadius:    BAR_RADIUS,
  },

  // Thin border sits above blur — gives the bar a raised edge
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_RADIUS,
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.09)',
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
    width:           4,
    height:          3,
    borderRadius:    2,
    backgroundColor: Colors.accent ?? '#C8A882',
  },

  fabWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'visible',
  },

  fab: {
    width:           FAB_SIZE,
    height:          FAB_SIZE,
    borderRadius:    FAB_SIZE / 2,
    backgroundColor: Colors.accent ?? '#C8A882',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -(FAB_LIFT * 2),
    // Warm sand glow
    shadowColor:     Colors.accent ?? '#C8A882',
    shadowOffset:    { width: 0, height: 5 },
    shadowOpacity:   0.38,
    shadowRadius:    16,
    elevation:       14,
  },

});