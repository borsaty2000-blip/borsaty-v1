import { SignUp } from "@clerk/nextjs";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-6 group cursor-pointer whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-700 transition-colors">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Borsaty
          </span>
        </Link>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-emerald-600 hover:bg-emerald-700 text-sm font-bold text-white shadow-sm",
              card: "shadow-xl border border-slate-200 dark:border-slate-800 dark:bg-[#111827]",
              headerTitle: "text-slate-900 dark:text-white font-extrabold",
              headerSubtitle: "text-slate-500 dark:text-gray-400",
            },
          }}
        />
      </div>
    </div>
  );
}
