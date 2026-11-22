import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Questions from "./pages/Questions.jsx";
import Results from "./pages/Results.jsx";
import Admin from "./pages/Admin.jsx";
import { t, getStoredLang, setStoredLang } from "./i18n.js";

const ANSWERS_KEY = "rh.answers";

function loadAnswers() {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export default function App() {
  const [page, setPage] = useState("home");
  const [lang, setLangState] = useState(getStoredLang);
  const [answers, setAnswers] = useState(loadAnswers);

  useEffect(() => {
    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    } catch {
      // storage unavailable; answers still live in memory
    }
  }, [answers]);

  const setLang = (l) => {
    setStoredLang(l);
    setLangState(l);
  };

  const go = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const startQuestions = () => {
    setAnswers({});
    go("questions");
  };

  const pickPersona = (personaAnswers) => {
    setAnswers(personaAnswers);
    go("questions");
  };

  let body;
  if (page === "questions") {
    body = (
      <Questions
        lang={lang}
        answers={answers}
        setAnswers={setAnswers}
        onBack={() => go("home")}
        onDone={() => go("results")}
      />
    );
  } else if (page === "results") {
    body = <Results lang={lang} answers={answers} onNavigate={go} />;
  } else if (page === "admin") {
    body = <Admin lang={lang} />;
  } else {
    body = (
      <Home
        lang={lang}
        setLang={setLang}
        onStart={startQuestions}
        onPersona={pickPersona}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b border-outline bg-surface">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => go("home")}
            className="text-[18px] font-bold text-ink min-h-[48px]"
          >
            {t("app_name", lang)}
          </button>
          <div role="group" aria-label="Language" className="flex rounded-full border border-outline overflow-hidden">
            {["te", "en"].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`px-3 h-10 text-sm font-semibold ${
                  lang === l ? "bg-primary-container text-primary" : "bg-surface text-muted"
                }`}
              >
                {l === "te" ? "తె" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">{body}</main>

      <footer className="border-t border-outline bg-surface">
        <div className="max-w-[390px] mx-auto px-4 py-4 space-y-2 text-sm text-muted">
          <p>{t("footer_free", lang)}</p>
          <p>{t("footer_forever", lang)}</p>
          <button
            type="button"
            onClick={() => go("admin")}
            className="underline min-h-[48px] text-muted"
          >
            {t("admin", lang)}
          </button>
        </div>
      </footer>
    </div>
  );
}
