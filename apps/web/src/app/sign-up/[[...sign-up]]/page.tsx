import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import Logo from "@/components/branding/Logo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-6 group cursor-pointer whitespace-nowrap" aria-label="Borsaty Home">
          <Logo variant="primary" size={36} showText={true} className="dark:hidden" />
          <Logo variant="white" size={36} showText={true} className="hidden dark:block" />
        </Link>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-[#0A0A0A] hover:bg-slate-900 text-sm font-bold text-white shadow-sm border border-slate-800",
              card: "shadow-xl border border-slate-200 dark:border-slate-800 dark:bg-[#0B1120]",
              headerTitle: "text-slate-900 dark:text-white font-extrabold",
              headerSubtitle: "text-slate-500 dark:text-gray-400",
            },
          }}
        />
      </div>
    </div>
  );
}
