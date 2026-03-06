"use client";

import { LogoIcon, LogoIconAlt, LogoIconMinimal } from "@/components/Logo";

export default function LogoPreview() {
  return (
    <div className="min-h-screen bg-[#030014] px-8 py-20">
      <h1
        className="mb-16 text-center text-4xl font-bold text-white"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        Logo Concepts
      </h1>

      <div className="mx-auto grid max-w-5xl gap-16">
        {/* Concept A — Cascading 3s */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12">
          <h2 className="mb-2 text-lg font-semibold text-white/70">
            Concept A — Cascading 3s
          </h2>
          <p className="mb-8 text-sm text-white/40">
            Three &quot;3&quot;s layered with depth, back-to-front with
            increasing opacity and gradient shift.
          </p>
          <div className="flex items-center gap-12">
            <LogoIcon size={120} />
            <div className="flex items-center gap-3">
              <LogoIcon size={40} />
              <span className="text-2xl font-bold tracking-tight text-white">
                Triple 3{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Labs
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LogoIcon size={28} />
              <span className="text-base font-bold tracking-tight text-white">
                Triple 3{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Labs
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Concept B — Abstract Curves */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12">
          <h2 className="mb-2 text-lg font-semibold text-white/70">
            Concept B — Abstract Curves
          </h2>
          <p className="mb-8 text-sm text-white/40">
            Geometric strokes forming an abstract &quot;3&quot; shape with
            flowing curves. A single continuous form suggesting the triple 3.
          </p>
          <div className="flex items-center gap-12">
            <LogoIconAlt size={120} />
            <div className="flex items-center gap-3">
              <LogoIconAlt size={40} />
              <span className="text-2xl font-bold tracking-tight text-white">
                Triple 3{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Labs
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LogoIconAlt size={28} />
              <span className="text-base font-bold tracking-tight text-white">
                Triple 3{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Labs
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Concept C — Bold 333 */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12">
          <h2 className="mb-2 text-lg font-semibold text-white/70">
            Concept C — Bold 333
          </h2>
          <p className="mb-8 text-sm text-white/40">
            Clean and direct — &quot;333&quot; in bold gradient type with a
            gradient border frame. Maximum recognition.
          </p>
          <div className="flex items-center gap-12">
            <LogoIconMinimal size={120} />
            <div className="flex items-center gap-3">
              <LogoIconMinimal size={40} />
              <span className="text-2xl font-bold tracking-tight text-white">
                Triple 3{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Labs
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LogoIconMinimal size={28} />
              <span className="text-base font-bold tracking-tight text-white">
                Triple 3{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Labs
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
