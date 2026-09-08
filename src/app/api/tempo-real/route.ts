import { subscribe, sseChunk, type CanalEvento } from '@/lib/realtime/bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CANAIS_VALIDOS: CanalEvento[] = ['contadores', 'mural', 'pagamento', 'midia', 'membresia'];

/**
 * Stream SSE de eventos do servidor para o navegador.
 *
 * Escolhemos SSE em vez de WebSocket porque o tráfego é unidirecional
 * (servidor → cliente), atravessa proxies HTTP sem configuração extra e
 * traz reconexão automática nativa no `EventSource`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const solicitados = (url.searchParams.get('canais') ?? 'contadores')
    .split(',')
    .map((c) => c.trim())
    .filter((c): c is CanalEvento => CANAIS_VALIDOS.includes(c as CanalEvento));

  const canais = solicitados.length ? solicitados : (['contadores'] as CanalEvento[]);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enviar = (texto: string) => {
        try {
          controller.enqueue(encoder.encode(texto));
        } catch {
          /* stream já fechado */
        }
      };

      enviar(`retry: 4000\n\n`);
      enviar(`event: conectado\ndata: ${JSON.stringify({ canais, em: new Date().toISOString() })}\n\n`);

      const cancelamentos = canais.map((canal) => subscribe(canal, (evento) => enviar(sseChunk(evento))));

      // Heartbeat: mantém a conexão viva atrás de proxies com timeout curto.
      const batida = setInterval(() => enviar(`: ping ${Date.now()}\n\n`), 25_000);

      const encerrar = () => {
        clearInterval(batida);
        for (const cancelar of cancelamentos) cancelar();
        try {
          controller.close();
        } catch {
          /* já fechado */
        }
      };

      req.signal.addEventListener('abort', encerrar);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
