"use client";

export function DynamicBackground({ children }: { children: React.ReactNode }) {
  return (
    <div 
      style={{ 
        backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)"
      }}
    >
      {children}
    </div>
  );
}
