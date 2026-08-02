import { getCandidateRankingsForJob } from "@/lib/hr/candidate-ranking-data";
import { AICandidateRankingPanel } from "@/components/hr/AICandidateRankingPanel";

export async function AICandidateRankingSection({ jobId }: { jobId: string }) {
  const rankings = await getCandidateRankingsForJob(jobId);
  return <AICandidateRankingPanel jobId={jobId} initialRankings={rankings} />;
}
