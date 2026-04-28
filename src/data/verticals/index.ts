import type { VerticalConfig } from "./types";
import realEstate from "./real-estate";

const verticals: Record<string, VerticalConfig> = {
  "real-estate": realEstate,
};

export function getVertical(slug: string): VerticalConfig | undefined {
  return verticals[slug];
}

export function getVerticalSlugs(): string[] {
  return Object.keys(verticals);
}
