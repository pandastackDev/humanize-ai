export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/50">
      <div className="container flex min-h-20 flex-col items-center justify-center gap-4 overflow-x-hidden px-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-6 md:h-16 md:px-6">
        <p className="text-muted-foreground text-xs sm:text-sm">
          Copyright © 2025 Humanize. All rights reserved.
        </p>
        <div className="flex items-center gap-4 sm:gap-6">
          <p className="text-muted-foreground text-xs sm:text-sm">
            social media links
          </p>
        </div>
      </div>
    </footer>
  );
}
