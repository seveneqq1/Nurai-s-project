const Calendar = (() => {
  const EVENT_CATEGORIES = ["Работа", "Личное", "Встреча", "Напоминание", "Другое"];
  const PRIORITIES = ["Низкий", "Средний", "Высокий"];
  const REMINDER_PRESETS = [
    { minutes: 5, label: "За 5 минут" },
    { minutes: 15, label: "За 15 минут" },
    { minutes: 30, label: "За 30 минут" },
    { minutes: 60, label: "За 1 час" },
    { minutes: 1440, label: "За 1 день" },
  ];
  const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const WEEKDAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Local view state — persists across navigating away/back to the calendar section
  let viewMode = "month"; // "month" | "week" | "list"
  let anchorDate = new Date();
  let ctx = null; // { data, container, persist, showToast, escapeHtml, goToHub }
  let firedReminders = new Set(); // in-memory only; resets on reload (see reminders section)
  let reminderTimerStarted = false;

  // ── Date / wall-clock helpers ───────────────────────────────────────────────
  // Events store start/end as naive "YYYY-MM-DDTHH:mm:ss" wall-clock strings
  // (no UTC offset) alongside a separate IANA `timeZone` field, mirroring how
  // the Google Calendar API's `dateTime` + `timeZone` pair works. `new Date()`
  // parses a string with no offset/Z suffix as local time, which is correct
  // here because the string represents wall-clock time in the browser's own
  // zone at creation time (captured into event.timeZone).

  function pad2(n) { return String(n).padStart(2, "0"); }

  function toDateInputValue(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function toTimeInputValue(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function combineDateTime(dateStr, timeStr) {
    return `${dateStr}T${timeStr || "00:00"}:00`;
  }
  function parseWallClock(str) {
    if (!str) return null;
    return new Date(str.length === 10 ? str + "T00:00:00" : str);
  }
  function currentTimeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  }
  function formatDayLabel(d) {
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  }
  function formatTimeLabel(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
  function startOfWeek(d) {
    const x = startOfDay(d);
    const dow = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - dow);
    return x;
  }

  // ── Recurrence expansion (view-time only — never persisted as separate records) ──

  function expandOccurrences(event, rangeStart, rangeEnd) {
    const baseStart = parseWallClock(event.start);
    const baseEnd = parseWallClock(event.end) || baseStart;
    if (!baseStart) return [];
    const durationMs = Math.max(0, baseEnd - baseStart);
    const rec = event.recurrence || { freq: "none" };
    const out = [];

    if (!rec.freq || rec.freq === "none") {
      if (baseStart <= rangeEnd && (baseEnd || baseStart) >= rangeStart) {
        out.push({ start: baseStart, end: baseEnd, event, occurrenceIndex: 0 });
      }
      return out;
    }

    const interval = Math.max(1, parseInt(rec.interval, 10) || 1);
    const until = rec.until ? parseWallClock(rec.until + "T23:59:59") : null;
    const maxCount = rec.count ? parseInt(rec.count, 10) : Infinity;

    let cursor = new Date(baseStart);
    let count = 0;
    let guard = 0;

    while (cursor <= rangeEnd && count < maxCount && guard < 3000) {
      guard++;
      if (until && cursor > until) break;
      const cursorEnd = new Date(cursor.getTime() + durationMs);
      if (cursorEnd >= rangeStart) {
        out.push({ start: new Date(cursor), end: cursorEnd, event, occurrenceIndex: count });
      }
      count++;
      if (rec.freq === "daily") cursor.setDate(cursor.getDate() + interval);
      else if (rec.freq === "weekly") cursor.setDate(cursor.getDate() + 7 * interval);
      else if (rec.freq === "monthly") cursor.setMonth(cursor.getMonth() + interval);
      else if (rec.freq === "yearly") cursor.setFullYear(cursor.getFullYear() + interval);
      else break;
    }
    return out;
  }

  function allOccurrencesInRange(events, rangeStart, rangeEnd) {
    const out = [];
    for (const ev of events) {
      out.push(...expandOccurrences(ev, rangeStart, rangeEnd));
    }
    out.sort((a, b) => a.start - b.start);
    return out;
  }

  // ── Reminders (in-tab only — fires while this browser tab is open) ─────────

  function ensureReminderTimer() {
    if (reminderTimerStarted) return;
    reminderTimerStarted = true;
    setInterval(checkReminders, 30000);
    checkReminders();
  }

  function checkReminders() {
    if (!ctx || !ctx.data || Notification.permission !== "granted") return;
    const now = new Date();
    const lookahead = new Date(now.getTime() + 60 * 60 * 1000); // next hour is enough given 30s polling
    const occurrences = allOccurrencesInRange(ctx.data.calendar || [], now, lookahead);
    for (const occ of occurrences) {
      const reminders = occ.event.reminders || [];
      for (const minutesBefore of reminders) {
        const fireAt = new Date(occ.start.getTime() - minutesBefore * 60000);
        const key = `${occ.event.id}:${occ.occurrenceIndex}:${minutesBefore}`;
        if (fireAt <= now && fireAt > new Date(now.getTime() - 60000) && !firedReminders.has(key)) {
          firedReminders.add(key);
          try {
            new Notification(occ.event.title || "Событие BM Database", {
              body: `${formatTimeLabel(occ.start)} · ${occ.event.location || "Напоминание"}`,
            });
          } catch { /* notification failed to construct — ignore */ }
        }
      }
    }
  }

  // ── Event CRUD ───────────────────────────────────────────────────────────

  function findEvent(id) {
    return (ctx.data.calendar || []).find((e) => e.id === id);
  }

  async function persistChange() {
    await ctx.persist();
  }

  function openEventModal(existingId, prefillDate) {
    const existing = existingId ? findEvent(existingId) : null;
    const now = prefillDate ? new Date(prefillDate) : new Date();
    const inHourLater = new Date(now.getTime() + 60 * 60000);

    const item = existing ? { ...existing, reminders: [...(existing.reminders || [])] } : {
      id: Store.createId(),
      title: "",
      allDay: false,
      start: `${toDateInputValue(now)}T${toTimeInputValue(now)}:00`,
      end: `${toDateInputValue(inHourLater)}T${toTimeInputValue(inHourLater)}:00`,
      location: "",
      description: "",
      category: EVENT_CATEGORIES[0],
      priority: PRIORITIES[1],
      reminders: [],
      recurrence: { freq: "none", interval: 1, until: null, count: null },
      timeZone: currentTimeZone(),
      updatedAt: null,
      googleEventId: null,
      lastSyncedAt: null,
    };

    const startDate = parseWallClock(item.start) || now;
    const endDate = parseWallClock(item.end) || inHourLater;
    const esc = ctx.escapeHtml;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${existing ? "Изменить событие" : "Новое событие"}</h3>
        <form id="cal-event-form">
          <label for="ce-title">Название *</label>
          <input type="text" id="ce-title" required value="${esc(item.title)}" />

          <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;cursor:pointer;">
            <input type="checkbox" id="ce-allday" style="width:auto;margin:0;" ${item.allDay ? "checked" : ""} />
            <span>Весь день</span>
          </label>

          <div class="field-row">
            <div>
              <label for="ce-start-date">Начало</label>
              <input type="date" id="ce-start-date" value="${toDateInputValue(startDate)}" required />
            </div>
            <div id="ce-start-time-wrap">
              <label for="ce-start-time">Время начала</label>
              <input type="time" id="ce-start-time" value="${toTimeInputValue(startDate)}" />
            </div>
          </div>
          <div class="field-row">
            <div>
              <label for="ce-end-date">Окончание</label>
              <input type="date" id="ce-end-date" value="${toDateInputValue(endDate)}" required />
            </div>
            <div id="ce-end-time-wrap">
              <label for="ce-end-time">Время окончания</label>
              <input type="time" id="ce-end-time" value="${toTimeInputValue(endDate)}" />
            </div>
          </div>

          <label for="ce-location">Место</label>
          <input type="text" id="ce-location" value="${esc(item.location)}" />

          <label for="ce-description">Описание / заметки</label>
          <textarea id="ce-description">${esc(item.description || "")}</textarea>

          <div class="field-row">
            <div>
              <label for="ce-category">Категория</label>
              <select id="ce-category">
                ${EVENT_CATEGORIES.map((c) => `<option value="${esc(c)}" ${item.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
              </select>
            </div>
            <div>
              <label for="ce-priority">Приоритет</label>
              <select id="ce-priority">
                ${PRIORITIES.map((p) => `<option value="${esc(p)}" ${item.priority === p ? "selected" : ""}>${esc(p)}</option>`).join("")}
              </select>
            </div>
          </div>

          <label>Напоминания</label>
          <div class="reminder-presets">
            ${REMINDER_PRESETS.map((r) => `
              <label class="reminder-chip-toggle">
                <input type="checkbox" data-reminder-preset="${r.minutes}" ${item.reminders.includes(r.minutes) ? "checked" : ""} />
                <span>${r.label}</span>
              </label>
            `).join("")}
          </div>
          <div class="reminder-custom-row">
            <input type="number" id="ce-custom-value" min="1" placeholder="Своё значение" />
            <select id="ce-custom-unit">
              <option value="1">минут</option>
              <option value="60">часов</option>
              <option value="1440">дней</option>
            </select>
            <button type="button" class="btn-secondary" id="ce-custom-add">+ Добавить</button>
          </div>
          <div class="reminder-chip-list" id="ce-custom-chips"></div>

          <label for="ce-recur-freq">Повтор</label>
          <select id="ce-recur-freq">
            <option value="none" ${item.recurrence.freq === "none" ? "selected" : ""}>Не повторяется</option>
            <option value="daily" ${item.recurrence.freq === "daily" ? "selected" : ""}>Ежедневно</option>
            <option value="weekly" ${item.recurrence.freq === "weekly" ? "selected" : ""}>Еженедельно</option>
            <option value="monthly" ${item.recurrence.freq === "monthly" ? "selected" : ""}>Ежемесячно</option>
            <option value="yearly" ${item.recurrence.freq === "yearly" ? "selected" : ""}>Ежегодно</option>
          </select>
          <div id="ce-recur-details" class="${item.recurrence.freq === "none" ? "hidden" : ""}">
            <div class="field-row">
              <div>
                <label for="ce-recur-interval">Повторять каждые</label>
                <input type="number" id="ce-recur-interval" min="1" value="${item.recurrence.interval || 1}" />
              </div>
              <div>
                <label for="ce-recur-end">Окончание повтора</label>
                <select id="ce-recur-end">
                  <option value="never" ${!item.recurrence.until && !item.recurrence.count ? "selected" : ""}>Никогда</option>
                  <option value="until" ${item.recurrence.until ? "selected" : ""}>До даты</option>
                  <option value="count" ${item.recurrence.count ? "selected" : ""}>После N раз</option>
                </select>
              </div>
            </div>
            <div class="field-row">
              <div id="ce-recur-until-wrap" class="${item.recurrence.until ? "" : "hidden"}">
                <label for="ce-recur-until">Дата окончания</label>
                <input type="date" id="ce-recur-until" value="${item.recurrence.until || ""}" />
              </div>
              <div id="ce-recur-count-wrap" class="${item.recurrence.count ? "" : "hidden"}">
                <label for="ce-recur-count">Количество повторов</label>
                <input type="number" id="ce-recur-count" min="1" value="${item.recurrence.count || ""}" />
              </div>
            </div>
            ${existing ? `<p style="color:var(--muted);font-size:0.82rem;margin-bottom:1rem;">Изменение или удаление затронет всю серию повторов.</p>` : ""}
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="ce-cancel">Отмена</button>
            ${existing ? `<button type="button" class="btn-danger" id="ce-delete">Удалить</button>` : ""}
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    let customReminders = item.reminders.filter((m) => !REMINDER_PRESETS.some((p) => p.minutes === m));

    function renderCustomChips() {
      const wrap = overlay.querySelector("#ce-custom-chips");
      wrap.innerHTML = customReminders.map((m) => `
        <span class="reminder-chip">${esc(formatMinutesLabel(m))} <button type="button" data-remove-custom="${m}">✕</button></span>
      `).join("");
      wrap.querySelectorAll("[data-remove-custom]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = parseInt(btn.dataset.removeCustom, 10);
          customReminders = customReminders.filter((m) => m !== val);
          renderCustomChips();
        });
      });
    }
    renderCustomChips();

    overlay.querySelector("#ce-custom-add").addEventListener("click", () => {
      const val = parseInt(overlay.querySelector("#ce-custom-value").value, 10);
      const unit = parseInt(overlay.querySelector("#ce-custom-unit").value, 10);
      if (!val || val <= 0) return;
      const minutes = val * unit;
      if (!customReminders.includes(minutes)) customReminders.push(minutes);
      overlay.querySelector("#ce-custom-value").value = "";
      renderCustomChips();
    });

    const allDayCheckbox = overlay.querySelector("#ce-allday");
    function syncAllDayUi() {
      const on = allDayCheckbox.checked;
      overlay.querySelector("#ce-start-time-wrap").classList.toggle("hidden", on);
      overlay.querySelector("#ce-end-time-wrap").classList.toggle("hidden", on);
    }
    allDayCheckbox.addEventListener("change", syncAllDayUi);
    syncAllDayUi();

    const recurFreq = overlay.querySelector("#ce-recur-freq");
    recurFreq.addEventListener("change", () => {
      overlay.querySelector("#ce-recur-details").classList.toggle("hidden", recurFreq.value === "none");
    });
    const recurEnd = overlay.querySelector("#ce-recur-end");
    recurEnd.addEventListener("change", () => {
      overlay.querySelector("#ce-recur-until-wrap").classList.toggle("hidden", recurEnd.value !== "until");
      overlay.querySelector("#ce-recur-count-wrap").classList.toggle("hidden", recurEnd.value !== "count");
    });

    overlay.querySelector("#ce-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    const deleteBtn = overlay.querySelector("#ce-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Удалить событие?")) return;
        ctx.data.calendar = ctx.data.calendar.filter((e) => e.id !== item.id);
        await persistChange();
        overlay.remove();
        renderView(ctx);
        ctx.showToast("Событие удалено.");
      });
    }

    overlay.querySelector("#cal-event-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const allDay = allDayCheckbox.checked;
      const startDateVal = overlay.querySelector("#ce-start-date").value;
      const endDateVal = overlay.querySelector("#ce-end-date").value;
      const startTimeVal = allDay ? "00:00" : overlay.querySelector("#ce-start-time").value;
      const endTimeVal = allDay ? "23:59" : overlay.querySelector("#ce-end-time").value;

      const presetReminders = Array.from(overlay.querySelectorAll("[data-reminder-preset]:checked"))
        .map((el) => parseInt(el.dataset.reminderPreset, 10));

      const freq = recurFreq.value;
      let recurrence = { freq: "none", interval: 1, until: null, count: null };
      if (freq !== "none") {
        recurrence.freq = freq;
        recurrence.interval = parseInt(overlay.querySelector("#ce-recur-interval").value, 10) || 1;
        const endMode = recurEnd.value;
        if (endMode === "until") recurrence.until = overlay.querySelector("#ce-recur-until").value || null;
        if (endMode === "count") recurrence.count = parseInt(overlay.querySelector("#ce-recur-count").value, 10) || null;
      }

      item.title = overlay.querySelector("#ce-title").value.trim();
      item.allDay = allDay;
      item.start = combineDateTime(startDateVal, startTimeVal);
      item.end = combineDateTime(endDateVal, endTimeVal);
      item.location = overlay.querySelector("#ce-location").value.trim();
      item.description = overlay.querySelector("#ce-description").value.trim();
      item.category = overlay.querySelector("#ce-category").value;
      item.priority = overlay.querySelector("#ce-priority").value;
      item.reminders = [...presetReminders, ...customReminders];
      item.recurrence = recurrence;
      item.timeZone = item.timeZone || currentTimeZone();
      item.updatedAt = new Date().toISOString();

      if (!item.title) { ctx.showToast("Поле «Название» обязательно."); return; }
      if (parseWallClock(item.end) < parseWallClock(item.start)) {
        ctx.showToast("Дата окончания раньше даты начала.");
        return;
      }

      const list = ctx.data.calendar;
      const idx = list.findIndex((e) => e.id === item.id);
      if (idx >= 0) list[idx] = item; else list.push(item);

      await persistChange();
      overlay.remove();
      renderView(ctx);
      ctx.showToast("Сохранено.");
    });
  }

  function formatMinutesLabel(minutes) {
    if (minutes % 1440 === 0) return `За ${minutes / 1440} дн.`;
    if (minutes % 60 === 0) return `За ${minutes / 60} ч.`;
    return `За ${minutes} мин.`;
  }

  // ── Views ────────────────────────────────────────────────────────────────

  function renderHeader() {
    const esc = ctx.escapeHtml;
    const googleAvailable = typeof GoogleCalendarModule !== "undefined";
    const gStatus = googleAvailable ? GoogleCalendarModule.getStatus() : { state: "unavailable" };

    let googleHtml = "";
    if (gStatus.state === "not_configured") {
      googleHtml = `<button class="btn-ghost" id="cal-google-btn" disabled title="Добавьте Client ID в js/google-config.js">Google Calendar не настроен</button>`;
    } else if (gStatus.state === "unsupported_origin") {
      googleHtml = `<button class="btn-ghost" id="cal-google-btn" disabled title="Откройте приложение через http://localhost:8080">Sync доступен только с основного устройства</button>`;
    } else if (gStatus.state === "connected") {
      googleHtml = `
        <button class="btn-secondary" id="cal-google-sync">⇄ Синхронизировать</button>
        <button class="btn-ghost" id="cal-google-disconnect">Отключить (${esc(gStatus.email || "Google")})</button>
      `;
    } else {
      googleHtml = `<button class="btn-secondary" id="cal-google-connect">Подключить Google Calendar</button>`;
    }

    return `
      <div class="view-header">
        <button class="btn-ghost" id="cal-back-btn">← Назад</button>
        <h2>📅 Календарь</h2>
        <button class="btn-primary" id="cal-add-btn">+ Событие</button>
      </div>
      <div class="calendar-toolbar">
        <div class="calendar-nav">
          <button class="btn-ghost" id="cal-prev">‹</button>
          <span class="calendar-nav-label" id="cal-nav-label"></span>
          <button class="btn-ghost" id="cal-next">›</button>
          <button class="btn-ghost" id="cal-today">Сегодня</button>
        </div>
        <div class="calendar-mode-switch">
          <button class="btn-ghost ${viewMode === "month" ? "calendar-mode-active" : ""}" data-mode="month">Месяц</button>
          <button class="btn-ghost ${viewMode === "week" ? "calendar-mode-active" : ""}" data-mode="week">Неделя</button>
          <button class="btn-ghost ${viewMode === "list" ? "calendar-mode-active" : ""}" data-mode="list">Список</button>
        </div>
        <div class="calendar-google-actions">${googleHtml}</div>
      </div>
      <div id="cal-body"></div>
    `;
  }

  function eventChipHtml(occ) {
    const esc = ctx.escapeHtml;
    return `<div class="calendar-event-chip" data-event-id="${occ.event.id}" title="${esc(occ.event.title)}">
      ${!occ.event.allDay ? `<span class="calendar-event-time">${formatTimeLabel(occ.start)}</span>` : ""}
      <span class="calendar-event-title">${esc(occ.event.title)}</span>
    </div>`;
  }

  function renderMonthGrid() {
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();
    const firstOfMonth = new Date(y, m, 1);
    const gridStart = startOfWeek(firstOfMonth);
    const gridEnd = endOfDay(new Date(gridStart.getTime() + 41 * 86400000));

    const occurrences = allOccurrencesInRange(ctx.data.calendar || [], startOfDay(gridStart), gridEnd);
    const byDay = new Map();
    for (const occ of occurrences) {
      const key = toDateInputValue(occ.start);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(occ);
    }

    const today = new Date();
    let cellsHtml = "";
    for (let i = 0; i < 42; i++) {
      const day = new Date(gridStart.getTime() + i * 86400000);
      const key = toDateInputValue(day);
      const dayEvents = byDay.get(key) || [];
      const isOtherMonth = day.getMonth() !== m;
      const isToday = sameDay(day, today);
      cellsHtml += `
        <div class="calendar-day-cell ${isOtherMonth ? "calendar-day-cell--muted" : ""} ${isToday ? "calendar-day-cell--today" : ""}" data-date="${key}">
          <div class="calendar-day-number">${day.getDate()}</div>
          <div class="calendar-day-events">
            ${dayEvents.slice(0, 3).map(eventChipHtml).join("")}
            ${dayEvents.length > 3 ? `<div class="calendar-more-link">+${dayEvents.length - 3} ещё</div>` : ""}
          </div>
        </div>
      `;
    }

    return `
      <div class="calendar-month-grid">
        ${WEEKDAY_NAMES.map((d) => `<div class="calendar-weekday-label">${d}</div>`).join("")}
        ${cellsHtml}
      </div>
    `;
  }

  function renderWeekView() {
    const weekStart = startOfWeek(anchorDate);
    const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000));
    const rangeStart = startOfDay(days[0]);
    const rangeEnd = endOfDay(days[6]);
    const occurrences = allOccurrencesInRange(ctx.data.calendar || [], rangeStart, rangeEnd);
    const today = new Date();

    return `
      <div class="calendar-week-grid">
        ${days.map((day) => {
          const dayOccs = occurrences.filter((o) => sameDay(o.start, day));
          const isToday = sameDay(day, today);
          return `
            <div class="calendar-week-col ${isToday ? "calendar-day-cell--today" : ""}">
              <div class="calendar-week-col-header">${WEEKDAY_NAMES[(day.getDay() + 6) % 7]} ${day.getDate()}</div>
              <div class="calendar-week-col-events">
                ${dayOccs.length === 0 ? `<div class="calendar-week-empty">—</div>` : dayOccs.map(eventChipHtml).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderListView() {
    const rangeStart = startOfDay(new Date());
    const rangeEnd = endOfDay(new Date(rangeStart.getTime() + 365 * 86400000));
    const occurrences = allOccurrencesInRange(ctx.data.calendar || [], rangeStart, rangeEnd).slice(0, 100);

    if (occurrences.length === 0) {
      return `<div class="empty-state">Нет предстоящих событий. Нажмите «+ Событие», чтобы создать первое.</div>`;
    }

    let lastDayKey = null;
    let html = `<div class="calendar-list-view">`;
    for (const occ of occurrences) {
      const dayKey = toDateInputValue(occ.start);
      if (dayKey !== lastDayKey) {
        html += `<div class="calendar-list-date-heading">${formatDayLabel(occ.start)}</div>`;
        lastDayKey = dayKey;
      }
      html += `
        <div class="entry-card entry-card--clickable calendar-list-item" data-event-id="${occ.event.id}">
          <div class="entry-card__body">
            <h4>${ctx.escapeHtml(occ.event.title)}</h4>
            <div class="meta">
              ${occ.event.allDay ? "Весь день" : `${formatTimeLabel(occ.start)} – ${formatTimeLabel(occ.end)}`}
              ${occ.event.location ? " · " + ctx.escapeHtml(occ.event.location) : ""}
              ${occ.event.category ? " · " + ctx.escapeHtml(occ.event.category) : ""}
            </div>
          </div>
        </div>
      `;
    }
    html += `</div>`;
    return html;
  }

  function navLabel() {
    if (viewMode === "month") return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
    if (viewMode === "week") {
      const s = startOfWeek(anchorDate);
      const e = new Date(s.getTime() + 6 * 86400000);
      return `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
    }
    return "Ближайшие события";
  }

  function attachBodyHandlers(body) {
    body.querySelectorAll("[data-event-id]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openEventModal(el.dataset.eventId);
      });
    });
    body.querySelectorAll(".calendar-day-cell").forEach((cell) => {
      cell.addEventListener("click", (e) => {
        if (e.target.closest("[data-event-id]")) return;
        openEventModal(null, cell.dataset.date);
      });
    });
  }

  function renderBody() {
    const bodyEl = ctx.container.querySelector("#cal-body");
    if (!bodyEl) return;
    if (viewMode === "month") bodyEl.innerHTML = renderMonthGrid();
    else if (viewMode === "week") bodyEl.innerHTML = renderWeekView();
    else bodyEl.innerHTML = renderListView();

    const label = ctx.container.querySelector("#cal-nav-label");
    if (label) label.textContent = navLabel();
    attachBodyHandlers(bodyEl);
  }

  function renderView(context) {
    ctx = context;
    ctx.container.innerHTML = renderHeader();
    renderBody();
    ensureReminderTimer();

    ctx.container.querySelector("#cal-back-btn").addEventListener("click", ctx.goToHub);
    ctx.container.querySelector("#cal-add-btn").addEventListener("click", () => openEventModal(null));
    ctx.container.querySelector("#cal-today").addEventListener("click", () => { anchorDate = new Date(); renderBody(); });
    ctx.container.querySelector("#cal-prev").addEventListener("click", () => { step(-1); renderBody(); });
    ctx.container.querySelector("#cal-next").addEventListener("click", () => { step(1); renderBody(); });

    ctx.container.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        viewMode = btn.dataset.mode;
        ctx.container.innerHTML = renderHeader();
        renderBody();
        wireHeaderButtonsOnly();
      });
    });

    wireGoogleButtons();
  }

  function wireHeaderButtonsOnly() {
    // Re-attach header nav/mode handlers after a full header re-render (mode switch)
    ctx.container.querySelector("#cal-back-btn").addEventListener("click", ctx.goToHub);
    ctx.container.querySelector("#cal-add-btn").addEventListener("click", () => openEventModal(null));
    ctx.container.querySelector("#cal-today").addEventListener("click", () => { anchorDate = new Date(); renderBody(); });
    ctx.container.querySelector("#cal-prev").addEventListener("click", () => { step(-1); renderBody(); });
    ctx.container.querySelector("#cal-next").addEventListener("click", () => { step(1); renderBody(); });
    ctx.container.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        viewMode = btn.dataset.mode;
        ctx.container.innerHTML = renderHeader();
        renderBody();
        wireHeaderButtonsOnly();
      });
    });
    wireGoogleButtons();
  }

  function wireGoogleButtons() {
    if (typeof GoogleCalendarModule === "undefined") return;
    const connectBtn = ctx.container.querySelector("#cal-google-connect");
    if (connectBtn) {
      connectBtn.addEventListener("click", async () => {
        connectBtn.disabled = true;
        connectBtn.textContent = "Подключение...";
        const ok = await GoogleCalendarModule.connect();
        if (!ok) ctx.showToast("Не удалось подключиться к Google Calendar.");
        ctx.container.innerHTML = renderHeader();
        renderBody();
        wireHeaderButtonsOnly();
      });
    }
    const syncBtn = ctx.container.querySelector("#cal-google-sync");
    if (syncBtn) {
      syncBtn.addEventListener("click", async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = "Синхронизация...";
        const result = await GoogleCalendarModule.syncAll(ctx.data.calendar, {
          onChange: async () => { await persistChange(); },
        });
        if (result.error) {
          ctx.showToast("Ошибка синхронизации: " + result.error);
        } else {
          ctx.showToast(`Синхронизировано. Отправлено: ${result.pushed}, импортировано: ${result.pulled}.`);
        }
        renderBody();
        syncBtn.disabled = false;
        syncBtn.textContent = "⇄ Синхронизировать";
      });
    }
    const disconnectBtn = ctx.container.querySelector("#cal-google-disconnect");
    if (disconnectBtn) {
      disconnectBtn.addEventListener("click", () => {
        GoogleCalendarModule.disconnect();
        ctx.container.innerHTML = renderHeader();
        renderBody();
        wireHeaderButtonsOnly();
      });
    }
  }

  function step(direction) {
    if (viewMode === "month") anchorDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + direction, 1);
    else if (viewMode === "week") anchorDate = new Date(anchorDate.getTime() + direction * 7 * 86400000);
    // list view has no navigation — always shows "upcoming"
  }

  return { renderView };
})();
