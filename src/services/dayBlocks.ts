export interface DayBlock {
  id: string;
  taskId: string;
  start: string;
  end: string;
}

const timePattern = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;

export function readDayBlocks(day: string): DayBlock[] {
  const data: unknown = JSON.parse(localStorage.getItem(dayBlockKey(day)) ?? "[]");
  if (!Array.isArray(data)) throw new Error("Could not read saved blocks.");
  return data.filter((block): block is DayBlock =>
    block !== null && typeof block === "object" &&
    typeof block.id === "string" && typeof block.taskId === "string" &&
    typeof block.start === "string" && timePattern.test(block.start) &&
    typeof block.end === "string" && timePattern.test(block.end) &&
    block.start < block.end
  );
}

export function dayBlockKey(day: string) {
  return `deepwork-hud:day-blocks:${day}`;
}

function timeOnDay(now: Date, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(now);
  return date.setHours(hour, minute, 0, 0);
}

export function currentDayBlock(blocks: DayBlock[], now: Date) {
  const current = now.getTime();
  for (const block of blocks) {
    const start = timeOnDay(now, block.start);
    const end = timeOnDay(now, block.end);
    if (start <= current && current < end) {
      return { block, secondsLeft: Math.ceil((end - current) / 1000), progress: (current - start) / (end - start) };
    }
  }
  return null;
}
