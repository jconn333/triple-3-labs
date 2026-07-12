"use client";

import { MotionConfig } from "framer-motion";

/**
 * Respects the visitor's "reduce motion" OS setting. When reduced motion is on,
 * framer-motion skips opacity/transform animations and renders elements at their
 * target (visible) state — so scroll-reveal sections never get stuck invisible.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
