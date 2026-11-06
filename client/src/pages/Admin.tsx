import { useEffect, useState, type FormEvent } from "react";
import {
  Camera,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  addResource,
  clearStoredPassword,
  deleteResource,
  fetchManifest,
  getStoredPassword,
  login,
  resetSiteImage,
  setSiteImage,
  storePassword,
  toggleLevelHidden,
  toggleResourceHidden,
  uploadFile,
  uploadSiteImage,
  type Category,
  type Manifest,
} from "../lib/adminApi";
import ThemeSwitch from "../components/ThemeSwitch";
import { BRANCHES, CATEGORY_LABELS, DEFAULT_LOGO, LEVELS_META, type LevelId } from "../lib/levelsMeta";

function LoginForm({ onSuccess }: { onSuccess: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await login(password);
      if (result.ok) {
        storePassword(password);
        onSuccess(password);
      } else {
        setError(result.error ?? "Mot de passe incorrect.");
      }
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form onSubmit={handleSubmit} className="admin-login-card">
        <h1>لوحة تحكم الأستاذ حمادي</h1>
        <p>أدخل كلمة المرور الخاصة بالإدارة للمتابعة</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe administrateur"
          autoFocus
        />
        {error && <span className="admin-error">{error}</span>}
        <button type="submit" disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          Se connecter
        </button>
      </form>
    </div>
  );
}

