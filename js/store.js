const Store = (() => {
  const STORAGE_KEY = "bm-database-v1";

  // When opened via HTTP server — use server-side shared storage.
  // When opened as file:// — use localStorage (single device).
  const IS_SERVER = window.location.protocol !== "file:";

  const COMPANY_KEYS = ["name", "address", "binIin", "bank", "bik", "kbe", "accountNumber",
    "ecpFileName", "ecpData", "ecpPassword", "ecpIssueDate", "ecpExpiryDate"];

  function emptyDatabase() {
    return {
      companies: [],
      founders: [],
      contacts: [],
      documents: [],
      access: [],
      calendar: [],
    };
  }

  function migrateData(data) {
    if (!data.companies && data.company && typeof data.company === "object" && !Array.isArray(data.company)) {
      const old = data.company;
      const hasData = COMPANY_KEYS.some((key) => old[key]);
      data.companies = hasData ? [{ id: createId(), ...pickCompanyFields(old) }] : [];
      delete data.company;
    }
    if (!Array.isArray(data.companies)) data.companies = [];
    if (!Array.isArray(data.calendar)) data.calendar = [];

    data.companies = data.companies.map((c) => ({
      ...c,
      founders: Array.isArray(c.founders) ? c.founders : [],
      certificates: Array.isArray(c.certificates) ? c.certificates : [],
    }));

    if (Array.isArray(data.contacts)) {
      data.contacts = data.contacts.map((c) => {
        if (!c.firstName && !c.group) {
          const nameParts = (c.name || "").trim().split(/\s+/);
          return {
            id: c.id || createId(),
            group: "Исполнители",
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: c.phone || "",
            telegram: "",
            extra: [c.role, c.company, c.email, c.notes].filter(Boolean).join(" · "),
          };
        }
        return c;
      });
    }

    return data;
  }

  function pickCompanyFields(source) {
    const entry = {};
    for (const key of COMPANY_KEYS) entry[key] = source[key] || "";
    return entry;
  }

  function createId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getDefaultState() {
    return { isSetup: false, encryptedPayload: null, data: null, password: null };
  }

  // ── Server storage helpers ──────────────────────────────────────────────────

  async function serverLoad() {
    try {
      const res = await fetch("/api/data");
      if (!res.ok) return null;
      const json = await res.json();
      return json.isSetup ? json : null;
    } catch {
      return null;
    }
  }

  async function serverSave(encryptedPayload) {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSetup: true, encryptedPayload }),
    });
  }

  // ── Core storage ────────────────────────────────────────────────────────────

  async function saveEncrypted(password, data) {
    const plaintext = JSON.stringify(data);
    const encryptedPayload = await CryptoModule.encrypt(password, plaintext);

    if (IS_SERVER) {
      await serverSave(encryptedPayload);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isSetup: true, encryptedPayload }));
    }

    return encryptedPayload;
  }

  async function loadFromStorage(password) {
    let saved = null;
    let fromLocalStorage = false;

    if (IS_SERVER) {
      // Try server first
      saved = await serverLoad();

      // If server is empty but localStorage has data — migrate it automatically
      if (!saved) {
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          try {
            const parsed = JSON.parse(localRaw);
            if (parsed.isSetup && parsed.encryptedPayload) {
              saved = parsed;
              fromLocalStorage = true;
            }
          } catch { /* ignore */ }
        }
      }
    } else {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { saved = JSON.parse(raw); } catch { /* ignore */ }
      }
    }

    if (!saved || !saved.isSetup || !saved.encryptedPayload) {
      return { isSetup: false, data: emptyDatabase() };
    }

    try {
      const payload   = saved.encryptedPayload;
      const plaintext = await CryptoModule.decrypt(password, payload);
      const parsed    = JSON.parse(plaintext);
      const data      = migrateData(parsed);

      const dataChanged   = JSON.stringify(parsed) !== JSON.stringify(data);
      const cryptoUpgrade = (payload.version || 1) < 2;
      const needsUpload   = fromLocalStorage; // migrate localStorage → server

      if (dataChanged || cryptoUpgrade || needsUpload) {
        await saveEncrypted(password, data);
        // After migrating to server, clear localStorage to avoid stale data
        if (needsUpload && IS_SERVER) localStorage.removeItem(STORAGE_KEY);
      }

      return { isSetup: true, data };
    } catch (e) {
      throw new Error(e.message || "Неверный пароль или повреждённые данные.");
    }
  }

  async function exportToFile(password, data) {
    const encryptedPayload = await CryptoModule.encrypt(password, JSON.stringify(data));
    const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `bm-database-kopiya-${new Date().toISOString().slice(0, 10)}.enc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFromFile(password, file) {
    const text             = await file.text();
    const encryptedPayload = JSON.parse(text);
    const plaintext        = await CryptoModule.decrypt(password, encryptedPayload);
    return migrateData(JSON.parse(plaintext));
  }

  function countEntries(data) {
    return {
      companies: data.companies.length,
      founders:  data.founders.length,
      contacts:  data.contacts.length,
      documents: data.documents.length,
      access:    data.access.length,
      calendar:  (data.calendar || []).length,
    };
  }

  return {
    emptyDatabase,
    createId,
    getDefaultState,
    saveEncrypted,
    loadFromStorage,
    exportToFile,
    importFromFile,
    countEntries,
    migrateData,
  };
})();
