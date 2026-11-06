import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { currentDayBlock, readDayBlocks } from "../services/dayBlocks";
import { localDay } from "../services/taskQueue";
import type { DailyQueueItem } from "../services/taskQueue";

export default function ScheduledCountdown({ tasks, children, onExpand }: { tasks: DailyQueueItem[]; children: ReactNode; onExpand?: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const day = localDay(now);
  const [schedule, setSchedule] = useState(() => loadSchedule(day));

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    setSchedule(loadSchedule(day));
  }, [day]);

  const active = schedule.day === day ? currentDayBlock(schedule.blocks, now) : null;
  const task = tasks.find((item) => item.id === active?.block.taskId && item.scheduledDate === day);
  if (!active || !task) return <>{children}</>;

  const minutes = Math.floor(active.secondsLeft / 60);
  const seconds = String(active.secondsLeft % 60).padStart(2, "0");
  const content = <>
    <div className="scheduled-countdown__task" title={task.title}>{task.title}</div>
    <div className="timer__clock" aria-label="Time left in scheduled block">{minutes}:{seconds}</div>
    <div className="scheduled-countdown__progress" aria-hidden="true">
      <span style={{ width: `${active.progress * 100}%` }} />
    </div>
  </>;
  return onExpand
    ? <button type="button" className="timer scheduled-countdown scheduled-countdown--button" onClick={onExpand} title="Expand timer panel">{content}</button>
    : <div className="timer scheduled-countdown">{content}</div>;
}

function loadSchedule(day: string) {
  try {
    return { day, blocks: readDayBlocks(day) };
  } catch {
    return { day, blocks: [] };
  }
}