function ResourceRow({
  levelId,
  resource,
  password,
  onChanged,
}: {
  levelId: string;
  resource: Manifest["levels"][string]["resources"][number];
  password: string;
  onChanged: (manifest: Manifest) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    try {
      const manifest = await toggleResourceHidden(password, levelId, resource.id);
      onChanged(manifest);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`حذف "${resource.label}" نهائيًا؟`)) return;
    setBusy(true);
    try {
      const manifest = await deleteResource(password, levelId, resource.id);
      onChanged(manifest);
      toast.success("تم الحذف.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`admin-resource-row ${resource.hidden ? "is-hidden" : ""}`}>
      <span className="admin-resource-icon">
        {resource.category === "media" ? <Video size={16} /> : <FileText size={16} />}
      </span>
      <div className="admin-resource-info">
        <strong>{resource.label}</strong>
        <small>{CATEGORY_LABELS[resource.category]}{resource.fileName ? ` · ${resource.fileName}` : ""}</small>
      </div>
      {resource.fileUrl && (
        <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="admin-resource-link">
          Ouvrir
        </a>
      )}
      <button disabled={busy} onClick={handleToggle} aria-label={resource.hidden ? "Afficher" : "Masquer"}>
        {resource.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button disabled={busy} onClick={handleDelete} className="admin-danger" aria-label="Supprimer">
        <Trash2 size={16} />
      </button>
    </li>
  );
}

type ResourceItem = Manifest["levels"][string]["resources"][number];

function AddResourceForm({
  levelId,
  branchId,
  password,
  onChanged,
}: {
  levelId: string;
  branchId: string;
  password: string;
  onChanged: (manifest: Manifest) => void;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<Category>("lesson");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!label.trim()) {
      toast.error("اكتب عنوانًا للملف أو الدرس أولًا.");
      return;
    }
    setBusy(true);
    setProgress(file ? 0 : null);
    try {
      let uploaded: { url: string; fileName: string } | undefined;
      if (file) {
        uploaded = await uploadFile(password, levelId, file, (percentage) => setProgress(percentage));
      }
      const manifest = await addResource(password, levelId, branchId, label.trim(), category, uploaded);
      onChanged(manifest);
      setLabel("");
      setFile(null);
      setProgress(null);
      toast.success("تمت الإضافة بنجاح.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <form className="admin-add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="عنوان الدرس / الملف (مثال: الدرس 3 - الكهرباء)"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
      />
      <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
        <option value="lesson">Cours</option>
        <option value="practice">Exercices</option>
        <option value="media">Vidéos</option>
        <option value="lab">Travaux pratiques</option>
      </select>
      <label className="admin-file-label">
        <Upload size={14} />
        <span>{file ? file.name : "إرفاق PDF أو فيديو (اختياري)"}</span>
        <input
          type="file"
          accept=".pdf,application/pdf,video/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {progress !== null && (
        <div className="admin-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <button type="submit" disabled={busy}>
        {busy ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
        إضافة
      </button>
    </form>
  );
}

function SiteImagePanel({
  manifest,
  password,
  onChanged,
}: {
  manifest: Manifest;
  password: string;
  onChanged: (manifest: Manifest) => void;
}) {
  const custom = manifest.settings?.heroImage;
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      toast.error("اختر صورة بصيغة PNG أو JPG أو WEBP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("الصورة كبيرة جدًا (الحد الأقصى 8 ميغابايت).");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setBusy(true);
    setProgress(0);
    try {
      const uploaded = await uploadSiteImage(password, file, (percentage) => setProgress(percentage));
      onChanged(await setSiteImage(password, uploaded.url));
      toast.success("تم تغيير صورة الموقع.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      setBusy(false);
      setProgress(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("استعادة الصورة الأصلية للموقع؟")) return;
    setBusy(true);
    try {
      onChanged(await resetSiteImage(password));
      toast.success("تمت استعادة الصورة الأصلية.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-site-panel">
      <div className={`admin-site-preview ${busy ? "is-busy" : ""}`}>
        <img src={preview ?? custom ?? DEFAULT_LOGO} alt="صورة الموقع الحالية" />
        {busy && <Loader2 size={22} className="spin admin-site-spinner" />}
      </div>
      <div className="admin-site-info">
        <h2>صورة الموقع</h2>
        <p>تظهر هذه الصورة في الصفحة الرئيسية وفي الشعار أعلى الموقع وأسفله. PNG أو JPG أو WEBP — 8 ميغابايت كحد أقصى.</p>
        <div className="admin-site-actions">
          <label className={`admin-photo-btn ${busy ? "is-disabled" : ""}`}>
            <Camera size={15} />
            تغيير الصورة
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={(event) => {
                void handleFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </label>
          {custom && (
            <button type="button" className="admin-ghost-btn" disabled={busy} onClick={handleReset}>
              <RotateCcw size={14} /> الصورة الأصلية
            </button>
          )}
        </div>
        {progress !== null && (
          <div className="admin-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </section>
  );
}

function ResourceList({
  levelId,
  resources,
  password,
  onChanged,
}: {
  levelId: string;
  resources: ResourceItem[];
  password: string;
  onChanged: (manifest: Manifest) => void;
}) {
  return (
    <ul className="admin-resource-list">
      {resources.map((resource) => (
        <ResourceRow key={resource.id} levelId={levelId} resource={resource} password={password} onChanged={onChanged} />
      ))}
    </ul>
  );
}

function LevelPanel({
  levelId,
  title,
  subtitle,
  manifest,
  password,
  onChanged,
}: {
  levelId: string;
  title: string;
  subtitle: string;
  manifest: Manifest;
  password: string;
  onChanged: (manifest: Manifest) => void;
}) {
  const levelData = manifest.levels[levelId] ?? { hidden: false, resources: [] };
  const [busy, setBusy] = useState(false);
  const branches = BRANCHES[levelId as LevelId] ?? [];
  const knownIds = new Set(branches.map((branch) => branch.id));
  const legacy = levelData.resources.filter((resource) => !resource.branch || !knownIds.has(resource.branch));

  const handleToggleLevel = async () => {
    setBusy(true);
    try {
      const next = await toggleLevelHidden(password, levelId);
      onChanged(next);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`admin-level-panel ${levelData.hidden ? "is-hidden" : ""}`}>
      <div className="admin-level-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="admin-toggle-level" disabled={busy} onClick={handleToggleLevel}>
          {levelData.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          {levelData.hidden ? "القسم مخفي — إظهار" : "القسم ظاهر — إخفاء"}
        </button>
      </div>

      {branches.map((branch) => {
        const resources = levelData.resources.filter((resource) => resource.branch === branch.id);
        return (
          <div className="admin-branch" key={branch.id}>
            <h3 className="admin-branch-title">
              {branch.label}
              <span>{resources.length} {resources.length > 1 ? "ملفات" : "ملف"}</span>
            </h3>
            {resources.length > 0 ? (
              <ResourceList levelId={levelId} resources={resources} password={password} onChanged={onChanged} />
            ) : (
              <p className="admin-empty">لا توجد ملفات مضافة بعد لهذا الفرع.</p>
            )}
            <AddResourceForm levelId={levelId} branchId={branch.id} password={password} onChanged={onChanged} />
          </div>
        );
      })}

      {legacy.length > 0 && (
        <div className="admin-branch is-legacy">
          <h3 className="admin-branch-title">
            ملفات قديمة بدون فرع
            <span>{legacy.length}</span>
          </h3>
          <p className="admin-note">تظهر هذه الملفات في جميع فروع هذا المستوى. احذفها وأعد رفعها داخل الفرع المناسب.</p>
          <ResourceList levelId={levelId} resources={legacy} password={password} onChanged={onChanged} />
        </div>
      )}
    </section>
  );
}

export default function Admin() {
  const [password, setPassword] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredPassword();
    if (!stored) {
      setChecking(false);
      return;
    }
    login(stored)
      .then((result) => {
        if (result.ok) setPassword(stored);
        else clearStoredPassword();
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!password) return;
    fetchManifest()
      .then(setManifest)
      .catch((error) => setLoadError((error as Error).message));
  }, [password]);

  if (checking) {
    return (
      <div className="admin-page admin-loading">
        <Loader2 size={28} className="spin" />
      </div>
    );
  }

  if (!password) {
    return (
      <div className="admin-page" dir="rtl">
        <LoginForm onSuccess={setPassword} />
      </div>
    );
  }

  return (
    <div className="admin-page" dir="rtl">
      <header className="admin-header">
        <div>
          <h1>لوحة تحكم الأستاذ حمادي الزيتوني</h1>
          <p>أضف، أخفِ أو احذف الدروس والملفات والفيديوهات لكل مستوى وكل فرع — تظهر التغييرات فورًا لكل الزوار.</p>
        </div>
        <div className="admin-header-actions">
          <ThemeSwitch />
          <a href="#/" className="admin-back-link">
            ← العودة إلى الموقع
          </a>
          <button
            className="admin-logout"
            onClick={() => {
              clearStoredPassword();
              setPassword(null);
              setManifest(null);
            }}
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </header>

      {loadError && <p className="admin-error admin-error-banner">{loadError}</p>}

      {!manifest ? (
        <div className="admin-loading">
          <Loader2 size={28} className="spin" />
        </div>
      ) : (
        <>
          <SiteImagePanel manifest={manifest} password={password} onChanged={setManifest} />
          <div className="admin-levels-grid">
            {LEVELS_META.map((level) => (
              <LevelPanel
                key={level.id}
                levelId={level.id}
                title={level.title}
                subtitle={level.subtitle}
                manifest={manifest}
                password={password}
                onChanged={setManifest}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
