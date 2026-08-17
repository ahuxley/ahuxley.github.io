function initIntroPreloader() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadyPlayed = false;
    try {
        alreadyPlayed = sessionStorage.getItem("introPlayed") === "1";
    } catch {
        alreadyPlayed = false;
    }

    if (reduceMotion || alreadyPlayed) {
        try {
            sessionStorage.setItem("introPlayed", "1");
        } catch {
            // Ignore storage failures (e.g. private browsing); the intro simply won't persist.
        }
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "intro-preloader";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <p class="intro-kicker" data-intro-kicker><span data-intro-kicker-text>Parsing raw data</span></p>
        <div class="intro-transform">
            <pre class="intro-json" data-intro-json>{
  <span class="intro-json-line intro-json-line--1"><span class="intro-json-key">"first_name"</span>: <span class="intro-json-string">"andrew"</span>,</span>
  <span class="intro-json-line intro-json-line--2"><span class="intro-json-key">"last_name"</span>: <span class="intro-json-string">"huxley"</span>,</span>
  <span class="intro-json-line intro-json-line--3"><span class="intro-json-key">"role"</span>: <span class="intro-json-string">"data_analyst"</span>,</span>
  <span class="intro-json-line intro-json-line--4"><span class="intro-json-key">"status"</span>: <span class="intro-json-string">"<span data-intro-status>raw</span>"</span></span>
}</pre>
            <div class="intro-clean" data-intro-clean>
                <p class="intro-clean-name">Andrew Huxley</p>
                <p class="intro-clean-role">Data Analyst</p>
                <span class="intro-underline"></span>
            </div>
        </div>
        <p class="intro-skip-hint" data-intro-skip-hint>Click anywhere to skip</p>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const statusEl = overlay.querySelector("[data-intro-status]");
    const statusStates = ["raw", "unvalidated", "buffering"];
    let statusIndex = 0;
    let statusInterval = null;

    const timers = [];
    let finished = false;

    const finish = () => {
        if (finished) {
            return;
        }

        finished = true;
        if (statusInterval) {
            window.clearInterval(statusInterval);
        }
        timers.forEach((timer) => window.clearTimeout(timer));
        overlay.classList.add("is-hiding");
        document.body.style.overflow = "";

        try {
            sessionStorage.setItem("introPlayed", "1");
        } catch {
            // Ignore storage failures; the intro just replays next load.
        }

        window.setTimeout(() => {
            overlay.remove();
        }, 550);
    };

    overlay.addEventListener("click", finish);
    window.addEventListener("keydown", finish, { once: true });
    window.addEventListener("wheel", finish, { once: true, passive: true });

    const jsonEl = overlay.querySelector("[data-intro-json]");
    const kickerTextEl = overlay.querySelector("[data-intro-kicker-text]");

    const swapKickerText = (text) => {
        if (!kickerTextEl) {
            return;
        }
        kickerTextEl.style.opacity = "0";
        window.setTimeout(() => {
            kickerTextEl.textContent = text;
            kickerTextEl.style.opacity = "1";
        }, 200);
    };

    // "raw" is left static (readable) until the status line has fully faded in
    // (line 4 finishes revealing at ~0.85s) before cycling starts.
    timers.push(window.setTimeout(() => {
        statusInterval = window.setInterval(() => {
            statusIndex = (statusIndex + 1) % statusStates.length;
            if (statusEl) {
                statusEl.textContent = statusStates[statusIndex];
            }
        }, 400);
    }, 900));

    timers.push(window.setTimeout(() => {
        if (jsonEl) {
            jsonEl.classList.add("is-pulsing");
        }
    }, 1100));

    timers.push(window.setTimeout(() => {
        if (jsonEl) {
            jsonEl.classList.remove("is-pulsing");
        }
    }, 1300));

    timers.push(window.setTimeout(() => {
        if (statusInterval) {
            window.clearInterval(statusInterval);
        }
        if (statusEl) {
            statusEl.textContent = "resolved";
        }
        swapKickerText("Formatting for humans");
        overlay.classList.add("is-transforming");
    }, 1350));

    // Leaves ~250ms to register the resolved name once its reveal completes (~1.95s).
    timers.push(window.setTimeout(finish, 2200));
}

initIntroPreloader();

