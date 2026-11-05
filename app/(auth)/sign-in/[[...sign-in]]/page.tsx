import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { StructaLogoBadge } from "@/components/shared/StructaLogo";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      {/* Top utility bar with logo and ThemeToggle */}
      <div className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <StructaLogoBadge size="md" className="group-hover:scale-105" />
          <span className="font-heading font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
            Structa
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full flex justify-center pt-8">
        <SignIn
          routing="path"
          path="/sign-in"
          appearance={{
            variables: {
              colorPrimary: "var(--primary)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorForeground: "var(--foreground)",
              colorMutedForeground: "var(--muted-foreground)",
              colorBackground: "var(--card)",
              colorInput: "var(--background)",
              colorInputForeground: "var(--foreground)",
              borderRadius: "0.5rem",
            },
          }}
        />
      </div>
    </div>
  );
}
