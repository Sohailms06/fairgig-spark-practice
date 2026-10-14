import { randomUUID } from 'crypto';

export interface GrievanceRecord {
  id: string;
  worker_id: string;
  platform_id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  claimed_loss_amount?: number | null;
  cluster_id?: string | null;
  escalated_at?: string | null;
  escalated_to_advocate_id?: string | null;
  resolution_notes?: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ClusterRecord {
  id: string;
  title: string;
  category: string;
  platform_id: string;
  severity: string;
  summary: string;
  affectedWorkerCount: number;
  totalClaimedLoss: number;
  grievanceIds: string[];
  commonTags: string[];
  created_at: string;
  updated_at: string;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'it', 'this', 'that', 'my', 'shift', 'worker', 'platform',
  'hours', 'pkr', 'usd', 'day', 'october', 'amount', 'statement', 'logged'
]);

export function extractThematicKeywords(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  const keywords = new Set<string>();
  for (const w of words) {
    if (w.length >= 4 && !STOP_WORDS.has(w)) {
      keywords.add(w);
    }
  }
  return keywords;
}

export function calculateKeywordOverlap(kw1: Set<string>, kw2: Set<string>): number {
  let matches = 0;
  for (const k of kw1) {
    if (kw2.has(k)) matches++;
  }
  return matches;
}

const PRIORITY_RANKS: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function resolveHighestPriority(priorities: string[]): string {
  let highest = 'medium';
  let maxRank = 0;
  for (const p of priorities) {
    const rank = PRIORITY_RANKS[p.toLowerCase()] || 1;
    if (rank > maxRank) {
      maxRank = rank;
      highest = p.toLowerCase();
    }
  }
  return highest;
}

/**
 * Deterministic complaint clustering:
 * Groups open grievances by platform + category + semantic keyword overlap.
 */
export function clusterGrievances(
  grievances: GrievanceRecord[],
  existingClusters: Map<string, ClusterRecord> = new Map()
): { updatedGrievances: GrievanceRecord[]; clusters: ClusterRecord[] } {
  const resultClusters = new Map<string, ClusterRecord>(existingClusters);
  const updatedGrievances: GrievanceRecord[] = [...grievances];

  // Group by (platform_id, category)
  const buckets = new Map<string, GrievanceRecord[]>();
  for (const g of updatedGrievances) {
    const key = `${g.platform_id}::${g.category}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(g);
  }

  // Evaluate each bucket
  for (const [key, group] of buckets.entries()) {
    if (group.length < 2) continue; // Minimum 2 complaints to form a collective cluster

    // Compare pairs for thematic keyword similarity
    const clustersInBucket: Array<{ members: GrievanceRecord[]; keywords: Set<string> }> = [];

    for (const g of group) {
      const gKeywords = extractThematicKeywords(`${g.title} ${g.description}`);
      let assigned = false;

      for (const c of clustersInBucket) {
        if (calculateKeywordOverlap(gKeywords, c.keywords) >= 1) {
          c.members.push(g);
          gKeywords.forEach((k) => c.keywords.add(k));
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        clustersInBucket.push({
          members: [g],
          keywords: gKeywords,
        });
      }
    }

    // Form clusters for groups with >= 2 members
    for (const c of clustersInBucket) {
      if (c.members.length >= 2) {
        const clusterId = c.members[0].cluster_id || randomUUID();
        const distinctWorkers = new Set(c.members.map((m) => m.worker_id)).size;
        const totalLoss = c.members.reduce((acc, m) => acc + (m.claimed_loss_amount || 0), 0);
        const severity = resolveHighestPriority(c.members.map((m) => m.priority));
        const [platformId, category] = key.split('::');

        const title = `Systemic ${category.replace(/_/g, ' ').toUpperCase()} on ${platformId} (${distinctWorkers} Workers Affected)`;
        const summary = `Automated cluster aggregating ${c.members.length} recurring complaints across ${distinctWorkers} independent workers. Key themes: ${Array.from(c.keywords).slice(0, 5).join(', ')}.`;

        const clusterRecord: ClusterRecord = {
          id: clusterId,
          title,
          category,
          platform_id: platformId,
          severity,
          summary,
          affectedWorkerCount: distinctWorkers,
          totalClaimedLoss: Math.round(totalLoss * 100) / 100,
          grievanceIds: c.members.map((m) => m.id),
          commonTags: Array.from(c.keywords).slice(0, 6),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        resultClusters.set(clusterId, clusterRecord);

        // Assign cluster ID to all member grievances
        for (const m of c.members) {
          m.cluster_id = clusterId;
          if (m.status === 'submitted') {
            m.status = 'clustered';
          }
        }
      }
    }
  }

  return {
    updatedGrievances,
    clusters: Array.from(resultClusters.values()),
  };
}
