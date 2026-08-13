"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Toast } from "@/components/shared/Toast";
import { useBuilder } from "@/hooks/useBuilder";
import { paneDuration, paneEase } from "@/lib/motion";
import { ResultsView } from "@/components/results/ResultsView";
import { SettingsView } from "@/components/settings/SettingsView";
import { ActivityLog } from "./ActivityLog";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderHeader } from "./BuilderHeader";
import { QuestionEditor } from "./QuestionEditor";
import { QuestionList } from "./QuestionList";
import { QuestionTypePicker } from "./QuestionTypePicker";

export function BuilderView({ id }: { id: string }) {
  const builder = useBuilder(id);
  const reduceMotion = useReducedMotion();
  const paneTransition = reduceMotion ? { duration: 0 } : { duration: paneDuration, ease: paneEase };
  if (builder.error) {
    return (
      <div className="empty">
        <h2>Form unavailable</h2>
        <p>{builder.error}</p>
      </div>
    );
  }
  if (!builder.form) {
    return (
      <main className="builder builder-skel" aria-busy="true" aria-label="Loading form">
        <header className="builderhead">
          <div className="builderid">
            <span className="skeleton skel-brand" />
            <span className="skeleton skel-title" />
          </div>
        </header>
        <div className="buildbody">
          <div className="buildleft">
            <aside className="questionlist">
              <span className="skeleton skel-line" />
              <span className="skeleton skel-line" />
              <span className="skeleton skel-line" />
              <span className="skeleton skel-line skel-short" />
            </aside>
          </div>
          <div className="canvas">
            <div className="canvasbody">
              <span className="skeleton skel-line skel-wide" />
              <span className="skeleton skel-block" />
            </div>
          </div>
          <aside className="qsettings">
            <span className="skeleton skel-line" />
            <span className="skeleton skel-line skel-short" />
            <span className="skeleton skel-block" />
          </aside>
        </div>
      </main>
    );
  }
  const question = builder.form.questions[builder.selected];
  const readOnly = builder.readOnly;

  return (
    <main className="builder">
      <BuilderHeader
        form={builder.form}
        tab={builder.tab}
        editors={builder.editors}
        current={builder.current}
        dirty={builder.dirty}
        saving={builder.saving}
        publishing={builder.publishing}
        readOnly={readOnly}
        onTab={builder.setTab}
        onTitle={(title) => builder.change({ title })}
        onSave={() => void builder.save()}
        onPublish={() => void builder.publish()}
        onCopyLink={() => void builder.copyLink()}
      />
      <div className="buildswitch">
        {question ? (
          <motion.div
            className={`buildpane${builder.tab === "Build" ? " is-on" : " is-off"}`}
            aria-hidden={builder.tab !== "Build"}
            initial={false}
            animate={{ opacity: builder.tab === "Build" ? 1 : 0, x: builder.tab === "Build" ? 0 : -12 }}
            transition={paneTransition}
          >
            <div className="buildbody">
              <div className="buildleft">
                <QuestionList
                  questions={builder.form.questions}
                  selected={builder.selected}
                  readOnly={readOnly}
                  onSelect={builder.setSelected}
                  onReorder={builder.reorder}
                  onAdd={() => builder.addQuestion()}
                />
                {readOnly ? null : <QuestionTypePicker onAdd={builder.addQuestion} />}
              </div>
              <BuilderCanvas
                question={question}
                index={builder.selected}
                total={builder.form.questions.length}
                accent={builder.form.theme.accent}
                thankYou={builder.form.theme.thankYou}
                readOnly={readOnly}
                onChange={builder.changeQuestion}
                onSelect={builder.setSelected}
              />
              <QuestionEditor
                question={question}
                questions={builder.form.questions}
                selected={builder.selected}
                readOnly={readOnly}
                onChange={builder.changeQuestion}
                onReorder={builder.reorder}
                onRemove={builder.removeQuestion}
              />
            </div>
          </motion.div>
        ) : null}
        <motion.div
          className={`buildpane${builder.tab === "Results" ? " is-on" : " is-off"}`}
          aria-hidden={builder.tab !== "Results"}
          initial={false}
          animate={{ opacity: builder.tab === "Results" ? 1 : 0, x: builder.tab === "Results" ? 0 : 12 }}
          transition={paneTransition}
        >
          <ResultsView
            key={id}
            id={id}
            questions={builder.form.questions}
            seed={builder.results}
            live={builder.tab === "Results"}
          />
        </motion.div>
        <motion.div
          className={`buildpane${builder.tab === "Settings" ? " is-on" : " is-off"}`}
          aria-hidden={builder.tab !== "Settings"}
          initial={false}
          animate={{ opacity: builder.tab === "Settings" ? 1 : 0, x: builder.tab === "Settings" ? 0 : 12 }}
          transition={paneTransition}
        >
          <SettingsView
            form={builder.form}
            readOnly={readOnly}
            onChange={builder.change}
            onSave={() => void builder.save()}
          />
          <ActivityLog events={builder.activity} />
        </motion.div>
      </div>
      <Toast {...builder.toast} />
    </main>
  );
}
