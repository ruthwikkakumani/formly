export function ProgressBar({ current, total, accent }: { current: number; total: number; accent?: string }) {
  return (
    <div className="progress">
      <i style={{ width: `${((current + 1) / total) * 100}%`, background: accent || "#0445af" }} />
    </div>
  );
}
