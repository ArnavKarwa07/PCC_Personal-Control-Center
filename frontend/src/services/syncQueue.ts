import {
  tasksApi,
  notesApi,
  projectsApi,
  ideasApi,
  calendarApi,
  remindersApi,
  alarmsApi,
  goalsApi,
  contactsApi,
} from "./api";

export interface QueuedMutation {
  id: string;
  timestamp: number;
  entityType:
    | "task"
    | "note"
    | "project"
    | "idea"
    | "calendar"
    | "reminder"
    | "alarm"
    | "goal"
    | "contact";
  action: "create" | "update" | "delete";
  entityId: string;
  payload?: any;
  retryCount: number;
}

const SYNC_QUEUE_KEY = "pcc_sync_queue";

class SyncQueueService {
  private isFlushing = false;

  private getQueue(): QueuedMutation[] {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setQueue(queue: QueuedMutation[]): void {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn("Failed to save sync queue", err);
    }
  }

  public enqueue(
    mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount">,
  ): void {
    const queue = this.getQueue();

    // Deduplication logic: If there's an existing mutation for the same entity, merge or overwrite
    const existingIndex = queue.findIndex(
      (m) =>
        m.entityType === mutation.entityType &&
        m.entityId === mutation.entityId,
    );

    if (existingIndex !== -1) {
      const existing = queue[existingIndex];
      if (mutation.action === "delete") {
        // If it's a delete, replace previous updates/creates, or remove if it was only just created
        if (existing.action === "create") {
          queue.splice(existingIndex, 1);
          this.setQueue(queue);
          return;
        } else {
          queue[existingIndex] = {
            ...existing,
            action: "delete",
            payload: undefined,
            timestamp: Date.now(),
          };
        }
      } else if (mutation.action === "update" && existing.action === "update") {
        // Merge updates
        queue[existingIndex] = {
          ...existing,
          payload: { ...existing.payload, ...mutation.payload },
          timestamp: Date.now(),
        };
      } else if (mutation.action === "update" && existing.action === "create") {
        // Apply update to the create payload
        queue[existingIndex] = {
          ...existing,
          payload: { ...existing.payload, ...mutation.payload },
          timestamp: Date.now(),
        };
      } else {
        // Default: add new mutation
        queue.push({
          ...mutation,
          id: crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(),
          timestamp: Date.now(),
          retryCount: 0,
        });
      }
    } else {
      queue.push({
        ...mutation,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        timestamp: Date.now(),
        retryCount: 0,
      });
    }

    this.setQueue(queue);

    // Dispatch an event to update the UI
    window.dispatchEvent(new Event("syncQueueChanged"));
  }

  public peek(): QueuedMutation[] {
    return this.getQueue();
  }

  public clear(): void {
    this.setQueue([]);
    window.dispatchEvent(new Event("syncQueueChanged"));
  }

  public getQueueSize(): number {
    return this.getQueue().length;
  }

  private getApiForEntity(entityType: QueuedMutation["entityType"]) {
    switch (entityType) {
      case "task":
        return tasksApi;
      case "note":
        return notesApi;
      case "project":
        return projectsApi;
      case "idea":
        return ideasApi;
      case "calendar":
        return calendarApi;
      case "reminder":
        return remindersApi;
      case "alarm":
        return alarmsApi;
      case "goal":
        return goalsApi;
      case "contact":
        return contactsApi;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  public async flushQueue(): Promise<void> {
    if (this.isFlushing) return;
    this.isFlushing = true;
    try {
      const queue = this.getQueue();
      if (queue.length === 0) return;

      const remainingQueue: QueuedMutation[] = [];
      let stopped = false;

      for (let i = 0; i < queue.length; i++) {
        const mutation = queue[i];
        if (stopped) {
          remainingQueue.push(mutation);
          continue;
        }

        try {
          const api = this.getApiForEntity(mutation.entityType);

          if (mutation.action === "create") {
            await api.create(mutation.payload);
          } else if (mutation.action === "update") {
            // Exclude certain fields that shouldn't be sent back
            await (api as any).update(mutation.entityId, mutation.payload);
          } else if (mutation.action === "delete") {
            await api.delete(mutation.entityId);
          }
        } catch (error: any) {
          // If it's a 404 on delete or update, the item might be already gone, so we can drop the mutation
          if (error?.code === 404) {
            console.warn(`Dropped mutation due to 404:`, mutation);
            continue; // Successfully "processed" by dropping
          }

          // If it's a network error, stop flushing and keep remaining
          if (error?.code === "NETWORK_ERROR" || !navigator.onLine) {
            mutation.retryCount += 1;
            remainingQueue.push(mutation);
            stopped = true; // Stop processing further mutations
          } else {
            // Some other error (400, 500). Should we drop it or retry?
            // For now, let's keep it but mark it with high retry count, or drop if retried too many times.
            mutation.retryCount += 1;
            if (mutation.retryCount > 3) {
              console.error(`Dropped mutation after 3 retries:`, mutation);
            } else {
              remainingQueue.push(mutation);
              stopped = true;
            }
          }
        }
      }

      this.setQueue(remainingQueue);
      window.dispatchEvent(new Event("syncQueueChanged"));
    } finally {
      this.isFlushing = false;
    }
  }
}

export const syncQueue = new SyncQueueService();
