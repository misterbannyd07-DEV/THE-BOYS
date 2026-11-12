/* =========================================================
   THE BOYS — ferramenta local de gestão de eventos
   Importa, edita e exporta dados JSON. Não publica ficheiros.
   ========================================================= */

const DEFAULT_DATA_PATH = "dados/eventos.json";
const STORAGE_KEY = "theBoysAdminDraftV1";

let siteData = {
    version: 1,
    contacts: { whatsapp: "", phone: "" },
    homeGalleryIds: [],
    events: [],
    organizations: [],
    partners: []
};

document.addEventListener("DOMContentLoaded", async () => {
    setupAdminLoader();
    setupAdminEvents();
    setupAdminTheme();

    try {
        const response = await fetch(DEFAULT_DATA_PATH, { cache: "no-cache" });

        if (response.ok) {
            siteData = normalizeData(await response.json());
        }
    } catch (error) {
        setStatus("Não foi possível ler o JSON inicial. Podes importar um ficheiro JSON.", true);
    }

    loadDraft();
    renderAdminEvents();
    resetEventForm();
    setStatus("Dados carregados. As alterações ficam neste navegador até exportares o JSON.");
});

function setupAdminTheme() {
    const savedTheme = localStorage.getItem("theBoysTheme") || "light";
    document.documentElement.dataset.theme = savedTheme;
    updateAdminThemeButtons(savedTheme);
    document.querySelectorAll(".theme-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = nextTheme;
            localStorage.setItem("theBoysTheme", nextTheme);
            updateAdminThemeButtons(nextTheme);
        });
    });
}

function updateAdminThemeButtons(theme) {
    document.querySelectorAll(".theme-toggle").forEach((button) => {
        const dark = theme === "dark";
        button.innerHTML = dark ? '☀ <span>Modo diurno</span>' : '☾ <span>Modo nocturno</span>';
        button.setAttribute("aria-label", dark ? "Activar modo diurno" : "Activar modo nocturno");
    });
}

function setupAdminLoader() {
    const loader = document.querySelector(".page-loader");

    if (!loader) {
        return;
    }

    window.addEventListener("load", () => {
        window.setTimeout(() => loader.classList.add("is-hidden"), 300);
    });

    window.setTimeout(() => loader.classList.add("is-hidden"), 1800);
}

function setupAdminEvents() {
    document.querySelector("#event-form").addEventListener("submit", saveEvent);
    document.querySelector("#reset-form").addEventListener("click", resetEventForm);
    document.querySelector("#export-json").addEventListener("click", exportJSON);
    document.querySelector("#import-json").addEventListener("change", importJSON);
    document.querySelector("#admin-events").addEventListener("click", handleEventListAction);
}

function normalizeData(data) {
    return {
        version: data.version || 1,
        contacts: data.contacts || { whatsapp: "", phone: "" },
        homeGalleryIds: Array.isArray(data.homeGalleryIds) ? data.homeGalleryIds : [],
        events: Array.isArray(data.events) ? data.events : [],
        organizations: Array.isArray(data.organizations) ? data.organizations : [],
        partners: Array.isArray(data.partners) ? data.partners : []
    };
}

function loadDraft() {
    try {
        const draft = localStorage.getItem(STORAGE_KEY);

        if (draft) {
            siteData = normalizeData(JSON.parse(draft));
            setStatus("Foi recuperado um rascunho local guardado neste navegador.");
        }
    } catch (error) {
        setStatus("O rascunho local não pôde ser lido. Continua com os dados carregados.", true);
    }
}

function saveDraft() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    } catch (error) {
        setStatus("Não foi possível guardar o rascunho no navegador. Exporta o JSON para não perderes as alterações.", true);
    }
}

function setStatus(message, isError = false) {
    const status = document.querySelector("#admin-status");

    if (status) {
        status.textContent = message;
        status.style.color = isError ? "#A22A2A" : "#168FA0";
    }
}

function saveEvent(event) {
    event.preventDefault();

    const idField = document.querySelector("#event-id");
    const existingId = idField.value;
    const title = document.querySelector("#event-title").value.trim();
    const date = document.querySelector("#event-date").value;

    if (!title || !date) {
        setStatus("Preenche o nome e a data do evento.", true);
        return;
    }

    const eventData = {
        id: existingId || createEventId(title, date),
        title,
        date,
        time: document.querySelector("#event-time").value,
        location: document.querySelector("#event-location").value.trim(),
        description: document.querySelector("#event-description").value.trim(),
        flyer: document.querySelector("#event-flyer").value.trim(),
        activities: splitLines(document.querySelector("#event-activities").value),
        photos: splitLines(document.querySelector("#event-photos").value),
        videos: [{
            youtube: splitLines(document.querySelector("#event-youtube").value).map(normalizeYouTubeInput),
            tiktok: splitLines(document.querySelector("#event-tiktok").value).map(normalizeTikTokInput)
        }]
    };

    const existingIndex = siteData.events.findIndex((item) => item.id === eventData.id);

    if (existingIndex >= 0) {
        siteData.events[existingIndex] = eventData;
        setStatus(`O evento “${title}” foi actualizado no rascunho.`);
    } else {
        siteData.events.push(eventData);
        setStatus(`O evento “${title}” foi adicionado ao rascunho.`);
    }

    saveDraft();
    renderAdminEvents();
    resetEventForm();
}

