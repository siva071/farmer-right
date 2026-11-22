// Scrolling helpers that work both inside the desktop phone frame (.phone-screen)
// and on mobile, where the window itself scrolls.

function phoneScreen() {
  return typeof document !== "undefined" ? document.querySelector(".phone-screen") : null;
}

function isScrollContainer(el) {
  if (!el || typeof getComputedStyle !== "function") return false;
  const overflowY = getComputedStyle(el).overflowY;
  return overflowY === "auto" || overflowY === "scroll";
}

export function scrollScreenToTop() {
  const s = phoneScreen();
  if (isScrollContainer(s)) s.scrollTo({ top: 0, behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollScreenToElement(el, block = "start") {
  if (!el) return;
  const s = el.closest ? el.closest(".phone-screen") : null;
  if (!isScrollContainer(s)) {
    el.scrollIntoView({ behavior: "smooth", block });
    return;
  }
  const top = el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop;
  s.scrollTo({ top, behavior: "smooth" });
}
