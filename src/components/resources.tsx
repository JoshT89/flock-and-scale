"use client";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bird,
  BookOpen,
  CalendarDays,
  Check,
  Download,
  Heart,
  Leaf,
  MapPin,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sprout,
  Upload,
  Wheat,
  AlertTriangle,
} from "lucide-react";
import type { AppData, PageId, Settings as KeeperDetails } from "@/lib/types";
import { dataSchema } from "@/lib/schema";
import { demoData } from "@/lib/seed";
import {
  emptyData,
  formatDate,
  id,
  monthShift,
  STORAGE_KEY,
  today,
} from "@/lib/utils";
import { useData } from "./store";
import { Badge, ExternalLink, Field, Modal, SectionTitle } from "./ui";

const checks = [
  {
    id: "water",
    label: "Fresh water, clean drinkers",
    detail: "Protect feed and water from contact with wild birds.",
  },
  {
    id: "footwear",
    label: "Dedicated footwear & clean hands",
    detail: "Clean and disinfect footwear and equipment between areas.",
  },
  {
    id: "wildbirds",
    label: "Check the run & wild bird access",
    detail: "Look for gaps, spills and anything that attracts wild birds.",
  },
  {
    id: "observe",
    label: "A moment to observe every bird",
    detail: "Note unusual behaviour, appetite, breathing or egg changes.",
  },
  {
    id: "clean",
    label: "Keep bedding & equipment clean",
    detail: "Use an appropriate disinfectant according to its instructions.",
  },
  {
    id: "newbirds",
    label: "Keep new or unwell birds separate",
    detail: "Follow your vet's quarantine and biosecurity advice.",
  },
];
const countryLinks: Record<KeeperDetails["country"], string> = {
  England:
    "https://www.gov.uk/government/collections/register-as-a-bird-keeper",
  Wales:
    "https://www.gov.wales/poultry-and-other-captive-birds-registration-rules-and-forms",
  Scotland:
    "https://www.gov.scot/publications/avian-influenza-bird-flu/pages/register-your-birds/",
  "Northern Ireland":
    "https://www.daera-ni.gov.uk/articles/identification-registration-and-movement-birds",
};
export function Resources({
  page,
  navigate,
}: {
  page: PageId;
  navigate: (p: PageId) => void;
}) {
  const { data, update, toast } = useData();
  const [confirmed, setConfirmed] = useState(false);
  const toggle = (cid: string) =>
    update((d) => ({
      ...d,
      checklist: d.checklist.includes(cid)
        ? d.checklist.filter((c) => c !== cid)
        : [...d.checklist, cid],
    }));
  function planUpdate() {
    const due = data.settings.aphaUpdated
      ? monthShift(data.settings.aphaUpdated, 12)
      : today();
    if (
      update((d) => ({
        ...d,
        tasks: d.tasks.some((t) => t.id === "apha-review" && !t.completed)
          ? d.tasks.map((t) =>
              t.id === "apha-review" && !t.completed ? { ...t, due } : t,
            )
          : [
              ...d.tasks,
              {
                id: d.tasks.some((t) => t.id === "apha-review")
                  ? id()
                  : "apha-review",
                title: "Review bird keeper registration details",
                kind: "poultry",
                due,
                time: "09:00",
                repeatDays: 365,
                animalId: "",
                habitatId: "",
                completed: false,
                notes: `Review ${data.settings.country} requirements and update your official keeper details.`,
              },
            ],
      }))
    )
      toast("Your registration review is in the care planner.");
  }
  if (page === "directory")
    return (
      <>
        <div className="info-strip">
          <MapPin size={19} />
          <p>
            Use these specialist directories to find a real practice or
            supplier. Confirm services and availability directly.
          </p>
        </div>
        <div className="directory-grid">
          {[
            {
              name: "Find a registered vet",
              tag: "VETERINARY DIRECTORY",
              icon: Heart,
              description:
                "Search the Royal College of Veterinary Surgeons directory for a practice, then ask about poultry or reptile experience.",
              url: "https://findavet.rcvs.org.uk/",
              action: "Search the RCVS directory",
            },
            {
              name: "British Hen Welfare Trust",
              tag: "POULTRY SUPPORT",
              icon: Bird,
              description:
                "Hen rehoming, keeper support and practical resources from a UK poultry charity.",
              url: "https://www.bhwt.org.uk/",
              action: "Explore hen support",
            },
            {
              name: "RSPCA reptile care",
              tag: "REPTILE CARE RESOURCES",
              icon: Leaf,
              description:
                "Species-specific care information, including housing, diet and environmental needs.",
              url: "https://www.rspca.org.uk/adviceandwelfare/pets/other",
              action: "Find a species care guide",
            },
            {
              name: "Omlet",
              tag: "COOPS & POULTRY SUPPLIES",
              icon: Sprout,
              description:
                "Explore coops, covered runs and accessories. The app does not purchase anything on your behalf.",
              url: "https://www.omlet.co.uk/",
              action: "Browse supplier website",
            },
            {
              name: "The Poultry Club of Great Britain",
              tag: "BREEDS & KEEPING",
              icon: BookOpen,
              description:
                "Breed information, clubs and resources for people keeping and breeding poultry.",
              url: "https://www.poultryclub.org/",
              action: "Visit the Poultry Club",
            },
            {
              name: "Federation of British Herpetologists",
              tag: "REPTILE COMMUNITY",
              icon: ShieldCheck,
              description:
                "Find reptile societies and resources through the UK's federation of herpetological groups.",
              url: "https://www.fbh.org.uk/",
              action: "Explore the federation",
            },
          ].map((d) => (
            <section className="panel directory-card" key={d.name}>
              <span className="large-icon sage">
                <d.icon size={25} />
              </span>
              <span className="eyebrow">{d.tag}</span>
              <h2>{d.name}</h2>
              <p>{d.description}</p>
              <ExternalLink href={d.url}>{d.action}</ExternalLink>
            </section>
          ))}
        </div>
        <p className="insight-note">
          External resources, not paid placements. No purchases or affiliate
          tracking are built into this app.
        </p>
      </>
    );
  return (
    <>
      <div className="guide-grid">
        <section className="panel biosecurity-panel">
          <SectionTitle
            title="Your biosecurity checklist"
            subtitle="A helpful routine alongside current official requirements."
            action={
              <Badge>
                {data.checklist.length}/{checks.length} checked
              </Badge>
            }
          />
          <div className="checklist">
            {checks.map((c) => (
              <button
                key={c.id}
                className={data.checklist.includes(c.id) ? "checked" : ""}
                onClick={() => toggle(c.id)}
              >
                <span className="task-check">
                  {data.checklist.includes(c.id) ? <Check size={14} /> : null}
                </span>
                <span>
                  <strong>{c.label}</strong>
                  <small>{c.detail}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="guide-source">
            <ExternalLink href="https://www.gov.uk/guidance/avian-influenza-bird-flu">
              APHA bird flu guidance
            </ExternalLink>
            <button className="text-link" onClick={() => setConfirmed(true)}>
              <RefreshCw size={14} />
              Reset checklist
            </button>
          </div>
        </section>
        <aside>
          <section className="official-card">
            <ShieldCheck size={25} />
            <span className="eyebrow">OFFICIAL GUIDANCE</span>
            <h2>Check the latest bird flu situation</h2>
            <p>
              Restrictions change by location and date. Check official notices
              and the disease-zone map before making decisions.
            </p>
            <ExternalLink href="https://www.gov.uk/government/collections/avian-influenza-bird-flu">
              Latest GOV.UK updates
            </ExternalLink>
            <ExternalLink href="https://www.gov.uk/guidance/avian-influenza-bird-flu">
              Signs & reporting guidance
            </ExternalLink>
            <small>
              This app has no live alert feed. It does not show a disease-free
              status for your location.
            </small>
          </section>
          <section className="panel registration-card">
            <span className="large-icon sage">
              <CalendarDays size={22} />
            </span>
            <h3>Bird keeper registration</h3>
            <p>
              Your region: <strong>{data.settings.country}</strong>
            </p>
            {data.settings.aphaReference ? (
              <p>
                Reference: <strong>{data.settings.aphaReference}</strong>
              </p>
            ) : null}
            <p>
              {data.settings.aphaUpdated
                ? `Last reviewed ${formatDate(data.settings.aphaUpdated, true)}`
                : "Add your registration and last update in Settings."}
            </p>
            <ExternalLink href={countryLinks[data.settings.country]}>
              Your region's registration guidance
            </ExternalLink>
            <button className="button secondary" onClick={planUpdate}>
              <PlusIcon />
              Plan an annual review
            </button>
            <button className="text-link" onClick={() => navigate("settings")}>
              Update keeper details
              <ArrowRight size={15} />
            </button>
          </section>
        </aside>
      </div>
      <SectionTitle title="Keep learning, keep caring" />
      <div className="resource-grid">
        <section className="panel resource-card">
          <Bird size={27} />
          <h3>Keeping birds in England & Wales</h3>
          <p>
            Official guidance covers registration within one month of keeping
            birds, annual reviews, and when details need updating.
          </p>
          <ExternalLink href="https://www.gov.uk/government/collections/register-as-a-bird-keeper">
            Read current registration guidance
          </ExternalLink>
        </section>
        <section className="panel resource-card">
          <Leaf size={27} />
          <h3>Species-specific reptile care</h3>
          <p>
            Start with a care sheet for your species. Set habitat targets and
            feeding routines to match your animal's needs.
          </p>
          <ExternalLink href="https://www.rspca.org.uk/adviceandwelfare/pets/other">
            RSPCA reptile resources
          </ExternalLink>
        </section>
        <section className="panel resource-card">
          <Heart size={27} />
          <h3>A vet who knows your animals</h3>
          <p>
            Find a registered practice and ask about experience with poultry or
            your reptile species before an urgent visit.
          </p>
          <ExternalLink href="https://findavet.rcvs.org.uk/">
            Find a registered vet
          </ExternalLink>
        </section>
      </div>
      {confirmed ? (
        <Modal
          title="Start a fresh checklist?"
          description="Your completed checks will be cleared so you can review them again."
          onClose={() => setConfirmed(false)}
        >
          <div className="modal-foot">
            <button
              className="button secondary"
              onClick={() => setConfirmed(false)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (update((d) => ({ ...d, checklist: [] }))) {
                  setConfirmed(false);
                  toast("A fresh checklist, ready for your next check-in.");
                }
              }}
            >
              Reset checklist
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
function PlusIcon() {
  return <CalendarDays size={16} />;
}
function download(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function KeeperSettings() {
  const { data, update, replace, toast, error } = useData();
  const [action, setAction] = useState<"fresh" | "demo" | null>(null);
  const [imported, setImported] = useState<AppData | null>(null);
  const [importError, setImportError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    if (
      update((d) => ({
        ...d,
        settings: {
          keeper: s("keeper"),
          collection: s("collection"),
          country: s("country") as KeeperDetails["country"],
          postcode: s("postcode"),
          aphaReference: s("aphaReference"),
          aphaUpdated: s("aphaUpdated"),
        },
      }))
    )
      toast("Your keeper details are saved.");
  }
  async function importFile(f: File | undefined) {
    if (!f) return;
    setImportError("");
    try {
      if (f.size > 10 * 1024 * 1024)
        throw new Error("Use a backup smaller than 10 MB.");
      const parsed = dataSchema.safeParse(JSON.parse(await f.text()));
      if (!parsed.success)
        throw new Error(
          "This file is not a valid Flock & Scale backup. Your current records are unchanged.",
        );
      setImported(parsed.data);
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Unable to read the backup.",
      );
    }
    if (file.current) file.current.value = "";
  }
  function exportCsv() {
    const header = [
      "date",
      "time",
      "kind",
      "workspace",
      "animal",
      "habitat",
      "value",
      "unit",
      "warm_c",
      "cool_c",
      "humidity_percent",
      "notes",
    ];
    const escape = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const rows = data.logs.map((l) =>
      [
        l.date,
        l.time,
        l.kind,
        l.workspace,
        data.animals.find((a) => a.id === l.animalId)?.name ?? "",
        data.habitats.find((h) => h.id === l.habitatId)?.name ?? "",
        l.value,
        l.unit,
        l.temperature ?? "",
        l.coolTemperature ?? "",
        l.humidity ?? "",
        l.notes,
      ]
        .map(escape)
        .join(","),
    );
    download(
      `flock-scale-records-${today()}.csv`,
      "\uFEFF" + [header.join(","), ...rows].join("\r\n"),
      "text/csv;charset=utf-8;",
    );
    toast("Your daily records have been exported.");
  }
  return (
    <div className="settings-grid">
      <section className="panel settings-card">
        <SectionTitle
          title="The keeper behind the care"
          subtitle="A few details to make this space your own."
        />
        <form
          onSubmit={save}
          key={data.settings.keeper + data.settings.collection}
        >
          <div className="form-grid">
            <Field label="Your name">
              <input
                name="keeper"
                required
                maxLength={80}
                defaultValue={data.settings.keeper}
              />
            </Field>
            <Field label="Collection name">
              <input
                name="collection"
                required
                maxLength={100}
                defaultValue={data.settings.collection}
              />
            </Field>
            <Field label="Country">
              <select name="country" defaultValue={data.settings.country}>
                {["England", "Wales", "Scotland", "Northern Ireland"].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Postcode (optional)">
              <input
                name="postcode"
                maxLength={12}
                defaultValue={data.settings.postcode}
                placeholder="e.g. BS1 1AA"
              />
            </Field>
            <Field label="APHA / keeper reference (optional)">
              <input
                name="aphaReference"
                defaultValue={data.settings.aphaReference}
              />
            </Field>
            <Field label="Registration last reviewed">
              <input
                name="aphaUpdated"
                type="date"
                max={today()}
                defaultValue={data.settings.aphaUpdated}
              />
            </Field>
          </div>
          <div className="settings-save">
            <button className="button primary">
              <Save size={16} />
              Save keeper details
            </button>
          </div>
        </form>
      </section>
      <section className="panel settings-card backup-card">
        <SectionTitle
          title="Your records belong to you"
          subtitle="Saved on this browser and device."
        />
        <div className="storage-explanation">
          <ShieldCheck size={24} />
          <p>
            No subscriptions or cloud services are connected. Clearing browser
            data removes device records. Export regular backups to keep a copy.
          </p>
        </div>
        <button
          className="backup-button"
          onClick={() => {
            download(
              `flock-scale-backup-${today()}.json`,
              JSON.stringify(data, null, 2),
            );
            toast("Your complete backup is ready.");
          }}
        >
          <span className="stat-icon sage">
            <Download size={21} />
          </span>
          <span>
            <strong>Export complete backup</strong>
            <small>Animals, habitats, tasks and all your records · JSON</small>
          </span>
          <ArrowRight size={17} />
        </button>
        <button className="backup-button" onClick={exportCsv}>
          <span className="stat-icon sand">
            <Download size={21} />
          </span>
          <span>
            <strong>Export daily records</strong>
            <small>Open in Excel or another spreadsheet · CSV</small>
          </span>
          <ArrowRight size={17} />
        </button>
        <button className="backup-button" onClick={() => file.current?.click()}>
          <span className="stat-icon lilac">
            <Upload size={21} />
          </span>
          <span>
            <strong>Restore a backup</strong>
            <small>Review a saved JSON backup before replacing records</small>
          </span>
          <ArrowRight size={17} />
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
        {importError ? (
          <p className="form-error" role="alert">
            {importError}
          </p>
        ) : null}
        {error ? (
          <button
            className="button secondary"
            onClick={() => {
              const raw = localStorage.getItem(STORAGE_KEY);
              if (raw) download(`flock-scale-recovery-${today()}.json`, raw);
            }}
          >
            Export unreadable stored records
          </button>
        ) : null}
      </section>
      <section className="panel settings-card fresh-card">
        <SectionTitle
          title={
            data.demo
              ? "Ready to make it yours?"
              : "A fresh start, when you need one"
          }
        />
        <p>
          {data.demo
            ? "You're exploring a clearly labelled sample collection. Start your own to replace the sample animals and records."
            : "Export a backup before replacing your collection."}
        </p>
        <div className="fresh-actions">
          <button className="button primary" onClick={() => setAction("fresh")}>
            <Sprout size={17} />
            Start my own collection
          </button>
          <button
            className="button secondary"
            onClick={() => setAction("demo")}
          >
            <RefreshCw size={16} />
            Load sample collection
          </button>
        </div>
      </section>
      <section className="panel settings-card about-card">
        <Leaf size={27} />
        <h3>Flock & Scale</h3>
        <p>A little care, every day.</p>
        <Badge tone="green">Free · Local records</Badge>
        <p className="muted">
          Built with Next.js, React, Lucide icons and DM Sans. No account,
          purchase, email service, live sensor feed or cloud sync is connected.
        </p>
      </section>
      {action ? (
        <Modal
          title={
            action === "fresh"
              ? "Start your own collection?"
              : "Load the sample collection?"
          }
          description="This replaces all records on this device. Export a complete backup first to keep your current collection."
          onClose={() => setAction(null)}
        >
          <div className="modal-foot">
            <button
              className="button secondary"
              onClick={() => setAction(null)}
            >
              Keep current collection
            </button>
            <button
              className="button primary"
              onClick={() => {
                const next =
                  action === "fresh"
                    ? { ...emptyData(), settings: data.settings }
                    : demoData();
                if (replace(next)) {
                  toast(
                    action === "fresh"
                      ? "A fresh start. Add your first animal or habitat."
                      : "Sample collection loaded.",
                  );
                  setAction(null);
                }
              }}
            >
              Replace collection
            </button>
          </div>
        </Modal>
      ) : null}
      {imported ? (
        <Modal
          title="Restore this backup?"
          description="This replaces your current device records. Export your current collection first if you want to keep both."
          onClose={() => setImported(null)}
        >
          <div className="import-summary">
            <strong>{imported.settings.collection}</strong>
            <p>
              {imported.animals.length} animals · {imported.habitats.length}{" "}
              habitats · {imported.logs.length} records ·{" "}
              {imported.tasks.length} tasks
            </p>
          </div>
          <div className="modal-foot">
            <button
              className="button secondary"
              onClick={() => setImported(null)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (replace(imported)) {
                  toast("Your backup has been restored.");
                  setImported(null);
                }
              }}
            >
              <Upload size={16} />
              Restore backup
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
