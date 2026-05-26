import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/api/supabase";
import { CustomLoader } from "../src/components/customLoader";
import { useAppStore } from "../src/store/useAppStore"; // ✅ Store import karein

export default function Index() {
  const router = useRouter();
  const setAuth = useAppStore((state) => state.setAuth); // ✅ setAuth action lein

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          setAuth(profile.family_id || null, profile);
          profile.family_id
            ? router.replace("/(tabs)")
            : router.replace("/family/setup");
        } else {
          router.replace("/family/setup");
        }
      } else {
        router.replace("/(auth)/loginSignup");
      }
    };
    checkUser();
  }, []); // Dependency empty rakhein taake sirf ek baar chale
  return (
    <View style={styles.container}>
      <CustomLoader size={100} color="#1E3A8A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
