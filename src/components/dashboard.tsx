"use client";
import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Bird,
  Egg,
  Leaf,
  Plus,
  Thermometer,
  Wheat,
  Heart,
  Check,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Droplets,
  Clock3,
  Turtle,
} from "lucide-react";
import type { Animal, CareTask, PageId, Workspace } from "@/lib/types";
import {
  today,
  eggSeries,
  feedDays,
  completeTask,
  formatDate,
  ageLabel,
  isWithdrawing,
  daysBetween,
  id,
} from "@/lib/utils";
import { photos } from "@/lib/seed";
import { useData } from "./store";
import { Badge, Empty, SectionTitle } from "./ui";
import type { Editor } from "./editors";

export function AnimalCard({
  animal,
  onClick,
  compact = false,
}: {
  animal: Animal;
  onClick: () => void;
  compact?: boolean;
}) {
  const { data } = useData();
  const habitat = data.habitats.find((h) => h.id === animal.habitatId);
  return (
    <button
      className={`animal-card ${compact ? "compact" : ""}`}
      onClick={onClick}
    >
      <div className="animal-photo">
        {animal.image ? (
          <Image
            src={animal.image}
            alt={animal.name}
            fill
            sizes="(max-width: 600px) 50vw, 300px"
            unoptimized
          />
        ) : (
          <div className="photo-placeholder">
            {animal.kind === "poultry" ? (
              <Bird size={44} />
            ) : (
              <Turtle size={44} />
            )}
          </div>
        )}
        <span className={`species-icon ${animal.kind}`}>
          {animal.kind === "poultry" ? (
            <Bird size={15} />
          ) : (
            <Turtle size={15} />
          )}
        </span>
      </div>
      <div className="animal-card-body">
        <div className="animal-title">
          <h3>{animal.name}</h3>
          <ChevronRight size={17} />
        </div>
        <p>
          {animal.kind === "poultry"
            ? animal.breed || animal.species
            : animal.species}
        </p>
        <div className="animal-meta">
          <Badge
            tone={
              animal.status === "Healthy"
                ? "green"
                : animal.status === "Deceased"
                  ? "neutral"
                  : "amber"
            }
          >
            {animal.status}
          </Badge>
          <span>
            {compact ? (habitat?.name ?? "Unassigned") : ageLabel(animal.born)}
          </span>
        </div>
      </div>
    </button>
  );
}
export function TaskList({
  tasks,
  limit,
  onEdit,
}: {
  tasks: CareTask[];
  limit?: number;
  onEdit?: (task: CareTask) => void;
}) {
  const { data, update, toast } = useData();
  const visible = limit ? tasks.slice(0, limit) : tasks;
  const finish = (task: CareTask) => {
    if (update((d) => ({ ...d, tasks: completeTask(d.tasks, task.id) })))
      toast(
        task.repeatDays
          ? "Done. The next occurrence is planned."
          : "Task completed. Nice work.",
      );
  };
  return visible.length ? (
    <div className="task-list">
      {visible.map((t) => (
        <div key={t.id} className={`task-row ${t.completed ? "complete" : ""}`}>
          <button
            className="task-check"
            disabled={t.completed}
            aria-label={`Complete ${t.title}`}
            onClick={() => finish(t)}
          >
            {t.completed ? <Check size={14} /> : null}
          </button>
          <button className="task-content" onClick={() => onEdit?.(t)}>
            <strong>{t.title}</strong>
            <span>
              {data.animals.find((a) => a.id === t.animalId)?.name ??
                data.habitats.find((h) => h.id === t.habitatId)?.name ??
                "Your collection"}
              <i />
              {t.time || "Any time"}
            </span>
          </button>
          <span className={`task-dot ${t.kind}`} title={t.kind} />
          {t.due < today() && !t.completed ? (
            <Badge tone="amber">Overdue</Badge>
          ) : null}
        </div>
      ))}
    </div>
  ) : (
    <Empty
      title="A little breathing room"
      description="You're up to date. Add your next care task when you're ready."
    />
  );
}
export function EggChart({ days = 7 }: { days?: number }) {
  const { data } = useData();
  const series = eggSeries(data, days);
  const max = Math.max(8, ...series.map((s) => s.count));
  const width = 650,
    height = 155,
    top = 14,
    bottom = 132;
  const points = series
    .map(
      (s, i) =>
        `${42 + i * ((width - 70) / Math.max(1, series.length - 1))},${bottom - (s.count / max) * (bottom - top)}`,
    )
    .join(" ");
  return (
    <div className="egg-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${series.reduce((s, p) => s + p.count, 0)} eggs collected in the last ${days} days`}
      >
        <defs>
          <linearGradient id="egg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fbaa2" stopOpacity=".3" />
            <stop offset="100%" stopColor="#9fbaa2" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line
              x1="40"
              x2={width - 15}
              y1={top + ((bottom - top) * v) / 3}
              y2={top + ((bottom - top) * v) / 3}
              stroke="#e8ebe5"
              strokeDasharray="4 5"
            />
            <text
              x="10"
              y={top + ((bottom - top) * v) / 3 + 4}
              fontSize="11"
              fill="#89918a"
            >
              {Math.round((max * (3 - v)) / 3)}
            </text>
          </g>
        ))}
        <polygon
          points={`42,${bottom} ${points} ${width - 28},${bottom}`}
          fill="url(#egg-fill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#52765b"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((s, i) => (
          <g key={s.date}>
            <circle
              cx={42 + i * ((width - 70) / Math.max(1, series.length - 1))}
              cy={bottom - (s.count / max) * (bottom - top)}
              r="3.5"
              fill="#52765b"
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {formatDate(s.date)}: {s.count} eggs
              </title>
            </circle>
            {days <= 7 || i % 5 === 0 || i === days - 1 ? (
              <text
                x={42 + i * ((width - 70) / Math.max(1, series.length - 1))}
                y="153"
                textAnchor="middle"
                fontSize="10"
                fill="#89918a"
              >
                {days <= 7
                  ? new Intl.DateTimeFormat("en-GB", {
                      weekday: "short",
                    }).format(new Date(s.date + "T12:00:00Z"))
                  : formatDate(s.date)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
export function Overview({
  workspace,
  navigate,
  edit,
  showAnimal,
}: {
  workspace: Workspace;
  navigate: (page: PageId) => void;
  edit: (editor: Editor) => void;
  showAnimal: (animal: Animal) => void;
}) {
  const { data, update, toast } = useData();
  const [days, setDays] = useState(7);
  const reptile = workspace === "reptile";
  const primaryCoop =
    data.habitats.find((h) => h.kind === "poultry" && /coop/i.test(h.type)) ??
    data.habitats.find((h) => h.kind === "poultry");
  function quickEgg() {
    if (!primaryCoop) return;
    const date = today();
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    const withheld = data.treatments.some(
      (t) =>
        isWithdrawing(t) &&
        data.animals.find((a) => a.id === t.animalId)?.habitatId ===
          primaryCoop.id,
    );
    if (
      update((d) => ({
        ...d,
        logs: [
          ...d.logs,
          {
            id: id(),
            kind: "Eggs",
            workspace: "poultry",
            date,
            time,
            animalId: "",
            habitatId: primaryCoop.id,
            value: 1,
            unit: "eggs",
            notes: withheld
              ? "One-tap collection · withdrawal active in this coop"
              : "One-tap egg collection",
          },
        ],
      }))
    )
      toast(
        withheld
          ? "1 egg recorded. A withdrawal is active in this coop; follow your vet's instructions."
          : `1 egg added to ${primaryCoop.name}.`,
      );
  }
  const active = data.animals.filter(
    (a) =>
      a.status !== "Deceased" && (workspace === "all" || a.kind === workspace),
  );
  const pending = data.tasks
    .filter(
      (t) =>
        !t.completed &&
        t.due <= today() &&
        (workspace === "all" || t.kind === workspace || t.kind === "all"),
    )
    .sort((a, b) => `${a.due} ${a.time}`.localeCompare(`${b.due} ${b.time}`));
  const feed = data.feed.filter(
    (f) => workspace === "all" || f.kind === workspace,
  );
  const daysLeft = feed.map(feedDays).filter((n): n is number => n !== null);
  const eggs = data.logs
    .filter((l) => l.kind === "Eggs" && l.date === today())
    .reduce((s, l) => s + l.value, 0);
  const series = eggSeries(data, days);
  const weekly = series.reduce((s, e) => s + e.count, 0);
  const currentReadings = data.logs.filter(
    (l) => l.kind === "Environment" && l.date === today(),
  );
  const featured =
    workspace === "all"
      ? [
          ...active.filter((a) => a.kind === "poultry").slice(0, 2),
          ...active.filter((a) => a.kind === "reptile").slice(0, 2),
        ]
      : active.slice(0, 4);
  const withdrawal = data.treatments.filter((t) => isWithdrawing(t));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR DAILY DOSE OF GOOD CARE</div>
          <h1>
            Hello, {data.settings.keeper.split(" ")[0]}.{" "}
            <span className="greeting-sun">✳</span>
          </h1>
          <p>Happy animals start with the little things. Let's check in.</p>
        </div>
        <button
          className="button secondary date-pill"
          onClick={() => navigate("planner")}
        >
          <CalendarDays size={16} />
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "long",
            timeZone: "Europe/London",
          }).format(new Date())}
        </button>
      </div>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-kicker">
            <Leaf size={14} /> A LITTLE CARE, EVERY DAY
          </span>
          <h2>
            Small routines.
            <br />
            <em>Thriving animals.</em>
          </h2>
          <p>
            {reptile
              ? "From warm basking spots to happy feeding days.\nA thoughtful home for your scaled companions."
              : "From the first egg to the next little hatch.\nA thoughtful home for every feather and scale."}
          </p>
          <div className="hero-quick-actions">
            <button
              className="button cream"
              onClick={() =>
                edit({
                  type: "log",
                  logKind: reptile ? "Feeding" : "Eggs",
                  habitatId: reptile ? undefined : primaryCoop?.id,
                })
              }
            >
              {reptile ? "Record a feeding" : "Log today's eggs"}
              <ArrowRight size={16} />
            </button>
            {!reptile && primaryCoop ? (
              <button
                className="one-tap-egg"
                aria-label={`Add one egg to ${primaryCoop.name}`}
                title={`Add one egg to ${primaryCoop.name}`}
                onClick={quickEgg}
              >
                <Plus size={14} />1 egg
              </button>
            ) : null}
          </div>
        </div>
        <div className="hero-image">
          <Image
            src={reptile ? photos.reptile : photos.flock}
            alt={
              reptile
                ? "A gecko perched on natural driftwood"
                : "Backyard hens exploring a green garden"
            }
            fill
            priority
            sizes="(max-width: 600px) 100vw, 50vw"
            unoptimized
          />
          <div className="hero-image-shade" />
          <div className="hero-caption">
            <span className="tiny-leaf">
              <Leaf size={16} />
            </span>
            <div>
              <strong>
                {reptile
                  ? "A world behind the glass"
                  : "Life in your little corner"}
              </strong>
              <span>
                {reptile
                  ? "Good habitats. Happy inhabitants."
                  : "One happy flock at a time."}
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="stats-grid">
        <button className="stat-card" onClick={() => navigate("animals")}>
          <span className="stat-icon sage">
            <Bird size={21} />
          </span>
          <span className="stat-label">
            {reptile ? "Your reptiles" : "Your animals"}
          </span>
          <span className="stat-value">
            {active.length}
            <span>{reptile ? "scaled friends" : "little lives"}</span>
          </span>
          <span className="stat-foot">
            <span className="green-dot" />
            {
              data.habitats.filter(
                (h) => workspace === "all" || h.kind === workspace,
              ).length
            }{" "}
            happy habitats
            <ArrowUpRight size={14} />
          </span>
        </button>
        <button
          className="stat-card"
          onClick={() => navigate(reptile ? "habitats" : "records")}
        >
          <span className="stat-icon peach">
            {reptile ? <Thermometer size={21} /> : <Egg size={21} />}
          </span>
          <span className="stat-label">
            {reptile ? "Habitat readings" : "Eggs today"}
          </span>
          <span className="stat-value">
            {reptile ? currentReadings.length : eggs}
            <span>{reptile ? "recorded today" : "freshly collected"}</span>
          </span>
          <span className="stat-foot">
            {reptile
              ? "Manual checks, better care"
              : `${eggSeries(data).reduce((s, e) => s + e.count, 0)} collected this week`}
            <ArrowUpRight size={14} />
          </span>
        </button>
        <button className="stat-card" onClick={() => navigate("planner")}>
          <span className="stat-icon lilac">
            <Heart size={21} />
          </span>
          <span className="stat-label">Care to do</span>
          <span className="stat-value">
            {pending.length}
            <span>{pending.length === 1 ? "little task" : "little tasks"}</span>
          </span>
          <span className="stat-foot">
            <span className="amber-dot" />
            {pending.length
              ? "A few moments of your day"
              : "All caught up today"}
            <ArrowUpRight size={14} />
          </span>
        </button>
        <button className="stat-card" onClick={() => navigate("feed")}>
          <span className="stat-icon sand">
            <Wheat size={21} />
          </span>
          <span className="stat-label">Feed in stock</span>
          <span className="stat-value">
            {daysLeft.length ? Math.min(...daysLeft) : "—"}
            <span>days remaining</span>
          </span>
          <span className="stat-foot">
            {daysLeft.length
              ? "Based on estimated daily use"
              : "Add supplies to estimate"}
            <ArrowUpRight size={14} />
          </span>
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel chart-panel">
            <SectionTitle
              title={reptile ? "Behind the glass" : "The egg basket"}
              subtitle={
                reptile
                  ? "Today's recorded habitat conditions"
                  : "A little progress, collected daily."
              }
              action={
                reptile ? (
                  <button
                    className="text-link"
                    onClick={() => navigate("habitats")}
                  >
                    All habitats
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <select
                    aria-label="Egg chart range"
                    className="small-select"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="14">Last 14 days</option>
                    <option value="30">Last 30 days</option>
                  </select>
                )
              }
            />
            {reptile ? (
              <div className="reading-grid">
                {data.habitats
                  .filter((h) => h.kind === "reptile")
                  .slice(0, 2)
                  .map((h) => {
                    const l = currentReadings
                      .filter((l) => l.habitatId === h.id)
                      .at(-1);
                    return (
                      <div key={h.id} className="reading-mini">
                        <h3>{h.name}</h3>
                        <div>
                          <Thermometer size={17} />
                          <strong>{l?.temperature ?? "—"}°C</strong>
                          <span>Warm side</span>
                        </div>
                        <div>
                          <Droplets size={17} />
                          <strong>{l?.humidity ?? "—"}%</strong>
                          <span>Humidity</span>
                        </div>
                        <Badge tone={l ? "green" : "neutral"}>
                          {l ? "Recorded today" : "Check due"}
                        </Badge>
                      </div>
                    );
                  })}
                {!data.habitats.some((h) => h.kind === "reptile") ? (
                  <Empty
                    title="Make a home"
                    description="Add your first habitat to record its conditions."
                  />
                ) : null}
              </div>
            ) : (
              <>
                <div className="chart-total">
                  <strong>{weekly}</strong>
                  <span>eggs this period</span>
                  <Badge tone="green">
                    <Leaf size={11} /> Home-grown goodness
                  </Badge>
                </div>
                <EggChart days={days} />
              </>
            )}
          </section>
          <section className="animals-section">
            <SectionTitle
              title="Meet your little crew"
              subtitle="Every personality, in one place."
              action={
                <button
                  className="text-link"
                  onClick={() => navigate("animals")}
                >
                  View all
                  <ArrowRight size={15} />
                </button>
              }
            />
            <div className="animal-grid compact-grid">
              {featured.map((a) => (
                <AnimalCard
                  key={a.id}
                  animal={a}
                  onClick={() => showAnimal(a)}
                  compact
                />
              ))}
              {!featured.length ? (
                <Empty
                  title="Your crew starts here"
                  description="Add your first feathered or scaled friend."
                  action={
                    <button
                      className="button primary"
                      onClick={() => edit({ type: "animal" })}
                    >
                      <Plus size={16} />
                      Add an animal
                    </button>
                  }
                />
              ) : null}
            </div>
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="panel todo-panel">
            <SectionTitle
              title="A little care today"
              action={
                <button
                  className="icon-button subtle"
                  aria-label="Add a care task"
                  onClick={() => edit({ type: "task" })}
                >
                  <Plus size={18} />
                </button>
              }
            />
            <div className="task-progress">
              <span>
                {
                  data.tasks.filter(
                    (t) =>
                      t.completed &&
                      t.due === today() &&
                      (workspace === "all" ||
                        t.kind === workspace ||
                        t.kind === "all"),
                  ).length
                }{" "}
                completed
              </span>
              <span>{pending.length} to go</span>
            </div>
            <TaskList
              tasks={pending}
              limit={4}
              onEdit={(t) => edit({ type: "task", entityId: t.id })}
            />
            <button
              className="panel-footer"
              onClick={() => navigate("planner")}
            >
              Open care planner
              <ArrowRight size={15} />
            </button>
          </section>
          <section className="quick-panel">
            <div className="quick-heading">
              <Sparkles size={18} />
              <h3>Make a quick record</h3>
            </div>
            <div className="quick-grid">
              {(reptile
                ? [
                    { label: "Feeding", icon: Wheat },
                    { label: "Weight", icon: Heart },
                    { label: "Shedding", icon: Leaf },
                    { label: "Environment", icon: Thermometer },
                  ]
                : [
                    { label: "Eggs", icon: Egg },
                    { label: "Feeding", icon: Wheat },
                    { label: "Health", icon: Heart },
                    { label: "Cleaning", icon: ShieldCheck },
                  ]
              ).map((q) => (
                <button
                  key={q.label}
                  onClick={() =>
                    edit({ type: "log", logKind: q.label as Editor["logKind"] })
                  }
                >
                  <q.icon size={20} />
                  <span>
                    {q.label === "Eggs"
                      ? "Collect eggs"
                      : q.label === "Environment"
                        ? "Conditions"
                        : q.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="season-card">
            <span className="eyebrow">
              <ShieldCheck size={14} /> KEEPING WITH CONFIDENCE
            </span>
            <h3>
              {withdrawal.length
                ? "An egg withdrawal is active"
                : "A healthy habit, all year round"}
            </h3>
            <p>
              {withdrawal.length
                ? `${withdrawal.length} treatment record${withdrawal.length > 1 ? "s" : ""} requires eggs to be withheld. Check the dates in Health & care.`
                : "Keep your biosecurity checklist and UK keeper guidance close at hand."}
            </p>
            <button
              className="text-link"
              onClick={() => navigate(withdrawal.length ? "health" : "guide")}
            >
              {withdrawal.length
                ? "Check withdrawal dates"
                : "Your keeper's guide"}
              <ArrowRight size={15} />
            </button>
            <Leaf className="season-decoration" size={70} />
          </section>
        </aside>
      </div>
      <div className="bottom-note">
        <Leaf size={14} /> A little care makes a big difference. You're doing
        good things.
      </div>
    </>
  );
}
