import PostHog from "posthog-react-native";

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

export const posthog = new PostHog(
  posthogApiKey,

  {
    host: "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
    personProfiles: "always",
    enableSessionReplay: true,
    sessionReplayConfig: {
      maskAllTextInputs: true,
      maskAllImages: true,
      captureLog: true,
      captureNetworkTelemetry: true,
    },
  },
);
posthog.debug(true);

export const identifyUser = (userId: string, email?: string) => {
  posthog.identify(userId, {
    email: email ?? "", // Agar undefined ho toh empty string bhej dega
    app_user_id: userId,
  });
};
