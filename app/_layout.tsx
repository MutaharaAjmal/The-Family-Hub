import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { ThemeProvider } from "../src/constants/theme";
import Toast from "react-native-toast-message";
import { supabase } from "../src/api/supabase";
import { useEffect } from "react";
import {
  updatePushToken,
  requestNotificationPermissions,
} from "../src/utils/notifications";
import { PostHogProvider } from "posthog-react-native";
import { identifyUser, posthog } from "../src/utils/postHog";
import * as Sentry from "@sentry/react-native";
import { useURL } from "expo-linking";

Sentry.init({
  dsn: "https://5ed4bdd324475a5b1d8597f9e09652f8@o4511342991441920.ingest.us.sentry.io/4511342993473536",
});

export default function RootLayout() {
  const url = useURL();

  useEffect(() => {
    if (url && url.includes("reset-password")) {
      // Handle reset password
      const fragment = url.split("#")[1];
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get("access_token");
        if (accessToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: params.get("refresh_token") || "",
          });
        }
      }
    }
  }, [url]);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && event === "SIGNED_IN") {
        identifyUser(session.user.id, session.user.email ?? "");
        setTimeout(async () => {
          await updatePushToken(session.user.id, session.user.email ?? "");
        }, 3000);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        identifyUser(session.user.id, session.user.email ?? "");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && event === "SIGNED_IN") {
        identifyUser(session.user.id, session.user.email ?? "");
        setTimeout(async () => {
          await updatePushToken(session.user.id, session.user.email ?? "");
        }, 3000);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="ai_chat" />
            <Stack.Screen name="manange-categories" />
            <Stack.Screen name="family/setup" />
            <Stack.Screen name="family/create" />
            <Stack.Screen name="family/join" />
          </Stack>
          <Toast />
        </ThemeProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}
