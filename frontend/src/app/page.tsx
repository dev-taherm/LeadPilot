import Link from "next/link";
import {
  Brain,
  Bot,
  BarChart3,
  CalendarCheck,
  Users,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Follow-Ups",
    description:
      "Automated, personalized responses that engage leads 24/7 — no lead left behind.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description:
      "Real-time insights into lead performance, conversion rates, and team productivity.",
  },
  {
    icon: CalendarCheck,
    title: "Meeting Booking",
    description:
      "AI schedules meetings directly into your calendar based on lead readiness.",
  },
  {
    icon: Users,
    title: "Lead Scoring",
    description:
      "Automatic qualification and prioritization so your team focuses on the hottest prospects.",
  },
];

const steps = [
  {
    number: 1,
    title: "Connect Your Leads",
    description: "Import leads from any source — CSV, CRM, API, or manual entry.",
  },
  {
    number: 2,
    title: "AI Engages Automatically",
    description:
      "Our agent scores, qualifies, and follows up with personalized messages.",
  },
  {
    number: 3,
    title: "Close More Deals",
    description:
      "Focus on hot leads while AI handles the rest. Watch your pipeline grow.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "29",
    description: "Perfect for solo founders and small teams getting started.",
    features: [
      "Up to 100 leads",
      "1 user",
      "Basic AI follow-ups",
      "Email notifications",
      "Dashboard analytics",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "79",
    description: "For growing teams that need more power and flexibility.",
    features: [
      "Up to 500 leads",
      "5 users",
      "Full AI agent access",
      "Calendar integration",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "199",
    description: "For organizations that need unlimited scale and customization.",
    features: [
      "Unlimited leads",
      "Unlimited users",
      "Custom AI models",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LeadFlow AI</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Zap className="h-4 w-4" />
              AI-Powered Lead Management
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Follow Up Smarter.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Close More Deals.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
              AI-powered lead management that automates follow-ups, scores leads,
              and books meetings — so your team can focus on closing.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-900/10">
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="ml-4 h-4 w-32 rounded bg-gray-200" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Total Leads", value: "2,847", color: "blue" },
                    { label: "Qualified", value: "1,293", color: "green" },
                    { label: "Meetings", value: "84", color: "purple" },
                    { label: "Conversion", value: "34%", color: "amber" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg bg-white p-4 shadow-sm"
                    >
                      <div className="text-sm text-gray-500">{stat.label}</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="col-span-2 rounded-lg bg-white p-4 shadow-sm">
                    <div className="mb-3 h-4 w-24 rounded bg-gray-200" />
                    <div className="space-y-2">
                      {[80, 65, 90, 45, 75, 60, 85].map((w, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-3 w-12 rounded bg-gray-100" />
                          <div className="h-2 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${w}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="mb-3 h-4 w-20 rounded bg-gray-200" />
                    <div className="space-y-3">
                      {["New", "Contacted", "Qualified", "Meeting"].map(
                        (s, i) => (
                          <div key={s} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-400" />
                            <div className="h-3 flex-1 rounded bg-gray-100" />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to convert leads
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Our AI agent handles the heavy lifting so your sales team can
              focus on building relationships and closing deals.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              No complex setup. No training required. Just add your leads and
              let our AI do the rest.
            </p>
          </div>
          <div className="relative mt-16">
            {/* Connector line */}
            <div className="absolute left-0 top-0 hidden h-full w-px bg-gray-200 lg:left-1/2 lg:block" />
            <div className="space-y-12 lg:space-y-0">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`relative lg:grid lg:grid-cols-2 lg:gap-12 lg:pb-16 ${
                    index === 0 ? "" : ""
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 z-10 hidden h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-sm font-bold text-white lg:flex">
                    {step.number}
                  </div>
                  <div
                    className={`${
                      index % 2 === 0
                        ? "lg:col-start-2 lg:pl-12"
                        : "lg:col-start-1 lg:pr-12 lg:text-right"
                    }`}
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white lg:hidden">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Start free. Upgrade when you&apos;re ready. No hidden fees.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.highlighted
                    ? "border-blue-600 bg-white shadow-xl shadow-blue-600/10"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? "text-blue-600" : "text-green-500"
                        }`}
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Enterprise" ? "#" : "/register"}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-blue-600 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Transform Your Lead Follow-Up?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Start your free trial today. No credit card required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                LeadFlow AI
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#features" className="hover:text-gray-900">
                Features
              </a>
              <a href="#pricing" className="hover:text-gray-900">
                Pricing
              </a>
              <Link href="/login" className="hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-gray-900">
                Register
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} LeadFlow AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
