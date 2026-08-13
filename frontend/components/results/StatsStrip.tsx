"use client";

import { motion, useReducedMotion } from "framer-motion";

import { fadeDuration, paneEase, stagger, staggerDelay } from "@/lib/motion";
import { FormResponse, Question, QuestionStat } from "@/lib/types";

import { QuestionInsight } from "./QuestionInsight";

export function StatsStrip({
  stats,
  questions,
  responses,
}: {
  stats: QuestionStat[];
  questions: Question[];
  responses: FormResponse[];
}) {
  const reduceMotion = useReducedMotion();
  if (!stats.length) return null;
  return (
    <motion.div
      className="stats"
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: staggerDelay } },
      }}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.question_id}
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0, transition: { duration: fadeDuration, ease: paneEase } },
          }}
        >
          <QuestionInsight
            stat={stat}
            question={questions.find((item) => item.id === stat.question_id)}
            responses={responses}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
