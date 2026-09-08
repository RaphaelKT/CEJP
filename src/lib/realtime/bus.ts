import 'server-only';
import { EventEmitter } from 'node:events';

/**
 * Barramento de eventos em memória que alimenta os streams SSE.
 *
 * Em produção com múltiplas instâncias, troque o `emitter` por um adaptador
 * Redis Pub/Sub mantendo a mesma interface (`publish` / `subscribe`) —
 * nenhum consumidor precisa mudar.
 */
export type CanalEvento = 'contadores' | 'mural' | 'pagamento' | 'midia' | 'membresia';

export type EventoTempoReal = {
  canal: CanalEvento;
  dados: unknown;
  em: string;
};

const globalForBus = globalThis as unknown as { __mebBus?: EventEmitter };
const emitter = globalForBus.__mebBus ?? new EventEmitter();
emitter.setMaxListeners(0);
globalForBus.__mebBus = emitter;

export function publish(canal: CanalEvento, dados: unknown) {
  emitter.emit(canal, { canal, dados, em: new Date().toISOString() } satisfies EventoTempoReal);
  emitter.emit('*', { canal, dados, em: new Date().toISOString() } satisfies EventoTempoReal);
}

export function subscribe(canal: CanalEvento | '*', handler: (evento: EventoTempoReal) => void) {
  emitter.on(canal, handler);
  return () => emitter.off(canal, handler);
}

/** Formata um evento no protocolo text/event-stream. */
export function sseChunk(evento: EventoTempoReal) {
  return `event: ${evento.canal}\ndata: ${JSON.stringify(evento)}\n\n`;
}
