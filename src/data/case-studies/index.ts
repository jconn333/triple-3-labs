import type { CaseStudy } from "./types";
import voiceFrontDesk from "./voice-front-desk";
import theaterBoxOffice from "./theater-box-office";
import regyPro from "./regy-pro";
import priceyPro from "./pricey-pro";
import reputationAgent from "./reputation-agent";
import aiChiefOfStaff from "./ai-chief-of-staff";
import pingo from "./pingo";
import zendini from "./zendini";
import spendaroo from "./spendaroo";
import otto from "./otto";
import seoAgent from "./seo-agent";
import pilotBilling from "./pilot-billing";
import takeoffEstimator from "./takeoff-estimator";

export type { CaseStudy, CaseStudyResult, CaseStudySolution } from "./types";

/** Ordered for the /work index page. */
export const caseStudies: CaseStudy[] = [
  voiceFrontDesk,
  theaterBoxOffice,
  regyPro,
  priceyPro,
  reputationAgent,
  aiChiefOfStaff,
  pingo,
  zendini,
  spendaroo,
  otto,
  seoAgent,
  pilotBilling,
  takeoffEstimator,
];

export function getBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((caseStudy) => caseStudy.slug === slug);
}

export default caseStudies;
