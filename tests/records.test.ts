import { test } from "node:test";
import assert from "node:assert/strict";
import { dataSchema } from "../src/lib/schema";
import { demoData } from "../src/lib/seed";
import {
  completeTask,
  eggSeries,
  feedDays,
  isWithdrawing,
  monthShift,
  shiftDate,
  today,
} from "../src/lib/utils";
test("London dates honour daylight saving around midnight", () => {
  assert.equal(today(new Date("2026-07-10T23:30:00Z")), "2026-07-11");
  assert.equal(today(new Date("2026-01-10T23:30:00Z")), "2026-01-10");
});
test("calendar month arithmetic clamps leap years and month ends", () => {
  assert.equal(monthShift("2024-02-29", 12), "2025-02-28");
  assert.equal(monthShift("2026-08-31", 6), "2027-02-28");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
});
test("withdrawals cover the entire final day and never start early", () => {
  const t = {
    id: "t",
    animalId: "a",
    medicine: "Vet prescribed",
    started: "2026-10-01",
    ended: "2026-10-05",
    withdrawalEnd: "2026-10-08",
    dose: "Label",
    vet: "",
    notes: "",
  };
  assert.equal(isWithdrawing(t, "2026-09-30"), false);
  assert.equal(isWithdrawing(t, "2026-10-08"), true);
  assert.equal(isWithdrawing(t, "2026-10-09"), false);
});
test("repeating care completes once and creates one future occurrence", () => {
  const d = demoData();
  const t = d.tasks[0];
  const tasks = completeTask(d.tasks, t.id);
  assert.equal(tasks.length, d.tasks.length + 1);
  assert.equal(tasks.find((x) => x.id === t.id)?.completed, true);
  const next = tasks.at(-1)!;
  assert.equal(next.due, shiftDate(today(), 1));
  assert.notEqual(next.id, t.id);
  assert.deepEqual(completeTask(tasks, t.id), tasks);
});
test("stock estimates handle no-use and depleted supplies", () => {
  const f = demoData().feed[0];
  assert.equal(feedDays({ ...f, stock: 0 }), 0);
  assert.equal(feedDays({ ...f, dailyUse: 0 }), null);
  assert.equal(feedDays({ ...f, stock: 8.4, dailyUse: 0.7 }), 12);
});
test("egg chart aggregates multiple same-day collections without double counting", () => {
  const d = demoData();
  d.logs.push({ ...d.logs[0], id: "extra", date: today(), value: 2 });
  const days = eggSeries(d);
  assert.equal(days.length, 7);
  assert.equal(days.at(-1)?.count, 6);
});
test("backup schema accepts real samples and rejects invalid counts, IDs and dates", () => {
  const d = demoData();
  assert.equal(dataSchema.safeParse(d).success, true);
  assert.equal(dataSchema.safeParse({ ...d, version: 2 }).success, false);
  assert.equal(
    dataSchema.safeParse({ ...d, animals: [...d.animals, d.animals[0]] })
      .success,
    false,
  );
  assert.equal(
    dataSchema.safeParse({ ...d, feed: [{ ...d.feed[0], stock: -1 }] }).success,
    false,
  );
  assert.equal(
    dataSchema.safeParse({
      ...d,
      habitats: [{ ...d.habitats[2], warmMin: 40, warmMax: 30 }],
    }).success,
    false,
  );
  assert.equal(
    dataSchema.safeParse({
      ...d,
      clutches: [{ ...d.clutches[0], hatched: 100 }],
    }).success,
    false,
  );
});
test("backup validation rejects family cycles and incompatible habitats", () => {
  const d = demoData();
  d.animals[0].motherId = d.animals[1].id;
  d.animals[1].motherId = d.animals[0].id;
  assert.equal(dataSchema.safeParse(d).success, false);
  const other = demoData();
  other.animals[0].habitatId = "terrarium";
  assert.equal(dataSchema.safeParse(other).success, false);
});
