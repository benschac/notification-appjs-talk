import {
  DOMAIN_EVENTS,
  domainEventSchemas,
  type DomainEventName,
  type DomainEvents,
  type EnrichedDomainEvent,
  type EventMetadata,
} from "./domain-events";

type Listener<EventName extends DomainEventName> = (
  payload: EnrichedDomainEvent<EventName>
) => void | Promise<void>;

const randomId = () =>
  globalThis.crypto?.randomUUID?.() ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export class TypedEventBus {
  readonly EVENTS = DOMAIN_EVENTS;
  readonly schemas = domainEventSchemas;

  private listeners = new Map<DomainEventName, Set<Listener<DomainEventName>>>();

  emit<EventName extends DomainEventName>(
    event: EventName,
    payload: DomainEvents[EventName]
  ): boolean {
    const enrichedPayload = this.validateAndEnrich(event, payload);

    if (!enrichedPayload) {
      return false;
    }

    const listeners = this.listeners.get(event);

    if (!listeners?.size) {
      return false;
    }

    for (const listener of Array.from(listeners)) {
      try {
        void listener(enrichedPayload);
      } catch (error) {
        this.emitSystemError(error, `Listener failed for ${event}`);
      }
    }

    return true;
  }

  async emitAsync<EventName extends DomainEventName>(
    event: EventName,
    payload: DomainEvents[EventName]
  ): Promise<void> {
    const enrichedPayload = this.validateAndEnrich(event, payload);

    if (!enrichedPayload) {
      return;
    }

    const listeners = Array.from(this.listeners.get(event) ?? []);

    if (listeners.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      listeners.map((listener) => Promise.resolve(listener(enrichedPayload)))
    );

    for (const result of results) {
      if (result.status === "rejected") {
        this.emitSystemError(result.reason, `Async listener failed for ${event}`);
      }
    }
  }

  on<EventName extends DomainEventName>(event: EventName, listener: Listener<EventName>): this {
    const listeners = this.listeners.get(event) ?? new Set<Listener<DomainEventName>>();
    listeners.add(listener as Listener<DomainEventName>);
    this.listeners.set(event, listeners);
    return this;
  }

  once<EventName extends DomainEventName>(event: EventName, listener: Listener<EventName>): this {
    const onceListener: Listener<EventName> = async (payload) => {
      this.off(event, onceListener);
      await listener(payload);
    };

    return this.on(event, onceListener);
  }

  off<EventName extends DomainEventName>(event: EventName, listener: Listener<EventName>): this {
    this.listeners.get(event)?.delete(listener as Listener<DomainEventName>);
    return this;
  }

  clear(event?: DomainEventName): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }

    return this;
  }

  listenerCount(event: DomainEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  private validateAndEnrich<EventName extends DomainEventName>(
    event: EventName,
    payload: DomainEvents[EventName]
  ): EnrichedDomainEvent<EventName> | null {
    const schema = domainEventSchemas[event]?.payload;

    if (!schema) {
      this.emitSystemError(new Error(`Unknown event: ${event}`), "Event validation failed");
      return null;
    }

    try {
      const validatedPayload = schema.parse(payload) as DomainEvents[EventName];
      const metadata: EventMetadata<EventName> = {
        eventType: event,
        emittedAt: new Date().toISOString(),
        eventId: randomId(),
      };

      return {
        ...validatedPayload,
        ...metadata,
      };
    } catch (error) {
      this.emitSystemError(error, `Event validation failed for ${event}`);
      return null;
    }
  }

  private emitSystemError(error: unknown, context: string): void {
    if (context.startsWith("Listener failed for system.error")) {
      return;
    }

    const systemErrorListeners = this.listeners.get(DOMAIN_EVENTS.SYSTEM.ERROR);

    if (!systemErrorListeners?.size) {
      return;
    }

    const payload: EnrichedDomainEvent<typeof DOMAIN_EVENTS.SYSTEM.ERROR> = {
      context,
      error,
      occurredAt: new Date().toISOString(),
      eventType: DOMAIN_EVENTS.SYSTEM.ERROR,
      emittedAt: new Date().toISOString(),
      eventId: randomId(),
    };

    for (const listener of Array.from(systemErrorListeners)) {
      try {
        void listener(payload);
      } catch {
        // Avoid recursive error reporting if the error listener itself fails.
      }
    }
  }
}

export {
  DOMAIN_EVENTS,
  domainEventSchemas,
  type DomainEventName,
  type DomainEvents,
  type EnrichedDomainEvent,
  type EventMetadata,
} from "./domain-events";

export const eventBus = new TypedEventBus();
