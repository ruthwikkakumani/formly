import { FormActivity } from "@/lib/types";

export function ActivityLog({ events }: { events: FormActivity[] }) {
  return (
    <section className="activity">
      <h3>Who changed this form</h3>
      <p>Every save, publish, and rename is recorded.</p>
      {!events.length && <p className="hint">No edits logged yet.</p>}
      <ol>
        {events.map((event) => (
          <li key={event.id}>
            <b>{event.actor_name || "Unknown"}</b> {event.action}
            {event.detail ? ` — ${event.detail}` : ""}
            <small>{new Date(event.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
