export type SocialPlatform = {
  name: string;
  color: string;
  icon: string; // Ionicons name
  emoji: string; // fallback emoji
};

const PLATFORMS: { pattern: RegExp; platform: SocialPlatform }[] = [
  {
    pattern: /instagram\.com/i,
    platform: { name: 'Instagram', color: '#E1306C', icon: 'logo-instagram', emoji: '📸' },
  },
  {
    pattern: /github\.com/i,
    platform: { name: 'GitHub', color: '#333333', icon: 'logo-github', emoji: '🐙' },
  },
  {
    pattern: /linkedin\.com/i,
    platform: { name: 'LinkedIn', color: '#0A66C2', icon: 'logo-linkedin', emoji: '💼' },
  },
  {
    pattern: /twitter\.com|x\.com/i,
    platform: { name: 'X', color: '#000000', icon: 'logo-twitter', emoji: '🐦' },
  },
  {
    pattern: /youtube\.com|youtu\.be/i,
    platform: { name: 'YouTube', color: '#FF0000', icon: 'logo-youtube', emoji: '▶️' },
  },
  {
    pattern: /tiktok\.com/i,
    platform: { name: 'TikTok', color: '#010101', icon: 'musical-notes', emoji: '🎵' },
  },
  {
    pattern: /facebook\.com/i,
    platform: { name: 'Facebook', color: '#1877F2', icon: 'logo-facebook', emoji: '👤' },
  },
  {
    pattern: /behance\.net/i,
    platform: { name: 'Behance', color: '#1769FF', icon: 'brush', emoji: '🎨' },
  },
  {
    pattern: /dribbble\.com/i,
    platform: { name: 'Dribbble', color: '#EA4C89', icon: 'basketball', emoji: '🏀' },
  },
  {
    pattern: /pinterest\.com/i,
    platform: { name: 'Pinterest', color: '#E60023', icon: 'logo-pinterest', emoji: '📌' },
  },
];

/**
 * Detect platform and extract username from a social URL.
 * Returns { platform, username } or null if unrecognized.
 */
export function parseSocialLink(url: string): { platform: SocialPlatform; username: string } | null {
  if (!url?.trim()) return null;

  const normalized = url.trim().replace(/\/$/, '');

  for (const { pattern, platform } of PLATFORMS) {
    if (pattern.test(normalized)) {
      // Extract the last path segment as the username
      const parts = normalized.split('/').filter(Boolean);
      const username = parts[parts.length - 1] ?? '';
      // Strip query strings / fragments
      const cleanUsername = username.split('?')[0].split('#')[0];
      return { platform, username: cleanUsername ? `@${cleanUsername}` : platform.name };
    }
  }

  // Unknown platform — show domain
  try {
    const domain = normalized.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    return {
      platform: { name: domain, color: '#8A857C', icon: 'link-outline', emoji: '🔗' },
      username: domain,
    };
  } catch {
    return null;
  }
}
