"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bird,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Egg,
  HeartPulse,
  HelpCircle,
  Home,
  LayoutDashboard,
  Leaf,
  Menu,
  Plus,
  Search,
  Settings,
  Sprout,
  TrendingUp,
  Turtle,
  Users,
  Wheat,
  X,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { Animal, PageId, Workspace } from "@/lib/types";
import { today } from "@/lib/utils";
import { useData } from "./store";
import { Modal, Badge } from "./ui";
import { RecordEditor, type Editor } from "./editors";
import { Overview } from "./dashboard";
import { ManagementPage, AnimalDetails } from "./management";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "animals", label: "My animals", icon: Bird },
  { id: "habitats", label: "Coops & habitats", icon: Home },
  { id: "records", label: "Daily records", icon: Egg },
  { id: "planner", label: "Care planner", icon: CalendarDays },
  { id: "health", label: "Health & care", icon: HeartPulse },
  { id: "feed", label: "Feed & supplies", icon: Wheat },
  { id: "breeding", label: "Breeding & hatching", icon: Sprout },
  { id: "insights", label: "Insights", icon: TrendingUp },
] as const;
const moreNavigation = [
  { id: "guide", label: "Keeper's guide", icon: BookOpen },
  { id: "directory", label: "Find an expert", icon: MapPin },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
const allNavigation = [...navigation, ...moreNavigation];
export function KeeperApp() {
  const { data, ready, error } = useData();
  const [page, setPage] = useState<PageId>("overview");
  const [workspace, setWorkspace] = useState<Workspace>("all");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [animalId, setAnimalId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pending = data.tasks.filter((t) => !t.completed && t.due <= today());
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.slice(1);
      if (allNavigation.some((n) => n.id === hash)) setPage(hash as PageId);
    };
    read();
    window.addEventListener("hashchange", read);
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("keydown", key);
    };
  }, []);
  function navigate(next: PageId) {
    setPage(next);
    window.location.hash = next;
    setMobile(false);
    setNotifications(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const label = allNavigation.find((n) => n.id === page)?.label ?? "Overview";
  const foundAnimals = data.animals
    .filter((a) =>
      `${a.name} ${a.species} ${a.breed}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .slice(0, 8);
  const foundPages = allNavigation.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase()),
  );
  if (!ready)
    return (
      <div className="loading">
        <div className="brand-mark">
          <Leaf size={28} />
        </div>
        <strong>Flock & Scale</strong>
        <span>Making a little room for good care…</span>
      </div>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mobile ? (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        />
      ) : null}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={() => navigate("overview")}
        >
          <span className="brand-mark">
            <Leaf size={23} />
          </span>
          <span>
            flock<span className="brand-amp">&</span>scale
            <small>A LITTLE CARE, EVERY DAY</small>
          </span>
        </a>
        <div className="collection-label">
          <span className="collection-icon">
            <Home size={17} />
          </span>
          <div>
            <strong>{data.settings.collection}</strong>
            <span>Your keeper workspace</span>
          </div>
        </div>
        <div className="nav-caption">YOUR LITTLE WORLD</div>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <a
              key={n.id}
              aria-label={n.label}
              href={`#${n.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(n.id);
              }}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              aria-current={page === n.id ? "page" : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "planner" && pending.length ? (
                <span className="nav-count">{pending.length}</span>
              ) : null}
            </a>
          ))}
        </nav>
        <div className="nav-divider" />
        <nav aria-label="Resources and settings">
          {moreNavigation.map((n) => (
            <a
              key={n.id}
              aria-label={n.label}
              href={`#${n.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(n.id);
              }}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              aria-current={page === n.id ? "page" : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-flower">✳</span>
            <h3>Good care grows here.</h3>
            <p>
              For backyard flocks.
              <br />
              For curious little reptiles.
              <br />
              For keepers like you.
            </p>
            <button onClick={() => navigate("guide")}>
              A helping hand
              <ArrowRight size={14} />
            </button>
          </div>
          <button className="profile" onClick={() => navigate("settings")}>
            <span className="avatar">
              {data.settings.keeper.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{data.settings.keeper}</strong>
              <small>Your personal collection</small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{label}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-button"
              onClick={() => {
                setSearch("");
                setSearchOpen(true);
              }}
            >
              <Search size={17} />
              <span>Find anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <button
              className={`icon-button bell ${pending.length ? "has-notification" : ""}`}
              aria-label="View care notifications"
              onClick={() => setNotifications(true)}
            >
              <Bell size={20} />
            </button>
            <button
              className="avatar small"
              aria-label="Open keeper settings"
              onClick={() => navigate("settings")}
            >
              {data.settings.keeper.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <div className="workspace-toolbar">
          <div
            className="workspace-tabs"
            role="group"
            aria-label="Animal workspace"
          >
            <button
              className={workspace === "all" ? "selected" : ""}
              onClick={() => setWorkspace("all")}
            >
              <Leaf size={16} />
              All animals
            </button>
            <button
              className={workspace === "poultry" ? "selected" : ""}
              onClick={() => setWorkspace("poultry")}
            >
              <Bird size={16} />
              Poultry
            </button>
            <button
              className={workspace === "reptile" ? "selected" : ""}
              onClick={() => setWorkspace("reptile")}
            >
              <Turtle size={16} />
              Reptiles
            </button>
          </div>
          <button
            className="button primary small-button"
            onClick={() => setEditor({ type: "animal" })}
          >
            <Plus size={17} />
            Add animal
          </button>
        </div>
        <main id="main" className="main-content">
          {error ? (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => navigate("settings")}>
                Open Settings
              </button>
            </div>
          ) : null}
          {page === "overview" ? (
            <Overview
              workspace={workspace}
              navigate={navigate}
              edit={setEditor}
              showAnimal={(a) => setAnimalId(a.id)}
            />
          ) : (
            <ManagementPage
              page={page}
              workspace={workspace}
              navigate={navigate}
              edit={setEditor}
              showAnimal={(a) => setAnimalId(a.id)}
            />
          )}
          <footer className="app-footer">
            <span>Made for the lives you look after.</span>
            <span>
              {data.demo ? (
                <Badge tone="neutral">Sample collection</Badge>
              ) : null}
              <span className="green-dot" />
              Device storage · Free
            </span>
          </footer>
        </main>
      </div>
      {editor ? (
        <RecordEditor
          key={`${editor.type}:${editor.entityId ?? "new"}:${editor.logKind ?? ""}:${editor.animalId ?? ""}`}
          editor={editor}
          workspace={
            editor.animalId
              ? (data.animals.find((a) => a.id === editor.animalId)?.kind ??
                workspace)
              : workspace
          }
          onClose={() => setEditor(null)}
        />
      ) : null}
      {animalId && data.animals.some((a) => a.id === animalId) && !editor ? (
        <AnimalDetails
          animal={data.animals.find((a) => a.id === animalId)!}
          edit={setEditor}
          onClose={() => setAnimalId(null)}
        />
      ) : null}
      {searchOpen ? (
        <Modal
          title="Find your little world"
          description="Search animals, species, breeds, and pages."
          onClose={() => setSearchOpen(false)}
        >
          <div className="search-input">
            <Search size={20} />
            <input
              autoFocus
              aria-label="Search your collection"
              placeholder="Try Mabel, gecko, care planner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="search-results">
            {foundAnimals.length ? (
              <div className="nav-caption">ANIMALS</div>
            ) : null}
            {foundAnimals.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setAnimalId(a.id);
                  setSearchOpen(false);
                }}
              >
                {a.kind === "poultry" ? (
                  <Bird size={18} />
                ) : (
                  <Turtle size={18} />
                )}
                <span>
                  <strong>{a.name}</strong>
                  <small>
                    {a.species} · {a.breed}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
            {foundPages.length ? (
              <div className="nav-caption">PAGES</div>
            ) : null}
            {foundPages.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  navigate(n.id);
                  setSearchOpen(false);
                }}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                <ArrowRight size={15} />
              </button>
            ))}
            {!foundAnimals.length && !foundPages.length ? (
              <p className="muted">No results. Try a name, species, or page.</p>
            ) : null}
          </div>
        </Modal>
      ) : null}
      {notifications ? (
        <Modal
          title="Your care check-in"
          description="Tasks due today or earlier. These are in-app reminders."
          onClose={() => setNotifications(false)}
        >
          <div className="search-results">
            {pending.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setNotifications(false);
                  setEditor({ type: "task", entityId: t.id });
                }}
              >
                <CalendarDays size={18} />
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {t.due < today() ? "Overdue" : "Today"} ·{" "}
                    {t.time || "Any time"}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
            {!pending.length ? (
              <div className="empty">
                <ShieldCheck size={32} />
                <h3>All caught up</h3>
                <p>Your care planner has no tasks due today.</p>
              </div>
            ) : null}
          </div>
          <button
            className="button primary notification-planner"
            onClick={() => navigate("planner")}
          >
            Open care planner
            <ArrowRight size={16} />
          </button>
        </Modal>
      ) : null}
    </div>
  );
}
