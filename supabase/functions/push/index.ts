// Tiki Taka · Supabase Edge Function "push"
// Envia notificaciones Web Push: recordatorio diario (?action=daily)
// y aviso de canje al admin (?action=canje o Database Webhook sobre redemptions).
//
// Deploy:   supabase functions deploy push --no-verify-jwt
// Secrets:  supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:tu@correo.com PUSH_SECRET=...

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@tikitaka.app";
const PUSH_SECRET   = Deno.env.get("PUSH_SECRET") ?? "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function sendTo(sub: any, payload: unknown): Promise<boolean> {
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    const code = err?.statusCode;
    if (code === 404 || code === 410) {
      try { await supabase.rpc("app_push_prune", { p_endpoint: sub?.endpoint }); } catch (_e) { /* noop */ }
    }
    return false;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch (_e) { body = {}; }

  // Seguridad opcional por secreto compartido
  if (PUSH_SECRET) {
    const provided = url.searchParams.get("secret") || req.headers.get("x-push-secret") || "";
    if (provided !== PUSH_SECRET) return json({ ok: false, error: "unauthorized" }, 401);
  }

  let action = url.searchParams.get("action") || body.action;
  // Database Webhook de Supabase sobre la tabla redemptions
  if (!action && body && body.table === "redemptions" && body.type === "INSERT") action = "canje";

  if (action === "daily") {
    const { data } = await supabase.rpc("app_push_daily_targets");
    const targets = (data as any[]) || [];
    let sent = 0;
    for (const t of targets) {
      const ok = await sendTo(t.sub, {
        title: "\uD83C\uDFB0 \u00A1Tu tirada diaria te espera!",
        body: "Entra y gira los rodillos para ganar puntos y no perder tu racha.",
        tag: "daily",
        url: "./index.html",
      });
      if (ok) sent++;
    }
    return json({ ok: true, action: "daily", targets: targets.length, sent });
  }

  if (action === "canje") {
    const rec = body.record ?? body.new ?? body ?? {};
    const bar = rec.bar || rec.username || "Un cliente";
    const premio = rec.premio || "un premio";
    const pts = (rec.puntos != null) ? ` \u00B7 ${rec.puntos} pts` : "";
    const { data } = await supabase.rpc("app_push_admin_targets");
    const targets = (data as any[]) || [];
    let sent = 0;
    for (const t of targets) {
      const ok = await sendTo(t.sub, {
        title: "\uD83C\uDF81 Nuevo canje",
        body: `${bar} ha canjeado: ${premio}${pts}`,
        tag: "canje",
        url: "./index.html",
      });
      if (ok) sent++;
    }
    return json({ ok: true, action: "canje", targets: targets.length, sent });
  }

  return json({ ok: false, error: "unknown action (usa ?action=daily o ?action=canje)" }, 400);
});
