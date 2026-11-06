import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { DailyQueueItem } from "../services/taskQueue";

import { dayBlockKey, readDayBlocks } from "../services/dayBlocks";
import type { DayBlock } from "../services/dayBlocks";
import "./DayBlocks.css";

const HOUR_HEIGHT = 72;
const hours = Array.from({ length: 24 }, (_, hour) => hour);

function minuteOfDay(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h < 12 ? "AM" : "PM"}`;
}

function parseTime(value: string) {
  const match = /^(1[0-2]|0?[1-9])(?::?([0-5][0-9]))?\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return null;
  const [, hour, minute = "00", period] = match;
  const h = Number(hour) % 12 + (period.toUpperCase() === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function hourLabel(hour: number) {
  return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

export default function DayBlocks({ day, tasks }: { day: string; tasks: DailyQueueItem[] }) {
  const key = dayBlockKey(day);
  const [stored, setStored] = useState(() => {
    try {
      return { blocks: readDayBlocks(day), error: "" };
    } catch {
      return { blocks: [] as DayBlock[], error: "Could not load saved blocks." };
    }
  });
  const [now, setNow] = useState(() => new Date());
  const timeline = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (timeline.current) timeline.current.scrollTop = Math.max(0, new Date().getHours() - 1) * HOUR_HEIGHT;
  }, []);
  const currentMinute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const [draft, setDraft] = useState({ taskId: "", start: "", end: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const blocks = stored.blocks.filter((block) => tasksById.has(block.taskId));

  function save(next: DayBlock[]) {
    try {
      const sorted = [...next].sort((a, b) => a.start.localeCompare(b.start));
      localStorage.setItem(key, JSON.stringify(sorted));
      setStored({ blocks: sorted, error: "" });
      setError("");
      return true;
    } catch {
      setError("Could not save your day blocks.");
      return false;
    }
  }

  function clearDraft() {
    setDraft({ taskId: "", start: "", end: "" });
    setEditing(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!tasksById.has(draft.taskId)) {
      setError("Choose a task from Today.");
      return;
    }
    const start = parseTime(draft.start);
    const end = parseTime(draft.end);
    if (!start || !end) {
      setError("Enter both times with AM or PM, for example 3:00 PM and 3:20 PM.");
      return;
    }
    if (start >= end) {
      setError("Choose an end time after the start time on the same day.");
      return;
    }
    const otherBlocks = blocks.filter((block) => block.id !== editing);
    if (otherBlocks.some((block) => start < block.end && block.start < end)) {
      setError("This overlaps another block. Pick a different time.");
      return;
    }
    if (save([...otherBlocks, { ...draft, start, end, id: editing ?? crypto.randomUUID() }])) clearDraft();
  }

  return <section className="day-plan">
    <h2>Day schedule</h2>
    <div className="day-plan__layout">
      <div className="day-plan__scroll" ref={timeline} aria-label="Day timeline">
        <div className="day-plan__grid" style={{ height: 24 * HOUR_HEIGHT }}>
          {hours.map((hour) => <button
            type="button"
            className="day-plan__hour"
            key={hour}
            style={{ height: HOUR_HEIGHT }}
            disabled={!tasks.length || Boolean(stored.error)}
            aria-label={`Add block at ${hourLabel(hour)}`}
            onClick={() => {
              const start = `${String(hour).padStart(2, "0")}:00`;
              setEditing(null);
              setDraft({ taskId: draft.taskId, start: formatTime(start), end: formatTime(`${start.slice(0, 2)}:30`) });
              setError("");
            }}
          >{hourLabel(hour)}</button>)}
          {blocks.map((block) => {
            const start = minuteOfDay(block.start);
            const end = minuteOfDay(block.end);
            const title = tasksById.get(block.taskId)?.title;
            return <button
              type="button"
              className="day-plan__block"
              key={block.id}
              aria-pressed={editing === block.id}
              title={`${title} · ${formatTime(block.start)}–${formatTime(block.end)}`}
              style={{ top: start * HOUR_HEIGHT / 60, height: (end - start) * HOUR_HEIGHT / 60 }}
              onClick={() => {
                setEditing(block.id);
                setDraft({ taskId: block.taskId, start: formatTime(block.start), end: formatTime(block.end) });
                setError("");
              }}
            >{title} <span>{formatTime(block.start)}–{formatTime(block.end)}</span></button>;
          })}
          <div className="day-plan__now" aria-hidden="true" style={{ top: currentMinute * HOUR_HEIGHT / 60 }} />
        </div>
      </div>
      <div className="day-plan__editor">
        {(error || stored.error) && <p className="inline-error" role="alert">{error || stored.error}</p>}
        {tasks.length === 0 ? <p className="queue-hint">Add a task to plan a time block.</p> :
          <form className="queue-editor" onSubmit={submit}>
            <h2>{editing ? "Edit time block" : "Add time block"}</h2>
            <label>Task
              <select required value={draft.taskId} onChange={(event) => setDraft({ ...draft, taskId: event.target.value })}>
                <option value="">Choose a task</option>
                {tasks.map((task) => <option value={task.id} key={task.id}>{task.title}</option>)}
              </select>
            </label>
            <p className="queue-hint" id="day-block-time-hint">Type 3 pm or 320 pm. The colon and :00 are optional.</p>
            <div className="queue-editor__numbers">
              <label>Start<input type="text" placeholder="3:00 PM" aria-describedby="day-block-time-hint" required value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label>
              <label>End<input type="text" placeholder="3:20 PM" aria-describedby="day-block-time-hint" required value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>
            </div>
            <div className="edit-actions">
              {editing && <>
                <button type="button" onClick={() => { clearDraft(); setError(""); }}>Cancel</button>
                <button type="button" onClick={() => {
                  if (save(blocks.filter((block) => block.id !== editing))) clearDraft();
                }}>Remove block</button>
              </>}
              <button type="submit" className="primary-action" disabled={Boolean(stored.error)}>Save block</button>
            </div>
          </form>}
      </div>
    </div>
  </section>;
}
