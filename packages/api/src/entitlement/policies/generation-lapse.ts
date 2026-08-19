import { GENERATIONS_LAPSED } from "../codes";
import { type Decision, type Refusal } from "../decision";
import { type ResolvedPlan } from "../policy";

// The one wording of "the subscription lapsed", shared by the judge below, the ingest precheck and the debit's own AppError.
export const lapsedRefusal = (): Refusal => ({
  applicationCode: GENERATIONS_LAPSED,
  message:
    "This organization's subscription has lapsed, so AI generations have stopped. Reactivate the subscription to generate again — everything already created stays where it is.",
  details: { reason: "lapsed" },
});

// A BYOAI turn skips the debit (not the entitlement), so this checks the lapse the debit would otherwise have caught.
export const judgeGenerationLapse = ({ lapsed }: ResolvedPlan): Decision =>
  lapsed ? { refusal: lapsedRefusal() } : { refusal: null };
