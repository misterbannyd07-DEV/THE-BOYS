/* =========================================================
   THE BOYS — comportamento das páginas públicas
   ========================================================= */

const EVENTS_FILE = "dados/eventos.json";

document.addEventListener("DOMContentLoaded", async () => {
    setupPageLoader();
    setupNavigation();
    setupThemeToggle();
    setupFooterYear();

    try {
        const data = await loadSiteData();
        renderHome(data);
        renderEventsPage(data);
        renderGalleryPage(data);
        setupEventFilters(data.events || []);
    } catch (error) {
        console.error("Não foi possível carregar os dados do site:", error);
        showDataError();
    }
});

function setupPageLoader() {
    const loader = document.querySelector(".page-loader");

    if (!loader) {
        return;
    }

    window.addEventListener("load", () => {
        window.setTimeout(() => {
            loader.classList.add("is-hidden");
        }, 350);
    });

    window.setTimeout(() => {
        loader.classList.add("is-hidden");
    }, 1800);
}

function setupNavigation() {
    // A navegação móvel usa o dock flutuante em estilo de aplicação.
    document.querySelectorAll(".main-nav a, .dock-link").forEach((link) => {
        if (link.href === window.location.href) {
            link.classList.add("active");
        }
    });
}

function setupThemeToggle() {
    const savedTheme = localStorage.getItem("theBoysTheme") || "light";
    document.documentElement.dataset.theme = savedTheme;
    updateThemeButtons(savedTheme);

    document.querySelectorAll(".theme-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = nextTheme;
            localStorage.setItem("theBoysTheme", nextTheme);
            updateThemeButtons(nextTheme);
        });
    });
}

function updateThemeButtons(theme) {
    document.querySelectorAll(".theme-toggle").forEach((button) => {
        const dark = theme === "dark";
        button.innerHTML = dark ? '☀ <span>Modo diurno</span>' : '☾ <span>Modo nocturno</span>';
        button.setAttribute("aria-label", dark ? "Activar modo diurno" : "Activar modo nocturno");
    });
}

function setupFooterYear() {
    document.querySelectorAll(".current-year").forEach((element) => {
        element.textContent = new Date().getFullYear();
    });
}

async function loadSiteData() {
    const response = await fetch(EVENTS_FILE, { cache: "no-cache" });

    if (!response.ok) {
        throw new Error("O ficheiro dados/eventos.json não foi encontrado.");
    }

    return response.json();
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

function parseDate(dateString) {
    if (!dateString) {
        return new Date("invalid");
    }

    return new Date(`${dateString}T00:00:00`);
}

function formatDate(dateString) {
    const date = parseDate(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Data a anunciar";
    }

    return new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function sortEvents(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...events].sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        const futureA = dateA >= today;
        const futureB = dateB >= today;

        if (futureA && !futureB) {
            return -1;
        }

        if (!futureA && futureB) {
            return 1;
        }

        return futureA ? dateA - dateB : dateB - dateA;
    });
}

