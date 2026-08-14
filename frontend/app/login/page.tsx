"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { SmoothHeight } from "@/components/shared/SmoothHeight";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { paneDuration, paneEase, pillSpring } from "@/lib/motion";
import { isValidEmail } from "@/lib/validation";

type DemoAccount = { role: string; label: string; email: string; password: string };

const DEMO_ORDER = ["owner", "viewer", "editor"];

function sortDemos(rows: DemoAccount[]) {
  return [...rows].sort((a, b) => DEMO_ORDER.indexOf(a.role) - DEMO_ORDER.indexOf(b.role));
}

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demos, setDemos] = useState<DemoAccount[]>([]);
  const [selected, setSelected] = useState(0);
  const [from, setFrom] = useState(0);

  useEffect(() => {
    authApi
      .demo()
      .then((rows) => {
        const ordered = sortDemos(rows);
        setDemos(ordered);
        if (ordered[0]) {
          setEmail(ordered[0].email);
          setPassword(ordered[0].password);
        }
      })
      .catch(() => setDemos([]));
  }, []);

  const dir = selected >= from ? 1 : -1;

  function show(index: number) {
    if (index === selected) return;
    const next = demos[index];
    setFrom(selected);
    setSelected(index);
    if (next) {
      setEmail(next.email);
      setPassword(next.password);
      setError("");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError(MESSAGES.invalidEmail);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await authApi.login({ email, password });
      setToken(session.token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.signInFailed));
    } finally {
      setBusy(false);
    }
  }

  const labels = useMemo(
    () =>
      demos.map((item) => {
        if (item.role === "owner") return "Owner";
        if (item.role === "viewer") return "Viewer";
        return "Reviewer";
      }),
    [demos],
  );

  return (
    <main className="invite-page">
      <Link className="brand" href="/login">
        formly<span>•</span>
      </Link>
      <p className="eyebrow">WORKSPACE</p>
      <h1>Sign in</h1>
      <p>Use your real account. Live editing shows whoever is actually signed in.</p>
      <form className="authform" onSubmit={(event) => void submit(event)}>
        <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? (
          <p className="autherr" role="alert">
            {error}
          </p>
        ) : null}
        <button className={`primary${busy ? " is-busy" : ""}`} type="submit" disabled={busy}>
          <BusyLabel busy={busy} idle="Sign in" pending="Signing in" />
        </button>
      </form>
      {demos.length ? (
        <aside className="reviewer-note">
          <nav className="demo-nav has-thumb" aria-label="Demo accounts">
            <LayoutGroup id="login-demo-pill">
              {demos.map((item, index) => (
                <button
                  key={`${item.role}-${item.email}`}
                  type="button"
                  className={index === selected ? "tabon" : ""}
                  aria-current={index === selected ? "true" : undefined}
                  onClick={() => show(index)}
                >
                  {index === selected ? (
                    <motion.span
                      layoutId="login-demo-active"
                      className="demo-nav-thumb"
                      transition={reduceMotion ? { duration: 0 } : pillSpring}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="demo-nav-label">{labels[index]}</span>
                </button>
              ))}
            </LayoutGroup>
          </nav>
          <SmoothHeight>
            <div className="demo-switch">
              {demos.map((item, index) => {
                const on = index === selected;
                return (
                  <motion.div
                    key={`${item.role}-${item.email}`}
                    className={`demo-pane${on ? " is-on" : " is-off"}`}
                    aria-hidden={!on}
                    initial={false}
                    animate={
                      reduceMotion
                        ? { opacity: on ? 1 : 0, x: 0 }
                        : {
                            opacity: on ? 1 : 0,
                            x: on ? 0 : dir * (index < selected ? -24 : 24),
                          }
                    }
                    transition={{ duration: paneDuration, ease: paneEase }}
                  >
                    <dl>
                      <div>
                        <dt>Email</dt>
                        <dd>{item.email}</dd>
                      </div>
                      <div>
                        <dt>Password</dt>
                        <dd>{item.password}</dd>
                      </div>
                    </dl>
                  </motion.div>
                );
              })}
            </div>
          </SmoothHeight>
        </aside>
      ) : null}
      <p>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
      <p>
        First person here? <Link href="/register">Create the workspace</Link>
      </p>
    </main>
  );
}
