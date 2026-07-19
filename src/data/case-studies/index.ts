import type { CaseStudy } from "./types";
import voiceFrontDesk from "./voice-front-desk";
import theaterBoxOffice from "./theater-box-office";
import regyPro from "./regy-pro";
import priceyPro from "./pricey-pro";
import reputationAgent from "./reputation-agent";
import aiChiefOfStaff from "./ai-chief-of-staff";

export type { CaseStudy, CaseStudyResult, CaseStudySolution } from "./types";

/** Ordered for the /work index page. */
export const caseStudies: CaseStudy[] = [
  voiceFrontDesk,
  theaterBoxOffice,
  regyPro,
  priceyPro,
  reputationAgent,
  aiChiefOfStaff,
];

export function getBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((caseStudy) => caseStudy.slug === slug);
}

export default caseStudies;
