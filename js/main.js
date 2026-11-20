(function () {
  "use strict";

  const DRAFT_KEY = "aurelia-visit-draft";
  const VISIT_START_HOUR = 9;
  const VISIT_END_HOUR = 17;
  const BOOKING_DAYS_AHEAD = 60;
  const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTH_FORMATTER = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
  const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const MOCK_AVAILABILITY = Object.create(null);

  const bySelector = (selector, root) => (root || document).querySelector(selector);
  const allBySelector = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const parts = value.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return localDateKey(date) === value ? date : null;
  }

  function addDays(date, amount) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + amount);
    return result;
  }

  function getDateBounds() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { today, lastDay: addDays(today, BOOKING_DAYS_AHEAD) };
  }

  function isBookableDate(date) {
    const bounds = getDateBounds();
    return date >= bounds.today && date <= bounds.lastDay && date.getDay() !== 0;
  }

  function isAvailableTime(dateKey, time) {
    const date = parseDateKey(dateKey);
    if (!date || !isBookableDate(date) || typeof time !== "string" || !/^(09|1[0-6]):00$/.test(time)) {
      return false;
    }

    const hour = Number(time.slice(0, 2));
    const bookedSlots = MOCK_AVAILABILITY[localDateKey(date)] || [];
    return hour >= VISIT_START_HOUR
      && hour < VISIT_END_HOUR
      && !(localDateKey(date) === localDateKey(getDateBounds().today) && hour <= new Date().getHours())
      && !bookedSlots.includes(time);
  }

  function seedMockAvailability() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    let seeded = 0;
    let offset = 1;
    while (seeded < 4) {
      const date = addDays(start, offset);
      if (isBookableDate(date)) {
        MOCK_AVAILABILITY[localDateKey(date)] = seeded % 2 === 0
          ? ["11:00", "15:00"]
          : ["10:00", "14:00", "16:00"];
        seeded += 1;
      }
      offset += 1;
    }
  }

  seedMockAvailability();

  function cleanText(value, maxLength) {
    return String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function getFocusableElements(container) {
    return allBySelector(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
  }

  function initMobileNavigation() {
    const toggle = bySelector(".menu-toggle");
    const navigation = bySelector("#primary-navigation");
    if (!toggle || !navigation) return;

    let returnFocus = null;
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    function setMenuOpen(open, shouldFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      navigation.classList.toggle("is-open", open);
      document.body.classList.toggle("is-menu-open", open);
      navigation.inert = !open && isMobile();
      if (!isMobile()) navigation.inert = false;
      if (open) {
        returnFocus = document.activeElement;
        if (shouldFocus) {
          const firstLink = navigation.querySelector("a");
          if (firstLink) firstLink.focus();
        }
      } else if (shouldFocus && returnFocus instanceof HTMLElement) {
        returnFocus.focus();
      }
    }

    toggle.addEventListener("click", () => {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true", true);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenuOpen(false, false);
    });

    document.addEventListener("keydown", (event) => {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false, true);
        return;
      }
      if (event.key !== "Tab" || !isMobile()) return;

      const focusable = getFocusableElements(navigation);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) {
        navigation.inert = false;
        setMenuOpen(false, false);
      } else if (toggle.getAttribute("aria-expanded") !== "true") {
        navigation.inert = true;
      }
    });

    navigation.inert = isMobile();
  }

  function initTabs() {
    allBySelector("[data-tabs]").forEach((tabSet) => {
      const tabs = allBySelector('[role="tab"]', tabSet);

      function activateTab(tab, moveFocus) {
        tabs.forEach((item) => {
          const selected = item === tab;
          item.setAttribute("aria-selected", String(selected));
          item.tabIndex = selected ? 0 : -1;
          const panel = bySelector(`#${item.getAttribute("aria-controls")}`, tabSet);
          if (panel) panel.hidden = !selected;
        });
        if (moveFocus) tab.focus();
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateTab(tab, false));
        tab.addEventListener("keydown", (event) => {
          let nextIndex = index;
          if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
          if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = tabs.length - 1;
          if (nextIndex !== index) {
            event.preventDefault();
            activateTab(tabs[nextIndex], true);
          }
        });
      });
    });
  }

  function initAccordion() {
    const accordion = bySelector("[data-accordion]");
    if (!accordion) return;
    accordion.addEventListener("click", (event) => {
      const trigger = event.target.closest(".faq-item__trigger");
      if (!trigger) return;
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";
      allBySelector(".faq-item__trigger", accordion).forEach((item) => {
        item.setAttribute("aria-expanded", String(item === trigger && willOpen));
        const panel = bySelector(`#${item.getAttribute("aria-controls")}`, accordion);
        if (panel) panel.hidden = item !== trigger || !willOpen;
      });
    });
  }

  function initGallery() {
    const lightbox = bySelector("[data-lightbox]");
    const image = bySelector(".lightbox__image", lightbox);
    const caption = bySelector(".lightbox__caption", lightbox);
    const counter = bySelector(".lightbox__count", lightbox);
    const dialog = bySelector(".lightbox__dialog", lightbox);
    const items = allBySelector(".gallery-item");
    if (!lightbox || !image || !dialog || !items.length) return;

    let activeIndex = 0;
    let previousFocus = null;
    let touchStartX = 0;
    let touchStartY = 0;

    function preloadNext(index) {
      const next = items[(index + 1) % items.length];
      const nextImage = bySelector("img", next);
      if (nextImage && nextImage.currentSrc) {
        const preload = new Image();
        preload.src = nextImage.currentSrc;
      }
    }

    function getImageTitle(index) {
      const item = items[index];
      const sourceImage = bySelector("img", item);
      const label = bySelector(".gallery-item__label", item);
      const labelText = label ? label.textContent.trim() : "";
      return labelText || sourceImage.alt || item.getAttribute("aria-label") || "Property image";
    }

    function showImage(index) {
      activeIndex = (index + items.length) % items.length;
      const item = items[activeIndex];
      const sourceImage = bySelector("img", item);
      const title = getImageTitle(activeIndex);

      image.alt = sourceImage.alt;
      if (image.dataset.failedSource === sourceImage.src) {
        image.classList.add("is-missing");
        caption.textContent = `${title} — image not yet supplied`;
      } else {
        image.classList.remove("is-missing");
        image.src = sourceImage.src;
        caption.textContent = title;
      }
      counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      preloadNext(activeIndex);
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove("is-lightbox-open");
      image.removeAttribute("src");
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }

    items.forEach((item) => {
      item.addEventListener("click", () => {
        previousFocus = document.activeElement;
        lightbox.hidden = false;
        document.body.classList.add("is-lightbox-open");
        showImage(Number(item.dataset.galleryIndex) || 0);
        bySelector("[data-lightbox-close]:not(.lightbox__backdrop)", lightbox).focus();
      });
    });

    lightbox.addEventListener("click", (event) => {
      if (event.target.closest("[data-lightbox-close]")) closeLightbox();
      if (event.target.closest("[data-lightbox-prev]")) showImage(activeIndex - 1);
      if (event.target.closest("[data-lightbox-next]")) showImage(activeIndex + 1);
    });

    image.addEventListener("error", () => {
      const failedSource = image.getAttribute("src");
      if (lightbox.hidden || !failedSource || image.dataset.failedSource === image.src) return;
      image.dataset.failedSource = image.src;
      image.classList.add("is-missing");
      caption.textContent = `${getImageTitle(activeIndex)} — image not yet supplied`;
    });
    image.addEventListener("load", () => {
      image.classList.remove("is-missing");
      delete image.dataset.failedSource;
    });

    dialog.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    dialog.addEventListener("touchend", (event) => {
      if (event.changedTouches.length !== 1) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        showImage(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showImage(activeIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showImage(activeIndex - 1);
      } else if (event.key === "Tab") {
        const focusable = getFocusableElements(dialog);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  function getDraft() {
    try {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY);
      if (!rawDraft) return null;
      const draft = JSON.parse(rawDraft);
      if (!draft || typeof draft !== "object") return null;
      return draft;
    } catch (error) {
      return null;
    }
  }

  function saveDraft(draft) {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      // Storage can be unavailable in private browsing; the in-memory flow still works.
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      // The confirmed demonstration should continue even when storage is disabled.
    }
  }

  /**
   * Simulates a booking request. Replace the delay with a POST to a validated server endpoint.
   * @param {object} payload Clean visit details collected by the form.
   * @returns {Promise<{demo: boolean}>}
   */
  async function submitBooking(payload) {
    void payload;
    // Production example: return fetch("/api/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    return { demo: true };
  }

  function initBooking() {
    const form = bySelector("#booking-form");
    if (!form) return;

    const state = {
      step: 1,
      visitType: "",
      date: "",
      time: "",
      name: "",
      email: "",
      phone: "",
      guests: "1",
      message: "",
      consent: false,
      reference: ""
    };
    const today = new Date();
    const calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextButton = bySelector("[data-booking-next]", form);
    const backButton = bySelector("[data-booking-back]", form);
    const controls = bySelector("[data-booking-controls]", form);
    const steps = allBySelector("[data-booking-step]", form);
    const calendarGrid = bySelector("[data-calendar-grid]", form);
    const calendarTitle = bySelector("[data-calendar-month]", form);
    const previousMonthButton = bySelector("[data-calendar-prev]", form);
    const nextMonthButton = bySelector("[data-calendar-next]", form);
    const slotGrid = bySelector("[data-slot-grid]", form);
    const successPanel = bySelector("[data-booking-success]", form);
    const fieldMap = {
      name: bySelector("#guest-name", form),
      email: bySelector("#guest-email", form),
      phone: bySelector("#guest-phone", form),
      guests: bySelector("#guest-count", form),
      message: bySelector("#guest-message", form),
      consent: bySelector("#guest-consent", form)
    };
    const errorMap = {
      name: bySelector("#error-name", form),
      email: bySelector("#error-email", form),
      phone: bySelector("#error-phone", form),
      consent: bySelector("#error-consent", form)
    };

    const existingDraft = getDraft();
    if (existingDraft) {
      state.visitType = ["In-person", "Virtual tour"].includes(existingDraft.visitType) ? existingDraft.visitType : "";
      state.date = parseDateKey(existingDraft.date) && isBookableDate(parseDateKey(existingDraft.date)) ? existingDraft.date : "";
      state.time = typeof existingDraft.time === "string" && /^(09|1[0-6]):00$/.test(existingDraft.time)
        ? existingDraft.time
        : "";
      if (state.time && !isAvailableTime(state.date, state.time)) state.time = "";
      state.name = cleanText(existingDraft.name, 100);
      state.email = cleanText(existingDraft.email, 254);
      state.phone = cleanText(existingDraft.phone, 30);
      state.guests = ["1", "2", "3", "4", "5", "6"].includes(existingDraft.guests) ? existingDraft.guests : "1";
      state.message = cleanText(existingDraft.message, 500);
      state.consent = existingDraft.consent === true;
      const requestedStep = Number(existingDraft.step);
      state.step = Number.isInteger(requestedStep) ? Math.min(Math.max(requestedStep, 1), 5) : 1;
    }

    fieldMap.name.value = state.name;
    fieldMap.email.value = state.email;
    fieldMap.phone.value = state.phone;
    fieldMap.guests.value = state.guests;
    fieldMap.message.value = state.message;
    fieldMap.consent.checked = state.consent;

    function getDateLabel(dateKey) {
      const date = parseDateKey(dateKey);
      return date && isBookableDate(date) ? DATE_FORMATTER.format(date) : "Not selected";
    }

    function getTimeLabel(dateKey, time) {
      if (!isAvailableTime(dateKey, time)) return "Not selected";
      return `${time}–${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00`;
    }

    function updateSummary() {
      bySelector("[data-summary-type]").textContent = state.visitType || "Not selected";
      bySelector("[data-summary-date]").textContent = getDateLabel(state.date);
      bySelector("[data-summary-time]").textContent = getTimeLabel(state.date, state.time);
    }

    function persistState() {
      saveDraft({
        step: state.step,
        visitType: state.visitType,
        date: state.date,
        time: state.time,
        name: state.name,
        email: state.email,
        phone: state.phone,
        guests: state.guests,
        message: state.message,
        consent: state.consent
      });
    }

    function clearStepError(stepNumber) {
      const error = bySelector(`[data-step-error="${stepNumber}"]`, form);
      if (error) error.textContent = "";
    }

    function setStep(stepNumber, shouldFocus) {
      state.step = stepNumber;
      steps.forEach((step) => {
        step.hidden = Number(step.dataset.bookingStep) !== stepNumber;
      });
      successPanel.hidden = true;
      controls.hidden = false;
      backButton.hidden = stepNumber === 1;
      nextButton.textContent = stepNumber === 5 ? "Send visit request" : "Continue →";
      nextButton.disabled = false;

      allBySelector("[data-progress-step]").forEach((item) => {
        const index = Number(item.dataset.progressStep);
        item.classList.toggle("is-current", index === stepNumber);
        item.classList.toggle("is-complete", index < stepNumber);
        if (index === stepNumber) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });

      clearStepError(stepNumber);
      if (stepNumber === 2) renderCalendar();
      if (stepNumber === 3) renderTimeSlots();
      if (stepNumber === 5) renderReview();
      updateSummary();
      persistState();

      if (shouldFocus) {
        const heading = bySelector(`[data-booking-step="${stepNumber}"] .booking-step__title`, form);
        if (heading) heading.focus();
      }
    }

    function showStepError(stepNumber, message) {
      const error = bySelector(`[data-step-error="${stepNumber}"]`, form);
      if (error) error.textContent = message;
    }

    function renderCalendar() {
      const bounds = getDateBounds();
      const currentMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      calendarTitle.textContent = MONTH_FORMATTER.format(currentMonth);
      const thisMonth = new Date(bounds.today.getFullYear(), bounds.today.getMonth(), 1);
      const lastMonth = new Date(bounds.lastDay.getFullYear(), bounds.lastDay.getMonth(), 1);
      previousMonthButton.disabled = currentMonth <= thisMonth;
      nextMonthButton.disabled = currentMonth >= lastMonth;
      calendarGrid.replaceChildren();

      WEEKDAY_LABELS.forEach((label) => {
        const weekday = document.createElement("span");
        weekday.className = "calendar__weekday";
        weekday.textContent = label;
        weekday.setAttribute("aria-hidden", "true");
        calendarGrid.append(weekday);
      });

      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const numberOfDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      for (let blank = 0; blank < firstDay.getDay(); blank += 1) {
        const spacer = document.createElement("span");
        spacer.setAttribute("aria-hidden", "true");
        calendarGrid.append(spacer);
      }

      for (let day = 1; day <= numberOfDays; day += 1) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const key = localDateKey(date);
        const button = document.createElement("button");
        button.className = "calendar__day";
        button.type = "button";
        button.textContent = String(day);
        button.disabled = !isBookableDate(date);
        button.setAttribute("aria-label", DATE_FORMATTER.format(date));
        button.setAttribute("aria-pressed", String(state.date === key));
        if (key === localDateKey(bounds.today)) button.classList.add("is-today");
        if (state.date === key) button.classList.add("is-selected");
        button.addEventListener("click", () => {
          if (state.date !== key) state.time = "";
          state.date = key;
          clearStepError(2);
          renderCalendar();
          const selectedDay = bySelector('.calendar__day[aria-pressed="true"]', form);
          if (selectedDay) selectedDay.focus();
          updateSummary();
          persistState();
        });
        calendarGrid.append(button);
      }
    }

    function renderTimeSlots() {
      slotGrid.replaceChildren();
      const selectedDate = parseDateKey(state.date);
      const dateLabel = bySelector("[data-selected-date-label]", form);
      if (!selectedDate || !isBookableDate(selectedDate)) {
        dateLabel.textContent = "Choose a valid date before selecting a time.";
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Return to the date step to choose an available day.";
        slotGrid.append(empty);
        return;
      }

      dateLabel.textContent = `Available times for ${DATE_FORMATTER.format(selectedDate)}.`;
      const key = localDateKey(selectedDate);
      const bookedSlots = MOCK_AVAILABILITY[key] || [];
      const isToday = key === localDateKey(getDateBounds().today);
      let availableCount = 0;

      for (let hour = VISIT_START_HOUR; hour < VISIT_END_HOUR; hour += 1) {
        const value = `${String(hour).padStart(2, "0")}:00`;
        const end = `${String(hour + 1).padStart(2, "0")}:00`;
        const pastToday = isToday && hour <= new Date().getHours();
        const isBooked = bookedSlots.includes(value);
        const button = document.createElement("button");
        button.className = "slot-button";
        button.type = "button";
        button.textContent = `${value}–${end}`;
        button.disabled = isBooked || pastToday;
        button.setAttribute("aria-pressed", String(state.time === value));
        if (!button.disabled) availableCount += 1;
        if (isBooked) button.setAttribute("aria-label", `${value} to ${end}, unavailable`);
        button.addEventListener("click", () => {
          state.time = value;
          clearStepError(3);
          renderTimeSlots();
          const selectedSlot = bySelector('.slot-button[aria-pressed="true"]', form);
          if (selectedSlot) selectedSlot.focus();
          updateSummary();
          persistState();
        });
        slotGrid.append(button);
      }

      if (availableCount === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "There are no times left on this day. Please choose another date.";
        slotGrid.append(empty);
      }
    }

    function syncFieldsToState() {
      state.name = cleanText(fieldMap.name.value, 100);
      state.email = cleanText(fieldMap.email.value, 254);
      state.phone = cleanText(fieldMap.phone.value, 30);
      state.guests = fieldMap.guests.value;
      state.message = cleanText(fieldMap.message.value, 500);
      state.consent = fieldMap.consent.checked;
    }

    function clearFieldErrors() {
      Object.keys(errorMap).forEach((key) => {
        errorMap[key].textContent = "";
        fieldMap[key].removeAttribute("aria-invalid");
      });
    }

    function setFieldError(key, message) {
      errorMap[key].textContent = message;
      fieldMap[key].setAttribute("aria-invalid", "true");
    }

    function validatePersonalDetails(shouldFocus) {
      syncFieldsToState();
      clearFieldErrors();
      let firstInvalidField = null;

      if (state.name.length < 2) {
        setFieldError("name", "Enter your full name.");
        firstInvalidField = firstInvalidField || fieldMap.name;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email)) {
        setFieldError("email", "Enter a valid email address.");
        firstInvalidField = firstInvalidField || fieldMap.email;
      }

      const digits = state.phone.replace(/\D/g, "");
      if (!/^\+?[\d\s().-]{7,30}$/.test(state.phone) || digits.length < 7 || digits.length > 15) {
        setFieldError("phone", "Enter a valid phone number, including country code if needed.");
        firstInvalidField = firstInvalidField || fieldMap.phone;
      }

      if (!fieldMap.consent.checked) {
        setFieldError("consent", "Please agree to be contacted about this visit request.");
        firstInvalidField = firstInvalidField || fieldMap.consent;
      }

      if (firstInvalidField) {
        if (shouldFocus !== false) firstInvalidField.focus();
        return false;
      }
      return true;
    }

    function appendReviewRow(list, label, value) {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value || "Not provided";
      list.append(term, description);
    }

    function renderReview() {
      syncFieldsToState();
      const list = bySelector("[data-review-list]", form);
      list.replaceChildren();
      appendReviewRow(list, "Visit", state.visitType);
      appendReviewRow(list, "Date", getDateLabel(state.date));
      appendReviewRow(list, "Time", getTimeLabel(state.date, state.time));
      appendReviewRow(list, "Name", state.name);
      appendReviewRow(list, "Email", state.email);
      appendReviewRow(list, "Phone", state.phone);
      appendReviewRow(list, "Guests", state.guests);
      if (state.message) appendReviewRow(list, "Note", state.message);
    }

    function validateStep(stepNumber, shouldFocus) {
      clearStepError(stepNumber);
      if (stepNumber === 1) {
        if (!state.visitType) {
          showStepError(stepNumber, "Choose a visit format to continue.");
          return false;
        }
      } else if (stepNumber === 2) {
        const date = parseDateKey(state.date);
        if (!date || !isBookableDate(date)) {
          showStepError(stepNumber, "Choose an available date in the next 60 days.");
          return false;
        }
      } else if (stepNumber === 3) {
        if (!isAvailableTime(state.date, state.time)) {
          showStepError(stepNumber, "Choose an available time slot.");
          return false;
        }
      } else if (stepNumber === 4) {
        return validatePersonalDetails(shouldFocus);
      }
      return true;
    }

    function makeReference() {
      const randomPart = Math.random().toString(36).slice(2, 8).padEnd(6, "0").toUpperCase();
      return `DEMO-${randomPart}`;
    }

    function escapeCalendarText(value) {
      return cleanText(value, 500)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
    }

    function downloadCalendar() {
      const date = parseDateKey(state.date);
      if (!date || !state.time) return;
      const [hour, minute] = state.time.split(":").map(Number);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const asLocalIcsDate = (value) => {
        const part = (number) => String(number).padStart(2, "0");
        return `${value.getFullYear()}${part(value.getMonth() + 1)}${part(value.getDate())}T${part(value.getHours())}${part(value.getMinutes())}00`;
      };
      const asUtcIcsDate = (value) => {
        const part = (number) => String(number).padStart(2, "0");
        return `${value.getUTCFullYear()}${part(value.getUTCMonth() + 1)}${part(value.getUTCDate())}T${part(value.getUTCHours())}${part(value.getUTCMinutes())}${part(value.getUTCSeconds())}Z`;
      };
      const reference = escapeCalendarText(state.reference);
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Aurelia Estates//Visit Request Demo//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${reference}@aureliaestates.example`,
        `DTSTAMP:${asUtcIcsDate(new Date())}`,
        `DTSTART:${asLocalIcsDate(start)}`,
        `DTEND:${asLocalIcsDate(end)}`,
        "SUMMARY:Casa Aurelia — visit request (demo)",
        `DESCRIPTION:${escapeCalendarText(`Simulated visit request only. Not a confirmed appointment. Reference ${state.reference}.`)}`,
        "LOCATION:Sierra Blanca, Marbella (exact address shared privately)",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n") + "\r\n";
      const status = bySelector(".booking-success__export-status", successPanel);
      if (typeof Blob !== "function" || !window.URL || typeof window.URL.createObjectURL !== "function") {
        status.textContent = "Calendar downloads are not supported in this browser.";
        return;
      }

      try {
        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "casa-aurelia-visit-request.ics";
        link.hidden = true;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        status.textContent = "A calendar file was downloaded. It records a demo request, not a confirmed appointment.";
      } catch (error) {
        status.textContent = "The calendar file could not be created in this browser.";
      }
    }

    async function confirmRequest() {
      for (let stepNumber = 1; stepNumber <= 3; stepNumber += 1) {
        if (!validateStep(stepNumber)) {
          setStep(stepNumber, true);
          validateStep(stepNumber);
          return;
        }
      }

      if (!validateStep(4)) {
        setStep(4, true);
        validateStep(4);
        return;
      }

      const honeypot = bySelector("#website", form);
      if (honeypot.value.trim()) {
        showStepError(5, "This request could not be processed. Please review the form and try again.");
        return;
      }

      nextButton.disabled = true;
      nextButton.textContent = "Preparing request…";
      clearStepError(5);

      const payload = {
        propertyReference: "AE-0426",
        visitType: state.visitType,
        date: state.date,
        time: state.time,
        name: state.name,
        email: state.email,
        phone: state.phone,
        guests: Number(state.guests),
        message: state.message,
        consent: state.consent
      };

      try {
        await submitBooking(payload);
        state.reference = makeReference();
        clearDraft();
        controls.hidden = true;
        steps.forEach((step) => { step.hidden = true; });
        successPanel.hidden = false;
        bySelector("[data-booking-reference]", successPanel).textContent = state.reference;
        allBySelector("[data-progress-step]").forEach((item) => {
          item.classList.toggle("is-complete", Number(item.dataset.progressStep) <= 5);
          item.classList.remove("is-current");
          item.removeAttribute("aria-current");
        });
        const heading = bySelector(".booking-step__title", successPanel);
        if (heading) heading.focus();
      } catch (error) {
        nextButton.disabled = false;
        nextButton.textContent = "Send visit request";
        showStepError(5, "The demonstration could not continue. Please try again.");
      }
    }

    allBySelector("[data-visit-type]", form).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.visitType === state.visitType));
      button.addEventListener("click", () => {
        state.visitType = button.dataset.visitType;
        allBySelector("[data-visit-type]", form).forEach((choice) => {
          choice.setAttribute("aria-pressed", String(choice === button));
        });
        clearStepError(1);
        updateSummary();
        persistState();
      });
    });

    previousMonthButton.addEventListener("click", () => {
      calendarMonth.setMonth(calendarMonth.getMonth() - 1);
      renderCalendar();
    });
    nextMonthButton.addEventListener("click", () => {
      calendarMonth.setMonth(calendarMonth.getMonth() + 1);
      renderCalendar();
    });

    [fieldMap.name, fieldMap.email, fieldMap.phone, fieldMap.guests, fieldMap.message, fieldMap.consent].forEach((field) => {
      field.addEventListener("input", () => {
        syncFieldsToState();
        if (errorMap[field.name]) {
          errorMap[field.name].textContent = "";
          field.removeAttribute("aria-invalid");
        }
        persistState();
      });
      field.addEventListener("change", () => {
        syncFieldsToState();
        if (errorMap[field.name]) {
          errorMap[field.name].textContent = "";
          field.removeAttribute("aria-invalid");
        }
        persistState();
      });
    });

    backButton.addEventListener("click", () => {
      if (state.step > 1) setStep(state.step - 1, true);
    });

    nextButton.addEventListener("click", async () => {
      if (state.step === 5) {
        await confirmRequest();
        return;
      }
      if (!validateStep(state.step)) return;
      setStep(state.step + 1, true);
    });

    bySelector("[data-calendar-download]", form).addEventListener("click", downloadCalendar);
    bySelector("[data-booking-restart]", form).addEventListener("click", () => {
      clearDraft();
      state.step = 1;
      state.visitType = "";
      state.date = "";
      state.time = "";
      state.name = "";
      state.email = "";
      state.phone = "";
      state.guests = "1";
      state.message = "";
      state.consent = false;
      state.reference = "";
      fieldMap.name.value = "";
      fieldMap.email.value = "";
      fieldMap.phone.value = "";
      fieldMap.guests.value = "1";
      fieldMap.message.value = "";
      fieldMap.consent.checked = false;
      allBySelector("[data-visit-type]", form).forEach((button) => button.setAttribute("aria-pressed", "false"));
      setStep(1, true);
    });

    const initialDate = parseDateKey(state.date);
    if (initialDate) {
      calendarMonth.setFullYear(initialDate.getFullYear(), initialDate.getMonth(), 1);
      calendarMonth.setDate(1);
    }
    for (let previousStep = 1; previousStep < state.step; previousStep += 1) {
      if (!validateStep(previousStep, false)) {
        state.step = previousStep;
        break;
      }
    }
    updateSummary();
    setStep(state.step, false);
  }

  function initImageFallbacks() {
    allBySelector(".image-frame img").forEach((image) => {
      const picture = image.closest(".image-frame");
      const markMissing = () => picture.classList.add("is-missing");
      image.addEventListener("error", () => {
        if (image.dataset.jpegFallbackAttempted !== "true") {
          image.dataset.jpegFallbackAttempted = "true";
          picture.querySelectorAll("source").forEach((source) => source.remove());
          image.removeAttribute("srcset");
          image.src = image.getAttribute("src");
          return;
        }
        markMissing();
      });
      if (image.complete && image.naturalWidth === 0) {
        image.dispatchEvent(new Event("error"));
      }
    });
  }

  function initRevealMotion() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-motion");
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    allBySelector(".reveal").forEach((element) => observer.observe(element));
  }

  function init() {
    const year = bySelector("[data-current-year]");
    if (year) year.textContent = String(new Date().getFullYear());
    initMobileNavigation();
    initTabs();
    initAccordion();
    initGallery();
    initBooking();
    initImageFallbacks();
    initRevealMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
