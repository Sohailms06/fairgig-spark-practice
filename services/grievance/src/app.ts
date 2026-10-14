import express, { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { config } from './config';
import { requireAuth, requireRole, optionalAuth, AuthenticatedRequest } from './auth';
import { grievanceDb, resolvePlatformSlug } from './db';
import { clusterGrievances } from './clustering';

export const app = express();

app.use(express.json());

// CORS Configuration
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Helper: Mask worker ID deterministically for public anonymous view
function maskWorkerId(workerId: string): string {
  const hash = createHash('sha256').update(workerId).digest('hex').substring(0, 6).toUpperCase();
  return `ANON-${hash}`;
}

// Format API response object
function formatGrievanceResponse(g: any) {
  return {
    id: g.id,
    workerId: g.worker_id,
    title: g.title,
    description: g.description,
    category: g.category,
    platform: resolvePlatformSlug(g.platform_id),
    priority: g.priority,
    status: g.status,
    claimedLossAmount: g.claimed_loss_amount !== undefined ? g.claimed_loss_amount : null,
    clusterId: g.cluster_id || null,
    tags: g.tags || [],
    associatedEarningIds: g.associatedEarningIds || [],
    evidenceUrls: g.evidenceUrls || [],
    escalatedAt: g.escalated_at || null,
    escalatedToAdvocateId: g.escalated_to_advocate_id || null,
    resolutionNotes: g.resolution_notes || null,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  };
}

// ============================================================================
// SYSTEM PROBES
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'grievance',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'grievance',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  const statusInfo = await grievanceDb.isConnected();
  res.status(statusInfo.connected ? 200 : 503).json({
    status: statusInfo.connected ? 'ready' : 'not_ready',
    service: 'grievance',
    databaseEngine: statusInfo.engine,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/ready', async (req: Request, res: Response) => {
  const statusInfo = await grievanceDb.isConnected();
  res.status(statusInfo.connected ? 200 : 503).json({
    status: statusInfo.connected ? 'ready' : 'not_ready',
    service: 'grievance',
    databaseEngine: statusInfo.engine,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// PUBLIC ANONYMOUS COMMUNITY BOARD
// ============================================================================

app.get(
  ['/api/v1/grievances/public', '/api/v1/grievances/community-board'],
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

      const { items, total } = await grievanceDb.listGrievances({ page, limit });

      // Strip ALL private PII: worker names, emails, raw IDs, phone, evidence paths
      const anonymousItems = items.map((g) => ({
        id: g.id,
        anonymousWorkerTag: maskWorkerId(g.worker_id),
        title: g.title,
        description: g.description,
        category: g.category,
        platform: resolvePlatformSlug(g.platform_id),
        priority: g.priority,
        status: g.status,
        claimedLossAmount: g.claimed_loss_amount,
        clusterId: g.cluster_id || null,
        tags: g.tags || [],
        createdAt: g.created_at,
      }));

      const totalPages = Math.ceil(total / limit);

      res.json({
        items: anonymousItems,
        meta: {
          page,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
      });
    }
  }
);

// ============================================================================
// WORKER OPERATIONS
// ============================================================================

// Submit Grievance
app.post('/api/v1/grievances', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, platform, priority, claimedLossAmount, associatedEarningIds, evidenceUrls } = req.body;

    if (!title || typeof title !== 'string' || title.length < 5 || title.length > 150) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Title must be between 5 and 150 characters.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (!description || typeof description !== 'string' || description.length < 20 || description.length > 2000) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Description must be between 20 and 2000 characters.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (!category || !platform) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Category and platform are required.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const workerId = req.user!.id;

    // Create grievance
    const record = await grievanceDb.createGrievance({
      workerId,
      title,
      description,
      category,
      platform,
      priority: priority || 'medium',
      claimedLossAmount: claimedLossAmount ? parseFloat(claimedLossAmount) : undefined,
      associatedEarningIds: associatedEarningIds || [],
      evidenceUrls: evidenceUrls || [],
    });

    // Run deterministic clustering check across all open grievances
    const allGrievances = (await grievanceDb.listGrievances({ limit: 100 })).items;
    const { updatedGrievances, clusters } = clusterGrievances(allGrievances);

    for (const c of clusters) {
      await grievanceDb.saveCluster(c);
    }

    // Update cluster_id if assigned
    const clusteredSelf = updatedGrievances.find((g) => g.id === record.id);
    if (clusteredSelf && clusteredSelf.cluster_id) {
      await grievanceDb.updateGrievance(record.id, {
        cluster_id: clusteredSelf.cluster_id,
        status: clusteredSelf.status,
      });
      record.cluster_id = clusteredSelf.cluster_id;
      record.status = clusteredSelf.status;
    }

    res.status(201).json(formatGrievanceResponse(record));
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

// List Grievances (Worker sees own; Advocate/Admin sees all)
app.get('/api/v1/grievances', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const status = req.query.status as string | undefined;
    const platform = req.query.platform as string | undefined;
    const category = req.query.category as string | undefined;
    const clusterId = req.query.clusterId as string | undefined;

    const user = req.user!;
    const isAdvocate = ['advocate', 'admin'].includes(user.role);

    // If worker, force filter to own workerId
    const filter = {
      workerId: isAdvocate ? undefined : user.id,
      status,
      platform,
      category,
      clusterId,
      page,
      limit,
    };

    const { items, total } = await grievanceDb.listGrievances(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      items: items.map(formatGrievanceResponse),
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

// Get Specific Grievance Details
app.get('/api/v1/grievances/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grievanceId = String(String(req.params.id));
    const grievance = await grievanceDb.getGrievanceById(grievanceId);

    if (!grievance) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Grievance '${grievanceId}' not found.`, timestamp: new Date().toISOString() },
      });
      return;
    }

    const user = req.user!;
    const isAdvocate = ['advocate', 'admin'].includes(user.role);

    // Worker ownership check: Cannot access another worker's private grievance
    if (!isAdvocate && grievance.worker_id !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: "Forbidden: You cannot access another worker's private grievance.",
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.json(formatGrievanceResponse(grievance));
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

// Edit Permitted Fields (Worker only, while editable)
app.patch('/api/v1/grievances/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grievanceId = String(String(req.params.id));
    const grievance = await grievanceDb.getGrievanceById(grievanceId);

    if (!grievance) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Grievance not found.', timestamp: new Date().toISOString() },
      });
      return;
    }

    const user = req.user!;
    if (grievance.worker_id !== user.id && user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Forbidden: Cannot edit another worker grievance.', timestamp: new Date().toISOString() },
      });
      return;
    }

    // Editable status check: only editable while submitted or under_review
    if (['escalated', 'resolved', 'rejected'].includes(grievance.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Grievance cannot be edited once ${grievance.status}.`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const { title, description, claimedLossAmount } = req.body;
    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (claimedLossAmount !== undefined) updates.claimed_loss_amount = claimedLossAmount;

    const updated = await grievanceDb.updateGrievance(grievanceId, updates);
    await grievanceDb.recordAuditLog(user.id, 'UPDATE_GRIEVANCE', 'grievances', grievanceId, updates);

    res.json(formatGrievanceResponse(updated));
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

// Link Additional Earnings Shifts
app.post('/api/v1/grievances/:id/link-earnings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grievanceId = String(String(req.params.id));
    const grievance = await grievanceDb.getGrievanceById(grievanceId);

    if (!grievance) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Grievance not found.', timestamp: new Date().toISOString() },
      });
      return;
    }

    if (grievance.worker_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Forbidden: Cannot link earnings to another worker grievance.', timestamp: new Date().toISOString() },
      });
      return;
    }

    const { earningIds } = req.body;
    if (!Array.isArray(earningIds) || earningIds.length === 0) {
      res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'earningIds must be a non-empty array.', timestamp: new Date().toISOString() },
      });
      return;
    }

    const linked = await grievanceDb.linkEarnings(grievanceId, earningIds);
    await grievanceDb.recordAuditLog(req.user!.id, 'LINK_EARNINGS', 'grievances', grievanceId, { earningIds });

    res.json({
      success: true,
      grievanceId,
      associatedEarningIds: linked,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

// ============================================================================
// ADVOCATE & ESCALATION OPERATIONS (Role: advocate, admin)
// ============================================================================

// Escalate Grievance
app.post(
  '/api/v1/grievances/:id/escalate',
  requireAuth,
  requireRole(['advocate', 'admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const grievanceId = String(String(req.params.id));
      const { escalationReason, advocateNotes, targetRepresentative } = req.body;

      const grievance = await grievanceDb.getGrievanceById(grievanceId);
      if (!grievance) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Grievance not found.', timestamp: new Date().toISOString() },
        });
        return;
      }

      // Check transition validity
      if (grievance.status === 'resolved') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: 'Cannot escalate a grievance that is already resolved.',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const now = new Date().toISOString();
      const notes = [
        escalationReason ? `Reason: ${escalationReason}` : '',
        advocateNotes ? `Notes: ${advocateNotes}` : '',
        targetRepresentative ? `Target: ${targetRepresentative}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const updated = await grievanceDb.updateGrievance(grievanceId, {
        status: 'escalated',
        escalated_at: now,
        escalated_to_advocate_id: req.user!.id,
        resolution_notes: notes || 'Escalated by labor advocate.',
      });

      await grievanceDb.recordAuditLog(req.user!.id, 'ESCALATE_GRIEVANCE', 'grievances', grievanceId, {
        escalatedTo: req.user!.id,
        notes,
      });

      res.json(formatGrievanceResponse(updated));
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
      });
    }
  }
);

// Resolve Grievance
app.post(
  '/api/v1/grievances/:id/resolve',
  requireAuth,
  requireRole(['advocate', 'admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const grievanceId = String(String(req.params.id));
      const { resolutionNotes } = req.body;

      const grievance = await grievanceDb.getGrievanceById(grievanceId);
      if (!grievance) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Grievance not found.', timestamp: new Date().toISOString() },
        });
        return;
      }

      const updated = await grievanceDb.updateGrievance(grievanceId, {
        status: 'resolved',
        resolution_notes: resolutionNotes || 'Resolved by advocate team.',
      });

      await grievanceDb.recordAuditLog(req.user!.id, 'RESOLVE_GRIEVANCE', 'grievances', grievanceId, {
        resolutionNotes,
      });

      res.json(formatGrievanceResponse(updated));
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
      });
    }
  }
);

// Add Tag
app.post(
  '/api/v1/grievances/:id/tags',
  requireAuth,
  requireRole(['advocate', 'admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const grievanceId = String(String(req.params.id));
      const { tag } = req.body;

      if (!tag || typeof tag !== 'string') {
        res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'tag string is required.', timestamp: new Date().toISOString() },
        });
        return;
      }

      const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
      const tags = await grievanceDb.addTag(grievanceId, cleanTag);
      await grievanceDb.recordAuditLog(req.user!.id, 'ADD_TAG', 'grievance_tags', grievanceId, { tag: cleanTag });

      res.json({ success: true, grievanceId, tags });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
      });
    }
  }
);

// Remove Tag
app.delete(
  '/api/v1/grievances/:id/tags/:tag',
  requireAuth,
  requireRole(['advocate', 'admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = String(String(req.params.id)); const tag = String(req.params.tag);
      const cleanTag = decodeURIComponent(tag).trim().toLowerCase().replace(/^#/, '');

      const tags = await grievanceDb.removeTag(id, cleanTag);
      await grievanceDb.recordAuditLog(req.user!.id, 'REMOVE_TAG', 'grievance_tags', id, { tag: cleanTag });

      res.json({ success: true, grievanceId: id, tags });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
      });
    }
  }
);

// Clusters API
app.get('/api/v1/grievances/clusters', requireAuth, requireRole(['advocate', 'admin']), async (req: Request, res: Response) => {
  try {
    const clusters = await grievanceDb.getClusters();
    res.json({ items: clusters });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

app.get('/api/v1/grievances/clusters/:id', requireAuth, requireRole(['advocate', 'admin']), async (req: Request, res: Response) => {
  try {
    const cluster = await grievanceDb.getClusterById(String(req.params.id));
    if (!cluster) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cluster not found.', timestamp: new Date().toISOString() },
      });
      return;
    }
    res.json(cluster);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
    });
  }
});

// Trigger Clustering
app.post(
  '/api/v1/grievances/clusters/generate',
  requireAuth,
  requireRole(['advocate', 'admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allGrievances = (await grievanceDb.listGrievances({ limit: 200 })).items;
      const { updatedGrievances, clusters } = clusterGrievances(allGrievances);

      for (const c of clusters) {
        await grievanceDb.saveCluster(c);
      }

      for (const g of updatedGrievances) {
        if (g.cluster_id) {
          await grievanceDb.updateGrievance(g.id, {
            cluster_id: g.cluster_id,
            status: g.status,
          });
        }
      }

      res.json({
        success: true,
        clustersFormed: clusters.length,
        clusters,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() },
      });
    }
  }
);

// 404 Catch-All
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found.`,
      timestamp: new Date().toISOString(),
    },
  });
});
