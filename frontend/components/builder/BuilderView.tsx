"use client";

import { Toast } from "@/components/shared/Toast";
import { useBuilder } from "@/hooks/useBuilder";
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
  if (builder.error) {
    return (
      <div className="empty">
        <h2>Form unavailable</h2>
        <p>{builder.error}</p>
      </div>
    );
  }
  if (!builder.form) return <div className="loader">Loading your form…</div>;
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
        readOnly={readOnly}
        onTab={builder.setTab}
        onTitle={(title) => builder.change({ title })}
        onSave={() => void builder.save()}
        onPublish={() => void builder.publish()}
        onCopyLink={() => void builder.copyLink()}
      />
      <div className="buildswitch">
        {builder.tab === "Build" && question ? (
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
        ) : null}
        {builder.tab === "Results" ? <ResultsView id={id} questions={builder.form.questions} /> : null}
        {builder.tab === "Settings" ? (
          <>
            <SettingsView
              form={builder.form}
              readOnly={readOnly}
              onChange={builder.change}
              onSave={() => void builder.save()}
            />
            <ActivityLog events={builder.activity} />
          </>
        ) : null}
      </div>
      <Toast {...builder.toast} />
    </main>
  );
}
