"use client";
import { DragEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const types = [["short_text","Short text"],["long_text","Long text"],["multiple_choice","Multiple choice"],["dropdown","Dropdown"],["email","Email"],["number","Number"],["yes_no","Yes / No"],["rating","Rating"]];
const defaults = (type = "short_text") => ({ type, title: "Your question here", description: "", required: false, options: ["multiple_choice", "dropdown"].includes(type) ? ["Option 1", "Option 2"] : [] });

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<any>();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState("Build");
  const [dragged, setDragged] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => { fetch(`${API}/forms/${id}`).then(r => r.json()).then(setForm); }, [id]);
  if (!form) return <div className="loader">Loading your form…</div>;
  const question = form.questions[selected];
  const change = (key: string, value: any) => setForm({ ...form, [key]: value });
  const changeQuestion = (key: string, value: any) => { const questions = [...form.questions]; questions[selected] = { ...question, [key]: value }; change("questions", questions); };
  const add = (type = "short_text") => { const questions = [...form.questions, defaults(type)]; change("questions", questions); setSelected(questions.length - 1); };
  const reorder = (from: number, to: number) => { if (from === to) return; const questions = [...form.questions]; const [item] = questions.splice(from, 1); questions.splice(to, 0, item); change("questions", questions); setSelected(to); };
  const remove = () => { if (form.questions.length === 1) return toastIt("A form needs at least one question"); const questions = form.questions.filter((_: any, index: number) => index !== selected); change("questions", questions); setSelected(Math.max(0, selected - 1)); };
  const toastIt = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  async function save() { const response = await fetch(`${API}/forms/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); setForm(await response.json()); toastIt("All changes saved"); }
  async function publish() { const response = await fetch(`${API}/forms/${id}/publish`, { method: "POST" }); setForm(await response.json()); toastIt(form.status === "draft" ? "Your form is live!" : "Form unpublished"); }
  async function copyLink() { await navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`); toastIt("Share link copied"); }
  const onDrop = (event: DragEvent, index: number) => { event.preventDefault(); if (dragged !== null) reorder(dragged, index); setDragged(null); };

  return <main className="builder">
    <header className="builderhead">
      <Link href="/" className="brand">formly<span>•</span></Link>
      <input value={form.title} onChange={e => change("title", e.target.value)} className="titleinput" aria-label="Form title" />
      <nav>{["Build", "Results", "Settings"].map(item => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav>
      <button className="save" onClick={save}>Save</button>
      {form.status === "published" && <button className="save" onClick={copyLink}>Copy link</button>}
      <button className="primary" onClick={publish}>{form.status === "draft" ? "Publish" : "Unpublish"}</button>
    </header>
    {tab === "Build" && <div className="buildbody">
      <aside className="questionlist"><p>CONTENT · DRAG TO REORDER</p>
        {form.questions.map((item: any, index: number) => <button key={index} draggable onDragStart={() => setDragged(index)} onDragOver={event => event.preventDefault()} onDrop={event => onDrop(event, index)} className={selected === index ? "selected" : ""} onClick={() => setSelected(index)}><small>{index + 1}</small><span>{item.title || "Untitled question"}</span><i className="draghandle">⠿</i></button>)}
        <button className="addline" onClick={() => add()}>＋ Add question</button>
      </aside>
      <section className="editor"><div className="qnumber">QUESTION {selected + 1} OF {form.questions.length}</div>
        <select value={question.type} onChange={e => changeQuestion("type", e.target.value)}>{types.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <textarea className="questiontitle" value={question.title} onChange={e => changeQuestion("title", e.target.value)} placeholder="Type your question" />
        <textarea className="description" value={question.description} onChange={e => changeQuestion("description", e.target.value)} placeholder="Add a description (optional)" />
        {["multiple_choice", "dropdown"].includes(question.type) && <div className="options">{question.options.map((option: string, index: number) => <input key={index} value={option} aria-label={`Option ${index + 1}`} onChange={e => { const options = [...question.options]; options[index] = e.target.value; changeQuestion("options", options); }} />)}<button onClick={() => changeQuestion("options", [...question.options, `Option ${question.options.length + 1}`])}>＋ Add option</button></div>}
        <div className="editbottom"><label className="toggle"><input type="checkbox" checked={question.required} onChange={e => changeQuestion("required", e.target.checked)} /> Required</label><div><button onClick={() => reorder(selected, selected - 1)} disabled={selected === 0}>↑</button><button onClick={() => reorder(selected, selected + 1)} disabled={selected === form.questions.length - 1}>↓</button><button className="danger" onClick={remove}>Delete</button></div></div>
      </section>
      <aside className="typepicker"><p>ADD A QUESTION</p>{types.map(([value, label]) => <button onClick={() => add(value)} key={value}><b>{label[0]}</b>{label}</button>)}</aside>
      <section className="preview"><p>LIVE PREVIEW</p><div className="phone"><small>{selected + 1} →</small><h3>{question.title}</h3>{question.description && <p>{question.description}</p>}<PreviewInput question={question} /><button>OK <kbd>↵</kbd></button></div></section>
    </div>}
    {tab === "Results" && <Results id={id} questions={form.questions} />}
    {tab === "Settings" && <Settings form={form} change={change} save={save} />}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}

function PreviewInput({ question }: any) { if (question.type === "long_text") return <div className="fakeinput multiline" />; if (["multiple_choice", "dropdown", "yes_no"].includes(question.type)) return <div className="choices">{(question.type === "yes_no" ? ["Yes", "No"] : question.options).map((option: string, index: number) => <span key={option}><b>{String.fromCharCode(65 + index)}</b>{option}</span>)}</div>; if (question.type === "rating") return <div className="stars">☆ ☆ ☆ ☆ ☆</div>; return <div className="fakeinput" />; }

function Settings({ form, change, save }: any) {
  const theme = form.theme || {};
  const update = (key: string, value: string) => change("theme", { ...theme, [key]: value });
  return <section className="settings"><h2>Settings</h2><p>Make this form feel like yours.</p><div className="settingsgrid"><article><h3>Theme</h3><label>Background <input type="color" value={theme.background || "#f7f7f4"} onChange={e => update("background", e.target.value)} /></label><label>Text color <input type="color" value={theme.color || "#262627"} onChange={e => update("color", e.target.value)} /></label><button className="primary" onClick={save}>Save theme</button></article><article><h3>Thank-you screen</h3><textarea value={theme.thankYou || "Your response has been submitted."} onChange={e => update("thankYou", e.target.value)} /><button className="primary" onClick={save}>Save message</button></article></div><div className="coming"><article><b>Logic jumps</b><span>Coming soon</span></article><article><b>Integrations & webhooks</b><span>Coming soon</span></article><article><b>Team collaboration</b><span>Coming soon</span></article><article><b>Payments & file uploads</b><span>Coming soon</span></article></div></section>;
}

function Results({ id, questions }: { id: string; questions: any[] }) {
  const [responses, setResponses] = useState<any[]>([]); const [stats, setStats] = useState<any[]>([]); const [open, setOpen] = useState<any>();
  useEffect(() => { fetch(`${API}/forms/${id}/responses`).then(r => r.json()).then(setResponses); fetch(`${API}/forms/${id}/stats`).then(r => r.json()).then(setStats); }, [id]);
  return <section className="results"><h2>Responses <span>{responses.length}</span></h2><div className="stats">{stats.map(stat => <article key={stat.question_id}><p>{stat.title}</p><b>{stat.responses} answers</b>{Object.entries(stat.counts).map(([key, value]) => <small key={key}>{key}: {String(value)}</small>)}</article>)}</div><div className="responseTable"><div className="row header"><span>Submitted</span>{questions.map(question => <span key={question.id}>{question.title}</span>)}</div>{responses.map(response => <button className="row responseRow" onClick={() => setOpen(response)} key={response.id}><span>{new Date(response.submitted_at).toLocaleString()}</span>{questions.map(question => <span key={question.id}>{response.answers[question.id] || "—"}</span>)}</button>)}</div>{open && <div className="modalback" onClick={() => setOpen(undefined)}><article className="responseModal" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setOpen(undefined)}>×</button><p className="eyebrow">SUBMITTED {new Date(open.submitted_at).toLocaleString()}</p><h2>Response details</h2>{questions.map(question => <div className="answer" key={question.id}><b>{question.title}</b><p>{open.answers[question.id] || "No answer"}</p></div>)}</article></div>}</section>;
}
