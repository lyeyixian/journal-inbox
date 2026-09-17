// Home of the grammY polling loop, clock-driven slots, the before-bed recheck
// timer and the nightly sort. Each arrives with its own ticket.
export function startWorker(): { stop(): void } {
  return { stop() {} };
}
