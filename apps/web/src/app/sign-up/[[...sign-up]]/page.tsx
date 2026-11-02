import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md flex flex-col items-center">
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
