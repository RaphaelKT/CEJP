import 'server-only';
import { prisma } from '@/lib/db';

/**
 * Materializa as ocorrências concretas de culto para as próximas semanas.
 *
 * A grade (`ServiceSchedule`) é recorrente e abstrata; a presença precisa se
 * ligar a um culto específico, com data e hora. Este job transforma a grade
 * em ocorrências reais, de forma idempotente — rodar duas vezes não duplica.
 */
export async function materializarCultos(semanas = 4) {
  const grades = await prisma.serviceSchedule.findMany({
    where: { active: true },
    include: { church: { select: { venueId: true } } },
  });

  let criadas = 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (const grade of grades) {
    for (let semana = 0; semana < semanas; semana++) {
      const data = new Date(hoje);
      const delta = (grade.weekday - hoje.getDay() + 7) % 7;
      data.setDate(hoje.getDate() + delta + semana * 7);

      const [h, m] = grade.startTime.split(':').map(Number);
      data.setHours(h ?? 0, m ?? 0, 0, 0);
      if (data < hoje) continue;

      const jaExiste = await prisma.serviceOccurrence.findFirst({
        where: { scheduleId: grade.id, startsAt: data },
        select: { id: true },
      });
      if (jaExiste) continue;

      const fim = grade.endTime
        ? (() => {
            const [eh, em] = grade.endTime!.split(':').map(Number);
            const f = new Date(data);
            f.setHours(eh ?? 0, em ?? 0, 0, 0);
            return f;
          })()
        : new Date(data.getTime() + 90 * 60_000);

      await prisma.serviceOccurrence.create({
        data: {
          scheduleId: grade.id,
          venueId: grade.church.venueId,
          title: grade.title,
          startsAt: data,
          endsAt: fim,
        },
      });
      criadas += 1;
    }
  }

  return { grades: grades.length, ocorrenciasCriadas: criadas, semanas };
}
