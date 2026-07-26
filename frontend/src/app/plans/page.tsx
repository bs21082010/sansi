import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    features: ["100 API requests/hour", "Basic corpus access", "Flashcards", "Community access"],
    tier: "free",
  },
  {
    name: "Basic",
    monthly: 199,
    yearly: 1999,
    features: ["1,000 API requests/hour", "Full corpus access", "Premium flashcards", "Tutor marketplace", "Badge rewards"],
    tier: "basic",
    popular: true,
  },
  {
    name: "Pro",
    monthly: 499,
    yearly: 4999,
    features: ["10,000 API requests/hour", "Priority support", "AI tutor unlimited", "Course bundles", "Developer portal"],
    tier: "pro",
  },
  {
    name: "Enterprise",
    monthly: 1999,
    yearly: 19999,
    features: ["100,000 API requests/hour", "Dedicated support", "Custom models", "Revenue share portal", "SLA guarantee"],
    tier: "enterprise",
  },
]

export default function PlansPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Pricing Plans</h1>
        <p className="mt-2 text-lg text-gray-600">Choose the right plan for your learning or development needs</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-lg ${
              plan.popular ? "border-sansi-500 ring-2 ring-sansi-200" : ""
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sansi-600 px-4 py-1 text-xs font-medium text-white">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <p className="mt-4">
              <span className="text-4xl font-bold">₹{plan.monthly}</span>
              <span className="text-sm text-gray-500">/mo</span>
            </p>
            {plan.yearly > 0 && (
              <p className="text-sm text-gray-500">₹{plan.yearly}/year (save ~{Math.round((1 - plan.yearly / (plan.monthly * 12)) * 100)}%)</p>
            )}
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sansi-600" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-8 w-full rounded-lg py-2 text-sm font-medium ${
                plan.tier === "free"
                  ? "border bg-gray-50 text-gray-700 hover:bg-gray-100"
                  : "bg-sansi-600 text-white hover:bg-sansi-700"
              }`}
            >
              {plan.tier === "free" ? "Current Plan" : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
