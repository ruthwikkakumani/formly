import { QuestionStat } from "@/lib/types";

export function StatsStrip({ stats }: { stats: QuestionStat[] }) {
  return (
    <div className="stats">
      {stats.map((stat) => (
        <article key={stat.question_id}>
          <p>{stat.title}</p>
          <b>{stat.responses} answers</b>
          {Object.entries(stat.counts).map(([key, value]) => (
            <small key={key}>
              {key}: {value}
            </small>
          ))}
        </article>
      ))}
    </div>
  );
}