document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("mobile-menu-btn");
    const navLinks = document.getElementById("site-menu");
    const navLinkItems = navLinks ? Array.from(navLinks.querySelectorAll("a")) : [];
    const sectionLinks = navLinkItems
        .map((link) => {
            const targetId = link.getAttribute("href");
            if (!targetId || !targetId.startsWith("#")) {
                return null;
            }

            const section = document.querySelector(targetId);
            if (!section) {
                return null;
            }

            return { link, section };
        })
        .filter(Boolean);
    let sectionOffsets = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function recalculateSectionOffsets() {
        sectionOffsets = sectionLinks.map(({ section }) => ({
            id: section.id,
            top: Math.round(section.getBoundingClientRect().top + window.scrollY)
        }));
    }

    function closeMenu() {
        if (!menuBtn || !navLinks) {
            return;
        }

        menuBtn.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("is-open");
    }

    function openMenu() {
        if (!menuBtn || !navLinks) {
            return;
        }

        menuBtn.setAttribute("aria-expanded", "true");
        navLinks.classList.add("is-open");
    }

    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", () => {
            const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        navLinkItems.forEach((link) => {
            link.addEventListener("click", () => {
                closeMenu();
            });
        });

        document.addEventListener("click", (event) => {
            if (!navLinks.classList.contains("is-open")) {
                return;
            }

            if (!navLinks.contains(event.target) && !menuBtn.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
                closeMenu();
                menuBtn.focus();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 960) {
                closeMenu();
            }
        });
    }

    if (sectionLinks.length) {
        const setActiveLink = (activeId) => {
            sectionLinks.forEach(({ link, section }) => {
                const isActive = `#${section.id}` === activeId;
                link.classList.toggle("is-active", isActive);

                if (isActive) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        };

        const syncHashActiveLink = () => {
            const hash = window.location.hash;
            const hasMatchingHashLink = sectionLinks.some(({ section }) => `#${section.id}` === hash);
            if (hasMatchingHashLink) {
                setActiveLink(hash);
            } else if (window.scrollY <= 1) {
                setActiveLink(null);
            }
        };

        const getActiveSectionFromScroll = () => {
            if (window.scrollY <= 1) {
                return null;
            }

            if (!sectionOffsets.length) {
                recalculateSectionOffsets();
            }

            const lastSectionId = sectionOffsets[sectionOffsets.length - 1].id;
            const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
            if (nearBottom) {
                return `#${lastSectionId}`;
            }

            const activationLine = window.scrollY + Math.min(window.innerHeight * 0.38, 320);
            let activeId = null;

            sectionOffsets.forEach(({ id, top }) => {
                if (top <= activationLine) {
                    activeId = `#${id}`;
                }
            });

            return activeId;
        };

        let syncFrame = null;
        const scheduleScrollSync = () => {
            if (syncFrame !== null) {
                return;
            }

            syncFrame = window.requestAnimationFrame(() => {
                syncFrame = null;
                setActiveLink(getActiveSectionFromScroll());
            });
        };

        const refreshOffsetsAndSync = () => {
            recalculateSectionOffsets();
            scheduleScrollSync();
        };

        recalculateSectionOffsets();
        syncHashActiveLink();
        scheduleScrollSync();

        window.addEventListener("scroll", scheduleScrollSync, { passive: true });
        window.addEventListener("resize", refreshOffsetsAndSync);
        window.addEventListener("load", refreshOffsetsAndSync);
        if (document.fonts?.ready) {
            document.fonts.ready.then(refreshOffsetsAndSync).catch(() => {
                // Ignore font readiness failures and continue.
            });
        }
        window.addEventListener("hashchange", () => {
            syncHashActiveLink();
            scheduleScrollSync();
        });
    }

    const reveals = document.querySelectorAll("[data-reveal]");
    if (reduceMotion) {
        reveals.forEach((element) => element.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0,
            rootMargin: "0px 0px -12% 0px"
        });

        reveals.forEach((element) => revealObserver.observe(element));
    }

    const counters = document.querySelectorAll(".metric-value[data-count]");
    const counterState = new WeakSet();

    function animateCounter(counter) {
        if (counterState.has(counter)) {
            return;
        }

        counterState.add(counter);
        const target = Number(counter.dataset.count || 0);
        const suffix = counter.dataset.suffix || "";
        const duration = 1200;
        const start = performance.now();

        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            counter.textContent = `${value}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                counter.textContent = `${target}${suffix}`;
            }
        }

        window.requestAnimationFrame(step);
    }

    if (reduceMotion) {
        counters.forEach((counter) => {
            counter.textContent = `${counter.dataset.count}${counter.dataset.suffix || ""}`;
        });
    } else if (counters.length) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                animateCounter(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.65
        });

        counters.forEach((counter) => counterObserver.observe(counter));
    }

    const currentYear = document.getElementById("current-year");
    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }

    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");
    const submitButton = document.getElementById("contact-submit-button");
    const messageField = document.getElementById("message");
    const messageCharCount = document.getElementById("message-char-count");
    const messageMaxLength = Number(messageField?.getAttribute("maxlength") || 0);
    const defaultSubmitText = submitButton?.textContent || "Send Message";
    const successSubmitText = "Message Sent";
    let isSubmitting = false;
    let submitSuccessResetTimeout = null;

    const setFormStatus = (message, state = null) => {
        if (!formStatus) {
            return;
        }

        formStatus.textContent = message;
        formStatus.classList.remove("is-success", "is-error");
        if (state) {
            formStatus.classList.add(`is-${state}`);
        }
    };

    const resetContactSubmitUi = () => {
        if (submitSuccessResetTimeout) {
            window.clearTimeout(submitSuccessResetTimeout);
            submitSuccessResetTimeout = null;
        }

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = defaultSubmitText;
            submitButton.classList.remove("is-success");
        }

        setFormStatus("");
    };

    resetContactSubmitUi();

    const updateMessageCharCount = () => {
        if (!messageField || !messageCharCount || !messageMaxLength) {
            return;
        }

        if (messageField.value.length > messageMaxLength) {
            messageField.value = messageField.value.slice(0, messageMaxLength);
        }

        const currentLength = messageField.value.length;
        messageCharCount.textContent = `${currentLength} / ${messageMaxLength} characters`;
    };

    if (messageField && messageCharCount && messageMaxLength) {
        updateMessageCharCount();
        messageField.addEventListener("input", updateMessageCharCount);
    }

    if (contactForm) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!contactForm.reportValidity()) {
                return;
            }

            if (isSubmitting) {
                return;
            }

            isSubmitting = true;
            if (submitSuccessResetTimeout) {
                window.clearTimeout(submitSuccessResetTimeout);
                submitSuccessResetTimeout = null;
            }

            if (submitButton) {
                submitButton.classList.remove("is-success");
                submitButton.disabled = true;
                submitButton.textContent = "Sending...";
            }

            setFormStatus("Sending your message...");
            let wasSuccess = false;

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: new FormData(contactForm),
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (response.ok) {
                    wasSuccess = true;
                    contactForm.reset();
                    updateMessageCharCount();
                    setFormStatus("Thanks! Your message was sent successfully.", "success");
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = successSubmitText;
                        submitButton.classList.add("is-success");
                    }

                    submitSuccessResetTimeout = window.setTimeout(() => {
                        submitSuccessResetTimeout = null;

                        if (!submitButton || isSubmitting) {
                            return;
                        }

                        submitButton.textContent = defaultSubmitText;
                        submitButton.classList.remove("is-success");
                    }, 3000);
                } else {
                    let errorMessage = "Something went wrong. Please try again or message me on LinkedIn.";

                    try {
                        const data = await response.json();
                        if (Array.isArray(data.errors) && data.errors[0]?.message) {
                            errorMessage = data.errors[0].message;
                        }
                    } catch {
                        // Keep the default fallback error message when payload is unavailable.
                    }

                    setFormStatus(errorMessage, "error");
                }
            } catch {
                setFormStatus("Network issue. Please try again in a moment.", "error");
            } finally {
                isSubmitting = false;
                if (!wasSuccess && submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = defaultSubmitText;
                    submitButton.classList.remove("is-success");
                }
            }
        });

        window.addEventListener("pageshow", (event) => {
            if (event.persisted || submitButton?.disabled) {
                resetContactSubmitUi();
            }
        });
    }

    /* Dashboard mock page switcher */
    const mockTabs = document.querySelectorAll(".dashboard-mock-tab");
    const mockPanels = document.querySelectorAll(".dashboard-panel");

    if (mockTabs.length && mockPanels.length) {
        mockTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                const target = tab.getAttribute("data-panel");

                mockTabs.forEach((t) => {
                    const isActive = t === tab;
                    t.classList.toggle("is-active", isActive);
                    t.setAttribute("aria-pressed", String(isActive));
                });

                mockPanels.forEach((panel) => {
                    const isActive = panel.getAttribute("data-panel-id") === target;
                    panel.classList.toggle("is-active", isActive);
                    panel.hidden = !isActive;
                });
            });
        });
    }

    /* Project Category Filter Tabs */
    const filterBtns = document.querySelectorAll(".project-filter-btn");
    const projectCards = document.querySelectorAll(".project-feature");

    if (filterBtns.length && projectCards.length) {
        filterBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const filter = btn.getAttribute("data-filter");

                filterBtns.forEach((b) => {
                    b.classList.remove("is-active");
                    b.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("is-active");
                btn.setAttribute("aria-pressed", "true");

                projectCards.forEach((card) => {
                    // Token match, not substring: "fullstack".includes("stack")
                    // would otherwise be a false positive.
                    const categories = (card.getAttribute("data-category") || "").split(/\s+/);
                    if (filter === "all" || categories.includes(filter)) {
                        card.style.display = "";
                        card.removeAttribute("hidden");
                    } else {
                        card.style.display = "none";
                        card.setAttribute("hidden", "true");
                    }
                });
            });
        });
    }
});

