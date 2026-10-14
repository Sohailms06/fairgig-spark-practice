import { randomUUID } from 'crypto';
import { config } from './config';
import { ClusterRecord, GrievanceRecord } from './clustering';

export interface AuditLogRecord {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
}

// In-memory local fallback store
class InMemoryStore {
  grievances = new Map<string, GrievanceRecord>();
  tags = new Map<string, Set<string>>(); // grievance_id -> tags
  earningsLinks = new Map<string, Set<string>>(); // grievance_id -> earning_ids
  clusters = new Map<string, ClusterRecord>();
  auditLogs: AuditLogRecord[] = [];
}

const memoryStore = new InMemoryStore();

// Platform Slug to UUID map
export const PLATFORM_SLUG_MAP: Record<string, string> = {
  bykea: '10000000-0000-0000-0000-000000000001',
  foodpanda: '10000000-0000-0000-0000-000000000002',
  indrive: '10000000-0000-0000-0000-000000000003',
  careem: '10000000-0000-0000-0000-000000000004',
  yango: '10000000-0000-0000-0000-000000000005',
  cheetay: '10000000-0000-0000-0000-000000000006',
  other: '10000000-0000-0000-0000-000000000007',
  uber: '10000000-0000-0000-0000-000000000004', // Map uber to rideshare platform id if needed
};

export function resolvePlatformId(platformOrSlug: string): string {
  const lower = platformOrSlug.toLowerCase();
  if (PLATFORM_SLUG_MAP[lower]) {
    return PLATFORM_SLUG_MAP[lower];
  }
  // If already a UUID
  return platformOrSlug;
}

export function resolvePlatformSlug(platformId: string): string {
  for (const [slug, id] of Object.entries(PLATFORM_SLUG_MAP)) {
    if (id === platformId) return slug;
  }
  return 'other';
}

