import { loadPipelineData } from "@/lib/data";
import { PipelineFlow } from "@/components/PipelineFlow";
import { StatsGrid } from "@/components/StatsGrid";
import { ThemeList } from "@/components/ThemeList";

export default function Home() {
  const data = loadPipelineData();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Problem Solution Mapping
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Pipeline overview — {data.catalog.length} problems analyzed
        </p>
      </div>

      <PipelineFlow data={data} />
      <StatsGrid data={data} />
      <ThemeList data={data} />
    </div>
  );
}
