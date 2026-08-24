export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    currency: "usd",
    description: "For individuals exploring AI-assisted screening insights.",
    quotas: {
      predictionsPerMonth: 20,
      trainingsPerMonth: 2,
      maxDatasets: 1,
      maxDatasetRows: 10000
    },
    features: [
      "20 predictions / month",
      "2 model trainings / month",
      "1 dataset",
      "Community support"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    currency: "usd",
    description: "For clinicians and researchers who need volume and history.",
    quotas: {
      predictionsPerMonth: 1000,
      trainingsPerMonth: 50,
      maxDatasets: 10,
      maxDatasetRows: 1000000
    },
    features: [
      "1,000 predictions / month",
      "50 model trainings / month",
      "10 datasets (up to 1M rows)",
      "Full prediction history & reports",
      "Priority email support"
    ],
    popular: true
  },
  clinic: {
    id: "clinic",
    name: "Clinic",
    priceMonthly: 99,
    currency: "usd",
    description: "For teams and clinics running high-volume screening programs.",
    quotas: {
      predictionsPerMonth: 20000,
      trainingsPerMonth: 500,
      maxDatasets: 100,
      maxDatasetRows: 5000000
    },
    features: [
      "Unlimited-scale predictions",
      "500 model trainings / month",
      "100 datasets",
      "Admin panel & team management",
      "Audit-ready history exports",
      "Dedicated support"
    ]
  }
};

export const DEFAULT_PLAN = "free";

export function getPlan(id) {
  return PLANS[id] || PLANS[DEFAULT_PLAN];
}

export function publicPlans() {
  return Object.values(PLANS).map(({ id, name, priceMonthly, currency, description, features, popular }) => ({
    id, name, priceMonthly, currency, description, features, popular: Boolean(popular)
  }));
}
