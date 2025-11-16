import path from "node:path";
import type { NextConfig } from "next";
// Import env here to validate during build
import "./src/env";

const withWebpack: NextConfig = {
  webpack(config) {
    if (!config.resolve) {
      config.resolve = {};
    }

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native": "react-native-web",
      "react-native$": "react-native-web",
      "react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$":
        "react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter",
      "react-native/Libraries/vendor/emitter/EventEmitter$":
        "react-native-web/dist/vendor/react-native/emitter/EventEmitter",
      "react-native/Libraries/EventEmitter/NativeEventEmitter$":
        "react-native-web/dist/vendor/react-native/NativeEventEmitter",
    };

    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...(config.resolve?.extensions ?? []),
    ];

    return config;
  },
};

const withTurpopack: NextConfig = {
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      "react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$":
        "react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter",
      "react-native/Libraries/vendor/emitter/EventEmitter$":
        "react-native-web/dist/vendor/react-native/emitter/EventEmitter",
      "react-native/Libraries/EventEmitter/NativeEventEmitter$":
        "react-native-web/dist/vendor/react-native/NativeEventEmitter",
    },
    resolveExtensions: [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",

      ".js",
      ".mjs",
      ".tsx",
      ".ts",
      ".jsx",
      ".json",
      ".wasm",
    ],
    root: path.resolve(__dirname, "../.."),
  },
};

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false, // reanimated doesn't support this on web
  transpilePackages: [
    "react-native",
    "react-native-web",
    "solito",
    "react-native-reanimated",
    "moti",
    "react-native-gesture-handler",
  ],
  compiler: {
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  ...withWebpack,
  ...withTurpopack,
};

export default nextConfig;
