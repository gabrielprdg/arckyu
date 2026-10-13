/** Gravação adiada: só o último valor dentro da janela é escrito; `flush` grava já (troca de desenho, aba escondida). */
export type DebouncedWriter<T> = { schedule: (value: T) => void; flush: () => Promise<void>; cancel: () => void };

/**
 * @example const writer = createDebouncedWriter((scene) => store.save(scene), 500); writer.schedule(scene); await writer.flush();
 */
export const createDebouncedWriter = <T>(write: (value: T) => Promise<void>, delayMs: number): DebouncedWriter<T> => {
  let pending: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const flush = async (): Promise<void> => {
    clearTimer();
    const job = pending;
    pending = null;
    if (job) await write(job.value);
  };

  const schedule = (value: T): void => {
    pending = { value };
    clearTimer();
    timer = setTimeout(() => void flush(), delayMs);
  };

  const cancel = (): void => {
    clearTimer();
    pending = null;
  };

  return { schedule, flush, cancel };
};
