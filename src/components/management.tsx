"use client";
import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Bird,
  CalendarDays,
  Check,
  ChevronRight,
  Droplets,
  Egg,
  Grid2X2,
  Heart,
  House,
  Leaf,
  List,
  Plus,
  Search,
  ShieldCheck,
  Thermometer,
  Trash2,
  Turtle,
  Wheat,
  Pencil,
  Clock3,
  AlertTriangle,
} from "lucide-react";
import type { Animal, PageId, Workspace } from "@/lib/types";
import {
  ageLabel,
  daysBetween,
  feedDays,
  formatDate,
  isWithdrawing,
  money,
  monthShift,
  today,
  shiftDate,
  eggSeries,
} from "@/lib/utils";
import { useData } from "./store";
import { Badge, Empty, Modal, SectionTitle } from "./ui";
import { AnimalCard, EggChart, TaskList } from "./dashboard";
import { Resources, KeeperSettings } from "./resources";
import type { Editor } from "./editors";

const details: Record<PageId, { title: string; description: string }> = {
  overview: { title: "Overview", description: "" },
  animals: {
    title: "Your feathered & scaled friends",
    description: "Every name, every personality, every little detail.",
  },
  habitats: {
    title: "A place to call home",
    description: "Keep coops cosy and habitats just right.",
  },
  records: {
    title: "The little things, remembered",
    description: "Eggs, feeds, check-ups and everything in between.",
  },
  planner: {
    title: "Good care has a rhythm",
    description:
      "A thoughtful plan for your daily, weekly and seasonal routines.",
  },
  health: {
    title: "Healthy animals, happy keeper",
    description: "Health observations, treatment records and withdrawal dates.",
  },
  feed: {
    title: "A well-stocked little world",
    description: "Know what's in the cupboard and when to top it up.",
  },
  breeding: {
    title: "New beginnings",
    description: "Follow every clutch, hatch and family connection.",
  },
  insights: {
    title: "See how your care adds up",
    description: "Small daily records tell a bigger story.",
  },
  guide: {
    title: "A helping hand for keepers",
    description: "Practical checklists and trusted UK guidance, close at hand.",
  },
  directory: {
    title: "Find your people",
    description: "Trusted places to find specialist help and supplies.",
  },
  settings: {
    title: "Make yourself at home",
    description: "Your keeper details, collection and device backups.",
  },
};
export function ManagementPage({
  page,
  workspace,
  navigate,
  edit,
  showAnimal,
}: {
  page: PageId;
  workspace: Workspace;
  navigate: (p: PageId) => void;
  edit: (e: Editor) => void;
  showAnimal: (a: Animal) => void;
}) {
  const { data, update, toast } = useData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("grid");
  const [taskRange, setTaskRange] = useState("today");
  const [recordKind, setRecordKind] = useState("all");
  const [recordDate, setRecordDate] = useState("");
  const [confirm, setConfirm] = useState<{
    kind: "logs" | "tasks" | "treatments" | "clutches" | "feed";
    id: string;
    label: string;
  } | null>(null);
  const animals = data.animals.filter(
    (a) =>
      (workspace === "all" || a.kind === workspace) &&
      (status === "all" || a.status === status) &&
      `${a.name} ${a.species} ${a.breed}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const habitats = data.habitats.filter(
    (h) => workspace === "all" || h.kind === workspace,
  );
  const tasks = data.tasks
    .filter(
      (t) =>
        (workspace === "all" || t.kind === workspace || t.kind === "all") &&
        (taskRange === "completed"
          ? t.completed
          : !t.completed &&
            (taskRange === "today"
              ? t.due <= today()
              : taskRange === "week"
                ? t.due <= shiftDate(today(), 7)
                : true)),
    )
    .sort((a, b) => `${a.due} ${a.time}`.localeCompare(`${b.due} ${b.time}`));
  const logs = data.logs
    .filter(
      (l) =>
        (workspace === "all" || l.workspace === workspace) &&
        (recordKind === "all" || l.kind === recordKind) &&
        (!recordDate || l.date === recordDate),
    )
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const feed = data.feed.filter(
    (f) => workspace === "all" || f.kind === workspace,
  );
  const treatments = data.treatments.filter((t) => {
    const a = data.animals.find((a) => a.id === t.animalId);
    return workspace === "all" || a?.kind === workspace;
  });
  const clutches = data.clutches.filter(
    (c) => workspace === "all" || c.kind === workspace,
  );
  const types: Partial<Record<PageId, Editor["type"]>> = {
    animals: "animal",
    habitats: "habitat",
    records: "log",
    planner: "task",
    health: "treatment",
    feed: "feed",
    breeding: "clutch",
  };
  const addLabels: Partial<Record<PageId, string>> = {
    animals: "Add animal",
    habitats: "Add habitat",
    records: "Add record",
    planner: "Add task",
    health: "Record treatment",
    feed: "Add supply",
    breeding: "Start a hatch",
  };
  return (
    <>
      <div className="page-heading management-heading">
        <div>
          <div className="eyebrow">
            YOUR LITTLE WORLD ·{" "}
            {workspace === "all" ? "ALL ANIMALS" : workspace.toUpperCase()}
          </div>
          <h1>{details[page].title}</h1>
          <p>{details[page].description}</p>
        </div>
        {types[page] ? (
          <button
            className="button primary"
            onClick={() => edit({ type: types[page]! })}
          >
            <Plus size={17} />
            {addLabels[page]}
          </button>
        ) : null}
      </div>
      {page === "animals" ? (
        <>
          <div className="filter-bar">
            <div className="input-search">
              <Search size={17} />
              <input
                aria-label="Search animals"
                placeholder="Search names, species or breeds…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Filter animal health status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All health statuses</option>
              {["Healthy", "Monitoring", "Quarantine", "Deceased"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <div className="view-switch">
              <button
                aria-label="Grid view"
                className={view === "grid" ? "selected" : ""}
                onClick={() => setView("grid")}
              >
                <Grid2X2 size={17} />
              </button>
              <button
                aria-label="List view"
                className={view === "list" ? "selected" : ""}
                onClick={() => setView("list")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
          <div className="result-count">
            {animals.length} {animals.length === 1 ? "animal" : "animals"} in
            your collection
          </div>
          {animals.length ? (
            view === "grid" ? (
              <div className="animal-grid full-grid">
                {animals.map((a) => (
                  <AnimalCard
                    key={a.id}
                    animal={a}
                    onClick={() => showAnimal(a)}
                  />
                ))}
              </div>
            ) : (
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Species / breed</th>
                      <th>Home</th>
                      <th>Status</th>
                      <th>Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => showAnimal(a)}
                          >
                            {a.name}
                            <ChevronRight size={14} />
                          </button>
                        </td>
                        <td>
                          {a.species}
                          <small>{a.breed}</small>
                        </td>
                        <td>
                          {data.habitats.find((h) => h.id === a.habitatId)
                            ?.name ?? "Unassigned"}
                        </td>
                        <td>
                          <Badge
                            tone={a.status === "Healthy" ? "green" : "amber"}
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td>{ageLabel(a.born)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <Empty
              title={
                query || status !== "all"
                  ? "No matching animals"
                  : "Your crew starts here"
              }
              description={
                query || status !== "all"
                  ? "Try a different search or health filter."
                  : "Add your first animal and make a little room for good care."
              }
              action={
                <button
                  className="button primary"
                  onClick={() => edit({ type: "animal" })}
                >
                  <Plus size={16} />
                  Add animal
                </button>
              }
            />
          )}
        </>
      ) : null}
      {page === "habitats" ? (
        <div className="habitat-grid">
          {habitats.map((h) => {
            const occupants = data.animals.filter(
              (a) => a.habitatId === h.id && a.status !== "Deceased",
            );
            const latest = data.logs
              .filter((l) => l.kind === "Environment" && l.habitatId === h.id)
              .sort((a, b) =>
                `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
              )[0];
            const fresh = latest?.date === today();
            const ranges = [
              {
                label: "Warm side",
                value: latest?.temperature,
                min: h.warmMin,
                max: h.warmMax,
                unit: "°C",
                icon: Thermometer,
              },
              {
                label: "Cool side",
                value: latest?.coolTemperature,
                min: h.coolMin,
                max: h.coolMax,
                unit: "°C",
                icon: Thermometer,
              },
              {
                label: "Humidity",
                value: latest?.humidity,
                min: h.humidityMin,
                max: h.humidityMax,
                unit: "%",
                icon: Droplets,
              },
            ];
            const outside =
              fresh &&
              ranges.some(
                (r) =>
                  r.value !== undefined && (r.value < r.min || r.value > r.max),
              );
            const uvbDue =
              h.uvbReplaced && h.uvbMonths
                ? monthShift(h.uvbReplaced, h.uvbMonths)
                : "";
            return (
              <section className="panel habitat-card" key={h.id}>
                <div className="habitat-card-head">
                  <span
                    className={`large-icon ${h.kind === "poultry" ? "sage" : "sand"}`}
                  >
                    {h.kind === "poultry" ? (
                      <House size={24} />
                    ) : (
                      <Turtle size={24} />
                    )}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${h.name}`}
                    onClick={() => edit({ type: "habitat", entityId: h.id })}
                  >
                    <Pencil size={17} />
                  </button>
                </div>
                <h2>{h.name}</h2>
                <p>{h.type}</p>
                <div className="habitat-description">{h.description}</div>
                <div className="habitat-occupants">
                  <UsersIcon />
                  {occupants.length}{" "}
                  {h.kind === "poultry" ? "birds" : "reptiles"}
                  <span>
                    {occupants.map((a) => a.name).join(", ") ||
                      "Ready for a new resident"}
                  </span>
                </div>
                {h.kind === "reptile" ? (
                  <>
                    <div className="environment-readings">
                      {ranges.map((r) => (
                        <div key={r.label}>
                          <span>
                            <r.icon size={14} />
                            {r.label}
                          </span>
                          <strong
                            className={
                              fresh &&
                              r.value !== undefined &&
                              (r.value < r.min || r.value > r.max)
                                ? "warning-text"
                                : ""
                            }
                          >
                            {r.value ?? "—"}
                            {r.unit}
                          </strong>
                          <small>
                            Target {r.min}–{r.max}
                            {r.unit}
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className="reading-status">
                      <Badge
                        tone={!fresh ? "neutral" : outside ? "amber" : "green"}
                      >
                        {!fresh
                          ? "Today's check due"
                          : outside
                            ? "Outside your targets"
                            : "Within your targets"}
                      </Badge>
                      <small>
                        {latest
                          ? `Last reading ${formatDate(latest.date)} · ${latest.time}`
                          : "No readings recorded"}
                      </small>
                    </div>
                    {uvbDue ? (
                      <div
                        className={`uvb-note ${uvbDue <= shiftDate(today(), 14) ? "due" : ""}`}
                      >
                        <Leaf size={15} />
                        UVB lamp review {formatDate(uvbDue)}
                        {uvbDue < today() ? " · overdue" : ""}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="coop-summary">
                    <span>
                      <Egg size={18} />
                      <strong>
                        {data.logs
                          .filter(
                            (l) =>
                              l.kind === "Eggs" &&
                              l.habitatId === h.id &&
                              l.date === today(),
                          )
                          .reduce((s, l) => s + l.value, 0)}
                      </strong>{" "}
                      eggs today
                    </span>
                    <span>
                      <ShieldCheck size={18} />
                      {data.logs
                        .filter(
                          (l) => l.kind === "Cleaning" && l.habitatId === h.id,
                        )
                        .sort((a, b) => b.date.localeCompare(a.date))[0]
                        ? "Cleaning recorded"
                        : "Ready for a cleaning record"}
                    </span>
                  </div>
                )}
                <div className="habitat-actions">
                  <button
                    className="button secondary"
                    onClick={() =>
                      edit({
                        type: "log",
                        logKind: h.kind === "poultry" ? "Eggs" : "Environment",
                        habitatId: h.id,
                      })
                    }
                  >
                    <Plus size={15} />
                    Record {h.kind === "poultry" ? "eggs" : "conditions"}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Add care task for ${h.name}`}
                    onClick={() => edit({ type: "task", habitatId: h.id })}
                  >
                    <CalendarDays size={18} />
                  </button>
                </div>
              </section>
            );
          })}
          {!habitats.length ? (
            <Empty
              title="Every animal deserves a good home"
              description="Add a coop, brooder, vivarium or terrarium."
              action={
                <button
                  className="button primary"
                  onClick={() => edit({ type: "habitat" })}
                >
                  Add habitat
                </button>
              }
            />
          ) : null}
        </div>
      ) : null}
      {page === "records" ? (
        <>
          <div className="filter-bar">
            <div className="segmented">
              <button
                className={recordKind === "all" ? "selected" : ""}
                onClick={() => setRecordKind("all")}
              >
                All records
              </button>
              {(workspace === "reptile"
                ? ["Feeding", "Weight", "Shedding", "Environment"]
                : ["Eggs", "Feeding", "Health"]
              ).map((k) => (
                <button
                  key={k}
                  className={recordKind === k ? "selected" : ""}
                  onClick={() => setRecordKind(k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="date-filter">
              <input
                type="date"
                aria-label="Filter records by date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
              {recordDate ? (
                <button className="text-link" onClick={() => setRecordDate("")}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          {logs.length ? (
            <section className="panel table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Record</th>
                    <th>Animal / habitat</th>
                    <th>Details</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {formatDate(l.date)}
                        <small>{l.time}</small>
                      </td>
                      <td>
                        <Badge
                          tone={l.workspace === "poultry" ? "green" : "amber"}
                        >
                          {l.kind}
                        </Badge>
                      </td>
                      <td>
                        {data.animals.find((a) => a.id === l.animalId)?.name ??
                          data.habitats.find((h) => h.id === l.habitatId)
                            ?.name ??
                          "Collection"}
                      </td>
                      <td>
                        {l.kind === "Environment"
                          ? `${l.temperature}°C warm · ${l.coolTemperature}°C cool · ${l.humidity}%`
                          : ["Eggs", "Weight", "Feeding"].includes(l.kind)
                            ? `${l.value} ${l.unit}`
                            : "Observation"}
                      </td>
                      <td className="record-notes">{l.notes || "—"}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${l.kind} record from ${l.date}`}
                          onClick={() =>
                            setConfirm({
                              kind: "logs",
                              id: l.id,
                              label: `${l.kind} record from ${formatDate(l.date)}`,
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <Empty
              title="A fresh page in your care journal"
              description="Add a daily record, or clear your filters to see earlier entries."
              action={
                <button
                  className="button primary"
                  onClick={() => edit({ type: "log" })}
                >
                  Add record
                </button>
              }
            />
          )}
        </>
      ) : null}
      {page === "planner" ? (
        <>
          <div className="filter-bar">
            <div className="segmented">
              {[
                { id: "today", name: "Today" },
                { id: "week", name: "Next 7 days" },
                { id: "all", name: "All upcoming" },
                { id: "completed", name: "Completed" },
              ].map((r) => (
                <button
                  key={r.id}
                  className={taskRange === r.id ? "selected" : ""}
                  onClick={() => setTaskRange(r.id)}
                >
                  {r.name}
                </button>
              ))}
            </div>
            <Badge tone="neutral">In-app reminders</Badge>
          </div>
          <div className="panel planner-panel">
            <SectionTitle
              title={
                taskRange === "completed"
                  ? "Good things, done"
                  : taskRange === "today"
                    ? "A little care today"
                    : "The days ahead"
              }
              subtitle="Completing a repeating task automatically schedules the next occurrence."
            />
            {[...new Set(tasks.map((t) => t.due))].map((date) => (
              <section className="planner-day" key={date}>
                <h3>
                  <CalendarDays size={16} />
                  {date === today() ? "Today" : formatDate(date, true)}
                  <span>
                    {tasks.filter((t) => t.due === date).length} tasks
                  </span>
                </h3>
                <TaskList
                  tasks={tasks.filter((t) => t.due === date)}
                  onEdit={(t) => edit({ type: "task", entityId: t.id })}
                />
              </section>
            ))}
            {!tasks.length ? (
              <Empty
                title="You're all caught up"
                description="Add your next routine to keep the good care going."
                action={
                  <button
                    className="button primary"
                    onClick={() => edit({ type: "task" })}
                  >
                    Plan a task
                  </button>
                }
              />
            ) : null}
          </div>
        </>
      ) : null}
      {page === "health" ? (
        <>
          <div className="health-banner">
            <ShieldCheck size={24} />
            <div>
              <strong>
                Keep observations and veterinary instructions together
              </strong>
              <p>
                Record medication exactly as prescribed. Withdrawal end dates
                are inclusive; the app does not determine doses or safe
                withdrawal periods.
              </p>
            </div>
          </div>
          <SectionTitle title="Animals needing a little extra care" />
          {animals.filter((a) =>
            ["Monitoring", "Quarantine"].includes(a.status),
          ).length ? (
            <div className="attention-grid">
              {animals
                .filter((a) => ["Monitoring", "Quarantine"].includes(a.status))
                .map((a) => (
                  <button
                    className="panel attention-card"
                    key={a.id}
                    onClick={() => showAnimal(a)}
                  >
                    <span className="large-icon peach">
                      <Heart size={22} />
                    </span>
                    <div>
                      <h3>{a.name}</h3>
                      <p>{a.notes || a.species}</p>
                    </div>
                    <Badge tone="amber">{a.status}</Badge>
                    <ChevronRight size={18} />
                  </button>
                ))}
            </div>
          ) : (
            <div className="panel healthy-message">
              <Check size={20} /> No animals in your selected workspace are
              marked for monitoring or quarantine.
            </div>
          )}
          <SectionTitle
            title="Treatments & egg withdrawals"
            subtitle="Record the final withdrawal date from your vet's instructions."
            action={
              <button
                className="text-link"
                onClick={() => edit({ type: "treatment" })}
              >
                Record treatment
                <Plus size={16} />
              </button>
            }
          />
          {treatments.length ? (
            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Animal</th>
                    <th>Treatment & dose</th>
                    <th>Dates</th>
                    <th>Egg withdrawal</th>
                    <th>Vet</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {data.animals.find((a) => a.id === t.animalId)?.name ??
                          "Unknown animal"}
                      </td>
                      <td>
                        <strong>{t.medicine}</strong>
                        <small>{t.dose}</small>
                        <small>{t.notes}</small>
                      </td>
                      <td>
                        {formatDate(t.started)}
                        <small>
                          {t.ended
                            ? `Ends ${formatDate(t.ended)}`
                            : "End not recorded"}
                        </small>
                      </td>
                      <td>
                        {t.withdrawalEnd ? (
                          <>
                            <Badge tone={isWithdrawing(t) ? "amber" : "green"}>
                              {isWithdrawing(t)
                                ? "Eggs withheld"
                                : "Date passed"}
                            </Badge>
                            <small>
                              Through {formatDate(t.withdrawalEnd, true)}
                            </small>
                          </>
                        ) : (
                          <Badge tone="neutral">Not recorded</Badge>
                        )}
                      </td>
                      <td>{t.vet || "—"}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${t.medicine} treatment`}
                          onClick={() =>
                            setConfirm({
                              kind: "treatments",
                              id: t.id,
                              label: t.medicine,
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="A healthy start"
              description="Record a prescribed treatment when an animal needs one."
            />
          )}
          <SectionTitle
            title="Recent health observations"
            action={
              <button
                className="text-link"
                onClick={() => edit({ type: "log", logKind: "Health" })}
              >
                Add observation
                <Plus size={16} />
              </button>
            }
          />
          <div className="panel observation-list">
            {logs
              .filter((l) => l.kind === "Health")
              .slice(0, 10)
              .map((l) => (
                <div key={l.id}>
                  <Heart size={18} />
                  <div>
                    <strong>
                      {data.animals.find((a) => a.id === l.animalId)?.name ??
                        "Collection"}
                    </strong>
                    <p>{l.notes}</p>
                  </div>
                  <span>{formatDate(l.date)}</span>
                </div>
              ))}
            {!logs.some((l) => l.kind === "Health") ? (
              <p className="muted">
                No health observations recorded in this workspace yet.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
      {page === "feed" ? (
        <>
          <div className="info-strip">
            <Wheat size={19} />
            <p>
              Stock forecasts use your estimated daily consumption. Recording a
              feed from a supply deducts its quantity automatically.
            </p>
          </div>
          <div className="feed-grid">
            {feed.map((f) => {
              const days = feedDays(f);
              return (
                <section key={f.id} className="panel feed-card">
                  <div className="feed-card-top">
                    <span className="large-icon sand">
                      <Wheat size={23} />
                    </span>
                    <Badge tone={days !== null && days < 7 ? "amber" : "green"}>
                      {days === null
                        ? "Usage not set"
                        : days < 7
                          ? "Top-up soon"
                          : "In stock"}
                    </Badge>
                  </div>
                  <h2>{f.name}</h2>
                  <p>
                    {f.kind === "poultry" ? "Poultry pantry" : "Reptile pantry"}
                  </p>
                  <div className="feed-amount">
                    <strong>{f.stock}</strong>
                    <span>{f.unit} remaining</span>
                  </div>
                  <div className="stock-meter">
                    <span
                      style={{
                        width: `${Math.min(100, ((days ?? 0) / 30) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="feed-facts">
                    <span>
                      Estimated supply
                      <strong>
                        {days === null ? "Set daily use" : `${days} days`}
                      </strong>
                    </span>
                    <span>
                      Daily use
                      <strong>
                        {f.dailyUse} {f.unit}
                      </strong>
                    </span>
                    <span>
                      Last purchase cost<strong>{money(f.cost)}</strong>
                    </span>
                    <span>
                      Purchased<strong>{formatDate(f.purchased)}</strong>
                    </span>
                  </div>
                  <div className="habitat-actions">
                    <button
                      className="button secondary"
                      onClick={() => edit({ type: "feed", entityId: f.id })}
                    >
                      <Pencil size={15} />
                      Update stock
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() =>
                        setConfirm({ kind: "feed", id: f.id, label: f.name })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </section>
              );
            })}
            {!feed.length ? (
              <Empty
                title="Let's stock the cupboard"
                description="Add feed or supplies, record costs, and forecast when you'll need more."
                action={
                  <button
                    className="button primary"
                    onClick={() => edit({ type: "feed" })}
                  >
                    Add supply
                  </button>
                }
              />
            ) : null}
          </div>
        </>
      ) : null}
      {page === "breeding" ? (
        <>
          <div className="info-strip">
            <SproutIcon />
            <p>
              Incubation dates and temperatures are your recorded settings.
              Follow a species-specific breeding plan.
            </p>
          </div>
          <div className="clutch-grid">
            {clutches.map((c) => {
              const elapsed = Math.max(0, daysBetween(c.started, today()));
              const total = Math.max(1, daysBetween(c.started, c.expected));
              return (
                <section className="panel clutch-card" key={c.id}>
                  <div className="clutch-card-top">
                    <span className="large-icon peach">
                      <Egg size={26} />
                    </span>
                    <Badge tone={c.hatched === c.eggs ? "green" : "amber"}>
                      {c.hatched === c.eggs
                        ? "Hatched"
                        : c.expected < today()
                          ? "Review due"
                          : "Incubating"}
                    </Badge>
                  </div>
                  <h2>{c.name}</h2>
                  <p>
                    {c.kind === "poultry" ? "Poultry hatch" : "Reptile clutch"}{" "}
                    · started {formatDate(c.started)}
                  </p>
                  <div className="hatch-progress">
                    <div>
                      <strong>Day {elapsed}</strong>
                      <span>Expected {formatDate(c.expected)}</span>
                    </div>
                    <div className="stock-meter">
                      <span
                        style={{
                          width: `${Math.min(100, (elapsed / total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="clutch-numbers">
                    <div>
                      <strong>{c.eggs}</strong>
                      <span>Eggs set</span>
                    </div>
                    <div>
                      <strong>{c.fertile}</strong>
                      <span>Fertile</span>
                    </div>
                    <div>
                      <strong>{c.hatched}</strong>
                      <span>Hatched</span>
                    </div>
                  </div>
                  <div className="parent-row">
                    <Leaf size={15} />
                    {data.animals.find((a) => a.id === c.motherId)?.name ??
                      "Mother unknown"}
                    <span>×</span>
                    {data.animals.find((a) => a.id === c.fatherId)?.name ??
                      "Father unknown"}
                  </div>
                  <p className="clutch-notes">{c.notes}</p>
                  <div className="habitat-actions">
                    <button
                      className="button secondary"
                      onClick={() => edit({ type: "clutch", entityId: c.id })}
                    >
                      <Pencil size={15} />
                      Update hatch
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${c.name}`}
                      onClick={() =>
                        setConfirm({
                          kind: "clutches",
                          id: c.id,
                          label: c.name,
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </section>
              );
            })}
            {!clutches.length ? (
              <Empty
                title="Something wonderful begins here"
                description="Create a hatch record to follow eggs, fertility, parents, and new arrivals."
                action={
                  <button
                    className="button primary"
                    onClick={() => edit({ type: "clutch" })}
                  >
                    Start a hatch
                  </button>
                }
              />
            ) : null}
          </div>
          <section className="panel lineage-panel">
            <SectionTitle
              title="Family connections"
              subtitle="Parents are recorded on each animal's profile."
            />
            {animals
              .filter((a) => a.motherId || a.fatherId)
              .map((a) => (
                <div className="lineage-row" key={a.id}>
                  <span>
                    {data.animals.find((x) => x.id === a.motherId)?.name ??
                      "Unknown mother"}{" "}
                    ×{" "}
                    {data.animals.find((x) => x.id === a.fatherId)?.name ??
                      "Unknown father"}
                  </span>
                  <ArrowRight size={18} />
                  <button className="text-link" onClick={() => showAnimal(a)}>
                    {a.name}
                    <ChevronRight size={15} />
                  </button>
                </div>
              ))}
            {!animals.some((a) => a.motherId || a.fatherId) ? (
              <p className="muted">
                Add mother and father details to an animal to build its lineage.
              </p>
            ) : null}
          </section>
        </>
      ) : null}
      {page === "insights" ? <Insights workspace={workspace} /> : null}
      {page === "guide" || page === "directory" ? (
        <Resources page={page} navigate={navigate} />
      ) : null}
      {page === "settings" ? <KeeperSettings /> : null}
      {confirm ? (
        <Modal
          title="Delete this record?"
          description={`This will permanently remove “${confirm.label}” from this device. Export a backup first if you want to keep it.`}
          onClose={() => setConfirm(null)}
        >
          <div className="modal-foot">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Keep record
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (
                  update((d) => ({
                    ...d,
                    [confirm.kind]: d[confirm.kind].filter(
                      (x) => x.id !== confirm.id,
                    ),
                  }))
                ) {
                  toast("Record deleted.");
                  setConfirm(null);
                }
              }}
            >
              <Trash2 size={16} />
              Delete record
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
function UsersIcon() {
  return <Bird size={15} />;
}
function SproutIcon() {
  return <Leaf size={19} />;
}
export function AnimalDetails({
  animal,
  edit,
  onClose,
}: {
  animal: Animal;
  edit: (e: Editor) => void;
  onClose: () => void;
}) {
  const { data } = useData();
  const habitat = data.habitats.find((h) => h.id === animal.habitatId);
  const logs = data.logs
    .filter((l) => l.animalId === animal.id)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const weight = logs.find((l) => l.kind === "Weight");
  const withdrawal = data.treatments.filter(
    (t) => t.animalId === animal.id && isWithdrawing(t),
  );
  return (
    <Modal
      title={animal.name}
      description={`${animal.species}${animal.breed ? ` · ${animal.breed}` : ""}`}
      onClose={onClose}
      wide
    >
      <div className="animal-detail">
        <div className="detail-photo">
          {animal.image ? (
            <Image
              src={animal.image}
              alt={animal.name}
              fill
              sizes="550px"
              unoptimized
            />
          ) : (
            <div className="photo-placeholder">
              <Bird size={50} />
            </div>
          )}
          <Badge tone={animal.status === "Healthy" ? "green" : "amber"}>
            {animal.status}
          </Badge>
        </div>
        <div className="detail-facts">
          <div>
            <span>Age</span>
            <strong>{ageLabel(animal.born)}</strong>
          </div>
          <div>
            <span>Sex</span>
            <strong>{animal.sex}</strong>
          </div>
          <div>
            <span>Home</span>
            <strong>{habitat?.name ?? "Unassigned"}</strong>
          </div>
          <div>
            <span>Latest weight</span>
            <strong>
              {weight ? `${weight.value} ${weight.unit}` : "Not recorded"}
            </strong>
          </div>
          <div>
            <span>Acquired</span>
            <strong>{formatDate(animal.acquired)}</strong>
          </div>
          <div>
            <span>Parents</span>
            <strong>
              {data.animals.find((a) => a.id === animal.motherId)?.name ??
                "Unknown"}{" "}
              ×{" "}
              {data.animals.find((a) => a.id === animal.fatherId)?.name ??
                "Unknown"}
            </strong>
          </div>
        </div>
        {animal.notes ? (
          <div className="detail-notes">
            <h3>A little about {animal.name}</h3>
            <p>{animal.notes}</p>
          </div>
        ) : null}
        {withdrawal.length ? (
          <div className="inline-warning">
            <AlertTriangle size={18} />
            Eggs withheld through{" "}
            {formatDate(
              withdrawal
                .map((t) => t.withdrawalEnd)
                .sort()
                .at(-1)!,
              true,
            )}
            .
          </div>
        ) : null}
        <SectionTitle title="Recent care" />
        {logs.length ? (
          <div className="detail-timeline">
            {logs.slice(0, 6).map((l) => (
              <div key={l.id}>
                <span className="timeline-dot" />
                <div>
                  <strong>
                    {l.kind}
                    {["Weight", "Feeding"].includes(l.kind)
                      ? ` · ${l.value} ${l.unit}`
                      : ""}
                  </strong>
                  <p>{l.notes || "Recorded with care."}</p>
                </div>
                <small>{formatDate(l.date)}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Their care story starts with your first record.
          </p>
        )}
        <div className="modal-foot">
          <button
            className="button secondary"
            onClick={() => edit({ type: "animal", entityId: animal.id })}
          >
            <Pencil size={16} />
            Edit profile
          </button>
          <button
            className="button primary"
            onClick={() =>
              edit({
                type: "log",
                logKind: animal.kind === "reptile" ? "Feeding" : "Health",
                animalId: animal.id,
                habitatId: animal.habitatId,
              })
            }
          >
            <Plus size={16} />
            Add care record
          </button>
        </div>
      </div>
    </Modal>
  );
}
function Insights({ workspace }: { workspace: Workspace }) {
  const { data } = useData();
  const [days, setDays] = useState(30);
  const [animalId, setAnimalId] = useState("");
  const eggs = eggSeries(data, days);
  const total = eggs.reduce((s, l) => s + l.count, 0);
  const reptiles = data.animals.filter((a) => a.kind === "reptile");
  const chosen = animalId || reptiles[0]?.id || "";
  const weights = data.logs
    .filter((l) => l.kind === "Weight" && l.animalId === chosen)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = weights.at(-1);
  const first = weights[0];
  return (
    <>
      <div className="insight-summary">
        <div className="panel">
          <Egg size={23} />
          <strong>{total}</strong>
          <span>eggs in {days} days</span>
        </div>
        <div className="panel">
          <Leaf size={23} />
          <strong>{(total / days).toFixed(1)}</strong>
          <span>average eggs per day</span>
        </div>
        <div className="panel">
          <ShieldCheck size={23} />
          <strong>
            {
              data.tasks.filter(
                (t) =>
                  t.completed &&
                  (workspace === "all" ||
                    t.kind === workspace ||
                    t.kind === "all"),
              ).length
            }
          </strong>
          <span>care tasks completed</span>
        </div>
        <div className="panel">
          <Wheat size={23} />
          <strong>
            {money(
              data.feed
                .filter((f) => workspace === "all" || f.kind === workspace)
                .reduce((s, f) => s + f.cost, 0),
            )}
          </strong>
          <span>cost of latest supply purchases</span>
        </div>
      </div>
      {workspace !== "reptile" ? (
        <section className="panel insights-chart">
          <SectionTitle
            title="Egg collection over time"
            subtitle="Totals include every recorded collection, including eggs recorded during withdrawal."
            action={
              <select
                aria-label="Insights chart range"
                className="small-select"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
            }
          />
          <EggChart days={days} />
        </section>
      ) : null}
      <section className="panel weight-panel">
        <SectionTitle
          title="Growing at their own pace"
          subtitle="Follow individual weight records. Weight changes should be interpreted with your vet."
          action={
            <select
              aria-label="Animal for weight history"
              className="small-select"
              value={chosen}
              onChange={(e) => setAnimalId(e.target.value)}
            >
              {reptiles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          }
        />
        {weights.length ? (
          <>
            <div className="weight-summary">
              <strong>{latest?.value} g</strong>
              <span>Latest · {formatDate(latest!.date)}</span>
              {weights.length > 1 ? (
                <Badge tone="neutral">
                  {(latest!.value - first.value).toFixed(1)} g change since{" "}
                  {formatDate(first.date)}
                </Badge>
              ) : null}
            </div>
            <div className="weight-bars">
              {weights.slice(-12).map((w) => (
                <div key={w.id}>
                  <span>{w.value} g</span>
                  <div
                    style={{
                      height: `${Math.max(12, (w.value / Math.max(...weights.map((l) => l.value))) * 130)}px`,
                    }}
                  />
                  <small>{formatDate(w.date)}</small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty
            title="Start a growth story"
            description="Add individual weight records to see changes over time."
          />
        )}
      </section>
      <p className="insight-note">
        Insights reflect your saved records. Supply cost shows the latest
        purchase recorded for each supply, rather than a complete expense
        ledger.
      </p>
    </>
  );
}
