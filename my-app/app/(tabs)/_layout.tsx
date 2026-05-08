import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';
import { Redirect } from 'expo-router';
import { useAuthContext } from '../../src/context/AuthContext';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

function PostSkillButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add" size={24} color={Colors.white} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { firebaseUser, loading } = useAuthContext();

  if (!loading && !firebaseUser) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.ink,
        tabBarInactiveTintColor: Colors.muted,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'compass' : 'compass-outline'} color={color} size={22} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} color={color} size={22} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <PostSkillButton onPress={() => props.onPress?.({} as any)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={22} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.ink,
  },
  fab: {
    top: -10,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.ink,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.float,
  },
});
