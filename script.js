function safeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMultilineText(value) {
  return safeText(value).replace(/\n/g, "<br>");
}

function parseDateOnly(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(dateString) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateOnly(dateString));
}

function formatShortDate(dateString) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseDateOnly(dateString));
}

function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function getSortedEvents() {
  return [...EVENTS].sort((a, b) => {
    const dateCompare = parseDateOnly(a.date) - parseDateOnly(b.date);
    if (dateCompare !== 0) return dateCompare;
    return String(a.time).localeCompare(String(b.time));
  });
}

function getUpcomingEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getSortedEvents().filter((event) => parseDateOnly(event.date) >= today);
}

function applySiteSettings() {
  document.querySelectorAll(".brand-name").forEach((element) => {
    element.textContent = SITE_SETTINGS.shortName || SITE_SETTINGS.societyName;
  });

  document.querySelectorAll(".brand-full-name").forEach((element) => {
    element.textContent = SITE_SETTINGS.societyName;
  });

  document.querySelectorAll(".university-label").forEach((element) => {
    element.textContent = SITE_SETTINGS.universityLabel;
  });

  document.querySelectorAll(".site-tagline").forEach((element) => {
    element.textContent = SITE_SETTINGS.tagline;
  });

  document.querySelectorAll(".site-description").forEach((element) => {
    element.textContent = SITE_SETTINGS.heroDescription;
  });

  document.querySelectorAll(".brand-logo, .hero-image").forEach((element) => {
    if (SITE_SETTINGS.logoPath && element.classList.contains("brand-logo")) {
      element.src = SITE_SETTINGS.logoPath;
      element.alt = `${SITE_SETTINGS.societyName} logo`;
    }

    if (SITE_SETTINGS.heroImage && element.classList.contains("hero-image")) {
      element.src = SITE_SETTINGS.heroImage;
      element.alt = `${SITE_SETTINGS.societyName} themed background`;
    }
  });

  document.querySelectorAll(".contact-email-link").forEach((element) => {
    element.textContent = SITE_SETTINGS.contactEmail;
    element.href = `mailto:${SITE_SETTINGS.contactEmail}`;
  });

  document.querySelectorAll(".footer-note").forEach((element) => {
    element.textContent = SITE_SETTINGS.footerText || "";
  });

  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

function setupNavigation() {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".site-nav");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("site-nav--open");
    });
  }
}

function renderHomePage() {
  const previewGrid = document.getElementById("homeUpcomingEvents");
  if (!previewGrid) return;

  const eventsToShow = getUpcomingEvents().slice(0, 3);
  const cards = [];

  for (let index = 0; index < 3; index += 1) {
    const event = eventsToShow[index];

    if (event) {
      cards.push(`
        <article class="mini-event-card">
          <span class="pill">${safeText(event.category)}</span>
          <h3>${safeText(event.title)}</h3>
          <p>${safeText(formatShortDate(event.date))} • ${safeText(event.time)}</p>
          <p>${safeText(event.location)}</p>
        </article>
      `);
    } else {
      cards.push('<article class="mini-event-card mini-event-card--blank" aria-hidden="true"></article>');
    }
  }

  previewGrid.innerHTML = cards.join("");
}

