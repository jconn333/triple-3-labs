import type { Metadata } from "next";
import TakeoffPage from "./TakeoffPage";

export const metadata: Metadata = {
  title: "AI Construction Takeoff & Estimating Software | Triple 3 Labs",
  description:
    "AI-assisted quantity takeoff and estimating for any trade — every quantity traceable to the plan sheet and the versioned rule that produced it. Validated against real historical jobs before it touches a live bid.",
};

export default function Page() {
  return <TakeoffPage />;
}
