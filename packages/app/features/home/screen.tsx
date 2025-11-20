"use client";

import { Text, View } from "react-native";
import { TextLink } from "solito/link";

export function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        gap: 32,
      }}
    >
      <H1>Welcome to Solito.</H1>
      <View style={{ maxWidth: 600, gap: 16 }}>
        <Text style={{ textAlign: "center" }}>
          Here is a basic starter to show you how you can navigate from one
          screen to another. This screen uses the same code on Next.js and React
          Native.
        </Text>
        <Text style={{ textAlign: "center" }}>
          Solito is made by{" "}
          <TextLink
            href="https://twitter.com/fernandotherojo"
            rel="noreferrer"
            style={{ color: "blue" }}
            target="_blank"
          >
            Fernando Rojo
          </TextLink>
          .
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 32 }}>
        <TextLink
          href="/users/fernando"
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: "blue",
          }}
        >
          Link
        </TextLink>
      </View>
    </View>
  );
}

const H1 = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontWeight: "800", fontSize: 24 }}>{children}</Text>
);