function renderSocials() {
  const container = document.getElementById("socialGrid");
  if (!container) return;

  container.innerHTML = SOCIAL_LINKS.map((social) => {
    const socialSlug = String(social.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `
      <a class="social-card" href="${safeText(social.url)}" target="_blank" rel="noopener noreferrer">
        <div class="social-card__icon social-card__icon--${socialSlug}">${safeText(social.icon)}</div>
        <div class="social-card__content">
          <h3>${safeText(social.name)}</h3>
          <p>${safeText(social.description)}</p>
          <span class="social-card__handle">${safeText(social.handle)}</span>
        </div>
      </a>
    `;
  }).join("");
}

function renderExecutives() {
  const container = document.getElementById("execGrid");
  if (!container) return;

  container.innerHTML = EXECUTIVES.map((exec) => {
    const socialButtons = (exec.socials || [])
      .map(
        (social) => `
          <a href="${safeText(social.url)}" target="_blank" rel="noopener noreferrer">${safeText(social.label)}</a>
        `
      )
      .join("");

    return `
      <article class="exec-card">
        <div class="exec-card__image-wrap">
          <img class="exec-card__image" src="${safeText(exec.photo)}" alt="Photo of ${safeText(exec.name)}">
        </div>
        <div class="exec-card__body">
          <span class="pill">${safeText(exec.role)}</span>
          <h3>${safeText(exec.name)}</h3>
          <p class="exec-card__degree">${safeText(exec.degree)}</p>
          <p>${safeText(exec.bio)}</p>
          <div class="exec-card__links">${socialButtons}</div>
        </div>
      </article>
    `;
  }).join("");
}

let calendarViewDate = null;

function getCalendarStartDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEventsForDate(date) {
  return getSortedEvents().filter((event) => isSameDate(parseDateOnly(event.date), date));
}

function openEventModal(date, eventsForDate) {
  const modal = document.getElementById("eventModal");
  const modalDate = document.getElementById("modalDate");
  const modalBody = document.getElementById("modalBody");

  if (!modal || !modalDate || !modalBody) return;

  modalDate.textContent = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  if (!eventsForDate.length) {
    modalBody.innerHTML = `
      <div class="empty-state">
        <p>No events are scheduled for this day yet.</p>
      </div>
    `;
  } else {
    modalBody.innerHTML = eventsForDate
      .map(
        (event) => `
          <article class="modal-event-card">
            <span class="pill">${safeText(event.category)}</span>
            <h3>${safeText(event.title)}</h3>
            <p><strong>Time:</strong> ${safeText(event.time)}</p>
            <p><strong>Location:</strong> ${safeText(event.location)}</p>
            <p>${formatMultilineText(event.description)}</p>
          </article>
        `
      )
      .join("");
  }

  modal.classList.add("event-modal--open");
  document.body.classList.add("no-scroll");
}

function closeEventModal() {
  const modal = document.getElementById("eventModal");
  if (!modal) return;
  modal.classList.remove("event-modal--open");
  document.body.classList.remove("no-scroll");
}

function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");
  const weekdayRow = document.getElementById("weekdayRow");
  if (!calendarGrid || !monthLabel || !weekdayRow) return;

  const monthStart = getCalendarStartDate(calendarViewDate);
  const monthName = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
  }).format(monthStart);
  monthLabel.textContent = monthName;

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  weekdayRow.innerHTML = weekdays.map((day) => `<div class="weekday-cell">${day}</div>`).join("");

  const firstDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const lastDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push('<div class="calendar-cell calendar-cell--empty"></div>');
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const eventsForDate = getEventsForDate(currentDate);
    const hasEvents = eventsForDate.length > 0;
    const isToday = isSameDate(currentDate, today);

    const labelsHtml = hasEvents
      ? `
        <div class="calendar-labels">
          <span class="calendar-tag">${safeText(eventsForDate[0].title)}</span>
          ${eventsForDate.length > 1 ? `<span class="calendar-more">+${eventsForDate.length - 1} more</span>` : ""}
        </div>
      `
      : "";

    cells.push(`
      <button
        class="calendar-cell ${hasEvents ? "calendar-cell--event" : ""} ${isToday ? "calendar-cell--today" : ""}"
        data-date="${currentDate.toISOString()}"
        type="button"
        aria-label="${safeText(
          hasEvents
            ? `${day} ${monthName}, ${eventsForDate.length} event${eventsForDate.length > 1 ? "s" : ""}`
            : `${day} ${monthName}`
        )}"
      >
        <span class="calendar-day-number">${day}</span>
        ${labelsHtml}
      </button>
    `);
  }

  while (cells.length % 7 !== 0) {
    cells.push('<div class="calendar-cell calendar-cell--empty"></div>');
  }

  calendarGrid.innerHTML = cells.join("");

  calendarGrid.querySelectorAll(".calendar-cell[data-date]").forEach((cell) => {
    cell.addEventListener("click", () => {
      const date = new Date(cell.dataset.date);
      date.setHours(0, 0, 0, 0);
      openEventModal(date, getEventsForDate(date));
    });
  });
}

function renderUpcomingEventList() {
  const container = document.getElementById("upcomingEventsList");
  if (!container) return;

  const upcoming = getUpcomingEvents();

  if (!upcoming.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No upcoming events scheduled right now.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = upcoming
    .map(
      (event) => `
        <article class="event-list-card">
          <div class="event-list-card__header">
            <div>
              <span class="pill">${safeText(event.category)}</span>
              <h3>${safeText(event.title)}</h3>
            </div>
            <button class="secondary-button open-event-button" type="button" data-event-date="${safeText(event.date)}">View details</button>
          </div>
          <p><strong>Date:</strong> ${safeText(formatLongDate(event.date))}</p>
          <p><strong>Time:</strong> ${safeText(event.time)}</p>
          <p><strong>Location:</strong> ${safeText(event.location)}</p>
        </article>
      `
    )
    .join("");

  container.querySelectorAll(".open-event-button").forEach((button) => {
    button.addEventListener("click", () => {
      const date = parseDateOnly(button.dataset.eventDate);
      openEventModal(date, getEventsForDate(date));
    });
  });
}

function setupCalendarControls() {
  const prevButton = document.getElementById("prevMonthButton");
  const nextButton = document.getElementById("nextMonthButton");
  const closeButton = document.getElementById("closeModalButton");
  const modal = document.getElementById("eventModal");

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeEventModal);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeEventModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeEventModal();
    }
  });
}

function initCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;

  const firstUpcoming = getUpcomingEvents()[0];
  calendarViewDate = firstUpcoming ? parseDateOnly(firstUpcoming.date) : new Date();
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);

  setupCalendarControls();
  renderCalendar();
  renderUpcomingEventList();
}

document.addEventListener("DOMContentLoaded", () => {
  applySiteSettings();
  setupNavigation();
  renderHomePage();
  renderSocials();
  renderExecutives();
  initCalendar();
});