async function supabaseFetch(method: string, path: string, body?: any, prefer?: string): Promise<any> {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase not configured');
  }

  const headers: Record<string, string> = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
  };
  if (prefer) {
    headers['Prefer'] = prefer;
  }

  const res = await fetch(`${config.supabaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase error ${res.status}: ${errText}`);
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export class GrievanceDatabaseManager {
  private useSupabase: boolean;

  constructor() {
    this.useSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
  }

  async isConnected(): Promise<{ connected: boolean; engine: string }> {
    if (this.useSupabase) {
      try {
        await supabaseFetch('GET', '/rest/v1/grievances?select=id&limit=1');
        return { connected: true, engine: 'supabase-postgresql' };
      } catch (e: any) {
        return { connected: false, engine: `error: ${e.message}` };
      }
    }
    return { connected: true, engine: 'in-memory-local' };
  }

  async recordAuditLog(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: any = {}
  ): Promise<void> {
    const log: AuditLogRecord = {
      id: randomUUID(),
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    };

    memoryStore.auditLogs.push(log);

    if (this.useSupabase) {
      try {
        await supabaseFetch('POST', '/rest/v1/audit_logs', {
          id: log.id,
          actor_id: log.actor_id,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          metadata: log.metadata,
        });
      } catch {
        // Log locally if remote fails
      }
    }
  }

  async createGrievance(data: {
    workerId: string;
    title: string;
    description: string;
    category: string;
    platform: string;
    priority?: string;
    claimedLossAmount?: number;
    associatedEarningIds?: string[];
    evidenceUrls?: string[];
    tags?: string[];
  }): Promise<GrievanceRecord & { tags: string[]; associatedEarningIds: string[] }> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const platformId = resolvePlatformId(data.platform);
    const initialTags = new Set(data.tags || [data.category, data.platform]);

    const grievance: GrievanceRecord = {
      id,
      worker_id: data.workerId,
      platform_id: platformId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || 'medium',
      status: 'submitted',
      claimed_loss_amount: data.claimedLossAmount || null,
      cluster_id: null,
      created_at: now,
      updated_at: now,
    };

    // Store in memory
    memoryStore.grievances.set(id, grievance);
    memoryStore.tags.set(id, initialTags);
    memoryStore.earningsLinks.set(id, new Set(data.associatedEarningIds || []));

    // Store in Supabase if live
    if (this.useSupabase) {
      try {
        await supabaseFetch('POST', '/rest/v1/grievances', {
          id,
          worker_id: data.workerId,
          platform_id: platformId,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: grievance.priority,
          status: grievance.status,
          claimed_loss_amount: grievance.claimed_loss_amount,
        });

        // Insert tags
        for (const t of initialTags) {
          await supabaseFetch('POST', '/rest/v1/grievance_tags', {
            id: randomUUID(),
            grievance_id: id,
            tag_name: t,
          }).catch(() => {});
        }

        // Insert earnings link if provided
        for (const eId of data.associatedEarningIds || []) {
          await supabaseFetch('POST', '/rest/v1/grievance_earnings_link', {
            grievance_id: id,
            earning_id: eId,
          }).catch(() => {});
        }
      } catch (err: any) {
        console.warn('[GrievanceDB] Supabase live write error, kept in memory:', err.message);
      }
    }

    await this.recordAuditLog(data.workerId, 'CREATE_GRIEVANCE', 'grievances', id, {
      title: data.title,
      category: data.category,
    });

    return {
      ...grievance,
      tags: Array.from(initialTags),
      associatedEarningIds: data.associatedEarningIds || [],
    };
  }

  async getGrievanceById(
    id: string
  ): Promise<(GrievanceRecord & { tags: string[]; associatedEarningIds: string[] }) | null> {
    let record = memoryStore.grievances.get(id);

    if (!record && this.useSupabase) {
      try {
        const rows = await supabaseFetch('GET', `/rest/v1/grievances?id=eq.${id}&select=*`);
        if (rows && rows.length > 0) {
          record = rows[0];
          memoryStore.grievances.set(id, record!);
        }
      } catch {}
    }

    if (!record) return null;

    let tags = Array.from(memoryStore.tags.get(id) || []);
    if (tags.length === 0 && this.useSupabase) {
      try {
        const tagRows = await supabaseFetch('GET', `/rest/v1/grievance_tags?grievance_id=eq.${id}&select=tag_name`);
        tags = (tagRows || []).map((r: any) => r.tag_name);
        memoryStore.tags.set(id, new Set(tags));
      } catch {}
    }

    let earnings = Array.from(memoryStore.earningsLinks.get(id) || []);
    if (earnings.length === 0 && this.useSupabase) {
      try {
        const linkRows = await supabaseFetch('GET', `/rest/v1/grievance_earnings_link?grievance_id=eq.${id}&select=earning_id`);
        earnings = (linkRows || []).map((r: any) => r.earning_id);
        memoryStore.earningsLinks.set(id, new Set(earnings));
      } catch {}
    }

    return {
      ...record,
      tags,
      associatedEarningIds: earnings,
    };
  }

  async listGrievances(filter: {
    workerId?: string;
    status?: string;
    platform?: string;
    category?: string;
    clusterId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Array<GrievanceRecord & { tags: string[]; associatedEarningIds: string[] }>; total: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;

    let all: GrievanceRecord[] = Array.from(memoryStore.grievances.values());

    if (this.useSupabase) {
      try {
        const queryParams: string[] = ['select=*', 'order=created_at.desc'];
        if (filter.workerId) queryParams.push(`worker_id=eq.${filter.workerId}`);
        if (filter.status) queryParams.push(`status=eq.${filter.status}`);
        if (filter.category) queryParams.push(`category=eq.${filter.category}`);
        if (filter.clusterId) queryParams.push(`cluster_id=eq.${filter.clusterId}`);

        const rows = await supabaseFetch('GET', `/rest/v1/grievances?${queryParams.join('&')}`);
        if (rows && Array.isArray(rows)) {
          const map = new Map<string, GrievanceRecord>();
          rows.forEach((r: any) => map.set(r.id, r));
          memoryStore.grievances.forEach((v, k) => {
            if (!map.has(k)) map.set(k, v);
          });
          all = Array.from(map.values());
        }
      } catch {}
    }

    // Apply memory filters
    let filtered = all.filter((g) => {
      if (filter.workerId && g.worker_id !== filter.workerId) return false;
      if (filter.status && g.status !== filter.status) return false;
      if (filter.category && g.category !== filter.category) return false;
      if (filter.clusterId && g.cluster_id !== filter.clusterId) return false;
      if (filter.platform) {
        const resolvedId = resolvePlatformId(filter.platform);
        if (g.platform_id !== resolvedId && g.platform_id !== filter.platform) return false;
      }
      return true;
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    const items = await Promise.all(
      paged.map(async (g) => {
        const full = await this.getGrievanceById(g.id);
        return full || { ...g, tags: [], associatedEarningIds: [] };
      })
    );

    return { items, total };
  }

  async updateGrievance(id: string, updates: Partial<GrievanceRecord>): Promise<GrievanceRecord | null> {
    const existing = await this.getGrievanceById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    memoryStore.grievances.set(id, updated);

    if (this.useSupabase) {
      try {
        await supabaseFetch('PATCH', `/rest/v1/grievances?id=eq.${id}`, updates);
      } catch {}
    }

    return updated;
  }

  async addTag(grievanceId: string, tag: string): Promise<string[]> {
    if (!memoryStore.tags.has(grievanceId)) {
      memoryStore.tags.set(grievanceId, new Set());
    }
    const set = memoryStore.tags.get(grievanceId)!;
    set.add(tag);

    if (this.useSupabase) {
      try {
        await supabaseFetch('POST', '/rest/v1/grievance_tags', {
          id: randomUUID(),
          grievance_id: grievanceId,
          tag_name: tag,
        }).catch(() => {});
      } catch {}
    }

    return Array.from(set);
  }

  async removeTag(grievanceId: string, tag: string): Promise<string[]> {
    const set = memoryStore.tags.get(grievanceId);
    if (set) {
      set.delete(tag);
    }

    if (this.useSupabase) {
      try {
        await supabaseFetch('DELETE', `/rest/v1/grievance_tags?grievance_id=eq.${grievanceId}&tag_name=eq.${encodeURIComponent(tag)}`).catch(() => {});
      } catch {}
    }

    return Array.from(set || []);
  }

  async linkEarnings(grievanceId: string, earningIds: string[]): Promise<string[]> {
    if (!memoryStore.earningsLinks.has(grievanceId)) {
      memoryStore.earningsLinks.set(grievanceId, new Set());
    }
    const set = memoryStore.earningsLinks.get(grievanceId)!;
    for (const eId of earningIds) {
      set.add(eId);
      if (this.useSupabase) {
        try {
          await supabaseFetch('POST', '/rest/v1/grievance_earnings_link', {
            grievance_id: grievanceId,
            earning_id: eId,
          }).catch(() => {});
        } catch {}
      }
    }
    return Array.from(set);
  }

  async saveCluster(cluster: ClusterRecord): Promise<void> {
    memoryStore.clusters.set(cluster.id, cluster);

    if (this.useSupabase) {
      try {
        await supabaseFetch('POST', '/rest/v1/grievance_clusters', {
          id: cluster.id,
          title: cluster.title,
          category: cluster.category,
          platform_id: cluster.platform_id,
          severity: cluster.severity,
          summary: cluster.summary,
        }, 'resolution=merge-duplicates');
      } catch {}
    }
  }

  async getClusters(): Promise<ClusterRecord[]> {
    if (this.useSupabase) {
      try {
        const rows = await supabaseFetch('GET', '/rest/v1/grievance_clusters?select=*');
        if (rows && rows.length > 0) {
          for (const r of rows) {
            if (!memoryStore.clusters.has(r.id)) {
              memoryStore.clusters.set(r.id, {
                id: r.id,
                title: r.title,
                category: r.category,
                platform_id: r.platform_id,
                severity: r.severity,
                summary: r.summary || '',
                affectedWorkerCount: 1,
                totalClaimedLoss: 0,
                grievanceIds: [],
                commonTags: [],
                created_at: r.created_at,
                updated_at: r.updated_at,
              });
            }
          }
        }
      } catch {}
    }
    return Array.from(memoryStore.clusters.values());
  }

  async getClusterById(id: string): Promise<ClusterRecord | null> {
    const cluster = memoryStore.clusters.get(id);
    if (cluster) return cluster;

    if (this.useSupabase) {
      try {
        const rows = await supabaseFetch('GET', `/rest/v1/grievance_clusters?id=eq.${id}&select=*`);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            title: r.title,
            category: r.category,
            platform_id: r.platform_id,
            severity: r.severity,
            summary: r.summary || '',
            affectedWorkerCount: 1,
            totalClaimedLoss: 0,
            grievanceIds: [],
            commonTags: [],
            created_at: r.created_at,
            updated_at: r.updated_at,
          };
        }
      } catch {}
    }

    return null;
  }

  getAuditLogs(): AuditLogRecord[] {
    return memoryStore.auditLogs;
  }
}

export const grievanceDb = new GrievanceDatabaseManager();
