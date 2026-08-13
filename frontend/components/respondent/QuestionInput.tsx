"use client";

import { choiceOptions, paymentAmount } from "@/lib/constants";
import { publicFormsApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { Question } from "@/lib/types";

export function QuestionInput({
  question,
  value,
  slug,
  onChange,
  onCommit,
}: {
  question: Question;
  value: string;
  slug: string;
  onChange: (value: string) => void;
  onCommit?: () => void;
}) {
  if (question.type === "payment") {
    const pay = paymentAmount(question);
    const paid = value.startsWith("Paid");
    return (
      <div className="paybox">
        <p className="payamount">
          {pay.currency} {pay.amount}
        </p>
        {paid ? (
          <p>✓ Payment recorded</p>
        ) : (
          <button
            className="ok"
            type="button"
            onClick={() => {
              onChange(`Paid ${pay.currency} ${pay.amount}`);
              window.setTimeout(() => onCommit?.(), 220);
            }}
          >
            Pay {pay.currency} {pay.amount}
          </button>
        )}
      </div>
    );
  }

  if (question.type === "file_upload") {
    return (
      <div className="upload">
        <input
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              onChange(await publicFormsApi.upload(slug, file));
            } catch (err) {
              onChange("");
              window.alert(messageFromUnknown(err, MESSAGES.uploadFailed));
            }
          }}
        />
        {value && <p>✓ File attached</p>}
      </div>
    );
  }

  if (question.type === "long_text") {
    return <textarea autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type your answer here…" />;
  }

  if (question.type === "multiple_choice" || question.type === "yes_no") {
    return (
      <div className="publicchoices">
        {choiceOptions(question).map((option, index) => (
          <button
            className={value === option ? "chosen" : ""}
            onClick={() => {
              onChange(option);
              window.setTimeout(() => onCommit?.(), 220);
            }}
            key={option}
          >
            <b>{String.fromCharCode(65 + index)}</b>
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "dropdown") {
    return (
      <select autoFocus value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose an answer</option>
        {question.options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "rating") {
    return (
      <div className="rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            className={Number(value) >= star ? "chosen" : ""}
            onClick={() => {
              onChange(String(star));
              window.setTimeout(() => onCommit?.(), 220);
            }}
            key={star}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  return (
    <input
      autoFocus
      type={question.type === "email" ? "email" : question.type === "number" ? "number" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type your answer here…"
    />
  );
}
