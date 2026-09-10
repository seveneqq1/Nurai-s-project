const GoogleCalendarModule = (() => {
  const SCOPE = "https://www.googleapis.com/auth/calendar.events";
  const API_BASE = "https://www.googleapis.com/calendar/v3";

  // Access token lives ONLY in this module-level variable — never written to
  // bm-data.enc, localStorage, or disk. Cleared on disconnect/reload. There is
  // no client secret and no refresh token anywhere in this flow by design.
  let accessToken = null;
  let tokenExpiresAt = null;
  let tokenClient = null;

  function isConfigured() {
    return typeof GOOGLE_CALENDAR_CONFIG !== "undefined" && !!GOOGLE_CALENDAR_CONFIG.clientId;
  }
  function isSupportedOrigin() {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }
  function gisReady() {
    return typeof google !== "undefined" && google.accounts && google.accounts.oauth2;
  }
  function currentTimeZoneFallback() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  }

  function getStatus() {
    if (!isConfigured()) return { state: "not_configured" };
    if (!isSupportedOrigin()) return { state: "unsupported_origin" };
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) return { state: "connected" };
    return { state: "disconnected" };
  }

  function ensureTokenClient() {
    if (tokenClient || !gisReady()) return tokenClient;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CALENDAR_CONFIG.clientId,
      scope: SCOPE,
      callback: () => {},
    });
    return tokenClient;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(false), ms)),
    ]);
  }

  function requestToken(promptMode) {
    return new Promise((resolve) => {
      const client = ensureTokenClient();
      if (!client) { resolve(false); return; }
      client.callback = (resp) => {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          tokenExpiresAt = Date.now() + (parseInt(resp.expires_in, 10) || 3600) * 1000 - 30000;
          resolve(true);
        } else {
          resolve(false);
        }
      };
      client.error_callback = () => resolve(false);
      try {
        client.requestAccessToken({ prompt: promptMode });
      } catch {
        resolve(false);
      }
    });
  }

  async function connect() {
    if (!isConfigured() || !isSupportedOrigin() || !gisReady()) return false;
    // Try a silent reauth first (existing Google session + prior consent);
    // fall back to the interactive consent popup. Never touches a refresh token.
    const silentOk = await withTimeout(requestToken(""), 3000);
    if (silentOk) return true;
    return requestToken("consent");
  }

  function disconnect() {
    if (accessToken && gisReady() && google.accounts.oauth2.revoke) {
      try { google.accounts.oauth2.revoke(accessToken, () => {}); } catch { /* ignore */ }
    }
    accessToken = null;
    tokenExpiresAt = null;
  }

  async function apiRequest(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Google API ${res.status}: ${res.statusText}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Recurrence translation (local <-> Google RRULE) ────────────────────────
  // Only a simple subset is supported (single RRULE, FREQ + INTERVAL + UNTIL/
  // COUNT, no BYDAY/BYMONTHDAY/BYSETPOS/EXDATE). Anything more complex falls
  // back to importing as a one-time snapshot event rather than a lossy guess.

  function localRecurrenceToGoogle(rec) {
    if (!rec || rec.freq === "none") return undefined;
    const freqMap = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY" };
    if (!freqMap[rec.freq]) return undefined;
    let rule = `RRULE:FREQ=${freqMap[rec.freq]}`;
    if (rec.interval && rec.interval > 1) rule += `;INTERVAL=${rec.interval}`;
    if (rec.until) rule += `;UNTIL=${rec.until.replace(/-/g, "")}T235959Z`;
    else if (rec.count) rule += `;COUNT=${rec.count}`;
    return [rule];
  }

  function parseGoogleRecurrence(recurrenceArr) {
    if (!recurrenceArr || recurrenceArr.length === 0) return { freq: "none", interval: 1, until: null, count: null };
    const rrules = recurrenceArr.filter((r) => r.startsWith("RRULE:"));
    const others = recurrenceArr.filter((r) => !r.startsWith("RRULE:"));
    if (rrules.length !== 1 || others.length > 0) return null;
    const parts = {};
    rrules[0].substring(6).split(";").forEach((p) => {
      const [k, v] = p.split("=");
      parts[k] = v;
    });
    const freqMap = { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly", YEARLY: "yearly" };
    if (!freqMap[parts.FREQ]) return null;
    if (parts.BYDAY || parts.BYMONTHDAY || parts.BYSETPOS || parts.BYMONTH) return null;
    const local = {
      freq: freqMap[parts.FREQ],
      interval: parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1,
      until: null,
      count: null,
    };
    if (parts.UNTIL) {
      const raw = parts.UNTIL;
      local.until = `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
    }
    if (parts.COUNT) local.count = parseInt(parts.COUNT, 10);
    return local;
  }

  // ── Local <-> Google event shape translation ────────────────────────────────

  function toGoogleEvent(localEvent) {
    const body = {
      summary: localEvent.title,
      location: localEvent.location || undefined,
      description: localEvent.description || undefined,
    };
    if (localEvent.allDay) {
      body.start = { date: (localEvent.start || "").slice(0, 10) };
      body.end = { date: (localEvent.end || "").slice(0, 10) };
    } else {
      const tz = localEvent.timeZone || currentTimeZoneFallback();
      body.start = { dateTime: localEvent.start, timeZone: tz };
      body.end = { dateTime: localEvent.end, timeZone: tz };
    }
    const rec = localRecurrenceToGoogle(localEvent.recurrence);
    if (rec) body.recurrence = rec;
    if (localEvent.reminders && localEvent.reminders.length > 0) {
      body.reminders = {
        useDefault: false,
        overrides: localEvent.reminders.map((m) => ({ method: "popup", minutes: m })),
      };
    }
    return body;
  }

  function fromGoogleEvent(gEvent) {
    const isAllDay = !!(gEvent.start && gEvent.start.date);
    const start = isAllDay ? `${gEvent.start.date}T00:00:00` : (gEvent.start.dateTime || "").slice(0, 19);
    const end = isAllDay ? `${gEvent.end.date}T23:59:00` : (gEvent.end.dateTime || "").slice(0, 19);
    let recurrence = { freq: "none", interval: 1, until: null, count: null };
    let note = "";
    if (gEvent.recurrence && gEvent.recurrence.length > 0) {
      const parsed = parseGoogleRecurrence(gEvent.recurrence);
      if (parsed) recurrence = parsed;
      else note = "\n\n(Повторяющееся событие из Google Calendar — полная серия доступна в Google Calendar.)";
    }
    return {
      id: Store.createId(),
      title: gEvent.summary || "Без названия",
      allDay: isAllDay,
      start,
      end,
      location: gEvent.location || "",
      description: (gEvent.description || "") + note,
      category: "Другое",
      priority: "Средний",
      reminders: (gEvent.reminders && gEvent.reminders.overrides)
        ? gEvent.reminders.overrides.map((o) => o.minutes)
        : [],
      recurrence,
      timeZone: (gEvent.start && gEvent.start.timeZone) || currentTimeZoneFallback(),
      updatedAt: new Date().toISOString(),
      googleEventId: gEvent.id,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  async function syncAll(events, { onChange }) {
    if (!accessToken) return { pushed: 0, pulled: 0, error: "Не подключено к Google Calendar." };
    let pushed = 0;
    let pulled = 0;

    try {
      // PUSH: create events not yet mapped, update events changed locally since last sync
      for (const ev of events) {
        try {
          if (!ev.googleEventId) {
            const created = await apiRequest("/calendars/primary/events", {
              method: "POST",
              body: JSON.stringify(toGoogleEvent(ev)),
            });
            ev.googleEventId = created.id;
            ev.lastSyncedAt = new Date().toISOString();
            pushed++;
          } else if (ev.updatedAt && (!ev.lastSyncedAt || ev.updatedAt > ev.lastSyncedAt)) {
            await apiRequest(`/calendars/primary/events/${ev.googleEventId}`, {
              method: "PUT",
              body: JSON.stringify(toGoogleEvent(ev)),
            });
            ev.lastSyncedAt = new Date().toISOString();
            pushed++;
          }
        } catch (e) {
          console.error("Google Calendar push failed for event", ev.id, e);
        }
      }

      // PULL: import events from Google not already mapped locally (dedup by googleEventId)
      const knownGoogleIds = new Set(events.filter((e) => e.googleEventId).map((e) => e.googleEventId));
      const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
      const timeMax = new Date(Date.now() + 365 * 86400000).toISOString();
      let pageToken = null;
      do {
        const qs = new URLSearchParams({
          timeMin, timeMax, singleEvents: "false", maxResults: "250",
          ...(pageToken ? { pageToken } : {}),
        });
        const page = await apiRequest(`/calendars/primary/events?${qs.toString()}`);
        for (const gEvent of (page.items || [])) {
          if (gEvent.status === "cancelled") continue;
          if (gEvent.recurringEventId) continue; // skip individual instances of a series already imported as a whole
          if (knownGoogleIds.has(gEvent.id)) continue;
          events.push(fromGoogleEvent(gEvent));
          knownGoogleIds.add(gEvent.id);
          pulled++;
        }
        pageToken = page.nextPageToken || null;
      } while (pageToken);

      if (pushed > 0 || pulled > 0) await onChange();
      return { pushed, pulled };
    } catch (e) {
      return { pushed, pulled, error: e.message || String(e) };
    }
  }

  return { getStatus, connect, disconnect, syncAll };
})();
