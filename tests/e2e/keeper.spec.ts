import { test, expect } from "@playwright/test";
import { demoData } from "../../src/lib/seed";
import AxeBuilder from "@axe-core/playwright";
import { today, STORAGE_KEY } from "../../src/lib/utils";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hello, Alex." }),
  ).toBeVisible();
});
test("animal creation survives reload and the reptile workspace filters it", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Add animal", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Workspace", { exact: true }).selectOption("reptile");
  await dialog.getByLabel("Name", { exact: true }).fill("Ember");
  await dialog.getByLabel("Species", { exact: true }).fill("Corn snake");
  await dialog.getByLabel("Sex", { exact: true }).selectOption("Female");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "My animals", exact: true }).click();
  await page
    .getByRole("group", { name: "Animal workspace" })
    .getByRole("button", { name: "Reptiles" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ember", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mabel", exact: true }),
  ).not.toBeVisible();
});
test("egg logging updates basket totals and persists the coop record", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Log today's eggs" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Coop or brooder").selectOption("coop");
  await dialog.getByLabel("Eggs collected").fill("3");
  await dialog
    .getByLabel("Notes", { exact: true })
    .fill("Afternoon collection");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("button", { name: /Eggs today/ })).toContainText(
    "7",
  );
  await page.reload();
  await page.getByRole("link", { name: "Daily records" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Afternoon collection" }),
  ).toContainText("3 eggs");
});
test("care completion schedules exactly one recurring task", async ({
  page,
}) => {
  await page
    .getByRole("button", {
      name: "Complete Refresh water & check the flock",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Complete Refresh water & check the flock",
      exact: true,
    }),
  ).not.toBeVisible();
  const tasks = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).tasks,
    STORAGE_KEY,
  );
  expect(
    tasks.filter(
      (t: { title: string; completed: boolean }) =>
        t.title === "Refresh water & check the flock" && t.completed,
    ),
  ).toHaveLength(1);
  expect(
    tasks.filter(
      (t: { title: string; completed: boolean }) =>
        t.title === "Refresh water & check the flock" && !t.completed,
    ),
  ).toHaveLength(1);
});
test("feeding deducts real stock and rejects excess quantities", async ({
  page,
}) => {
  await page
    .getByRole("group", { name: "Animal workspace" })
    .getByRole("button", { name: "Reptiles" })
    .click();
  await page
    .getByRole("button", { name: "Record a feeding", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Animal", { exact: true }).selectOption("sunny");
  await dialog
    .getByLabel("Deduct from supply (optional)")
    .selectOption("crickets");
  await dialog.getByLabel("Amount fed").fill("99");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(dialog).toContainText("exceeds the recorded feed stock");
  await dialog.getByLabel("Amount fed").fill("6");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await page.getByRole("link", { name: "Feed & supplies" }).click();
  await expect(
    page.locator(".feed-card").filter({ hasText: "Live crickets" }),
  ).toContainText("36");
});
test("out of target environment readings are flagged without inventing sensor data", async ({
  page,
}) => {
  await page
    .getByRole("group", { name: "Animal workspace" })
    .getByRole("button", { name: "Reptiles" })
    .click();
  await page.getByRole("link", { name: "Coops & habitats" }).click();
  const habitat = page
    .locator(".habitat-card")
    .filter({ hasText: "Sunny's Terrarium" });
  await habitat.getByRole("button", { name: "Record conditions" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Warm side (°C)").fill("40");
  await dialog.getByLabel("Cool side (°C)").fill("24");
  await dialog.getByLabel("Humidity (%)").fill("42");
  await dialog.getByLabel("Time", { exact: true }).fill("23:59");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(habitat).toContainText("Outside your targets");
  await expect(habitat).toContainText("40°C");
});
test("recorded withdrawal is active on its final day", async ({ page }) => {
  await page.getByRole("link", { name: "Health & care" }).click();
  await page
    .getByRole("button", { name: "Record treatment", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Animal", { exact: true }).selectOption("mabel");
  await dialog.getByLabel("Medication / treatment").fill("Vet prescription");
  await dialog.getByLabel("Prescribed dose").fill("Per veterinary label");
  await dialog.getByLabel("Keep eggs withheld through").fill(today());
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Vet prescription" }),
  ).toContainText("Eggs withheld");
});
test("invalid backup is rejected; a validated backup is reviewed before restoring", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":5}'),
    });
  await expect(page.locator(".form-error")).toContainText(
    "not a valid Flock & Scale backup",
  );
  const data = demoData();
  data.settings.keeper = "Test keeper";
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data)),
    });
  await expect(page.getByRole("dialog")).toContainText("8 animals");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restore backup" })
    .click();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Your name" })).toHaveValue(
    "Test keeper",
  );
});
test("mobile navigation works and every screen fits the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of [
    "My animals",
    "Coops & habitats",
    "Daily records",
    "Care planner",
    "Health & care",
    "Feed & supplies",
    "Breeding & hatching",
    "Insights",
    "Keeper's guide",
    "Find an expert",
    "Settings",
    "Overview",
  ]) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
});
test("dashboard has working imagery and renders without browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hello, Alex." }),
  ).toBeVisible();
  await expect(page.locator(".hero-image img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".hero-image img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: "artifacts/dashboard.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("saved care records remain available after an offline reload", async ({
  page,
  context,
}) => {
  await page
    .getByRole("button", {
      name: "Complete Refresh water & check the flock",
      exact: true,
    })
    .click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hello, Alex." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cache = await caches.open("flock-scale-shell-v1");
        const keys = await cache.keys();
        return keys.filter((k) => k.url.includes("/_next/static/")).length;
      }),
    )
    .toBeGreaterThan(5);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hello, Alex." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Complete Refresh water & check the flock",
      exact: true,
    }),
  ).not.toBeVisible();
});
test("dashboard and record form meet automated WCAG AA checks", async ({
  page,
}) => {
  const dashboard = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    dashboard.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Log today's eggs" }).click();
  const form = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    form.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
test("one-tap eggs accumulate without opening a form", async ({ page }) => {
  const quick = page.getByRole("button", {
    name: "Add one egg to The Garden Coop",
  });
  await quick.click();
  await quick.click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Eggs today/ })).toContainText(
    "6",
  );
  await page.reload();
  await expect(page.getByRole("button", { name: /Eggs today/ })).toContainText(
    "6",
  );
});
test("mortality keeps the profile and writes a dated health history", async ({
  page,
}) => {
  await page.getByRole("link", { name: "My animals", exact: true }).click();
  await page
    .locator(".animal-card")
    .filter({ has: page.getByRole("heading", { name: "Mabel", exact: true }) })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Edit profile" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Health status").selectOption("Deceased");
  await dialog.getByLabel("Date of death").fill(today());
  await dialog.getByRole("button", { name: "Save changes" }).click();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(
    stored.animals.find((a: { id: string }) => a.id === "mabel").status,
  ).toBe("Deceased");
  expect(
    stored.animals.find((a: { id: string }) => a.id === "mabel").deceased,
  ).toBe(today());
  expect(
    stored.logs.some(
      (l: { animalId: string; kind: string; notes: string }) =>
        l.animalId === "mabel" &&
        l.kind === "Health" &&
        l.notes.includes("Deceased"),
    ),
  ).toBe(true);
});
