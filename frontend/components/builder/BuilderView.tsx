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
  if (!builder.form) return <div className="loader">Loading your form…</div>;
  const question = builder.form.questions[builder.selected];

  return (
    <main className="builder">
      <BuilderHeader
        form={builder.form}
        tab={builder.tab}
        editors={builder.editors}
        current={builder.current}
        dirty={builder.dirty}
        onTab={builder.setTab}
        onTitle={(title) => builder.change({ title })}
        onSave={() => void builder.save()}
        onPublish={() => void builder.publish()}
        onCopyLink={() => void builder.copyLink()}
      />
      {builder.tab === "Build" && question && (
        <div className="buildbody">
          <div className="buildleft">
            <QuestionList
              questions={builder.form.questions}
              selected={builder.selected}
              onSelect={builder.setSelected}
              onReorder={builder.reorder}
              onAdd={() => builder.addQuestion()}
            />
            <QuestionTypePicker onAdd={builder.addQuestion} />
          </div>
          <BuilderCanvas
            question={question}
            index={builder.selected}
            total={builder.form.questions.length}
            accent={builder.form.theme.accent}
            onChange={builder.changeQuestion}
          />
          <QuestionEditor
            question={question}
            questions={builder.form.questions}
            selected={builder.selected}
            onChange={builder.changeQuestion}
            onReorder={builder.reorder}
            onRemove={builder.removeQuestion}
          />
        </div>
      )}
      {builder.tab === "Results" && <ResultsView id={id} questions={builder.form.questions} />}
      {builder.tab === "Settings" && (
        <>
          <SettingsView form={builder.form} onChange={builder.change} onSave={() => void builder.save()} />
          <ActivityLog events={builder.activity} />
        </>
      )}
      <Toast message={builder.toast} />
    </main>
  );
}
