"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
type Form = {
  id: number;
  title: string;
  description: string;
  status: string;
  slug: string;
  response_count: number;
  questions: any[];
};
export default function Home() {
  const [forms, setForms] = useState<Form[]>([]);
  const [toast, setToast] = useState("");
  const load = () =>
    fetch(`${API}/forms`)
      .then((r) => r.json())
      .then(setForms);
  useEffect(() => {
    void load();
  }, []);
  async function create() {
    const f = await fetch(`${API}/forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled form",
        questions: [
          { type: "short_text", title: "What is your name?", required: true },
        ],
      }),
    }).then((r) => r.json());
    location.href = `/builder/${f.id}`;
  }
  async function act(id: number, path: string, msg: string) {
    await fetch(`${API}/forms/${id}${path}`, { method: "POST" });
    setToast(msg);
    load();
    setTimeout(() => setToast(""), 2200);
  }
  return (
    <main className="dashboard">
      <header>
        <Link href="/" className="brand">
          formly<span>•</span>
        </Link>
        <div className="avatar">RK</div>
      </header>
      <section className="dashhead">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>My forms</h1>
        </div>
        <button className="primary" onClick={create}>
          ＋ Create a form
        </button>
      </section>
      <div className="tabs">
        <b>All forms</b>
        <span>Templates</span>
        <span>Trash</span>
      </div>
      <section className="formgrid">
        {forms.map((f) => (
          <article className="formcard" key={f.id}>
            <div className="cardtop">
              <span className={`status ${f.status}`}>{f.status}</span>
              <button
                className="dots"
                onClick={() => act(f.id, "/duplicate", "Form duplicated")}
              >
                Duplicate
              </button>
            </div>
            <Link href={`/builder/${f.id}`}>
              <h2>{f.title}</h2>
              <p>{f.description || "No description"}</p>
            </Link>
            <footer>
              <span>{f.response_count} responses</span>
              <span>{f.questions.length} questions</span>
            </footer>
            <div className="cardactions">
              <button
                onClick={() =>
                  act(
                    f.id,
                    "/publish",
                    f.status === "draft"
                      ? "Form published"
                      : "Form unpublished",
                  )
                }
              >
                {f.status === "draft" ? "Publish" : "Unpublish"}
              </button>
              {f.status === "published" && (
                <Link href={`/f/${f.slug}`} target="_blank">
                  Open ↗
                </Link>
              )}
              <button
                className="danger"
                onClick={async () => {
                  if (confirm("Delete this form?")) {
                    await fetch(`${API}/forms/${f.id}`, { method: "DELETE" });
                    load();
                  }
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
      {!forms.length && (
        <div className="empty">No forms yet. Create one to begin.</div>
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
