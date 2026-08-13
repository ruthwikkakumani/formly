"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();
  const [f, setF] = useState<any>();
  const [n, setN] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [err, setErr] = useState("");
  const [visitorId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    fetch(`${API}/public/${slug}`).then(async (r) =>
      r.ok ? setF(await r.json()) : setErr("This form is not available"),
    );
  }, [slug]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (["Enter", "ArrowRight", "ArrowDown"].includes(e.key) && n >= 0) {
        e.preventDefault();
        next();
      }
      if (["ArrowLeft", "ArrowUp"].includes(e.key) && n > 0) {
        e.preventDefault();
        setN(n - 1);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  if (err)
    return (
      <main className="public error">
        <h1>{err}</h1>
      </main>
    );
  if (!f)
    return (
      <main className="public">
        <div className="loadingdot" />
      </main>
    );
  if (n === -1)
    return (
      <main
        className="public"
        style={{ background: f.theme.darkMode ? "#1e1e20" : f.theme.background, color: f.theme.darkMode ? "#f7f7f4" : f.theme.color }}
      >
        <div className="welcome">
          <p className="brand">
            formly<span>•</span>
          </p>
          <h1>{f.title}</h1>
          <p>{f.description}</p>
          <button onClick={() => setN(0)}>
            Start <kbd>↵</kbd>
          </button>
        </div>
      </main>
    );
  if (n === f.questions.length)
    return (
      <main
        className="public"
        style={{ background: f.theme.darkMode ? "#1e1e20" : f.theme.background, color: f.theme.darkMode ? "#f7f7f4" : f.theme.color }}
      >
        <div className="welcome thanks">
          <div>✓</div>
          <h1>Thank you!</h1>
          <p>{f.theme.thankYou || "Your response has been submitted."}</p>
        </div>
      </main>
    );
  let q = f.questions[n];
  function set(v: string) {
    const nextAnswers = { ...answers, [q.id]: v };
    setAnswers(nextAnswers);
    setErr("");
    void fetch(`${API}/public/${slug}/partial`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitor_id: visitorId, answers: nextAnswers }) });
  }
  async function next() {
    let v = answers[q.id] || "";
    if (q.required && !v) {
      setErr("Please answer this question to continue.");
      return;
    }
    if (q.type === "email" && v && !/^\S+@\S+\.\S+$/.test(v)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (q.type === "number" && v && isNaN(Number(v))) {
      setErr("Please enter a number.");
      return;
    }
    const jumpTo = q.logic?.option === v && q.logic?.target !== "" && q.logic?.target !== undefined ? Number(q.logic.target) : n + 1;
    if (jumpTo < f.questions.length) {
      setN(jumpTo);
      return;
    }
    const r = await fetch(`${API}/public/${slug}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id: visitorId,
        answers: Object.entries(answers).map(([question_id, value]) => ({
          question_id: Number(question_id),
          value,
        })),
      }),
    });
    if (r.ok) setN(f.questions.length);
    else setErr((await r.json()).detail || "Something went wrong");
  }
  return (
    <main
      className="public"
      style={{ background: f.theme.darkMode ? "#1e1e20" : f.theme.background, color: f.theme.darkMode ? "#f7f7f4" : f.theme.color }}
    >
      <div className="progress">
        <i style={{ width: `${((n + 1) / f.questions.length) * 100}%` }} />
      </div>
      <div className="publictop">
        <span>
          {n + 1} of {f.questions.length}
        </span>
        <span>Powered by formly</span>
      </div>
      <div className="ask" key={q.id}>
        <h1>
          <em>{n + 1} →</em>
          {q.title}
          {q.required && <sup>*</sup>}
        </h1>
        {q.description && <p>{q.description}</p>}
        <QuestionInput q={q} value={answers[q.id] || ""} set={set} slug={slug} />
        {err && <div className="validation">{err}</div>}
        <button className="ok" onClick={next}>
          OK <kbd>↵</kbd>
        </button>
        <small>press Enter ↵ or use arrow keys</small>
      </div>
    </main>
  );
}
function QuestionInput({
  q,
  value,
  set,
  slug,
}: {
  q: any;
  value: string;
  set: (x: string) => void;
  slug: string;
}) {
  if (q.type === "file_upload") return <div className="upload"><input type="file" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; const data = new FormData(); data.append("file", file); const response = await fetch(`${API}/public/${slug}/upload`, { method: "POST", body: data }); if (response.ok) { const uploaded = await response.json(); set(uploaded.url); } }} />{value && <p>✓ File attached</p>}</div>;
  if (q.type === "long_text")
    return (
      <textarea autoFocus value={value} onChange={(e) => set(e.target.value)} />
    );
  if (q.type === "multiple_choice" || q.type === "yes_no")
    return (
      <div className="publicchoices">
        {(q.type === "yes_no" ? ["Yes", "No"] : q.options).map(
          (x: string, i: number) => (
            <button
              className={value === x ? "chosen" : ""}
              onClick={() => set(x)}
              key={x}
            >
              <b>{String.fromCharCode(65 + i)}</b>
              {x}
            </button>
          ),
        )}
      </div>
    );
  if (q.type === "dropdown")
    return (
      <select autoFocus value={value} onChange={(e) => set(e.target.value)}>
        <option value="">Choose an answer</option>
        {q.options.map((x: string) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    );
  if (q.type === "rating")
    return (
      <div className="rating">
        {[1, 2, 3, 4, 5].map((x) => (
          <button
            className={Number(value) >= x ? "chosen" : ""}
            onClick={() => set(String(x))}
            key={x}
          >
            ★
          </button>
        ))}
      </div>
    );
  return (
    <input
      autoFocus
      type={
        q.type === "email" ? "email" : q.type === "number" ? "number" : "text"
      }
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder="Type your answer here…"
    />
  );
}
