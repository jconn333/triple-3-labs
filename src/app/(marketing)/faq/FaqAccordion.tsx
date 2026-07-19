"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { FaqCategory } from "./page";

export default function FaqAccordion({
  categories,
}: {
  categories: FaqCategory[];
}) {
  const [openId, setOpenId] = useState<string | null>(
    categories[0]?.items[0]?.id ?? null
  );

  return (
    <div className="space-y-14">
      {categories.map((category, categoryIndex) => (
        <motion.div
          key={category.category}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: categoryIndex * 0.05 }}
        >
          <h2
            className="mb-5 text-xl font-bold tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {category.category}
          </h2>

          <div className="glass-card divide-y divide-white/[0.06] rounded-2xl">
            {category.items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="px-6">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-base font-medium text-white/90 sm:text-lg">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-violet-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-sm leading-relaxed text-white/50 sm:text-base">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
