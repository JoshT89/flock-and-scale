"use client";
import { useState, type FormEvent } from "react";
import { Plus, Check, AlertCircle } from "lucide-react";
import type {
  Animal,
  AnimalKind,
  AppData,
  CareTask,
  Clutch,
  Feed,
  Habitat,
  LogKind,
  RecordLog,
  Treatment,
  Workspace,
} from "@/lib/types";
import { id, today, isWithdrawing } from "@/lib/utils";
import { useData } from "./store";
import { Field, Modal } from "./ui";

export type Editor = {
  type: "animal" | "habitat" | "task" | "feed" | "treatment" | "clutch" | "log";
  entityId?: string;
  logKind?: LogKind;
  animalId?: string;
  habitatId?: string;
};
const editorTitles = {
  animal: "Add an animal",
  habitat: "Add a habitat",
  task: "Plan a care task",
  feed: "Add feed & supplies",
  treatment: "Record a treatment",
  clutch: "Start a hatch record",
  log: "Record a little care",
};
export function RecordEditor({
  editor,
  workspace,
  onClose,
}: {
  editor: Editor;
  workspace: Workspace;
  onClose: () => void;
}) {
  const { data, update, toast } = useData();
  const animal = data.animals.find((a) => a.id === editor.entityId);
  const habitat = data.habitats.find((a) => a.id === editor.entityId);
  const feed = data.feed.find((a) => a.id === editor.entityId);
  const task = data.tasks.find((a) => a.id === editor.entityId);
  const clutch = data.clutches.find((a) => a.id === editor.entityId);
  const [kind, setKind] = useState<AnimalKind>(
    animal?.kind ??
      habitat?.kind ??
      feed?.kind ??
      clutch?.kind ??
      data.animals.find((a) => a.id === editor.animalId)?.kind ??
      data.habitats.find((h) => h.id === editor.habitatId)?.kind ??
      (workspace === "reptile" ? "reptile" : "poultry"),
  );
  const [logKind, setLogKind] = useState<LogKind>(
    editor.logKind ?? (workspace === "reptile" ? "Feeding" : "Eggs"),
  );
  const [selectedAnimal, setSelectedAnimal] = useState(editor.animalId ?? "");
  const [selectedHabitat, setSelectedHabitat] = useState(
    editor.habitatId ?? animal?.habitatId ?? "",
  );
  const [error, setError] = useState("");
  const [healthStatus, setHealthStatus] = useState<Animal["status"]>(
    animal?.status ?? "Healthy",
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const activeAnimals = data.animals.filter(
    (a) => a.kind === kind && a.status !== "Deceased",
  );
  const habitats = data.habitats.filter((h) => h.kind === kind);
  const affected = data.treatments
    .filter((t) => isWithdrawing(t))
    .map((t) => data.animals.find((a) => a.id === t.animalId))
    .filter(Boolean);
  const showLogWarning =
    logKind === "Eggs" &&
    affected.some((a) => a?.habitatId === selectedHabitat);
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const s = (key: string) => String(form.get(key) ?? "").trim();
    const n = (key: string) => Number(form.get(key) ?? 0);
    const rid = editor.entityId ?? id();
    let changes: (d: AppData) => AppData;
    const upsert = <T extends { id: string }>(items: T[], item: T) =>
      editor.entityId
        ? items.map((i) => (i.id === item.id ? item : i))
        : [...items, item];
    if (editor.type === "animal") {
      if (
        (s("motherId") && s("motherId") === rid) ||
        (s("fatherId") && s("fatherId") === rid)
      ) {
        setError("An animal cannot be its own parent.");
        return;
      }
      const item: Animal = {
        id: rid,
        name: s("name"),
        kind,
        species: s("species"),
        breed: s("breed"),
        sex: s("sex") as Animal["sex"],
        born: s("born"),
        habitatId: s("habitatId"),
        status: healthStatus,
        image: s("image"),
        notes: s("notes"),
        acquired: s("acquired"),
        motherId: s("motherId"),
        fatherId: s("fatherId"),
        deceased: healthStatus === "Deceased" ? s("deceased") : "",
      };
      changes = (d) => ({
        ...d,
        animals: upsert(d.animals, item),
        logs:
          animal && animal.status !== healthStatus
            ? [
                ...d.logs,
                {
                  id: id(),
                  kind: "Health",
                  workspace: kind,
                  date: healthStatus === "Deceased" ? s("deceased") : today(),
                  time: new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Europe/London",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date()),
                  animalId: rid,
                  habitatId: item.habitatId,
                  value: 0,
                  unit: "",
                  notes: `Health status changed to ${healthStatus}.${item.notes ? ` ${item.notes}` : ""}`,
                },
              ]
            : d.logs,
      });
    } else if (editor.type === "habitat") {
      const item: Habitat = {
        id: rid,
        name: s("name"),
        kind,
        type: s("habitatType"),
        description: s("notes"),
        warmMin: n("warmMin"),
        warmMax: n("warmMax"),
        coolMin: n("coolMin"),
        coolMax: n("coolMax"),
        humidityMin: n("humidityMin"),
        humidityMax: n("humidityMax"),
        uvbReplaced: s("uvbReplaced"),
        uvbMonths: n("uvbMonths"),
      };
      changes = (d) => ({ ...d, habitats: upsert(d.habitats, item) });
    } else if (editor.type === "task") {
      const item: CareTask = {
        id: rid,
        title: s("name"),
        kind: s("taskKind") as Workspace,
        due: s("date"),
        time: s("time"),
        repeatDays: n("repeatDays"),
        animalId: s("animalId"),
        habitatId: s("habitatId"),
        completed: task?.completed ?? false,
        notes: s("notes"),
      };
      changes = (d) => ({ ...d, tasks: upsert(d.tasks, item) });
    } else if (editor.type === "feed") {
      const item: Feed = {
        id: rid,
        name: s("name"),
        kind,
        stock: n("stock"),
        dailyUse: n("dailyUse"),
        unit: s("unit"),
        cost: n("cost"),
        purchased: s("date"),
      };
      changes = (d) => ({ ...d, feed: upsert(d.feed, item) });
    } else if (editor.type === "treatment") {
      const item: Treatment = {
        id: rid,
        animalId: s("animalId"),
        medicine: s("name"),
        started: s("date"),
        ended: s("ended"),
        withdrawalEnd: s("withdrawalEnd"),
        dose: s("dose"),
        vet: s("vet"),
        notes: s("notes"),
      };
      changes = (d) => ({ ...d, treatments: [...d.treatments, item] });
    } else if (editor.type === "clutch") {
      const item: Clutch = {
        id: rid,
        name: s("name"),
        kind,
        started: s("date"),
        expected: s("expected"),
        eggs: n("eggs"),
        fertile: n("fertile"),
        hatched: n("hatched"),
        motherId: s("motherId"),
        fatherId: s("fatherId"),
        temperature: n("temperature"),
        notes: s("notes"),
      };
      changes = (d) => ({ ...d, clutches: upsert(d.clutches, item) });
    } else {
      const animalId = s("animalId");
      const target = data.animals.find((a) => a.id === animalId);
      const habitatId = s("habitatId") || target?.habitatId || "";
      if (logKind === "Eggs" && !habitatId) {
        setError("Choose the coop you collected from.");
        return;
      }
      if (logKind === "Environment" && !habitatId) {
        setError("Choose a habitat for these readings.");
        return;
      }
      const value = n("value");
      const feedId = s("feedId");
      const stock = data.feed.find((f) => f.id === feedId);
      if (logKind === "Feeding" && stock && value > stock.stock) {
        setError(
          "That amount exceeds the recorded feed stock. Restock it first.",
        );
        return;
      }
      const item: RecordLog = {
        id: rid,
        kind: logKind,
        workspace: target?.kind ?? kind,
        date: s("date"),
        time: s("time"),
        animalId,
        habitatId,
        value: logKind === "Environment" ? n("temperature") : value,
        unit:
          logKind === "Eggs"
            ? "eggs"
            : logKind === "Weight"
              ? "g"
              : logKind === "Environment"
                ? "°C"
                : (stock?.unit ?? s("unit")),
        notes: s("notes"),
        ...(logKind === "Environment"
          ? {
              temperature: n("temperature"),
              coolTemperature: n("coolTemperature"),
              humidity: n("humidity"),
            }
          : {}),
      };
      changes = (d) => ({
        ...d,
        logs: [...d.logs, item],
        feed:
          logKind === "Feeding" && stock
            ? d.feed.map((f) =>
                f.id === feedId
                  ? { ...f, stock: Math.round((f.stock - value) * 1000) / 1000 }
                  : f,
              )
            : d.feed,
      });
    }
    if (update(changes)) {
      toast(
        editor.entityId
          ? "Your changes are saved."
          : "Recorded. A little care goes a long way.",
      );
      onClose();
    } else
      setError("Could not save. Check the record values and storage message.");
  }
  const kindField = (
    <Field label="Workspace">
      <select
        value={kind}
        onChange={(e) => {
          setKind(e.target.value as AnimalKind);
          if (e.target.value === "reptile" && logKind === "Eggs")
            setLogKind("Feeding");
          setSelectedAnimal("");
          setSelectedHabitat("");
        }}
      >
        <option value="poultry">Poultry</option>
        <option value="reptile">Reptiles</option>
      </select>
    </Field>
  );
  const animalField = (required = false, defaultId = "") => (
    <Field label="Animal">
      <select
        name="animalId"
        required={required}
        value={selectedAnimal || defaultId}
        onChange={(e) => setSelectedAnimal(e.target.value)}
      >
        <option value="">
          {required ? "Choose an animal" : "Whole habitat / no individual"}
        </option>
        {activeAnimals.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.species}
          </option>
        ))}
      </select>
    </Field>
  );
  const habitatField = (_defaultId = "") => (
    <Field label={kind === "poultry" ? "Coop or brooder" : "Habitat"}>
      <select
        name="habitatId"
        value={selectedHabitat}
        onChange={(e) => setSelectedHabitat(e.target.value)}
      >
        <option value="">
          {editor.type === "animal" ? "Unassigned" : "Choose a habitat"}
        </option>
        {habitats.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
    </Field>
  );
  const parents = (
    <>
      <Field label="Mother">
        <select
          name="motherId"
          defaultValue={animal?.motherId ?? clutch?.motherId ?? ""}
        >
          <option value="">Unknown / not recorded</option>
          {activeAnimals
            .filter((a) => a.id !== animal?.id && a.sex !== "Male")
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Father">
        <select
          name="fatherId"
          defaultValue={animal?.fatherId ?? clutch?.fatherId ?? ""}
        >
          <option value="">Unknown / not recorded</option>
          {activeAnimals
            .filter((a) => a.id !== animal?.id && a.sex !== "Female")
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </select>
      </Field>
    </>
  );
  return (
    <Modal
      title={
        editor.entityId
          ? `Edit ${animal?.name ?? habitat?.name ?? feed?.name ?? task?.title ?? clutch?.name ?? "record"}`
          : editorTitles[editor.type]
      }
      description="Saved privately on this device. Export a backup from Settings."
      onClose={onClose}
      wide
    >
      {deleteConfirm ? (
        <div className="delete-task-confirm">
          <p>
            Remove this care task? Completed history and other occurrences are
            kept.
          </p>
          <div className="modal-foot">
            <button
              className="button secondary"
              onClick={() => setDeleteConfirm(false)}
            >
              Keep task
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (
                  update((d) => ({
                    ...d,
                    tasks: d.tasks.filter((t) => t.id !== editor.entityId),
                  }))
                ) {
                  toast("Care task removed.");
                  onClose();
                }
              }}
            >
              Remove task
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="editor-form">
          <div className="form-grid">
            {editor.type !== "task" ? kindField : null}
            {editor.type === "animal" ? (
              <>
                <Field label="Name">
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={animal?.name}
                    placeholder="e.g. Mabel"
                    autoFocus
                  />
                </Field>
                <Field label="Species">
                  <input
                    key={kind}
                    name="species"
                    required
                    defaultValue={
                      animal?.species ?? (kind === "poultry" ? "Chicken" : "")
                    }
                    placeholder="e.g. Leopard gecko"
                  />
                </Field>
                <Field label={kind === "poultry" ? "Breed" : "Morph / variety"}>
                  <input
                    name="breed"
                    defaultValue={animal?.breed}
                    placeholder={
                      kind === "poultry"
                        ? "e.g. Buff Orpington"
                        : "e.g. Tangerine"
                    }
                  />
                </Field>
                <Field label="Sex">
                  <select name="sex" defaultValue={animal?.sex ?? "Unknown"}>
                    <option>Unknown</option>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </Field>
                <Field label="Date of birth">
                  <input
                    name="born"
                    type="date"
                    max={today()}
                    defaultValue={animal?.born}
                  />
                </Field>
                <Field label="Date acquired">
                  <input
                    name="acquired"
                    type="date"
                    max={today()}
                    defaultValue={animal?.acquired ?? today()}
                  />
                </Field>
                {habitatField(animal?.habitatId)}
                <Field label="Health status">
                  <select
                    value={healthStatus}
                    onChange={(e) =>
                      setHealthStatus(e.target.value as Animal["status"])
                    }
                  >
                    <option>Healthy</option>
                    <option>Monitoring</option>
                    <option>Quarantine</option>
                    <option>Deceased</option>
                  </select>
                </Field>
                {healthStatus === "Deceased" ? (
                  <Field
                    label="Date of death"
                    hint="The animal and its records stay in your collection"
                  >
                    <input
                      name="deceased"
                      type="date"
                      required
                      max={today()}
                      defaultValue={animal?.deceased || today()}
                    />
                  </Field>
                ) : null}
                <Field
                  label="Photo URL (optional)"
                  hint="A public HTTPS image URL"
                >
                  <input
                    name="image"
                    type="url"
                    pattern="https://.*"
                    defaultValue={animal?.image}
                    placeholder="https://…"
                  />
                </Field>
                {parents}
              </>
            ) : null}
            {editor.type === "habitat" ? (
              <>
                <Field label="Habitat name">
                  <input
                    name="name"
                    required
                    autoFocus
                    defaultValue={habitat?.name}
                    placeholder="e.g. The Garden Coop"
                  />
                </Field>
                <Field label="Habitat type">
                  <input
                    name="habitatType"
                    required
                    defaultValue={habitat?.type}
                    placeholder={
                      kind === "poultry"
                        ? "Coop, brooder, covered run…"
                        : "Vivarium, terrarium…"
                    }
                  />
                </Field>
                {kind === "reptile" ? (
                  <>
                    <div className="form-note span-2">
                      Set targets from a species-specific care plan or your
                      reptile vet. Readings are manually recorded.
                    </div>
                    <Field label="Warm side minimum (°C)">
                      <input
                        name="warmMin"
                        type="number"
                        step="0.1"
                        min="0"
                        max="60"
                        required
                        defaultValue={habitat?.warmMin}
                      />
                    </Field>
                    <Field label="Warm side maximum (°C)">
                      <input
                        name="warmMax"
                        type="number"
                        step="0.1"
                        min="0"
                        max="60"
                        required
                        defaultValue={habitat?.warmMax}
                      />
                    </Field>
                    <Field label="Cool side minimum (°C)">
                      <input
                        name="coolMin"
                        type="number"
                        step="0.1"
                        min="0"
                        max="60"
                        required
                        defaultValue={habitat?.coolMin}
                      />
                    </Field>
                    <Field label="Cool side maximum (°C)">
                      <input
                        name="coolMax"
                        type="number"
                        step="0.1"
                        min="0"
                        max="60"
                        required
                        defaultValue={habitat?.coolMax}
                      />
                    </Field>
                    <Field label="Humidity minimum (%)">
                      <input
                        name="humidityMin"
                        type="number"
                        min="0"
                        max="100"
                        required
                        defaultValue={habitat?.humidityMin}
                      />
                    </Field>
                    <Field label="Humidity maximum (%)">
                      <input
                        name="humidityMax"
                        type="number"
                        min="0"
                        max="100"
                        required
                        defaultValue={habitat?.humidityMax}
                      />
                    </Field>
                    <Field label="UVB lamp last replaced">
                      <input
                        name="uvbReplaced"
                        type="date"
                        max={today()}
                        defaultValue={habitat?.uvbReplaced}
                      />
                    </Field>
                    <Field
                      label="Lamp replacement interval (months)"
                      hint="Use the manufacturer's instructions"
                    >
                      <input
                        name="uvbMonths"
                        type="number"
                        min="0"
                        max="120"
                        defaultValue={habitat?.uvbMonths ?? 0}
                      />
                    </Field>
                  </>
                ) : null}
              </>
            ) : null}
            {editor.type === "task" ? (
              <>
                <Field label="Task">
                  <input
                    name="name"
                    required
                    autoFocus
                    defaultValue={task?.title}
                    placeholder="e.g. Refresh drinking water"
                  />
                </Field>
                <Field label="Workspace">
                  <select
                    name="taskKind"
                    defaultValue={task?.kind ?? workspace}
                  >
                    <option value="all">All animals</option>
                    <option value="poultry">Poultry</option>
                    <option value="reptile">Reptiles</option>
                  </select>
                </Field>
                <Field label="Due date">
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={task?.due ?? today()}
                  />
                </Field>
                <Field label="Time">
                  <input
                    name="time"
                    type="time"
                    defaultValue={task?.time ?? "09:00"}
                  />
                </Field>
                <Field label="Repeat">
                  <select
                    name="repeatDays"
                    defaultValue={task?.repeatDays ?? 0}
                  >
                    <option value="0">One time</option>
                    <option value="1">Every day</option>
                    <option value="2">Every 2 days</option>
                    <option value="3">Every 3 days</option>
                    <option value="7">Weekly</option>
                    <option value="14">Every 2 weeks</option>
                    <option value="30">Every 30 days</option>
                    <option value="365">Every year</option>
                  </select>
                </Field>
                <Field label="Animal (optional)">
                  <select
                    name="animalId"
                    defaultValue={task?.animalId ?? editor.animalId ?? ""}
                  >
                    <option value="">No individual animal</option>
                    {data.animals
                      .filter((a) => a.status !== "Deceased")
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Habitat (optional)">
                  <select
                    name="habitatId"
                    defaultValue={task?.habitatId ?? editor.habitatId ?? ""}
                  >
                    <option value="">No habitat</option>
                    {data.habitats.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            ) : null}
            {editor.type === "feed" ? (
              <>
                <Field label="Feed / supply name">
                  <input
                    name="name"
                    required
                    autoFocus
                    defaultValue={feed?.name}
                    placeholder="e.g. Organic layers pellets"
                  />
                </Field>
                <Field label="Current stock">
                  <input
                    name="stock"
                    type="number"
                    required
                    min="0"
                    step="0.001"
                    defaultValue={feed?.stock}
                  />
                </Field>
                <Field label="Unit">
                  <select name="unit" defaultValue={feed?.unit ?? "kg"}>
                    <option>kg</option>
                    <option>g</option>
                    <option>feeders</option>
                    <option>litres</option>
                    <option>units</option>
                  </select>
                </Field>
                <Field
                  label="Estimated daily use"
                  hint="In the same stock unit; used to estimate days remaining"
                >
                  <input
                    name="dailyUse"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={feed?.dailyUse ?? 0}
                  />
                </Field>
                <Field label="Purchase cost (£)">
                  <input
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={feed?.cost ?? 0}
                  />
                </Field>
                <Field label="Last purchased">
                  <input
                    name="date"
                    type="date"
                    max={today()}
                    defaultValue={feed?.purchased ?? today()}
                  />
                </Field>
              </>
            ) : null}
            {editor.type === "treatment" ? (
              <>
                {animalField(true)}
                <Field label="Medication / treatment">
                  <input
                    name="name"
                    required
                    autoFocus
                    placeholder="As prescribed by your vet"
                  />
                </Field>
                <Field label="Started">
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={today()}
                  />
                </Field>
                <Field label="Treatment end">
                  <input name="ended" type="date" />
                </Field>
                <Field
                  label="Keep eggs withheld through"
                  hint="Enter the final withdrawal date specified by your vet. This date is inclusive."
                >
                  <input name="withdrawalEnd" type="date" />
                </Field>
                <Field label="Prescribed dose">
                  <input
                    name="dose"
                    required
                    placeholder="Copy the prescription / label"
                  />
                </Field>
                <Field label="Prescribing vet">
                  <input name="vet" placeholder="Practice or vet name" />
                </Field>
                <div className="form-note span-2">
                  This is a record of veterinary instructions. The app does not
                  calculate doses or withdrawal periods.
                </div>
              </>
            ) : null}
            {editor.type === "clutch" ? (
              <>
                <Field label="Hatch / clutch name">
                  <input
                    name="name"
                    required
                    autoFocus
                    defaultValue={clutch?.name}
                    placeholder="e.g. Our autumn hatch"
                  />
                </Field>
                <Field label="Incubation started">
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={clutch?.started ?? today()}
                  />
                </Field>
                <Field label="Expected hatch date">
                  <input
                    name="expected"
                    type="date"
                    required
                    defaultValue={clutch?.expected}
                  />
                </Field>
                <Field label="Eggs set">
                  <input
                    name="eggs"
                    type="number"
                    required
                    min="1"
                    step="1"
                    defaultValue={clutch?.eggs}
                  />
                </Field>
                <Field label="Fertile eggs">
                  <input
                    name="fertile"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={clutch?.fertile ?? 0}
                  />
                </Field>
                <Field label="Hatched so far">
                  <input
                    name="hatched"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={clutch?.hatched ?? 0}
                  />
                </Field>
                <Field label="Recorded incubator temperature (°C)">
                  <input
                    name="temperature"
                    type="number"
                    min="0"
                    max="60"
                    step="0.1"
                    defaultValue={clutch?.temperature ?? 0}
                  />
                </Field>
                {parents}
              </>
            ) : null}
            {editor.type === "log" ? (
              <>
                <Field label="Record type">
                  <select
                    value={logKind}
                    onChange={(e) => {
                      setLogKind(e.target.value as LogKind);
                      if (e.target.value === "Eggs") setKind("poultry");
                    }}
                  >
                    {[
                      "Eggs",
                      "Feeding",
                      "Weight",
                      "Shedding",
                      "Environment",
                      "Health",
                      "Cleaning",
                    ]
                      .filter((k) => kind !== "reptile" || k !== "Eggs")
                      .map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                  </select>
                </Field>
                <Field label="Date">
                  <input
                    name="date"
                    type="date"
                    required
                    max={today()}
                    defaultValue={today()}
                  />
                </Field>
                <Field label="Time">
                  <input
                    name="time"
                    type="time"
                    defaultValue={new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Europe/London",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date())}
                  />
                </Field>
                {logKind !== "Eggs"
                  ? animalField(
                      ["Weight", "Shedding", "Health"].includes(logKind),
                    )
                  : null}
                {habitatField()}
                {["Eggs", "Feeding", "Weight"].includes(logKind) ? (
                  <Field
                    label={
                      logKind === "Eggs"
                        ? "Eggs collected"
                        : logKind === "Weight"
                          ? "Weight (g)"
                          : "Amount fed"
                    }
                  >
                    <input
                      name="value"
                      type="number"
                      min={logKind === "Weight" ? "0.001" : "0"}
                      max="1000000"
                      step={logKind === "Eggs" ? "1" : "0.001"}
                      required
                      defaultValue={logKind === "Eggs" ? 1 : undefined}
                    />
                  </Field>
                ) : null}
                {logKind === "Feeding" ? (
                  <>
                    <Field label="Deduct from supply (optional)">
                      <select name="feedId">
                        <option value="">Do not update stock</option>
                        {data.feed
                          .filter((f) => f.kind === kind)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} · {f.stock} {f.unit} available
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Unit (if no supply selected)">
                      <input
                        name="unit"
                        placeholder="kg, feeders, g…"
                        defaultValue={kind === "reptile" ? "feeders" : "kg"}
                      />
                    </Field>
                  </>
                ) : null}
                {logKind === "Environment" ? (
                  <>
                    <Field label="Warm side (°C)">
                      <input
                        name="temperature"
                        type="number"
                        required
                        min="-50"
                        max="100"
                        step="0.1"
                      />
                    </Field>
                    <Field label="Cool side (°C)">
                      <input
                        name="coolTemperature"
                        type="number"
                        required
                        min="-50"
                        max="100"
                        step="0.1"
                      />
                    </Field>
                    <Field label="Humidity (%)">
                      <input
                        name="humidity"
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </Field>
                  </>
                ) : null}
                {showLogWarning ? (
                  <div className="inline-warning span-2">
                    <AlertCircle size={18} /> This coop includes a bird with an
                    active egg withdrawal. Keep affected eggs separate and
                    follow your vet's instructions.
                  </div>
                ) : null}
              </>
            ) : null}
            {editor.type !== "feed" ? (
              <div className="span-2">
                <Field
                  label={
                    logKind === "Shedding" && editor.type === "log"
                      ? "Shed quality & observations"
                      : "Notes"
                  }
                >
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={
                      animal?.notes ??
                      habitat?.description ??
                      task?.notes ??
                      clutch?.notes
                    }
                    placeholder="Anything you'd like to remember…"
                    required={
                      editor.type === "log" &&
                      ["Health", "Shedding"].includes(logKind)
                    }
                  />
                </Field>
              </div>
            ) : null}
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="modal-foot">
            {editor.entityId && editor.type === "task" ? (
              <button
                className="text-link remove-task"
                type="button"
                onClick={() => setDeleteConfirm(true)}
              >
                Remove task
              </button>
            ) : null}
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              {editor.entityId ? <Check size={17} /> : <Plus size={17} />}{" "}
              {editor.entityId ? "Save changes" : "Save record"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
