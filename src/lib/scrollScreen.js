// Scrolling helpers that work both inside the desktop phone frame (.phone-screen)
// and on mobile, where the window itself scrolls.

export function scrollScreenToTop() {
  const s = typeof document !== "undefined" ? document.querySelector(".phone-screen") : null;
  if (s) s.scrollTo({ top: 0, behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollScreenToElement(el, block = "start") {
  if (!el) return;
  const s = el.closest ? el.closest(".phone-screen") : null;
  if (!s) {
    el.scrollIntoView({ behavior: "smooth", block });
    return;
  }
  const top = el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop;
  s.scrollTo({ top, behavior: "smooth" });
}