function getEventStatus(event) {
    const date = parseDate(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today ? "Próximo evento" : "Evento realizado";
}

function mediaMarkup(path, className = "media-mark") {
    if (path) {
        return `<img src="${escapeHTML(path)}" alt="" loading="lazy">`;
    }

    return `<span class="${className}" aria-hidden="true">TB</span>`;
}

function eventCard(event, featured = false) {
    const cardClass = featured ? "featured-card" : "event-card";
    const imageClass = featured ? "media-placeholder" : "event-media";
    const location = event.location ? `<p>${escapeHTML(event.location)}</p>` : "";
    const description = event.description
        ? `<p>${escapeHTML(event.description)}</p>`
        : "<p>Mais informações sobre este evento serão divulgadas em breve.</p>";

    return `
        <article class="${cardClass}">
            <div class="${imageClass}">${mediaMarkup(event.flyer)}</div>
            <div class="${featured ? "featured-copy" : "event-card-copy"}">
                <span class="event-date">${escapeHTML(formatDate(event.date))}</span>
                <h3>${escapeHTML(event.title)}</h3>
                ${location}
                ${description}
                <div class="event-card-footer">
                    <span class="muted">${escapeHTML(getEventStatus(event))}</span>
                    <a class="card-arrow" href="galeria.html?evento=${encodeURIComponent(event.id)}" aria-label="Abrir galeria de ${escapeHTML(event.title)}">↗</a>
                </div>
            </div>
        </article>
    `;
}

function renderHome(data) {
    const events = sortEvents(data.events || []);
    const featuredContainer = document.querySelector("#featured-events");

    if (featuredContainer) {
        const upcoming = events.filter((event) => getEventStatus(event) === "Próximo evento");
        const selected = upcoming.slice(0, 2);

        featuredContainer.innerHTML = selected.length
            ? selected.map((event) => eventCard(event, true)).join("")
            : '<p class="empty-state">Ainda não há eventos futuros no calendário.</p>';
    }

    const galleryContainer = document.querySelector("#home-gallery");

    if (galleryContainer) {
        const pastEvents = events.filter((event) => getEventStatus(event) === "Evento realizado");
        const highlights = (data.homeGalleryIds || [])
            .map((id) => pastEvents.find((event) => event.id === id))
            .filter(Boolean);
        const selected = [...highlights, ...pastEvents.filter((event) => !highlights.includes(event))]
            .slice(0, 4);

        galleryContainer.innerHTML = selected.length
            ? selected.map((event) => galleryCard(event, true)).join("")
            : '<p class="empty-state">Os destaques da galeria serão apresentados aqui depois de adicionares eventos realizados.</p>';
        setupGalleryCardLinks(galleryContainer);
    }

    const contacts = data.contacts || {};
    const whatsapp = document.querySelector("#whatsapp-link");
    const phone = document.querySelector("#phone-link");

    if (whatsapp) {
        whatsapp.href = contacts.whatsapp
            ? `https://wa.me/${String(contacts.whatsapp).replace(/\D/g, "")}`
            : "#";
    }

    if (phone) {
        phone.href = contacts.phone ? `tel:${contacts.phone.replace(/\s/g, "")}` : "#";
    }
}

function renderEventsPage(data) {
    const container = document.querySelector("#all-events");
    if (!container) return;

    const events = sortEvents(data.events || []);
    const featured = document.querySelector("#featured-events");
    if (featured) {
        const upcoming = events.filter((event) => getEventStatus(event) === "Próximo evento");
        featured.innerHTML = upcoming.length
            ? upcoming.slice(0, 2).map((event) => eventCard(event, true)).join("")
            : '<p class="empty-state">Ainda não há eventos futuros no calendário.</p>';
    }
    renderEventsForYear(events, new Date().getFullYear() >= 2023 && new Date().getFullYear() <= 2027 ? String(new Date().getFullYear()) : "2027");
}

function renderEventsForYear(events, year) {
    const container = document.querySelector("#all-events");
    if (!container) return;
    const filtered = sortEvents(events).filter((event) => String(event.date || "").slice(0, 4) === String(year));
    container.innerHTML = filtered.length
        ? filtered.map((event) => eventCard(event, false)).join("")
        : `<p class="empty-state">Ainda não existem eventos registados para ${escapeHTML(year)}.</p>`;
}

function setupEventFilters(events) {
    const buttons = document.querySelectorAll("[data-event-year]");
    if (!buttons.length) return;

    const currentYear = String(new Date().getFullYear());
    const initialYear = [...buttons].some((button) => button.dataset.eventYear === currentYear) ? currentYear : "2027";
    buttons.forEach((button) => {
        button.classList.toggle("active", button.dataset.eventYear === initialYear);
        button.addEventListener("click", () => {
            buttons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            renderEventsForYear(events, button.dataset.eventYear);
        });
    });
    renderEventsForYear(events, initialYear);
}

function galleryCard(event, compact = false) {
    return `
        <button class="gallery-card" type="button" data-gallery-event="${escapeHTML(event.id)}">
            <div class="gallery-media">${mediaMarkup(event.flyer)}</div>
            <div class="gallery-card-copy">
                <div>
                    <h3>${escapeHTML(event.title)}</h3>
                    <p>${escapeHTML(formatDate(event.date))}</p>
                </div>
                <span class="card-arrow" aria-hidden="true">↗</span>
            </div>
        </button>
    `;
}

function renderGalleryPage(data) {
    const container = document.querySelector("#gallery-events");

    if (!container) {
        return;
    }

    const events = sortEvents(data.events || []);
    const pastEvents = events.filter((event) => getEventStatus(event) === "Evento realizado");

    container.innerHTML = pastEvents.length
        ? pastEvents.map((event) => galleryCard(event)).join("")
        : '<p class="empty-state">Ainda não há eventos realizados para mostrar na galeria.</p>';

    setupGalleryCardLinks(container);

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("evento");

    if (requestedId) {
        const requestedEvent = pastEvents.find((event) => event.id === requestedId);

        if (requestedEvent) {
            openGalleryEvent(requestedEvent);
        }
    }
}

function setupGalleryCardLinks(container) {
    container.querySelectorAll("[data-gallery-event]").forEach((card) => {
        card.addEventListener("click", () => {
            const eventId = card.dataset.galleryEvent;
            loadSiteData()
                .then((data) => {
                    const event = (data.events || []).find((item) => item.id === eventId);

                    if (event) {
                        openGalleryEvent(event);
                    }
                })
                .catch((error) => console.error(error));
        });
    });
}

let currentPhotos = [];
let currentPhotoIndex = 0;

function openGalleryEvent(event) {
    const detail = document.querySelector("#gallery-detail");

    if (!detail) {
        return;
    }

    currentPhotos = event.photos || [];
    currentPhotoIndex = 0;

    document.querySelector("#gallery-detail-title").textContent = event.title;
    document.querySelector("#gallery-detail-meta").textContent =
        `${formatDate(event.date)}${event.location ? ` • ${event.location}` : ""}`;

    renderPhotoViewer();
    renderEventVideos(event.videos || []);

    detail.hidden = false;
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPhotoViewer() {
    const stage = document.querySelector("#photo-stage");
    const counter = document.querySelector("#photo-counter");
    const thumbnails = document.querySelector("#photo-thumbnails");

    if (!stage || !counter || !thumbnails) {
        return;
    }

    if (!currentPhotos.length) {
        stage.innerHTML = '<div class="photo-placeholder">As fotografias deste evento serão adicionadas aqui.</div>';
        counter.textContent = "Sem fotografias";
        thumbnails.innerHTML = "";
        return;
    }

    const photo = currentPhotos[currentPhotoIndex];
    stage.innerHTML = `<img src="${escapeHTML(photo.src || photo)}" alt="${escapeHTML(photo.alt || "Fotografia do evento")}" loading="lazy">`;
    counter.textContent = `Fotografia ${currentPhotoIndex + 1} de ${currentPhotos.length}`;

    thumbnails.innerHTML = currentPhotos.map((item, index) => {
        const src = typeof item === "string" ? item : item.src;
        return `
            <button class="photo-thumbnail ${index === currentPhotoIndex ? "active" : ""}" type="button" data-photo-index="${index}" aria-label="Ver fotografia ${index + 1}">
                <img src="${escapeHTML(src)}" alt="" loading="lazy">
            </button>
        `;
    }).join("");

    thumbnails.querySelectorAll("[data-photo-index]").forEach((button) => {
        button.addEventListener("click", () => {
            currentPhotoIndex = Number(button.dataset.photoIndex);
            renderPhotoViewer();
        });
    });
}

function renderEventVideos(videos) {
    const container = document.querySelector("#event-videos");
    if (!container) return;

    const entries = [];
    videos.forEach((item) => {
        if (typeof item === "string") {
            entries.push({ platform: "youtube", url: item, title: "Vídeo do evento" });
            return;
        }
        if (item.youtube) item.youtube.forEach((url) => entries.push({ platform: "youtube", url, title: "Vídeo do YouTube" }));
        if (item.tiktok) item.tiktok.forEach((url) => entries.push({ platform: "tiktok", url, title: "Vídeo do TikTok" }));
        if (item.url) entries.push({ platform: item.platform || "youtube", url: item.url, title: item.title || "Vídeo do evento" });
    });

    if (!entries.length) {
        container.innerHTML = '<p class="muted">Ainda não foram adicionados vídeos a este evento.</p>';
        return;
    }

    container.innerHTML = entries.map((video) => {
        const embedUrl = getEmbedUrl(video.url, video.platform);
        if (!embedUrl) return `<article class="video-card"><p>${escapeHTML(video.title)}</p><a href="${escapeHTML(video.url)}" target="_blank" rel="noopener">Abrir vídeo ↗</a></article>`;
        return `<article class="video-card"><iframe src="${escapeHTML(embedUrl)}" title="${escapeHTML(video.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><a href="${escapeHTML(video.url)}" target="_blank" rel="noopener">Abrir vídeo original ↗</a></article>`;
    }).join("");
}

function getEmbedUrl(rawUrl, platform = "youtube") {
    const value = String(rawUrl || "").trim();
    if (!value) return null;

    if (platform === "tiktok") {
        const match = value.match(/(?:video\/)(\d{8,})/) || value.match(/^(\d{8,})$/);
        return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : null;
    }

    const directId = value.match(/^[a-zA-Z0-9_-]{6,}$/);
    if (directId) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(value)}`;
    try {
        const url = new URL(value);
        let videoId = "";
        if (url.hostname.includes("youtube.com")) {
            videoId = url.searchParams.get("v") || (url.pathname.startsWith("/embed/") ? url.pathname.split("/embed/")[1] : "");
        } else if (url.hostname === "youtu.be") {
            videoId = url.pathname.slice(1);
        }
        return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null;
    } catch {
        return null;
    }
}

document.addEventListener("click", (event) => {
    if (event.target.closest("#photo-prev")) {
        if (currentPhotos.length) {
            currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
            renderPhotoViewer();
        }
    }

    if (event.target.closest("#photo-next")) {
        if (currentPhotos.length) {
            currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
            renderPhotoViewer();
        }
    }

    if (event.target.closest("#close-gallery-detail")) {
        const detail = document.querySelector("#gallery-detail");

        if (detail) {
            detail.hidden = true;
        }
    }
});


function showDataError() {
    document.querySelectorAll("#featured-events, #home-gallery, #all-events, #gallery-events")
        .forEach((container) => {
            container.innerHTML = '<p class="empty-state">Não foi possível carregar os dados. Confirma o ficheiro dados/eventos.json e abre o projecto através de um servidor local.</p>';
        });
}
