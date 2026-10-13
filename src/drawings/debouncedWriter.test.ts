import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedWriter } from "./debouncedWriter";

describe("createDebouncedWriter", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("grava só o último valor depois do atraso", async () => {
    const written: number[] = [];
    const writer = createDebouncedWriter(async (value: number) => { written.push(value); }, 500);
    writer.schedule(1);
    writer.schedule(2);
    await vi.advanceTimersByTimeAsync(499);
    expect(written).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(written).toEqual([2]);
  });
  it("flush grava na hora e não repete depois", async () => {
    const written: number[] = [];
    const writer = createDebouncedWriter(async (value: number) => { written.push(value); }, 500);
    writer.schedule(7);
    await writer.flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(written).toEqual([7]);
  });
  it("cancel descarta o pendente", async () => {
    const written: number[] = [];
    const writer = createDebouncedWriter(async (value: number) => { written.push(value); }, 500);
    writer.schedule(3);
    writer.cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(written).toEqual([]);
  });
});
