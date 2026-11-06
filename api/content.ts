import { list, put, del } from "@vercel/blob";

const MANIFEST_PATH = "content/manifest.json";
const LEVEL_IDS = ["first", "second", "third", "bac"] as const;
const CATEGORIES = ["lesson", "practice", "media", "lab"];

// Filières autorisées par niveau (synchronisées avec client/src/lib/levelsMeta.ts).
const BRANCH_IDS: Record<string, string[]> = {
  first: ["physique", "chimie"],
  second: ["sciences", "informatique"],
  third: ["sciences-exp", "maths", "informatique"],
  bac: ["sciences-exp", "sciences-tech", "maths-info"],
};

type Category = "lesson" | "practice" | "media" | "lab";

type Resource = {
  id: string;
  label: string;
  category: Category;
  branch?: string;
  fileUrl?: string;
  fileName?: string;
  hidden?: boolean;
};

type LevelData = { hidden?: boolean; resources: Resource[] };
type Manifest = { levels: Record<string, LevelData>; settings: { heroImage?: string } };

function defaultManifest(): Manifest {
  const levels: Record<string, LevelData> = {};
  for (const id of LEVEL_IDS) levels[id] = { hidden: false, resources: [] };
  return { levels, settings: {} };
}

function isBlobUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function normalizeManifest(raw: unknown): Manifest {
  const manifest = defaultManifest();
  if (raw && typeof raw === "object" && "levels" in (raw as any)) {
    const rawLevels = (raw as any).levels;
    for (const id of LEVEL_IDS) {
      const level = rawLevels?.[id];
      if (level && typeof level === "object") {
        manifest.levels[id] = {
          hidden: Boolean(level.hidden),
          resources: Array.isArray(level.resources) ? level.resources : [],
        };
      }
    }
  }
  const rawSettings = raw && typeof raw === "object" ? (raw as any).settings : undefined;
  if (rawSettings && isBlobUrl(rawSettings.heroImage)) manifest.settings.heroImage = rawSettings.heroImage;
  return manifest;
}

async function loadManifest(): Promise<Manifest> {
  try {
    const { blobs } = await list({ prefix: MANIFEST_PATH });
    const match = blobs.find((b) => b.pathname === MANIFEST_PATH);
    if (!match) return defaultManifest();
    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return defaultManifest();
    return normalizeManifest(await res.json());
  } catch {
    return defaultManifest();
  }
}

async function saveManifest(manifest: Manifest) {
  await put(MANIFEST_PATH, JSON.stringify(manifest), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function checkAuth(request: Request): boolean {
  const header = request.headers.get("authorization") || "";
  const password = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && password === expected;
}

function genId() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(request: Request) {
  if (request.method === "GET") {
    const manifest = await loadManifest();
    return new Response(JSON.stringify(manifest), {
      headers: { "content-type": "application/json" },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: "Non autorisé." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let action = "";
  let payload: any = {};
  try {
    const body = await request.json();
    action = body?.action ?? "";
    payload = body?.payload ?? {};
  } catch {
    return new Response(JSON.stringify({ error: "Requête invalide." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const manifest = await loadManifest();

  switch (action) {
    case "addResource": {
      const { levelId, branchId, label, category, fileUrl, fileName } = payload;
      if (!LEVEL_IDS.includes(levelId)) {
        return new Response(JSON.stringify({ error: "Niveau inconnu." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      if (!branchId || !(BRANCH_IDS[levelId] ?? []).includes(branchId)) {
        return new Response(JSON.stringify({ error: "Filière inconnue." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      if (!CATEGORIES.includes(category)) {
        return new Response(JSON.stringify({ error: "Type de ressource inconnu." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      if (!label || typeof label !== "string") {
        return new Response(JSON.stringify({ error: "Le titre est requis." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      manifest.levels[levelId].resources.push({
        id: genId(),
        label,
        category: category as Category,
        branch: branchId,
        fileUrl,
        fileName,
        hidden: false,
      });
      break;
    }
    case "deleteResource": {
      const { levelId, resourceId } = payload;
      const level = manifest.levels[levelId];
      if (level) {
        const target = level.resources.find((r) => r.id === resourceId);
        if (target?.fileUrl) {
          try {
            await del(target.fileUrl);
          } catch {
            // le fichier a peut-être déjà été supprimé, on ignore
          }
        }
        level.resources = level.resources.filter((r) => r.id !== resourceId);
      }
      break;
    }
    case "toggleResourceHidden": {
      const { levelId, resourceId } = payload;
      const target = manifest.levels[levelId]?.resources.find((r) => r.id === resourceId);
      if (target) target.hidden = !target.hidden;
      break;
    }
    case "toggleLevelHidden": {
      const { levelId } = payload;
      if (manifest.levels[levelId]) {
        manifest.levels[levelId].hidden = !manifest.levels[levelId].hidden;
      }
      break;
    }
    case "updateResourceLabel": {
      const { levelId, resourceId, label } = payload;
      const target = manifest.levels[levelId]?.resources.find((r) => r.id === resourceId);
      if (target && typeof label === "string" && label.trim()) target.label = label.trim();
      break;
    }
    case "setSiteImage": {
      const { url } = payload;
      if (!isBlobUrl(url)) {
        return new Response(JSON.stringify({ error: "Image invalide." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const previous = manifest.settings.heroImage;
      manifest.settings.heroImage = url;
      if (previous && previous !== url) {
        try {
          await del(previous);
        } catch {
          // ancienne image déjà supprimée : on ignore
        }
      }
      break;
    }
    case "resetSiteImage": {
      const previous = manifest.settings.heroImage;
      delete manifest.settings.heroImage;
      if (previous) {
        try {
          await del(previous);
        } catch {
          // ignore
        }
      }
      break;
    }
    default:
      return new Response(JSON.stringify({ error: "Action inconnue." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
  }

  await saveManifest(manifest);
  return new Response(JSON.stringify(manifest), {
    headers: { "content-type": "application/json" },
  });
}

export const GET = handler;
export const POST = handler;
