"use client";
import { useServerInsertedHTML } from "next/navigation";
import { StyleSheet } from "react-native";

export function StylesProvider({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    // @ts-expect-error - getSheet() is not in the TypeScript types but exists in react-native-web for SSR
    const sheet = StyleSheet.getSheet();
    return (
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: This is a valid use case
        dangerouslySetInnerHTML={{ __html: sheet.textContent }}
        id={sheet.id}
      />
    );
  });
  return <>{children}</>;
}
