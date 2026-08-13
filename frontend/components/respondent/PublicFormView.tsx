"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useRespondent } from "@/hooks/useRespondent";
import { paneEase, slideDuration } from "@/lib/motion";
import { ProgressBar } from "./ProgressBar";
import { QuestionScreen } from "./QuestionScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { WelcomeScreen } from "./WelcomeScreen";

const slide = {
  enter: (dir: "up" | "down") => ({ y: dir === "up" ? "100%" : "-100%" }),
  center: { y: 0 },
  exit: (dir: "up" | "down") => ({ y: dir === "up" ? "-100%" : "100%" }),
};

export function PublicFormView({ slug }: { slug: string }) {
  const flow = useRespondent(slug);
  const reduceMotion = useReducedMotion();
  const theme = flow.form?.theme || {};
  const dark = Boolean(theme.darkMode);
  const style = flow.form
    ? {
        background: dark ? "#1e1e20" : theme.background,
        color: dark ? "#f7f6f3" : theme.color,
        fontFamily: `"${theme.font || "DM Sans"}", "DM Sans", sans-serif`,
        ["--accent" as string]: theme.accent || "#0445af",
      }
    : undefined;
  const transition = reduceMotion ? { duration: 0 } : { duration: slideDuration, ease: paneEase };

  if (flow.step === "loading") {
    return (
      <main className="public">
        <div className="loadingdot" />
      </main>
    );
  }

  if (flow.step === "error" || !flow.form) {
    return (
      <main className="public error">
        <h1>{flow.error || "This form isn't available"}</h1>
      </main>
    );
  }

  const screenKey =
    flow.step === "question" ? `q-${flow.question?.id ?? flow.index}` : flow.step;

  return (
    <main className="public" style={style}>
      {flow.step === "question" && flow.form ? (
        <>
          <ProgressBar current={flow.index} total={flow.form.questions.length} accent={theme.accent} />
          <div className="publictop">
            <span>
              {flow.index + 1} of {flow.form.questions.length}
            </span>
          </div>
        </>
      ) : null}
      <div className="public-stage">
        <AnimatePresence initial={false} custom={flow.direction}>
          {flow.step === "welcome" ? (
            <motion.div
              key={screenKey}
              className="public-screen"
              custom={flow.direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <WelcomeScreen form={flow.form} onStart={flow.advance} />
            </motion.div>
          ) : null}
          {flow.step === "question" && flow.question ? (
            <motion.div
              key={screenKey}
              className="public-screen"
              custom={flow.direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <QuestionScreen
                question={flow.question}
                index={flow.index}
                value={flow.question.id ? flow.answers[flow.question.id] || "" : ""}
                error={flow.error}
                slug={slug}
                onChange={flow.setAnswer}
                onNext={flow.advance}
                onBack={flow.back}
              />
            </motion.div>
          ) : null}
          {flow.step === "thanks" ? (
            <motion.div
              key={screenKey}
              className="public-screen"
              custom={flow.direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <ThankYouScreen form={flow.form} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
