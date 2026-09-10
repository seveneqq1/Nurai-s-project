const CONTACT_GROUPS = ["Семья", "Партнёры / Друзья", "Исполнители"];

const BANK_BIK = {
  'АО "Altyn Bank" (ДБ China Citic Bank Corporation Limited)': "ATYNKZKA",
  'АО ДБ "БАНК КИТАЯ В КАЗАХСТАНЕ"': "BKCHKZKA",
  'АО "Bereke Bank"': "BRKEKZKA",
  'АО "KASPI BANK"': "CASPKZKA",
  'АО "Ситибанк Казахстан"': "CITIKZKA",
  'АО "Банк Развития Казахстана"': "DVKAKZKA",
  "ЕВРАЗИЙСКИЙ БАНК РАЗВИТИЯ": "EABRKZKA",
  'АО "Евразийский Банк"': "EURIKZKA",
  'АО "Отбасы банк"': "HCSKKZKA",
  'АО «Исламский Банк «ADCB»': "HLALKZKZ",
  'АО "Народный Банк Казахстана"': "HSBKKZKX",
  'АО "Торгово-промышленный Банк Китая в г. Алматы"': "ICBKKZKX",
  'АО "Home Credit Bank"': "INLMKZKA",
  'АО "ForteBank"': "IRTYKZKA",
  'АО "Банк ЦентрКредит"': "KCJBKZKX",
  'АО "Bank RBK"': "KINCKZKA",
  'АО "KMF Банк"': "KMFBKZKK",
  'АО "КАЗПОЧТА"': "KPSTKZKA",
  'АО "Фридом Банк Казахстан"': "KSNVKZKA",
  'АО "ДБ КАЗАХСТАН-ЗИРААТ ИНТЕРНЕШНЛ БАНК"': "KZIBKZKA",
  'АО «Коммерческий Банк БиЭнКей»': "MOKFKZKA",
  'РГУ Национальный Банк Республики Казахстан': "NBRKKZKX",
  'АО "Нурбанк"': "NURSKZKX",
  'АО "Шинхан Банк Казахстан"': "SHBKKZKA",
  'АО "Alatau City Bank"': "TSESKZKA",
  'ДО АО Банк ВТБ (Казахстан)': "VTBAKZKZ",
  'АО "Исламский банк Заман-Банк"': "ZAJSKZ22",
};

const CONTACT_FIELDS = [
  { key: "firstName", label: "Имя", type: "text", required: true },
  { key: "lastName", label: "Фамилия", type: "text" },
  { key: "phone", label: "Номер телефона", type: "text" },
  { key: "telegram", label: "Telegram", type: "text" },
  { key: "extra", label: "Дополнительно", type: "textarea" },
];

// Founders nested inside a company record (js/app.js `openEntryModal` for
// CATEGORIES.companies) — belong specifically to one company and are stored
// inline on that company's own object (item.founders).
const COMPANY_FOUNDER_FIELDS = [
  { key: "fullName", label: "ФИО / Название компании", type: "text", required: true },
  { key: "iinBin", label: "ИИН / БИН", type: "text" },
  { key: "type", label: "Тип", type: "select", options: ["Физическое лицо", "Юридическое лицо"] },
  { key: "sharePercent", label: "Доля (%)", type: "number" },
  { key: "contributionAmount", label: "Сумма вклада", type: "text" },
  { key: "dateBecameFounder", label: "Дата вступления", type: "date" },
  { key: "notes", label: "Заметки", type: "textarea" },
];

const CATEGORIES = {
  companies: {
    id: "companies",
    title: "Компании",
    singularTitle: "компанию",
    subtitle: "Реквизиты и банковские данные",
    icon: "🏢",
    color: "var(--company)",
    detailOnClick: true,
    fields: [
      { key: "name", label: "Компания", type: "text", required: true },
      { key: "address", label: "Адрес", type: "textarea" },
      { key: "binIin", label: "БИН (ИИН)", type: "text" },
      { key: "bank", label: "Банк", type: "select", options: Object.keys(BANK_BIK) },
      { key: "bik", label: "БИК", type: "text" },
      { key: "kbe", label: "КБЕ", type: "select", options: ["17", "19"] },
      { key: "accountNumber", label: "Номер счёта", type: "text" },
    ],
    listTitle: (item) => item.name || "Без названия",
    emptyHint: "компаний",
  },
  contacts: {
    id: "contacts",
    title: "Контакты",
    subtitle: "Подрядчики и ключевые люди",
    icon: "📇",
    color: "var(--contacts)",
    groupedView: true,
    emptyHint: "контактов",
  },
  documents: {
    id: "documents",
    title: "Документы",
    singularTitle: "документ",
    subtitle: "Договоры, регистрация и расположение файлов",
    icon: "📄",
    color: "var(--documents)",
    fields: [
      { key: "title", label: "Название документа", type: "text", required: true },
      { key: "category", label: "Тип", type: "select", options: ["Договор", "Регистрация", "Налоги", "Страхование", "Банк", "Другое"] },
      { key: "location", label: "Путь к файлу или ссылка", type: "text" },
      { key: "expiryDate", label: "Срок действия / продления", type: "date" },
      { key: "description", label: "Описание", type: "textarea" },
      { key: "notes", label: "Заметки", type: "textarea" },
    ],
    listTitle: (item) => item.title || "Без названия",
    listMeta: (item) => [item.category, item.location].filter(Boolean).join(" · "),
    emptyHint: "документов",
  },
  access: {
    id: "access",
    title: "Доступы",
    singularTitle: "учётную запись",
    subtitle: "Аккаунты, логины и пароли",
    icon: "🔐",
    color: "var(--access)",
    sensitive: true,
    fields: [
      { key: "serviceName", label: "Сервис / название аккаунта", type: "text", required: true },
      { key: "username", label: "Логин / email", type: "text" },
      { key: "password", label: "Пароль", type: "password", sensitive: true },
      { key: "accountType", label: "Тип аккаунта", type: "select", options: ["Банк", "Почта", "Соцсети", "SaaS", "Домен", "Хостинг", "Другое"] },
    ],
    listTitle: (item) => item.serviceName || "Без названия",
    listMeta: (item) => [item.accountType, item.username].filter(Boolean).join(" · "),
    emptyHint: "записей о доступах",
  },
  calendar: {
    id: "calendar",
    title: "Календарь",
    subtitle: "События, напоминания и Google Calendar",
    icon: "📅",
    color: "var(--calendar)",
    calendarView: true,
    emptyHint: "событий",
  },
};

