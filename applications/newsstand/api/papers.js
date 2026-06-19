import { fetchPapers } from "./data.js";

export default async function handler({ query }) {
  const papers = await fetchPapers(query.date);

  return {
    papers: papers.map((paper) => ({
      slug: paper.slug,
      name: paper.name || paper.slug,
      city: paper.city || "",
      country: paper.country || "",
      date: paper.date,
    })),
    total: papers.length,
    updatedAt: new Date().toISOString(),
  };
}
