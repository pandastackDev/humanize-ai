export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/50">
      <div className="container flex h-20 flex-col items-center justify-between gap-4 overflow-x-hidden px-4 py-6 md:h-16 md:flex-row md:px-6">
        <p className="text-sm text-muted-foreground">
          Copyright © 2025 Humanize. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <p className="text-sm text-muted-foreground">social media links</p>
        </div>
      </div>
    </footer>
  );
}