function splitLines(value) {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function normalizeYouTubeInput(value) {
    const match = value.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
    return match ? match[1] : value;
}

function normalizeTikTokInput(value) {
    const match = value.match(/video\/(\d{8,})/) || value.match(/^(\d{8,})$/);
    return match ? match[1] : value;
}

function createEventId(title, date) {
    const slug = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${date}-${slug || "evento"}`;
}

function resetEventForm() {
    document.querySelector("#event-form").reset();
    document.querySelector("#event-id").value = "";
    document.querySelector("#form-title").textContent = "Criar evento";
}

function renderAdminEvents() {
    const container = document.querySelector("#admin-events");
    const count = document.querySelector("#event-count");

    count.textContent = String(siteData.events.length);

    if (!siteData.events.length) {
        container.innerHTML = '<p class="empty-state">Ainda não há eventos. Usa o formulário para criar o primeiro.</p>';
        return;
    }

    const sorted = [...siteData.events].sort((a, b) => String(a.date).localeCompare(String(b.date)));

    container.innerHTML = sorted.map((event) => `
        <article class="admin-event-item">
            <div class="admin-event-thumb">
                ${event.flyer ? `<img src="${escapeHTML(event.flyer)}" alt="" loading="lazy">` : "TB"}
            </div>
            <div class="admin-event-info">
                <h3>${escapeHTML(event.title)}</h3>
                <p>${escapeHTML(formatDate(event.date))}${event.location ? ` • ${escapeHTML(event.location)}` : ""}</p>
                <div class="admin-item-actions">
                    <button class="small-button" type="button" data-action="edit" data-id="${escapeHTML(event.id)}">Editar</button>
                    <button class="small-button danger" type="button" data-action="delete" data-id="${escapeHTML(event.id)}">Apagar</button>
                </div>
            </div>
        </article>
    `).join("");
}

function handleEventListAction(event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const eventData = siteData.events.find((item) => item.id === button.dataset.id);

    if (!eventData) {
        return;
    }

    if (button.dataset.action === "edit") {
        fillEventForm(eventData);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (button.dataset.action === "delete") {
        const confirmed = window.confirm(`Queres apagar o evento “${eventData.title}” do rascunho?`);

        if (confirmed) {
            siteData.events = siteData.events.filter((item) => item.id !== eventData.id);
            siteData.homeGalleryIds = siteData.homeGalleryIds.filter((id) => id !== eventData.id);
            saveDraft();
            renderAdminEvents();
            setStatus(`O evento “${eventData.title}” foi removido do rascunho. Exporta o JSON para guardar a alteração.`);
        }
    }
}

function fillEventForm(eventData) {
    document.querySelector("#event-id").value = eventData.id || "";
    document.querySelector("#event-title").value = eventData.title || "";
    document.querySelector("#event-date").value = eventData.date || "";
    document.querySelector("#event-time").value = eventData.time || "";
    document.querySelector("#event-location").value = eventData.location || "";
    document.querySelector("#event-description").value = eventData.description || "";
    document.querySelector("#event-flyer").value = eventData.flyer || "";
    document.querySelector("#event-activities").value = (eventData.activities || []).join("\n");
    document.querySelector("#event-photos").value = (eventData.photos || []).map((photo) => typeof photo === "string" ? photo : photo.src).join("\n");
    const videoData = (eventData.videos || []).reduce((result, video) => {
        if (typeof video === "string") result.youtube.push(video);
        else {
            if (video.url) (video.platform === "tiktok" ? result.tiktok : result.youtube).push(video.url);
            if (Array.isArray(video.youtube)) result.youtube.push(...video.youtube);
            if (Array.isArray(video.tiktok)) result.tiktok.push(...video.tiktok);
        }
        return result;
    }, { youtube: [], tiktok: [] });
    document.querySelector("#event-youtube").value = videoData.youtube.join("\n");
    document.querySelector("#event-tiktok").value = videoData.tiktok.join("\n");
    document.querySelector("#form-title").textContent = "Editar evento";
    setStatus(`A editar “${eventData.title}”. Guarda as alterações antes de exportar.`);
}

async function importJSON(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const content = await file.text();
        const imported = JSON.parse(content);

        if (!imported || !Array.isArray(imported.events)) {
            throw new Error("O ficheiro não contém uma lista 'events'.");
        }

        siteData = normalizeData(imported);
        saveDraft();
        renderAdminEvents();
        resetEventForm();
        setStatus(`Importação concluída: ${siteData.events.length} evento(s) carregado(s). Revê os dados e exporta quando estiverem prontos.`);
    } catch (error) {
        setStatus(`Não foi possível importar o JSON: ${error.message}`, true);
    } finally {
        event.target.value = "";
    }
}

function exportJSON() {
    const content = JSON.stringify(siteData, null, 4);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "eventos.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus("JSON exportado. Substitui o ficheiro dados/eventos.json no projecto e faz um novo deploy.");
}

function formatDate(dateString) {
    if (!dateString) {
        return "Data a anunciar";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "Data inválida";
    }

    return new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}
