import { z } from "zod";
const text = z.string().max(10000);
const name = z.string().trim().min(1, "Enter a name").max(200);
const identifier = z.string().max(200);
const date = z.union([z.literal(""), z.iso.date()]);
const count = z.number().finite().min(0).max(1000000);
const kind = z.enum(["poultry", "reptile"]);
const workspace = z.enum(["all", "poultry", "reptile"]);
export const dataSchema = z
  .object({
    version: z.literal(1),
    demo: z.boolean(),
    settings: z.object({
      keeper: name,
      collection: name,
      country: z.enum(["England", "Wales", "Scotland", "Northern Ireland"]),
      postcode: text,
      aphaReference: text,
      aphaUpdated: date,
    }),
    animals: z
      .array(
        z.object({
          id: identifier,
          name,
          kind,
          species: name,
          breed: text,
          sex: z.enum(["Female", "Male", "Unknown"]),
          born: date,
          habitatId: identifier,
          status: z.enum(["Healthy", "Monitoring", "Quarantine", "Deceased"]),
          image: z.union([
            z.literal(""),
            z
              .url()
              .refine(
                (v) => v.startsWith("https://"),
                "Use an HTTPS image URL",
              ),
          ]),
          notes: text,
          acquired: date,
          motherId: identifier,
          fatherId: identifier,
          deceased: date.optional(),
        }),
      )
      .max(10000),
    habitats: z
      .array(
        z.object({
          id: identifier,
          name: text,
          kind,
          type: text,
          description: text,
          warmMin: count,
          warmMax: count,
          coolMin: count,
          coolMax: count,
          humidityMin: count.max(100),
          humidityMax: count.max(100),
          uvbReplaced: date,
          uvbMonths: count.max(120),
        }),
      )
      .max(10000),
    tasks: z
      .array(
        z.object({
          id: identifier,
          title: text,
          kind: workspace,
          due: z.iso.date(),
          time: text,
          repeatDays: count.max(3650),
          animalId: identifier,
          habitatId: identifier,
          completed: z.boolean(),
          notes: text,
        }),
      )
      .max(100000),
    logs: z
      .array(
        z.object({
          id: identifier,
          kind: z.enum([
            "Eggs",
            "Feeding",
            "Weight",
            "Shedding",
            "Environment",
            "Health",
            "Cleaning",
          ]),
          workspace: kind,
          date: z.iso.date(),
          time: text,
          animalId: identifier,
          habitatId: identifier,
          value: count,
          unit: text,
          notes: text,
          temperature: z.number().finite().min(-50).max(100).optional(),
          coolTemperature: z.number().finite().min(-50).max(100).optional(),
          humidity: count.max(100).optional(),
          cost: count.optional(),
        }),
      )
      .max(100000),
    feed: z
      .array(
        z.object({
          id: identifier,
          name: text,
          kind,
          stock: count,
          unit: text,
          dailyUse: count,
          cost: count,
          purchased: date,
        }),
      )
      .max(10000),
    treatments: z
      .array(
        z.object({
          id: identifier,
          animalId: identifier,
          medicine: text,
          started: z.iso.date(),
          ended: date,
          withdrawalEnd: date,
          dose: text,
          vet: text,
          notes: text,
        }),
      )
      .max(100000),
    clutches: z
      .array(
        z.object({
          id: identifier,
          name: text,
          kind,
          started: z.iso.date(),
          expected: z.iso.date(),
          eggs: count,
          fertile: count,
          hatched: count,
          motherId: identifier,
          fatherId: identifier,
          temperature: count,
          notes: text,
        }),
      )
      .max(10000),
    checklist: z.array(text).max(1000),
  })
  .superRefine((data, ctx) => {
    for (const key of [
      "animals",
      "habitats",
      "tasks",
      "logs",
      "feed",
      "treatments",
      "clutches",
    ] as const) {
      const ids = data[key].map((x) => x.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Duplicate record IDs",
        });
    }
    for (const [i, h] of data.habitats.entries())
      if (
        h.warmMin > h.warmMax ||
        h.coolMin > h.coolMax ||
        h.humidityMin > h.humidityMax
      )
        ctx.addIssue({
          code: "custom",
          path: ["habitats", i],
          message: "Minimum must not exceed maximum",
        });
    for (const [i, c] of data.clutches.entries())
      if (c.fertile > c.eggs || c.hatched > c.eggs || c.expected < c.started)
        ctx.addIssue({
          code: "custom",
          path: ["clutches", i],
          message: "Check egg counts and hatch dates",
        });
    for (const [i, t] of data.treatments.entries())
      if (
        (t.ended && t.ended < t.started) ||
        (t.withdrawalEnd && t.withdrawalEnd < t.started)
      )
        ctx.addIssue({
          code: "custom",
          path: ["treatments", i],
          message: "End dates must follow the start date",
        });
    for (const [i, l] of data.logs.entries())
      if (l.kind === "Eggs" && !Number.isInteger(l.value))
        ctx.addIssue({
          code: "custom",
          path: ["logs", i],
          message: "Egg counts must be whole numbers",
        });
    const animals = new Map(data.animals.map((a) => [a.id, a]));
    const habitats = new Map(data.habitats.map((h) => [h.id, h]));
    for (const [i, a] of data.animals.entries()) {
      if (a.habitatId && habitats.get(a.habitatId)?.kind !== a.kind)
        ctx.addIssue({
          code: "custom",
          path: ["animals", i],
          message: "Choose a habitat from the animal's workspace",
        });
      const seen = new Set<string>();
      const visit = (aid: string): boolean => {
        if (aid === a.id) return true;
        if (seen.has(aid)) return false;
        seen.add(aid);
        const parent = animals.get(aid);
        if (!parent) return false;
        return [parent.motherId, parent.fatherId].filter(Boolean).some(visit);
      };
      if ([a.motherId, a.fatherId].filter(Boolean).some(visit))
        ctx.addIssue({
          code: "custom",
          path: ["animals", i],
          message: "Parent records cannot contain a family cycle",
        });
      if (a.deceased && a.born && a.deceased < a.born)
        ctx.addIssue({
          code: "custom",
          path: ["animals", i],
          message: "Death date must follow birth date",
        });
    }
  });
