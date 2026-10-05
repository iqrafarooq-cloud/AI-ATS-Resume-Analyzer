import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>&copy; {new Date().getFullYear()} ResumePilot</p>
      </div>
    </footer>
  );
}
