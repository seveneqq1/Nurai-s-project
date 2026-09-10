// Cloudflare Pages Function — заменяет /api/data из server.ps1.
// Хранит зашифрованный файл базы (bm-data.enc) в Cloudflare KV вместо диска.
//
// Чтобы это заработало на Cloudflare, один раз в настройках Pages-проекта
// нужно создать KV namespace и привязать его с именем BM_DATA
// (Settings → Functions → KV namespace bindings → Variable name: BM_DATA).
// Подробности — в файле CLOUDFLARE-SETUP.md рядом с этой папкой.

const STORAGE_KEY = "bm-data";

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.BM_DATA) {
    return jsonResponse({ isSetup: false, error: "KV не подключён (BM_DATA)" }, 200);
  }

  const raw = await env.BM_DATA.get(STORAGE_KEY);
  if (!raw) {
    return jsonResponse({ isSetup: false });
  }

  return new Response(raw, {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.BM_DATA) {
    return jsonResponse({ ok: false, error: "KV не подключён (BM_DATA)" }, 500);
  }

  const body = await request.text();
  await env.BM_DATA.put(STORAGE_KEY, body);

  return jsonResponse({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
