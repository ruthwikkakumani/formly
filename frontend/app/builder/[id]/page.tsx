"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const types = [
  ["short_text", "Short text"],
  ["long_text", "Long text"],
  ["multiple_choice", "Multiple choice"],
  ["dropdown", "Dropdown"],
  ["email", "Email"],
  ["number", "Number"],
  ["yes_no", "Yes / No"],
  ["rating", "Rating"],
];
export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const [f, setF] = useState<any>();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState("Build");
  const [toast, setToast] = useState("");
  useEffect(() => {
    fetch(`${API}/forms/${id}`)
      .then((r) => r.json())
      .then(setF);
  }, [id]);
  if (!f) return <div className="loader">Loading your form…</div>;
  const q = f.questions[selected];
  const change = (key: string, val: any) => setF({ ...f, [key]: val });
  const changeQ = (key: string, val: any) => {
    const qs = [...f.questions];
    qs[selected] = { ...q, [key]: val };
    change("questions", qs);
  };
  const add = (type = "short_text") => {
    const qs = [
      ...f.questions,
      {
        type,
        title: "Your question here",
        description: "",
        required: false,
        options:
          type === "multiple_choice" || type === "dropdown"
            ? ["Option 1", "Option 2"]
            : [],
      },
    ];
    change("questions", qs);
    setSelected(qs.length - 1);
  };
  const remove = () => {
    if (f.questions.length === 1) return;
    const qs = f.questions.filter((_: any, i: number) => i !== selected);
    change("questions", qs);
    setSelected(Math.max(0, selected - 1));
  };
  const move = (dir: number) => {
    let to = selected + dir;
    if (to < 0 || to >= f.questions.length) return;
    let qs = [...f.questions];
    [qs[selected], qs[to]] = [qs[to], qs[selected]];
    change("questions", qs);
    setSelected(to);
  };
  async function save() {
    const r = await fetch(`${API}/forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setF(await r.json());
    setToast("All changes saved");
    setTimeout(() => setToast(""), 2000);
  }
  async function publish() {
    const r = await fetch(`${API}/forms/${id}/publish`, { method: "POST" });
    setF(await r.json());
    setToast(f.status === "draft" ? "Your form is live!" : "Form unpublished");
    setTimeout(() => setToast(""), 2500);
  }
  return (
    <main className="builder">
      <header className="builderhead">
        <Link href="/" className="brand">
          formly<span>•</span>
        </Link>
        <input
          value={f.title}
          onChange={(e) => change("title", e.target.value)}
          className="titleinput"
        />
        <nav>
          {["Build", "Results", "Settings"].map((x) => (
            <button
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
        <button className="save" onClick={save}>
          Save
        </button>
        <button className="primary" onClick={publish}>
          {f.status === "draft" ? "Publish" : "Unpublish"}
        </button>
      </header>
      {tab === "Build" ? (
        <div className="buildbody">
          <aside className="questionlist">
            <p>CONTENT</p>
            {f.questions.map((x: any, i: number) => (
              <button
                key={i}
                className={selected === i ? "selected" : ""}
                onClick={() => setSelected(i)}
              >
                <small>{i + 1}</small>
                <span>{x.title || "Untitled question"}</span>
              </button>
            ))}
            <button className="addline" onClick={() => add()}>
              ＋ Add question
            </button>
          </aside>
          <section className="editor">
            <div className="qnumber">
              QUESTION {selected + 1} OF {f.questions.length}
            </div>
            <select
              value={q.type}
              onChange={(e) => changeQ("type", e.target.value)}
            >
              {types.map((t) => (
                <option value={t[0]} key={t[0]}>
                  {t[1]}
                </option>
              ))}
            </select>
            <textarea
              className="questiontitle"
              value={q.title}
              onChange={(e) => changeQ("title", e.target.value)}
              placeholder="Type your question"
            />
            <textarea
              className="description"
              value={q.description}
              onChange={(e) => changeQ("description", e.target.value)}
              placeholder="Add a description (optional)"
            />
            {["multiple_choice", "dropdown"].includes(q.type) && (
              <div className="options">
                {q.options.map((o: string, i: number) => (
                  <input
                    key={i}
                    value={o}
                    onChange={(e) => {
                      let a = [...q.options];
                      a[i] = e.target.value;
                      changeQ("options", a);
                    }}
                  />
                ))}
                <button
                  onClick={() =>
                    changeQ("options", [
                      ...q.options,
                      `Option ${q.options.length + 1}`,
                    ])
                  }
                >
                  ＋ Add option
                </button>
              </div>
            )}
            <div className="editbottom">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => changeQ("required", e.target.checked)}
                />
                <i /> Required
              </label>
              <div>
                <button onClick={() => move(-1)}>↑</button>
                <button onClick={() => move(1)}>↓</button>
                <button className="danger" onClick={remove}>
                  Delete
                </button>
              </div>
            </div>
          </section>
          <aside className="typepicker">
            <p>ADD A QUESTION</p>
            {types.map((t) => (
              <button onClick={() => add(t[0])} key={t[0]}>
                <b>{t[1][0]}</b>
                {t[1]}
              </button>
            ))}
          </aside>
          <section className="preview">
            <p>LIVE PREVIEW</p>
            <div className="phone">
              <small>{selected + 1} →</small>
              <h3>{q.title}</h3>
              {q.description && <p>{q.description}</p>}
              <PreviewInput q={q} />
              <button>
                OK <kbd>↵</kbd>
              </button>
            </div>
          </section>
        </div>
      ) : (
        <Results id={id} questions={f.questions} />
      )}{" "}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
function PreviewInput({ q }: any) {
  if (q.type === "long_text") return <div className="fakeinput multiline" />;
  if (
    q.type === "multiple_choice" ||
    q.type === "dropdown" ||
    q.type === "yes_no"
  )
    return (
      <div className="choices">
        {(q.type === "yes_no" ? ["Yes", "No"] : q.options).map(
          (x: string, i: number) => (
            <span key={i}>
              <b>{String.fromCharCode(65 + i)}</b>
              {x}
            </span>
          ),
        )}
      </div>
    );
  if (q.type === "rating") return <div className="stars">☆ ☆ ☆ ☆ ☆</div>;
  return <div className="fakeinput" />;
}
function Results({ id, questions }: { id: string; questions: any[] }) {
  const [rs, setRs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API}/forms/${id}/responses`)
      .then((r) => r.json())
      .then(setRs);
    fetch(`${API}/forms/${id}/stats`)
      .then((r) => r.json())
      .then(setStats);
  }, [id]);
  return (
    <section className="results">
      <h2>
        Responses <span>{rs.length}</span>
      </h2>
      <div className="stats">
        {stats.map((s) => (
          <article key={s.question_id}>
            <p>{s.title}</p>
            <b>{s.responses} answers</b>
            {Object.entries(s.counts).map(([k, v]) => (
              <small key={k}>
                {k}: {String(v)}
              </small>
            ))}
          </article>
        ))}
      </div>
      <div className="responseTable">
        <div className="row header">
          <span>Submitted</span>
          {questions.map((q) => (
            <span key={q.id}>{q.title}</span>
          ))}
        </div>
        {rs.map((r) => (
          <div className="row" key={r.id}>
            <span>{new Date(r.submitted_at).toLocaleString()}</span>
            {questions.map((q) => (
              <span key={q.id}>{r.answers[q.id] || "—"}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
