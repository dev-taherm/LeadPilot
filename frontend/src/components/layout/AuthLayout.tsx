import type { ReactNode } from "react";
import { Brain } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-white">LeadFlow AI</span>
        </div>

        <p className="max-w-md text-center text-lg text-blue-100">
          AI-powered lead management that helps you close more deals, faster.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-6 text-sm text-blue-100">
          {[
            "Automated lead scoring",
            "Smart conversation routing",
            "AI-driven follow-ups",
            "Real-time analytics",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-300" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
