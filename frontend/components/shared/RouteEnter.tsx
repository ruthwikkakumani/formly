"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { fadeDuration, paneEase } from "@/lib/motion";

export function RouteEnter({ children }: { children: ReactNode }) {
  const path = usePathname();
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      key={path}
      className="route-enter"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: fadeDuration, ease: paneEase }}
    >
      {children}
    </motion.div>
  );
}
