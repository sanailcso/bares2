// Tiki Taka · Web Push seguro.
// Acción pública: admin_send (valida el PIN en PostgreSQL).
// Acciones internas: daily y canje (requieren x-push-secret).

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const legacyServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
const SERVICE_KEY = secretKeys ? (JSON.parse(secretKeys).default ?? legacyServiceKey) : legacyServiceKey;
const ENV_VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC") ?? "";
const ENV_VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE") ?? "";
const ENV_VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "";
const ENV_PUSH_SECRET = Deno.env.get("PUSH_SECRET") ?? "";
const ALLOWED_ORIGIN = "https://sanailcso.github.io";

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Falta la configuración interna de Supabase");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type PushRuntimeConfig = {
  vapidPublic: string;
  vapidPrivate: string;
  vapidSubject: string;
  pushSecret: string;
};

let runtimeConfigPromise: Promise<PushRuntimeConfig> | null = null;

async function getPushConfig(): Promise<PushRuntimeConfig> {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = (async () => {
      let raw: Record<string, unknown> = {
        vapid_public: ENV_VAPID_PUBLIC,
        vapid_private: ENV_VAPID_PRIVATE,
        vapid_subject: ENV_VAPID_SUBJECT,
        push_secret: ENV_PUSH_SECRET,
      };

      if (!ENV_VAPID_PUBLIC || !ENV_VAPID_PRIVATE || !ENV_PUSH_SECRET) {
        const { data, error } = await supabase.rpc("app_push_runtime_config");
        if (error) throw error;
        raw = (data ?? {}) as Record<string, unknown>;
      }

      const config = {
        vapidPublic: String(raw.vapid_public ?? ""),
        vapidPrivate: String(raw.vapid_private ?? ""),
        vapidSubject: String(raw.vapid_subject ?? "https://sanailcso.github.io"),
        pushSecret: String(raw.push_secret ?? ""),
      };
      if (!config.vapidPublic || !config.vapidPrivate || !config.pushSecret) {
        throw new Error("Falta la configuración segura de Web Push");
      }
      webpush.setVapidDetails(config.vapidSubject, config.vapidPublic, config.vapidPrivate);
      return config;
    })();
  }
  return runtimeConfigPromise;
}

function cors(req: Request) {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "content-type,x-push-secret",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors(req) });
}

function sameSecret(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sendTo(sub: Record<string, unknown>, payload: unknown): Promise<boolean> {
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return true;
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode;
    console.error("Push delivery failed", {
      status: status ?? null,
      message: error instanceof Error ? error.message : String(error),
    });
    if (status === 404 || status === 410) {
      await supabase.rpc("app_push_prune", { p_endpoint: sub?.endpoint }).catch(() => undefined);
    }
    return false;
  }
}

async function targets(kind: "admin" | "daily" | "users", usernames: string[] | null = null) {
  const { data, error } = await supabase.rpc("app_push_targets", {
    p_kind: kind,
    p_usernames: usernames,
  });
  if (error) throw error;
  return ((data ?? []) as Array<{ sub: Record<string, unknown> }>).map((row) => row.sub);
}

async function deliver(list: Array<Record<string, unknown>>, payload: unknown) {
  const results = await Promise.allSettled(list.map((sub) => sendTo(sub, payload)));
  return results.filter((result) => result.status === "fulfilled" && result.value).length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { ok: false, error: "method" }, 405);
  if (Number(req.headers.get("content-length") ?? 0) > 16_384) {
    return json(req, { ok: false, error: "payload" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { ok: false, error: "json" }, 400);
  }

  const url = new URL(req.url);
  let action = String(url.searchParams.get("action") ?? body.action ?? "");
  if (!action && body.table === "redemptions" && body.type === "INSERT") action = "canje";

  try {
    const runtime = await getPushConfig();
    if (action === "healthcheck") {
      return json(req, { ok: true, config: true });
    }

    if (action === "admin_send") {
      const pin = String(body.pin ?? "");
      const title = String(body.title ?? "Tiki Taka").trim().slice(0, 80);
      const message = String(body.body ?? "").trim().slice(0, 300);
      const requested = Array.isArray(body.usernames)
        ? [...new Set(body.usernames.map(String).filter((u) => /^[a-z0-9_.-]{1,64}$/.test(u)))].slice(0, 500)
        : null;
      if (!message) return json(req, { ok: false, error: "message" }, 400);
      const { data: allowed, error } = await supabase.rpc("app_admin_check", { p_pin: pin });
      if (error || allowed !== true) return json(req, { ok: false, error: "unauthorized" }, 401);
      const list = await targets("users", requested);
      const sent = await deliver(list, { title: title || "Tiki Taka", body: message, tag: "admin", url: "/bares2/index.html" });
      return json(req, { ok: true, action, targets: list.length, sent });
    }

    const suppliedSecret = req.headers.get("x-push-secret") ?? "";
    if (!sameSecret(suppliedSecret, runtime.pushSecret)) {
      return json(req, { ok: false, error: "unauthorized" }, 401);
    }

    if (action === "daily") {
      const list = await targets("daily");
      const sent = await deliver(list, {
        title: "🎰 ¡Tu tirada diaria te espera!",
        body: "Entra y gira los rodillos para ganar puntos y no perder tu racha.",
        tag: "daily",
        url: "/bares2/index.html",
      });
      return json(req, { ok: true, action, targets: list.length, sent });
    }

    if (action === "canje") {
      const record = (body.record ?? body.new ?? {}) as Record<string, unknown>;
      const bar = String(record.bar ?? record.username ?? "Un cliente").slice(0, 100);
      const prize = String(record.premio ?? "un premio").slice(0, 180);
      const points = Number(record.puntos);
      const list = await targets("admin");
      const sent = await deliver(list, {
        title: "🎁 Nuevo canje",
        body: `${bar} ha canjeado: ${prize}${Number.isFinite(points) ? ` · ${points} pts` : ""}`,
        tag: "canje",
        url: "/bares2/index.html#admin",
      });
      return json(req, { ok: true, action, targets: list.length, sent });
    }

    return json(req, { ok: false, error: "action" }, 400);
  } catch (error) {
    console.error(error);
    return json(req, { ok: false, error: "internal" }, 500);
  }
});
