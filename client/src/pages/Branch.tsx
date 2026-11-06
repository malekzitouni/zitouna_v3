import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, BookOpen, FlaskConical, Sparkles, Video } from "lucide-react";
import { useRoute } from "wouter";
import ThemeSwitch from "../components/ThemeSwitch";
import { fetchManifest, type Manifest } from "../lib/adminApi";
import { CATEGORY_LABELS, LEVELS_META, getBranch } from "../lib/levelsMeta";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  lesson: <BookOpen size={18} />,
  practice: <Sparkles size={18} />,
  media: <Video size={18} />,
  lab: <FlaskConical size={18} />,
};

export default function Branch() {
  const [, params] = useRoute("/niveau/:levelId/:branchId");
  const levelId = params?.levelId ?? "";
  const branchId = params?.branchId ?? "";
  const level = LEVELS_META.find((item) => item.id === levelId);
  const branch = getBranch(levelId, branchId);
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchManifest().then(setManifest).catch(() => setManifest(null));
  }, []);

  if (!level || !branch) {
    return (
      <div className="cat-page" dir="rtl">
        <div className="cat-inner">
          <div className="cat-topbar"><a href="#/" className="cat-back"><ArrowLeft size={16} /> Retour à l’accueil</a><ThemeSwitch /></div>
          <div className="cat-empty"><strong>Page introuvable</strong></div>
        </div>
      </div>
    );
  }

  const levelData = manifest?.levels[level.id];
  const countFor = (category: string) =>
    levelData?.hidden
      ? 0
      : (levelData?.resources ?? []).filter((r) => !r.hidden && r.category === category && (r.branch === branchId || !r.branch)).length;

  return (
    <div className="cat-page" dir="rtl">
      <div className="cat-inner">
        <div className="cat-topbar"><a href="#/" className="cat-back"><ArrowLeft size={16} /> Retour aux niveaux</a><ThemeSwitch /></div>

        <header className="cat-header">
          <span className="cat-kicker">{level.title}</span>
          <h1>{branch.label}</h1>
          <p>Choisissez une rubrique pour accéder aux ressources de cette filière.</p>
        </header>

        <ul className="cat-list">
          {Object.entries(CATEGORY_LABELS).map(([id, label], i) => {
            const count = countFor(id);
            return (
              <li key={id}>
                <a href={`#/niveau/${level.id}/${branch.id}/${id}`} className="cat-item">
                  <span className="cat-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cat-icon">{CATEGORY_ICONS[id]}</span>
                  <strong>{label}</strong>
                  {manifest && <small className="cat-count" dir="ltr">{count} {count > 1 ? "fichiers" : "fichier"}</small>}
                  <ArrowLeft size={16} className="cat-arrow" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
