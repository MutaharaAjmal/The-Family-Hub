import { ConfigContext, ExpoConfig } from "expo/config";

// Variant check karne ke liye process.env use karein
const IS_DEV = process.env.EXPO_PUBLIC_APP_VARIANT === "development";
const IS_STG = process.env.EXPO_PUBLIC_APP_VARIANT === "staging";

console.log("IS_DEV", IS_DEV);

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    // return "com.mutaharaduaa.familytodo.dev";
    return "com.familyhub.dev";
  } else if (IS_STG) {
    // return "com.mutaharaduaa.familytodo.stg";
    return "com.staging.familyhub";
  } else {
    // return "com.mutaharaduaa.familytodo";
    // return "com.familyhub.app";
    return "com.devsoul.familyhub.app";
  }
};

const getAppName = () => {
  if (IS_DEV) {
    return "Family Hub(Dev)";
  } else if (IS_STG) {
    return "Family Hub(test)";
  } else {
    return "The Family Hub";
  }
};

const getGoogleServicesFile = () => {
  if (IS_DEV) {
    return "./google-services-dev.json";
  } else if (IS_STG) {
    return "./google-services-stg.json";
  } else {
    return "./google-services.json";
  }
};
const geminiKey = process.env.EXPO_PUBLIC_GEMINIAPI_KEY;
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
// const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`;
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "family-todo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/family-logo.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  scheme: "family-todo",

  splash: {
    image: "./assets/new.jpg",
    resizeMode: "cover",
    // backgroundColor: "#1E3A8A",
    backgroundColor: "#3C6E9F",
    // height: "100%",
    // width: "100%",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
  },

  android: {
    package: getUniqueIdentifier(),
    googleServicesFile: getGoogleServicesFile(),
    adaptiveIcon: {
      foregroundImage: "./assets/family-logo.png",
      backgroundColor: "#ffffff",
    },
    intentFilters: [
      {
        action: "VIEW",
        data: {
          scheme: "family-todo",
          host: "reset-password",
        },
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    permissions: [
      "NOTIFICATIONS",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
    ],
    edgeToEdgeEnabled: true,
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "@sentry/react-native",
      {
        organization: "devsoul-7n",
        project: "react-native",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow FamilyHub to see your bills",
        cameraPermission: "Allow FamilyHub to take bill photos",
      },
    ],
    [
      "expo-notifications",
      {
        color: "#1E3A8A",
      },
    ],
    "@react-native-community/datetimepicker",
    "expo-web-browser",
    "expo-localization",
  ],

  extra: {
    ...config.extra,
    eas: {
      projectId: "681dc982-cad2-40c2-9cdb-98dfb5ab8d1b",
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    geminiKey: process.env.EXPO_PUBLIC_GEMINIAPI_KEY,
    geminiUrl: geminiUrl,
    variant: process.env.EXPO_PUBLIC_APP_VARIANT,
  },

  owner: "mutaharaduaa",
});
