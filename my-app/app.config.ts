import type { ConfigContext } from 'expo/config';

declare const process: {
  env: Record<string, string | undefined>;
};

export default ({ config }: ConfigContext) => {
  const androidApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const iosApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY?.trim();

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-maps',
        {
          ...(androidApiKey ? { androidGoogleMapsApiKey: androidApiKey } : {}),
          ...(iosApiKey ? { iosGoogleMapsApiKey: iosApiKey } : {}),
        },
      ],
    ],
    extra: {
      ...config.extra,
      googleMapsConfigured: {
        android: Boolean(androidApiKey),
        ios: Boolean(iosApiKey),
      },
    },
  };
};
