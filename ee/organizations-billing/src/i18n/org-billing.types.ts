import type { StripePlanKey } from "@scibly/db/plan-catalogue";
import type { SpendAction } from "@scibly/db/topup-catalogue";
import type { PlanCardCopy } from "../components/plan-card";

export type OrgBillingPage = {
  title: string;
  subtitle: string;
  /** The shell's banner, in two variants — the dated warning inside grace, and
   * what has and has not stopped after it. */
  paymentLapse: {
    grace: { title: string; description: string };
    lapsed: { title: string; description: string };
    billingLink: string;
  };
  allowanceWarning: {
    warning: { title: string; description: string };

    critical: { title: string; description: string };
    dismiss: string;

    topupLink: string;
    plansLink: string;
  };
  usage: {
    title: string;
    description: string;

    usedOfTotal: string;
    remaining: string;

    unlimited: string;

    allowanceLegend: string;

    topupLegend: string;

    topupLegendSpent: string;
    resetsAt: string;

    noReset: string;
  };
  breakdown: {
    title: string;
    description: string;
    byAuthorTab: string;
    byActionTab: string;
    creditsColumn: string;

    unattributed: string;

    otherAuthors: string;
    empty: string;
    total: string;

    topupNote: string;

    actions: Record<SpendAction, string>;
  };
  seats: {
    title: string;
    description: string;
    usedOfCapacity: string;
    included: string;

    none: string;

    pricePerSeat: string;
    vatNote: string;
    quantityLabel: string;
    buyButton: string;

    prorationNote: string;

    unavailableNote: string;

    purchaseSuccess: string;
    purchaseFailed: string;

    confirmTitle: string;
    confirmLoading: string;
    confirmFailed: string;

    confirmChargeNow: string;

    confirmRenewal: string;
    confirmRenewalNoDate: string;
    confirmAction: string;
    confirmActionPending: string;
    confirmCancel: string;
  };
  topup: {
    title: string;
    description: string;

    unavailableDescription: string;
    packCredits: string;
    packPrice: string;
    vatNote: string;
    buyButton: string;

    upgradeNote: string;
    checkoutFailed: string;
    purchaseConfirmed: string;

    purchasePending: string;
  };
  plan: {
    title: string;
    description: string;
    internalDescription: string;
    activeDescription: string;
    managePortalButton: string;
    checkoutFailed: string;
    portalFailed: string;
    mostPopularBadge: string;
    vatNote: string;
    byoaiLabel: string;
    /** One card per plan on sale — keyed by the catalogue, so putting a plan
     * on sale is a compile error here until it has been written about. */
    plans: Record<StripePlanKey, PlanCardCopy>;
  };
};
