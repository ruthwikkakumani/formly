"use client";

import { useRespondent } from "@/hooks/useRespondent";
import { ProgressBar } from "./ProgressBar";
import { QuestionScreen } from "./QuestionScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { WelcomeScreen } from "./WelcomeScreen";

export function PublicFormView({ slug }: { slug: string }) {
  const flow = useRespondent(slug);
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
        <h1>{flow.error || "This form is not available"}</h1>
      </main>
    );
  }

  return (
    <main className="public" style={style}>
      {flow.step === "question" && flow.question && (
        <>
          <ProgressBar current={flow.index} total={flow.form.questions.length} accent={theme.accent} />
          <div className="publictop">
            <span>
              {flow.index + 1} of {flow.form.questions.length}
            </span>
          </div>
          <QuestionScreen
            question={flow.question}
            index={flow.index}
            total={flow.form.questions.length}
            value={flow.question.id ? flow.answers[flow.question.id] || "" : ""}
            error={flow.error}
            slug={slug}
            direction={flow.direction}
            onChange={flow.setAnswer}
            onNext={flow.advance}
          />
        </>
      )}
      {flow.step === "welcome" && <WelcomeScreen form={flow.form} onStart={flow.advance} />}
      {flow.step === "thanks" && <ThankYouScreen form={flow.form} />}
    </main>
  );
}
