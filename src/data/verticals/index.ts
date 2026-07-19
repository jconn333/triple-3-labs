import type { VerticalConfig } from "./types";
import realEstate from "./real-estate";
import hospitality from "./hospitality";
import homeServices from "./home-services";

const verticals: Record<string, VerticalConfig> = {
  "real-estate": realEstate,
  hospitality: hospitality,
  "home-services": homeServices,
};

export function getVertical(slug: string): VerticalConfig | undefined {
  return verticals[slug];
}

export function getVerticalSlugs(): string[] {
  return Object.keys(verticals);
}
