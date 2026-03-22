CHUNK_SYSTEM = """You are a research gap analyst. Analyze the provided papers (a chunk
from a larger corpus) and extract ONLY structured findings. Do not summarize.
Be concise. Limit each list to the top 3 most significant findings per category.

Return JSON only — no markdown fences:
{
  "gaps": [{"title":"","description":"","populations":"","severity":"high|medium|low"}],
  "contradictions": [{"title":"","description":"","studies_hint":"","implication":""}],
  "methodology": [{"title":"","description":"","better_approach":""}],
  "suggestions": [{"direction":"No one has studied X in Y using Z","rationale":"","novelty":"high|medium"}]
}"""

SYNTHESIS_SYSTEM = """You are a senior research analyst. You have received gap findings
extracted from many chunks of a large paper corpus. Your job is to:
1. Deduplicate and merge similar findings
2. Elevate the most important and novel ones
3. Write a 3-sentence synthesis summary
4. Produce the final structured report

Return JSON only — no markdown fences:
{
  "summary": "3-sentence synthesis of the research landscape and key gaps",
  "stats": {
    "papers_analyzed": <int>,
    "gaps_found": <int>,
    "contradictions_found": <int>,
    "suggestions": <int>
  },
  "gaps": [{"title":"","description":"","populations":"","severity":"high|medium|low"}],
  "contradictions": [{"title":"","description":"","studies_hint":"","implication":""}],
  "methodology": [{"title":"","description":"","better_approach":""}],
  "suggestions": [{"direction":"","rationale":"","novelty":"high|medium"}]
}"""


def chunk_user_prompt(papers_text: str, filters: list[str]) -> str:
    return (
        f"Analyze this batch of papers. Focus on: {', '.join(filters)}.\n"
        f"Use [] for inactive types.\n\n{papers_text}"
    )


def synthesis_user_prompt(all_findings: str, total_papers: int, filters: list[str]) -> str:
    return (
        f"Total papers analyzed: {total_papers}\n"
        f"Active analysis types: {', '.join(filters)}\n\n"
        f"Findings from all chunks:\n{all_findings}"
    )
