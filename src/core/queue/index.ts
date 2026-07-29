/**
 * StockAI Enterprise Queue Foundation
 *
 * This provides a modular, in-memory queue implementation that is
 * ready to be swapped for BullMQ + Redis with minimal code changes.
 *
 * The IQueue interface is the contract. InMemoryQueue is the current implementation.
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
export type JobPriority = 'critical' | 'high' | 'normal' | 'low';
export type JobType =
  | 'generate-metadata'
  | 'generate-prompt'
  | 'export-csv'
  | 'send-email'
  | 'health-check'
  | 'cache-invalidate';

export interface QueueJob<T = any> {
  id: string;
  type: JobType;
  priority: JobPriority;
  payload: T;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  result?: any;
}

export interface IQueue {
  enqueue<T>(type: JobType, payload: T, options?: { priority?: JobPriority; maxAttempts?: number }): Promise<QueueJob<T>>;
  getJob(id: string): QueueJob | undefined;
  getStatus(id: string): JobStatus | undefined;
  listJobs(filter?: { type?: JobType; status?: JobStatus }): QueueJob[];
  getStats(): { total: number; pending: number; processing: number; completed: number; failed: number };
  clear(): void;
}

// Priority weight for sorting (lower = higher priority)
const PRIORITY_WEIGHT: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3
};

class InMemoryQueue implements IQueue {
  private jobs: Map<string, QueueJob> = new Map();
  private readonly MAX_JOBS = 1000; // Memory safety cap

  async enqueue<T>(
    type: JobType,
    payload: T,
    options: { priority?: JobPriority; maxAttempts?: number } = {}
  ): Promise<QueueJob<T>> {
    // Evict oldest completed/failed jobs if at cap
    if (this.jobs.size >= this.MAX_JOBS) {
      const evictable = Array.from(this.jobs.values())
        .filter(j => j.status === 'completed' || j.status === 'failed')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (evictable.length > 0) this.jobs.delete(evictable[0].id);
    }

    const job: QueueJob<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      priority: options.priority || 'normal',
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: options.maxAttempts || 3
    };

    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): QueueJob | undefined {
    return this.jobs.get(id);
  }

  getStatus(id: string): JobStatus | undefined {
    return this.jobs.get(id)?.status;
  }

  listJobs(filter?: { type?: JobType; status?: JobStatus }): QueueJob[] {
    let jobs = Array.from(this.jobs.values());
    if (filter?.type) jobs = jobs.filter(j => j.type === filter.type);
    if (filter?.status) jobs = jobs.filter(j => j.status === filter.status);
    // Sort by priority then creation time
    return jobs.sort((a, b) => {
      const pDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  getStats() {
    const all = Array.from(this.jobs.values());
    return {
      total: all.length,
      pending: all.filter(j => j.status === 'pending').length,
      processing: all.filter(j => j.status === 'processing').length,
      completed: all.filter(j => j.status === 'completed').length,
      failed: all.filter(j => j.status === 'failed').length
    };
  }

  /**
   * Mark a job as processing — called by worker before execution.
   */
  markProcessing(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'processing';
      job.startedAt = new Date().toISOString();
      job.attempts++;
    }
  }

  /**
   * Mark a job as completed with result.
   */
  markCompleted(id: string, result?: any): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.result = result;
    }
  }

  /**
   * Mark a job as failed. Will retry if attempts < maxAttempts.
   */
  markFailed(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.lastError = error;
    if (job.attempts < job.maxAttempts) {
      job.status = 'retrying';
    } else {
      job.status = 'failed';
      job.failedAt = new Date().toISOString();
    }
  }

  clear(): void {
    this.jobs.clear();
  }
}

// Singleton queue instance
export const StockAiQueue = new InMemoryQueue();
