import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { parseSocialLink } from '../../src/utils/socialLinks';

interface SocialLinkChipProps {
  url: string;
}

export default function SocialLinkChip({ url }: SocialLinkChipProps) {
  const { colors } = useTheme();
  const parsed = parseSocialLink(url);
  if (!parsed) return null;

  const { platform, username } = parsed;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => Linking.openURL(url).catch(() => {})}
      activeOpacity={0.6}
    >
      <Ionicons name={platform.icon as any} size={20} color={colors.muted} />
      <Text style={[styles.username, { color: colors.body }]} numberOfLines={1}>
        {username.replace(/^@/, '')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  username: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
  },
});
