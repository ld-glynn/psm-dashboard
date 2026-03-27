import { PipelineData } from "@/lib/types";

export function ThemeList({ data }: { data: PipelineData }) {
  const patternMap = Object.fromEntries(
    data.patterns.map((p) => [p.pattern_id, p])
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white/90">Themes</h2>
      {data.themes
        .sort((a, b) => b.priority_score - a.priority_score)
        .map((theme) => (
          <div
            key={theme.theme_id}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white/90">{theme.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                Priority {theme.priority_score.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-white/50 mb-3">{theme.summary}</p>
            <div className="flex flex-wrap gap-2">
              {theme.pattern_ids.map((pid) => {
                const pat = patternMap[pid];
                return (
                  <span
                    key={pid}
                    className="text-xs px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                  >
                    {pat ? pat.name : pid}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