const App = (() => {
  let state = {
    password: null,
    data: null,
    view: "hub",
    activeCategory: null,
    contactSearch: "",
    contactGroupsCollapsed: new Set(),
  };

  const $ = (sel) => document.querySelector(sel);
  const authScreen = () => $("#auth-screen");
  const appShell = () => $("#app");
  const mainContent = () => $("#main-content");

  function pluralEntries(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return "записей";
    if (mod10 === 1) return "запись";
    if (mod10 >= 2 && mod10 <= 4) return "записи";
    return "записей";
  }

  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  async function persist() {
    await Store.saveEncrypted(state.password, state.data);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ─── ECP helpers ─────────────────────────────────────────────────────────

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return dateStr; }
  }

  function getEcpStatus(expiryDate) {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate + "T23:59:59");
    const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { cls: "ecp-expired", text: "Просрочен" };
    if (daysLeft <= 30) return { cls: "ecp-warning", text: `Истекает через ${daysLeft} дн.` };
    return { cls: "ecp-active", text: "Активен" };
  }

  function renderEcpFormSection(item) {
    const hasFile = !!(item.ecpFileName && item.ecpData);
    return `
      <div class="ecp-form-section">
        <div class="ecp-form-divider">🔑 ЭЦП — электронная цифровая подпись</div>
        <label>Файл ключа ЭЦП</label>
        <div class="ecp-upload-area">
          <span class="ecp-filename" id="ecp-filename-display">
            ${hasFile ? `📎 ${escapeHtml(item.ecpFileName)}` : "Файл не выбран"}
          </span>
          <label class="ecp-upload-btn" for="f-ecpFile">
            ${hasFile ? "Заменить" : "Выбрать файл"}
          </label>
          <input type="file" id="f-ecpFile" class="hidden"
            accept=".p12,.pfx,.key,.cer,.pem,.p7b,.jks" />
        </div>
        <label for="f-ecpPassword">Пароль к ЭЦП</label>
        <div class="password-field">
          <input type="password" id="f-ecpPassword"
            value="${escapeHtml(item.ecpPassword || "")}" />
          <button type="button" class="toggle-password"
            onclick="bmTogglePassword(this,'f-ecpPassword')">Показать</button>
        </div>
        <div class="ecp-dates-row">
          <div>
            <label for="f-ecpIssueDate">Дата выпуска</label>
            <input type="date" id="f-ecpIssueDate" value="${item.ecpIssueDate || ""}" />
          </div>
          <div>
            <label for="f-ecpExpiryDate">Дата окончания</label>
            <input type="date" id="f-ecpExpiryDate" value="${item.ecpExpiryDate || ""}" />
          </div>
        </div>
      </div>
    `;
  }

  function downloadEcpFile(item) {
    if (!item.ecpData || !item.ecpFileName) return;
    const byteStr = atob(item.ecpData);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.ecpFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Company founders (nested inside a company record) ─────────────────────
  // Staged on the company form's working copy (item.founders) exactly like the
  // ECP fields above — nothing is persisted until the company form itself is
  // submitted, so "Отмена" on the company modal discards founder edits too.

  function founderRowMeta(f) {
    return [f.type, f.sharePercent !== "" && f.sharePercent != null ? `${f.sharePercent}%` : ""]
      .filter(Boolean).join(" · ");
  }

  function renderFoundersList(item, listEl) {
    const founders = item.founders || [];
    listEl.innerHTML = founders.length === 0
      ? `<div class="founders-empty">Пока нет учредителей. Нажмите «+ Добавить учредителя».</div>`
      : founders.map((f) => `
        <div class="founder-row" data-founder-id="${f.id}">
          <div class="founder-row__body">
            <strong>${escapeHtml(f.fullName || "Без имени")}</strong>
            ${founderRowMeta(f) ? `<span class="meta">${escapeHtml(founderRowMeta(f))}</span>` : ""}
          </div>
          <div class="founder-row__actions">
            <button type="button" class="btn-secondary btn-sm" data-founder-edit="${f.id}">Изменить</button>
            <button type="button" class="btn-danger btn-sm" data-founder-delete="${f.id}">Удалить</button>
          </div>
        </div>
      `).join("");

    listEl.querySelectorAll("[data-founder-edit]").forEach((btn) => {
      btn.addEventListener("click", () => openFounderModal(item, listEl, btn.dataset.founderEdit));
    });
    listEl.querySelectorAll("[data-founder-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        item.founders = item.founders.filter((f) => f.id !== btn.dataset.founderDelete);
        renderFoundersList(item, listEl);
      });
    });
  }

  function renderFoundersFormSection(item) {
    return `
      <div class="founders-form-section">
        <div class="founders-form-divider">👥 Учредители</div>
        <div class="founders-list" id="founders-list"></div>
        <button type="button" class="btn-secondary" id="add-founder-btn" style="width:100%;margin-top:0.5rem">+ Добавить учредителя</button>
      </div>
    `;
  }

  function openFounderModal(companyItem, listEl, founderId) {
    const existing = founderId ? companyItem.founders.find((f) => f.id === founderId) : null;
    const founder = existing ? { ...existing } : { id: Store.createId() };

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${existing ? "Изменить учредителя" : "Добавить учредителя"}</h3>
        <form id="founder-form">
          ${COMPANY_FOUNDER_FIELDS.map((f) => renderField(f, founder[f.key] || "")).join("")}
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="founder-cancel">Отмена</button>
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#founder-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector("#founder-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      for (const f of COMPANY_FOUNDER_FIELDS) {
        founder[f.key] = form.elements[f.key].value.trim();
      }
      if (!founder.fullName) {
        showToast("Поле «ФИО / Название компании» обязательно.");
        return;
      }
      if (!Array.isArray(companyItem.founders)) companyItem.founders = [];
      const idx = companyItem.founders.findIndex((f) => f.id === founder.id);
      if (idx >= 0) companyItem.founders[idx] = founder; else companyItem.founders.push(founder);

      overlay.remove();
      renderFoundersList(companyItem, listEl);
    });
  }

  // ─── Company certificates (nested inside a company record) ─────────────────
  // Same staging model as founders (item.certificates, committed only when the
  // company form is submitted). Files reuse the exact base64-in-JSON approach
  // already used for the ECP file above — this app has no separate file
  // storage, every uploaded file lives inline in the encrypted database.

  function certificateStatusBadge(expiryDate) {
    if (!expiryDate) return "";
    const now = new Date();
    const expiry = new Date(expiryDate + "T23:59:59");
    const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return `<span class="ecp-badge ecp-expired">Истёк</span>`;
    if (daysLeft <= 30) return `<span class="ecp-badge ecp-warning">Истекает через ${daysLeft} дн.</span>`;
    return `<span class="ecp-badge ecp-active">Действителен</span>`;
  }

  function renderCertificateCard(cert, index) {
    const hasFile = !!(cert.fileName && cert.fileData);
    return `
      <div class="certificate-card" data-cert-id="${cert.id}">
        <div class="certificate-card__header">
          <span class="certificate-card__title">Сертификат ${index + 1}</span>
          ${certificateStatusBadge(cert.expiryDate)}
          <button type="button" class="btn-danger btn-sm" data-cert-delete="${cert.id}">Удалить</button>
        </div>
        <label>Название сертификата *</label>
        <input type="text" data-field="title" value="${escapeHtml(cert.title || "")}" />
        <div class="field-row">
          <div>
            <label>Дата выдачи *</label>
            <input type="date" data-field="issueDate" value="${cert.issueDate || ""}" />
          </div>
          <div>
            <label>Срок действия</label>
            <input type="date" data-field="expiryDate" value="${cert.expiryDate || ""}" />
          </div>
        </div>
        <label>Дополнительное описание</label>
        <textarea data-field="description">${escapeHtml(cert.description || "")}</textarea>
        <label>Файл сертификата</label>
        <div class="ecp-upload-area">
          <span class="ecp-filename" data-cert-filename>
            ${hasFile ? `📎 ${escapeHtml(cert.fileName)}` : "Файл не выбран"}
          </span>
          ${hasFile ? `<button type="button" class="btn-ghost btn-sm" data-cert-open>Открыть</button>` : ""}
          <label class="ecp-upload-btn">
            ${hasFile ? "Заменить" : "Выбрать файл"}
            <input type="file" class="hidden" data-cert-file />
          </label>
        </div>
      </div>
    `;
  }

  function renderCertificatesList(item, listEl) {
    const certs = item.certificates || [];
    listEl.innerHTML = certs.length === 0
      ? `<div class="founders-empty">Пока нет сертификатов. Нажмите «+ Добавить сертификат».</div>`
      : certs.map((c, i) => renderCertificateCard(c, i)).join("");

    listEl.querySelectorAll(".certificate-card").forEach((card) => {
      const certId = card.dataset.certId;
      const cert = item.certificates.find((c) => c.id === certId);
      if (!cert) return;

      card.querySelectorAll("[data-field]").forEach((input) => {
        input.addEventListener("input", () => {
          cert[input.dataset.field] = input.value;
        });
      });

      card.querySelector("[data-cert-file]").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        cert.fileName = file.name;
        cert.fileType = file.type || "application/octet-stream";
        cert.fileData = await readFileAsBase64(file);
        renderCertificatesList(item, listEl);
      });

      card.querySelector("[data-cert-open]")?.addEventListener("click", () => openCertificateFile(cert));

      card.querySelector("[data-cert-delete]").addEventListener("click", () => {
        item.certificates = item.certificates.filter((c) => c.id !== certId);
        renderCertificatesList(item, listEl);
      });
    });
  }

  function renderCertificatesFormSection(item) {
    return `
      <div class="founders-form-section">
        <div class="founders-form-divider">📜 Сертификаты</div>
        <div class="certificates-list" id="certificates-list"></div>
        <button type="button" class="btn-secondary" id="add-certificate-btn" style="width:100%;margin-top:0.5rem">+ Добавить сертификат</button>
      </div>
    `;
  }

  function openCertificateFile(cert) {
    if (!cert.fileData || !cert.fileName) return;
    const byteStr = atob(cert.fileData);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: cert.fileType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  const CYRILLIC_REGEX = /[а-яёА-ЯЁ]/;
  let capsLockActive = false;

  function updatePasswordWarnings(capsLockOn = capsLockActive, extraCyrillic = false) {
    capsLockActive = capsLockOn;
    const warningsEl = $("#password-warnings");
    if (!warningsEl) return;

    const warnings = [];
    const passwordInput = $("#password");
    const confirmInput = $("#password-confirm");
    const password = passwordInput?.value || "";
    const confirm = confirmInput?.value || "";
    const hasCyrillic =
      extraCyrillic || CYRILLIC_REGEX.test(password) || CYRILLIC_REGEX.test(confirm);

    if (hasCyrillic) warnings.push("Пароль содержит русские буквы — используйте латиницу.");
    if (capsLockOn) warnings.push("Включён Caps Lock — проверьте раскладку.");

    const highlight = warnings.length > 0;
    passwordInput?.classList.toggle("password-issue", highlight);
    confirmInput?.classList.toggle("password-issue", highlight);

    warningsEl.innerHTML = warnings
      .map((text) => `<div class="auth-warning">${escapeHtml(text)}</div>`)
      .join("");
    warningsEl.classList.toggle("hidden", warnings.length === 0);
  }

  function attachPasswordWatchers() {
    const inputs = [$("#password"), $("#password-confirm")].filter(Boolean);
    const handleInteraction = (e) => {
      const capsLockOn = e.getModifierState("CapsLock");
      const extraCyrillic = e.type === "keydown" && e.key.length === 1 && CYRILLIC_REGEX.test(e.key);
      updatePasswordWarnings(capsLockOn, extraCyrillic);
    };
    for (const input of inputs) {
      input.addEventListener("keydown", handleInteraction);
      input.addEventListener("keyup", handleInteraction);
      input.addEventListener("input", () => updatePasswordWarnings());
      input.addEventListener("focus", handleInteraction);
      input.addEventListener("click", handleInteraction);
    }
  }

  function renderAuth(mode = "unlock") {
    capsLockActive = false;
    const isSetup = mode === "setup";
    authScreen().innerHTML = `
      <div class="auth-card">
        <h1>BM Database</h1>
        <p>${isSetup ? "Создайте мастер-пароль для шифрования данных компании." : "Введите мастер-пароль для разблокировки."}</p>
        <div class="auth-error" id="auth-error"></div>
        <label for="password">${isSetup ? "Мастер-пароль" : "Пароль"}</label>
        <input type="password" id="password" autocomplete="${isSetup ? "new-password" : "current-password"}" />
        ${isSetup ? `
          <label for="password-confirm">Подтвердите пароль</label>
          <input type="password" id="password-confirm" autocomplete="new-password" />
        ` : ""}
        <div class="auth-warnings hidden" id="password-warnings"></div>
        <button class="btn-primary" id="auth-submit">${isSetup ? "Создать базу" : "Разблокировать"}</button>
        ${!isSetup ? `<button class="btn-ghost" id="import-btn" style="width:100%;margin-top:0.5rem">Импортировать резервную копию</button>` : ""}
        <input type="file" id="import-file" accept=".enc,.json" class="hidden" />
      </div>
    `;

    $("#auth-submit").addEventListener("click", () => handleAuth(isSetup));
    $("#password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleAuth(isSetup);
    });
    attachPasswordWatchers();

    if (!isSetup) {
      $("#import-btn").addEventListener("click", () => $("#import-file").click());
      $("#import-file").addEventListener("change", handleImportOnAuth);
    }
  }

  async function handleAuth(isSetup) {
    const errorEl = $("#auth-error");
    errorEl.textContent = "";
    const password = $("#password").value;
    const confirm = isSetup ? $("#password-confirm").value : password;

    if (!password || password.length < 8) {
      errorEl.textContent = "Пароль должен содержать не менее 8 символов.";
      return;
    }
    if (isSetup && password !== confirm) {
      errorEl.textContent = "Пароли не совпадают.";
      return;
    }

    try {
      if (isSetup) {
        state.data = Store.emptyDatabase();
        state.password = password;
        await persist();
      } else {
        const loaded = await Store.loadFromStorage(password);
        state.data = loaded.data;
        state.password = password;
      }
      authScreen().classList.add("hidden");
      appShell().classList.remove("hidden");
      state.view = "hub";
      render();
    } catch (err) {
      errorEl.textContent = err.message || "Не удалось разблокировать базу.";
    }
  }

  async function handleImportOnAuth(e) {
    const file = e.target.files[0];
    if (!file) return;
    const password = $("#password").value;
    if (!password) {
      $("#auth-error").textContent = "Сначала введите пароль.";
      return;
    }
    try {
      state.data = await Store.importFromFile(password, file);
      state.password = password;
      await persist();
      authScreen().classList.add("hidden");
      appShell().classList.remove("hidden");
      state.view = "hub";
      render();
      showToast("Резервная копия импортирована.");
    } catch {
      $("#auth-error").textContent = "Ошибка импорта. Проверьте пароль и файл.";
    }
  }

  // ─── Hub ─────────────────────────────────────────────────────────────────

  function renderHub() {
    const counts = Store.countEntries(state.data);
    mainContent().innerHTML = `
      <div class="hub-container">
        <h2 class="hub-title">Справочник компании</h2>
        <p class="hub-subtitle">Все разделы хранятся в одном зашифрованном хранилище</p>
        <div class="category-grid">
          ${Object.values(CATEGORIES).map((cat) => `
            <div class="category-card" data-category="${cat.id}" style="--card-color: ${cat.color}">
              <div class="category-icon">${cat.icon}</div>
              <h3>${cat.title}</h3>
              ${cat.subtitle ? `<p>${cat.subtitle}</p>` : ""}
              <span class="category-count">${counts[cat.id]} ${pluralEntries(counts[cat.id])}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    mainContent().querySelectorAll(".category-card").forEach((card) => {
      card.addEventListener("click", () => {
        state.activeCategory = card.dataset.category;
        state.view = "category";
        render();
      });
    });
  }

  // ─── Generic category view ────────────────────────────────────────────────

  function renderCategory() {
    const cat = CATEGORIES[state.activeCategory];

    if (cat.groupedView) {
      renderContactsView();
      return;
    }

    if (cat.calendarView) {
      Calendar.renderView({
        data: state.data,
        container: mainContent(),
        persist,
        showToast,
        escapeHtml,
        goToHub,
      });
      return;
    }

    const items = state.data[state.activeCategory];

    mainContent().innerHTML = `
      <div class="view-header">
        <button class="btn-ghost" id="back-btn">← Назад</button>
        <h2>${cat.icon} ${cat.title}</h2>
        <button class="btn-primary" id="add-btn">+ Добавить</button>
      </div>
      <div class="entry-list" id="entry-list">
        ${items.length === 0
          ? `<div class="empty-state">Пока нет ${cat.emptyHint}. Нажмите «Добавить», чтобы создать запись.</div>`
          : items.map((item) => `
            <div class="entry-card ${cat.detailOnClick ? "entry-card--clickable" : ""}" data-id="${item.id}">
              <div class="entry-card__body">
                <h4>${escapeHtml(cat.listTitle(item))}</h4>
                ${!cat.detailOnClick && cat.listMeta ? `<div class="meta">${escapeHtml(cat.listMeta(item))}</div>` : ""}
              </div>
              ${cat.detailOnClick ? "" : `
              <div class="entry-actions">
                <button class="btn-secondary" data-edit="${item.id}">Изменить</button>
                <button class="btn-danger" data-delete="${item.id}">Удалить</button>
              </div>`}
            </div>
          `).join("")}
      </div>
    `;

    $("#back-btn").addEventListener("click", goToHub);
    $("#add-btn").addEventListener("click", () => openEntryModal(null));

    if (cat.detailOnClick) {
      mainContent().querySelectorAll(".entry-card--clickable").forEach((card) => {
        card.addEventListener("click", () => openDetailModal(card.dataset.id));
      });
    } else {
      mainContent().querySelectorAll("[data-edit]").forEach((btn) => {
        btn.addEventListener("click", () => openEntryModal(btn.dataset.edit));
      });
      mainContent().querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", () => deleteEntry(btn.dataset.delete));
      });
    }
  }

  // ─── Company detail modal ─────────────────────────────────────────────────

  function openDetailModal(id) {
    const cat = CATEGORIES[state.activeCategory];
    const item = state.data[state.activeCategory].find((c) => c.id === id);
    if (!item) return;

    const isCompanies = state.activeCategory === "companies";
    const filledFields = cat.fields.filter((f) => item[f.key]);

    const fieldsHtml = filledFields
      .map((f) => `
        <div class="detail-field">
          <span class="detail-label">${escapeHtml(f.label)}</span>
          <span class="detail-value">${escapeHtml(item[f.key])}</span>
        </div>
      `)
      .join("");

    // ECP section
    const hasEcp = item.ecpFileName || item.ecpPassword || item.ecpIssueDate || item.ecpExpiryDate;
    const ecpStatus = getEcpStatus(item.ecpExpiryDate);
    const ecpHtml = hasEcp ? `
      <div class="ecp-detail-section">
        <div class="ecp-detail-header">
          <span>🔑 ЭЦП</span>
          ${ecpStatus ? `<span class="ecp-badge ${ecpStatus.cls}">${ecpStatus.text}</span>` : ""}
        </div>
        ${item.ecpFileName ? `
          <div class="detail-field">
            <span class="detail-label">Файл ключа</span>
            <span class="detail-value ecp-file-row">
              📎 ${escapeHtml(item.ecpFileName)}
              ${item.ecpData ? `<button class="btn-ghost btn-sm" id="ecp-download-btn">⬇ Скачать</button>` : ""}
            </span>
          </div>
        ` : ""}
        ${item.ecpPassword ? `
          <div class="detail-field">
            <span class="detail-label">Пароль ЭЦП</span>
            <span class="detail-value">
              <span class="ecp-pwd-mask" id="ecp-pwd-val">••••••••</span>
              <button class="btn-ghost btn-sm" id="ecp-pwd-toggle">Показать</button>
            </span>
          </div>
        ` : ""}
        ${item.ecpIssueDate ? `
          <div class="detail-field">
            <span class="detail-label">Дата выпуска</span>
            <span class="detail-value">${formatDate(item.ecpIssueDate)}</span>
          </div>
        ` : ""}
        ${item.ecpExpiryDate ? `
          <div class="detail-field">
            <span class="detail-label">Дата окончания</span>
            <span class="detail-value ${ecpStatus ? ecpStatus.cls : ""}">
              ${formatDate(item.ecpExpiryDate)}
            </span>
          </div>
        ` : ""}
      </div>
    ` : "";

    // Founders section — companies only, always shown (even empty), each
    // founder belongs strictly to this company's own item.founders array.
    const founders = isCompanies ? (item.founders || []) : [];
    const foundersHtml = isCompanies ? `
      <div class="founders-detail-section">
        <div class="ecp-detail-header"><span>👥 Учредители</span></div>
        ${founders.length === 0
          ? `<p style="color:var(--muted);font-size:0.9rem;">Пока нет учредителей. Нажмите «Изменить», чтобы добавить.</p>`
          : founders.map((f) => `
            <div class="detail-field">
              <span class="detail-label">${escapeHtml(f.fullName || "Без имени")}</span>
              <span class="detail-value">
                ${[f.type, f.iinBin, f.sharePercent !== "" && f.sharePercent != null ? `${escapeHtml(String(f.sharePercent))}%` : "", f.contributionAmount, f.dateBecameFounder ? formatDate(f.dateBecameFounder) : ""]
                  .filter(Boolean).map(escapeHtml).join(" · ")}
                ${f.notes ? `<br><span style="color:var(--muted)">${escapeHtml(f.notes)}</span>` : ""}
              </span>
            </div>
          `).join("")}
      </div>
    ` : "";

    // Certificates section — companies only, always shown (even empty), each
    // certificate belongs strictly to this company's own item.certificates array.
    const certificates = isCompanies ? (item.certificates || []) : [];
    const certificatesHtml = isCompanies ? `
      <div class="founders-detail-section">
        <div class="ecp-detail-header"><span>📜 Сертификаты</span></div>
        ${certificates.length === 0
          ? `<p style="color:var(--muted);font-size:0.9rem;">Пока нет сертификатов. Нажмите «Изменить», чтобы добавить.</p>`
          : certificates.map((c, i) => `
            <div class="detail-field">
              <span class="detail-label">${escapeHtml(c.title || `Сертификат ${i + 1}`)}</span>
              <span class="detail-value">
                ${[c.issueDate ? `Выдан: ${formatDate(c.issueDate)}` : "", c.expiryDate ? `Действителен до: ${formatDate(c.expiryDate)}` : ""]
                  .filter(Boolean).join(" · ")}
                ${c.description ? `<br><span style="color:var(--muted)">${escapeHtml(c.description)}</span>` : ""}
                ${c.fileName ? `<br><span class="ecp-file-row">📎 ${escapeHtml(c.fileName)} <button class="btn-ghost btn-sm" data-cert-detail-open="${c.id}">Открыть</button></span>` : ""}
              </span>
            </div>
          `).join("")}
      </div>
    ` : "";

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="detail-modal-header">
          <h3>${escapeHtml(cat.listTitle(item))}</h3>
          <button class="btn-copy-all" id="detail-copy" title="Скопировать всё">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Копировать
          </button>
        </div>
        <div class="detail-fields">
          ${fieldsHtml || `<p style="color:var(--muted)">Нет заполненных полей.</p>`}
        </div>
        ${ecpHtml}
        ${foundersHtml}
        ${certificatesHtml}
        <div class="modal-actions" style="margin-top:1.25rem">
          <button class="btn-ghost" id="detail-close">Закрыть</button>
          <button class="btn-secondary" id="detail-edit">Изменить</button>
          <button class="btn-danger" id="detail-delete">Удалить</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#detail-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector("#detail-edit").addEventListener("click", () => {
      overlay.remove();
      openEntryModal(id);
    });

    overlay.querySelector("#detail-delete").addEventListener("click", async () => {
      overlay.remove();
      await deleteEntry(id);
    });

    // ECP download
    overlay.querySelector("#ecp-download-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      downloadEcpFile(item);
    });

    // Certificate file open (companies only)
    overlay.querySelectorAll("[data-cert-detail-open]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cert = (item.certificates || []).find((c) => c.id === btn.dataset.certDetailOpen);
        if (cert) openCertificateFile(cert);
      });
    });

    // ECP password toggle
    const ecpPwdToggle = overlay.querySelector("#ecp-pwd-toggle");
    const ecpPwdVal = overlay.querySelector("#ecp-pwd-val");
    let ecpPwdVisible = false;
    ecpPwdToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      ecpPwdVisible = !ecpPwdVisible;
      ecpPwdVal.textContent = ecpPwdVisible ? item.ecpPassword : "••••••••";
      ecpPwdToggle.textContent = ecpPwdVisible ? "Скрыть" : "Показать";
    });

    overlay.querySelector("#detail-copy").addEventListener("click", () => {
      const lines = filledFields.map((f) => `${f.label}: ${item[f.key]}`);
      if (item.ecpIssueDate) lines.push(`Дата выпуска ЭЦП: ${formatDate(item.ecpIssueDate)}`);
      if (item.ecpExpiryDate) lines.push(`Дата окончания ЭЦП: ${formatDate(item.ecpExpiryDate)}`);
      navigator.clipboard.writeText(lines.join("\n")).then(() => {
        const btn = overlay.querySelector("#detail-copy");
        btn.textContent = "✓ Скопировано";
        setTimeout(() => {
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Копировать`;
        }, 2000);
      });
    });
  }

  // ─── Contacts grouped view ────────────────────────────────────────────────

  function getInitials(firstName, lastName) {
    const a = (firstName || "").trim()[0] || "";
    const b = (lastName || "").trim()[0] || "";
    return (a + b).toUpperCase() || "?";
  }

  function highlightMatch(text, q) {
    if (!q || !text) return escapeHtml(text || "");
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      `<mark class="contact-highlight">${escapeHtml(text.slice(idx, idx + q.length))}</mark>` +
      escapeHtml(text.slice(idx + q.length))
    );
  }

  function renderContactsView() {
    const contacts = state.data.contacts;
    const q = state.contactSearch.toLowerCase().trim();

    function matchContact(c) {
      if (!q) return true;
      return (
        (c.firstName || "").toLowerCase().includes(q) ||
        (c.lastName || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
      );
    }

    function renderGroup(groupName) {
      const allItems = contacts.filter((c) => c.group === groupName);
      const items = allItems.filter(matchContact);
      const isCollapsed = state.contactGroupsCollapsed.has(groupName) && !q;
      const hide = items.length === 0 && q;

      const cardsHtml = items.map((c) => {
        const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ");
        const hasExtra = c.extra && c.extra.trim();
        const initials = getInitials(c.firstName, c.lastName);
        const displayName = q
          ? highlightMatch([c.firstName, c.lastName].filter(Boolean).join(" ") || "Без имени", q)
          : escapeHtml(fullName || "Без имени");
        const displayPhone = q
          ? highlightMatch(c.phone || "", q) || `<span style="color:var(--muted)">—</span>`
          : escapeHtml(c.phone || "") || `<span style="color:var(--muted)">—</span>`;

        return `
          <div class="contact-card" data-id="${c.id}"${hasExtra ? ` data-tooltip="${escapeHtml(c.extra)}"` : ""}>
            <div class="contact-card__avatar">${escapeHtml(initials)}</div>
            <div class="contact-card__info">
              <span class="contact-card__name">${displayName}</span>
              <span class="contact-card__phone">${displayPhone}</span>
            </div>
          </div>
        `;
      }).join("");

      return `
        <div class="contact-group${hide ? " contact-group--hidden" : ""}">
          <div class="contact-group__header" data-group-toggle="${escapeHtml(groupName)}">
            <div class="contact-group__header-left">
              <svg class="contact-group__chevron${isCollapsed ? " contact-group__chevron--collapsed" : ""}"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <span class="contact-group__title">${escapeHtml(groupName)}</span>
              <span class="contact-group__count">${allItems.length}</span>
            </div>
            <button class="contact-group__add" data-group="${escapeHtml(groupName)}">+ Добавить</button>
          </div>
          <div class="contact-group__body${isCollapsed ? " contact-group__body--collapsed" : ""}">
            ${items.length === 0
              ? `<div class="contact-group__empty">${q ? "Нет совпадений." : "Пока нет записей в этой группе."}</div>`
              : `<div class="contact-grid">${cardsHtml}</div>`}
          </div>
        </div>
      `;
    }

    mainContent().innerHTML = `
      <div class="view-header">
        <button class="btn-ghost" id="back-btn">← Назад</button>
        <h2>📇 Контакты</h2>
        <span class="contact-total-badge">${contacts.length} контактов</span>
      </div>
      <div class="contact-search-wrap">
        <input type="text" id="contact-search" class="contact-search" placeholder="🔍  Поиск по имени или номеру..." value="${escapeHtml(state.contactSearch)}" />
        ${q ? `<button class="contact-search__clear" id="search-clear">✕</button>` : ""}
      </div>
      <div id="contacts-groups">
        ${CONTACT_GROUPS.map(renderGroup).join("")}
      </div>
    `;

    $("#back-btn").addEventListener("click", () => {
      state.contactSearch = "";
      state.contactGroupsCollapsed = new Set();
      goToHub();
    });

    const searchInput = $("#contact-search");
    searchInput.addEventListener("input", () => {
      state.contactSearch = searchInput.value;
      renderContactsView();
      const newInput = $("#contact-search");
      if (newInput) {
        newInput.focus();
        const len = newInput.value.length;
        newInput.setSelectionRange(len, len);
      }
    });

    const clearBtn = $("#search-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        state.contactSearch = "";
        renderContactsView();
        $("#contact-search")?.focus();
      });
    }

    // Group collapse toggle
    mainContent().querySelectorAll("[data-group-toggle]").forEach((header) => {
      header.addEventListener("click", (e) => {
        if (e.target.closest(".contact-group__add")) return;
        const groupName = header.dataset.groupToggle;
        if (state.contactGroupsCollapsed.has(groupName)) {
          state.contactGroupsCollapsed.delete(groupName);
        } else {
          state.contactGroupsCollapsed.add(groupName);
        }
        renderContactsView();
      });
    });

    mainContent().querySelectorAll(".contact-group__add").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openContactModal(null, btn.dataset.group);
      });
    });

    mainContent().querySelectorAll(".contact-card").forEach((card) => {
      card.addEventListener("click", () => openContactDetailModal(card.dataset.id));
    });
  }

  // ─── Contact detail card ──────────────────────────────────────────────────

  function openContactDetailModal(id) {
    const contact = state.data.contacts.find((c) => c.id === id);
    if (!contact) return;

    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

    const rows = [
      { label: "Имя", value: contact.firstName },
      { label: "Фамилия", value: contact.lastName },
      { label: "Номер телефона", value: contact.phone },
      { label: "Telegram", value: contact.telegram },
      { label: "Группа", value: contact.group },
      { label: "Дополнительно", value: contact.extra },
    ].filter((r) => r.value);

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${escapeHtml(fullName || "Контакт")}</h3>
        <div class="detail-fields">
          ${rows.map((r) => `
            <div class="detail-field">
              <span class="detail-label">${escapeHtml(r.label)}</span>
              <span class="detail-value">${escapeHtml(r.value)}</span>
            </div>
          `).join("")}
        </div>
        <div class="modal-actions" style="margin-top:1.25rem">
          <button class="btn-ghost" id="contact-close">Закрыть</button>
          <button class="btn-secondary" id="contact-edit">Изменить</button>
          <button class="btn-danger" id="contact-delete">Удалить</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#contact-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector("#contact-edit").addEventListener("click", () => {
      overlay.remove();
      openContactModal(id, contact.group);
    });

    overlay.querySelector("#contact-delete").addEventListener("click", async () => {
      if (!confirm(`Удалить контакт «${fullName}»?`)) return;
      overlay.remove();
      state.data.contacts = state.data.contacts.filter((c) => c.id !== id);
      await persist();
      renderContactsView();
      showToast("Удалено.");
    });
  }

  // ─── Contact add/edit modal ───────────────────────────────────────────────

  function openContactModal(id, group) {
    const existing = id ? state.data.contacts.find((c) => c.id === id) : null;
    const item = existing
      ? { ...existing }
      : { id: Store.createId(), group: group || CONTACT_GROUPS[2], firstName: "", lastName: "", phone: "", telegram: "", extra: "" };

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${existing ? "Изменить контакт" : `Добавить — ${escapeHtml(item.group)}`}</h3>
        <form id="contact-form">
          ${CONTACT_FIELDS.map((f) => renderField(f, item[f.key] || "")).join("")}
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="contact-cancel">Отмена</button>
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector("#contact-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector("#contact-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      for (const f of CONTACT_FIELDS) {
        item[f.key] = form.elements[f.key].value.trim();
      }

      if (!item.firstName) {
        showToast("Поле «Имя» обязательно.");
        return;
      }

      const list = state.data.contacts;
      const idx = list.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.push(item);
      }

      await persist();
      overlay.remove();
      renderContactsView();
      showToast("Сохранено.");
    });
  }

  // ─── Generic entry modal ──────────────────────────────────────────────────

  function renderField(field, value = "") {
    if (field.type === "textarea") {
      return `
        <label for="f-${field.key}">${field.label}</label>
        <textarea id="f-${field.key}" name="${field.key}">${escapeHtml(value)}</textarea>
      `;
    }
    if (field.type === "select") {
      return `
        <label for="f-${field.key}">${field.label}</label>
        <select id="f-${field.key}" name="${field.key}">
          <option value="">— Выберите —</option>
          ${field.options.map((opt) => `
            <option value="${escapeHtml(opt)}" ${value === opt ? "selected" : ""}>${escapeHtml(opt)}</option>
          `).join("")}
        </select>
      `;
    }
    if (field.type === "password") {
      return `
        <label for="f-${field.key}">${field.label}</label>
        <div class="password-field">
          <input type="password" id="f-${field.key}" name="${field.key}" value="${escapeHtml(value)}" />
          <button type="button" class="toggle-password" onclick="bmTogglePassword(this, 'f-${field.key}')">Показать</button>
        </div>
      `;
    }
    return `
      <label for="f-${field.key}">${field.label}${field.required ? " *" : ""}</label>
      <input type="${field.type}" id="f-${field.key}" name="${field.key}" value="${escapeHtml(value)}" ${field.required ? "required" : ""} />
    `;
  }

  function openEntryModal(id) {
    const cat = CATEGORIES[state.activeCategory];
    const existing = id ? state.data[state.activeCategory].find((item) => item.id === id) : null;
    const item = existing ? { ...existing } : { id: Store.createId() };
    const isCompanies = state.activeCategory === "companies";

    // Clone founders/certificates (not just reference) so "Отмена" discards
    // edits, same as how the rest of this form only commits on submit.
    if (isCompanies) {
      item.founders = (existing?.founders || []).map((f) => ({ ...f }));
      item.certificates = (existing?.certificates || []).map((c) => ({ ...c }));
    }

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${existing ? "Изменить" : "Добавить"} ${cat.singularTitle}</h3>
        <form id="entry-form">
          ${cat.fields.map((field) => renderField(field, item[field.key] || "")).join("")}
          ${isCompanies ? renderEcpFormSection(item) : ""}
          ${isCompanies ? renderFoundersFormSection(item) : ""}
          ${isCompanies ? renderCertificatesFormSection(item) : ""}
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="cancel-btn">Отмена</button>
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    if (isCompanies) {
      const foundersListEl = overlay.querySelector("#founders-list");
      renderFoundersList(item, foundersListEl);
      overlay.querySelector("#add-founder-btn").addEventListener("click", () => {
        openFounderModal(item, foundersListEl, null);
      });

      const certificatesListEl = overlay.querySelector("#certificates-list");
      renderCertificatesList(item, certificatesListEl);
      overlay.querySelector("#add-certificate-btn").addEventListener("click", () => {
        item.certificates.push({
          id: Store.createId(),
          title: "", issueDate: "", expiryDate: "", description: "",
          fileName: "", fileData: "", fileType: "",
        });
        renderCertificatesList(item, certificatesListEl);
      });
    }

    // Auto-fill BIK when bank is selected (companies only)
    if (isCompanies) {
      const bankSelect = overlay.querySelector("#f-bank");
      const bikInput = overlay.querySelector("#f-bik");
      if (bankSelect && bikInput) {
        const applyBik = () => {
          const bik = BANK_BIK[bankSelect.value] || "";
          if (bik) {
            bikInput.value = bik;
            bikInput.style.color = "var(--muted)";
            bikInput.title = "Заполнено автоматически по выбранному банку";
          }
        };
        bankSelect.addEventListener("change", applyBik);
        if (bankSelect.value && !bikInput.value) applyBik();
      }

      // ECP file picker — update displayed filename
      const ecpFileInput = overlay.querySelector("#f-ecpFile");
      const ecpFileDisplay = overlay.querySelector("#ecp-filename-display");
      const ecpUploadBtn = overlay.querySelector(".ecp-upload-btn");
      if (ecpFileInput) {
        ecpFileInput.addEventListener("change", () => {
          const file = ecpFileInput.files[0];
          if (file && ecpFileDisplay) {
            ecpFileDisplay.textContent = `📎 ${file.name}`;
            if (ecpUploadBtn) ecpUploadBtn.textContent = "Заменить";
          }
        });
      }
    }

    overlay.querySelector("#cancel-btn").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector("#entry-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      for (const field of cat.fields) {
        item[field.key] = form.elements[field.key].value.trim();
      }

      // ECP fields (companies only)
      if (isCompanies) {
        item.ecpPassword  = overlay.querySelector("#f-ecpPassword")?.value?.trim() || "";
        item.ecpIssueDate = overlay.querySelector("#f-ecpIssueDate")?.value || "";
        item.ecpExpiryDate = overlay.querySelector("#f-ecpExpiryDate")?.value || "";
        const ecpFileInput = overlay.querySelector("#f-ecpFile");
        if (ecpFileInput?.files?.[0]) {
          const file = ecpFileInput.files[0];
          item.ecpFileName = file.name;
          item.ecpData = await readFileAsBase64(file);
        }
        // Keep existing ecpData/ecpFileName if no new file selected
      }

      const required = cat.fields.find((f) => f.required && !item[f.key]);
      if (required) {
        showToast(`Поле «${required.label}» обязательно.`);
        return;
      }

      if (isCompanies) {
        const badCert = item.certificates.find((c) => !c.title || !c.issueDate);
        if (badCert) {
          showToast(`У каждого сертификата обязательны поля «Название сертификата» и «Дата выдачи».`);
          return;
        }
      }

      const list = state.data[state.activeCategory];
      const index = list.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      await persist();
      overlay.remove();
      render();
      showToast("Сохранено.");
    });
  }

  async function deleteEntry(id) {
    const cat = CATEGORIES[state.activeCategory];
    if (!confirm(`Удалить запись?`)) return;
    state.data[state.activeCategory] = state.data[state.activeCategory].filter((item) => item.id !== id);
    await persist();
    render();
    showToast("Удалено.");
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  function goToHub() {
    state.view = "hub";
    state.activeCategory = null;
    render();
  }

  function render() {
    if (state.view === "hub") {
      renderHub();
    } else if (state.view === "category") {
      renderCategory();
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  async function init() {
    let isSetup = false;
    try {
      if (window.location.protocol !== "file:") {
        const res = await fetch("/api/data");
        const json = await res.json();
        isSetup = !!json.isSetup;
      } else {
        const raw = localStorage.getItem("bm-database-v1");
        isSetup = raw ? JSON.parse(raw).isSetup : false;
      }
    } catch { /* ignore, default to setup */ }

    authScreen().classList.remove("hidden");
    appShell().classList.add("hidden");
    renderAuth(isSetup ? "unlock" : "setup");

    $("#export-btn").addEventListener("click", async () => {
      await Store.exportToFile(state.password, state.data);
      showToast("Резервная копия скачана.");
    });

    $("#lock-btn").addEventListener("click", () => {
      state.password = null;
      state.data = null;
      authScreen().classList.remove("hidden");
      appShell().classList.add("hidden");
      renderAuth("unlock");
    });
  }

  return { init };
})();

function bmTogglePassword(btn, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.textContent = show ? "Скрыть" : "Показать";
}

document.addEventListener("DOMContentLoaded", () => App.init());
