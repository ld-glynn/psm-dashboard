import type { AgentNewHire, SkillFeedback, AgentQualityScore, SkillTypeTrend, SkillType } from "./types";

export function computeAgentQualityScores(
  newHires: AgentNewHire[],
  feedback: Record<string, SkillFeedback>
): AgentQualityScore[] {
  return newHires.map((agent) => {
    let usefulCount = 0;
    let notUsefulCount = 0;
    let revisionCount = 0;
    let ratedSkills = 0;

    agent.skills.forEach((_, i) => {
      const fb = feedback[`${agent.agent_id}:${i}`];
      if (fb) {
        ratedSkills++;
        if (fb.rating === "useful") usefulCount++;
        else if (fb.rating === "not_useful") notUsefulCount++;
        else if (fb.rating === "needs_revision") revisionCount++;
      }
    });

    // Score: useful = 1.0, needs_revision = 0.3, not_useful = 0
    const qualityScore = ratedSkills > 0
      ? Math.round(((usefulCount * 1 + revisionCount * 0.3) / ratedSkills) * 100)
      : -1; // -1 means no data

    return {
      agentId: agent.agent_id,
      agentName: agent.name,
      totalSkills: agent.skills.length,
      ratedSkills,
      usefulCount,
      notUsefulCount,
      revisionCount,
      qualityScore,
    };
  });
}

export function computeSkillTypeTrends(
  newHires: AgentNewHire[],
  feedback: Record<string, SkillFeedback>
): SkillTypeTrend[] {
  const types: SkillType[] = ["recommend", "action_plan", "process_doc", "investigate"];

  return types.map((skillType) => {
    let useful = 0;
    let notUseful = 0;
    let revision = 0;
    let totalRated = 0;

    newHires.forEach((agent) => {
      agent.skills.forEach((skill, i) => {
        if (skill.skill_type !== skillType) return;
        const fb = feedback[`${agent.agent_id}:${i}`];
        if (fb) {
          totalRated++;
          if (fb.rating === "useful") useful++;
          else if (fb.rating === "not_useful") notUseful++;
          else if (fb.rating === "needs_revision") revision++;
        }
      });
    });

    return {
      skillType,
      totalRated,
      usefulPct: totalRated > 0 ? Math.round((useful / totalRated) * 100) : 0,
      notUsefulPct: totalRated > 0 ? Math.round((notUseful / totalRated) * 100) : 0,
      revisionPct: totalRated > 0 ? Math.round((revision / totalRated) * 100) : 0,
    };
  });
}

export function exportFeedbackAsJSON(
  newHires: AgentNewHire[],
  feedback: Record<string, SkillFeedback>
): void {
  const scores = computeAgentQualityScores(newHires, feedback);
  const trends = computeSkillTypeTrends(newHires, feedback);
  const data = {
    exportedAt: new Date().toISOString(),
    skillFeedback: Object.values(feedback),
    agentScores: scores,
    skillTypeTrends: trends,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `psm-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
