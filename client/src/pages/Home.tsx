/* تصميم بسيط ومباشر لمنصة الأستاذ حمادي الزيتوني؛ المحتوى الأصلي محفوظ والمستويات أربعة فقط. */
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ChevronDown,
  FlaskConical,
  Film,
  GraduationCap,
  Mail,
  Menu,
  Phone,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ThemeSwitch from "../components/ThemeSwitch";
import { fetchManifest, type Manifest } from "../lib/adminApi";
import { BRANCHES, DEFAULT_LOGO, type LevelId } from "../lib/levelsMeta";

const personalLogoUrl = DEFAULT_LOGO;

type Level = {
  id: string;
  number: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  branches: string[];
  action: string;
};

type Feature = {
  icon: ReactNode;
  title: string;
  description: string;
};

type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };
type Quiz = { levelId: string; title: string; questions: QuizQuestion[] };

const quizBank: Quiz[] = [
  { levelId: "first", title: "Notions fondamentales de physique et de chimie", questions: [
    { question: "Quelle est l’unité de la force dans le S.I. ?", options: ["Le joule", "Le newton", "Le watt", "L’ampère"], correctIndex: 1, explanation: "La force se mesure en newtons, symbole N." },
    { question: "Que peut-on dire de l’intensité dans un circuit en série ?", options: ["Elle est la même dans tous les dipôles", "Elle s’annule après le premier dipôle", "Elle double dans chaque lampe", "Elle devient une tension"], correctIndex: 0, explanation: "Dans un circuit en série, l’intensité est la même en tout point." },
  ] },
  { levelId: "second", title: "Mouvement et circuits électriques", questions: [
    { question: "Quelle relation permet de calculer la vitesse ?", options: ["vitesse = distance × durée", "vitesse = distance ÷ durée", "vitesse = durée ÷ distance", "vitesse = masse ÷ volume"], correctIndex: 1, explanation: "La vitesse est égale à la distance parcourue divisée par la durée." },
    { question: "Quel est le rôle d’une résistance dans un circuit ?", options: ["Stocker uniquement la charge", "Produire toujours de la lumière", "Limiter l’intensité du courant", "Mesurer le temps"], correctIndex: 2, explanation: "La résistance limite l’intensité et transforme une partie de l’énergie en chaleur." },
  ] },
  { levelId: "third", title: "Lois du mouvement et de l’électricité", questions: [
    { question: "D’après la loi d’Ohm, comment calcule-t-on la tension ?", options: ["U = R × I", "U = R ÷ I", "U = I ÷ R", "U = m × g"], correctIndex: 0, explanation: "La loi d’Ohm s’écrit U = R × I, avec U la tension, R la résistance et I l’intensité." },
    { question: "Quand un mouvement est-il accéléré ?", options: ["Lorsque la vitesse reste constante", "Lorsque la vitesse varie avec le temps", "Lorsque la durée est nulle", "Lorsque la distance est nulle"], correctIndex: 1, explanation: "Un mouvement est accéléré lorsque la valeur ou la direction de la vitesse varie avec le temps." },
  ] },
  { levelId: "bac", title: "Révision du baccalauréat", questions: [
    { question: "Quelle grandeur se mesure en watts ?", options: ["La puissance", "La charge électrique", "La résistance", "La quantité de matière"], correctIndex: 0, explanation: "Le watt est l’unité de mesure de la puissance électrique ou mécanique." },
    { question: "Dans une réaction d’oxydoréduction, que deviennent les électrons ?", options: ["Ils ne changent pas", "Ils sont transférés entre les espèces chimiques", "Ils deviennent des neutrons", "Ils disparaissent définitivement"], correctIndex: 1, explanation: "Une réaction d’oxydoréduction implique un transfert d’électrons entre espèces chimiques." },
  ] },
];

const levels: Level[] = [
  {
    id: "first",
    number: "01",
    icon: <span aria-hidden="true">🌱</span>,
    title: "1ère année secondaire",
    subtitle: "Physique – Chimie",
    branches: ["Section Physique", "Section Chimie"],
    action: "Choisir la section",
  },
  {
    id: "second",
    number: "02",
    icon: <Atom size={28} strokeWidth={1.7} />,
    title: "2ème année secondaire",
    subtitle: "Sciences / Informatique",
    branches: ["Section Sciences", "Section Informatique", "Ressources adaptées à chaque filière"],
    action: "Choisir la filière",
  },
  {
    id: "third",
    number: "03",
    icon: <span aria-hidden="true">⚛️</span>,
    title: "3ème année secondaire",
    subtitle: "Sciences expérimentales / Mathématiques / Informatique",
    branches: ["Sciences expérimentales", "Mathématiques", "Informatique"],
    action: "Choisir la section",
  },
  {
    id: "bac",
    number: "04",
    icon: <Trophy size={28} strokeWidth={1.7} />,
    title: "Baccalauréat",
    subtitle: "Session 2027",
    branches: ["Sciences expérimentales", "Sciences techniques", "Mathématiques et Informatique"],
    action: "Accéder à l’espace Bac",
  },
];

const features: Feature[] = [
  { icon: <BookOpen size={24} />, title: "Cours", description: "Cours de physique et de chimie par niveau et par section" },
  { icon: <Sparkles size={24} />, title: "Devoirs & Séries", description: "Devoirs, séries et exercices progressifs corrigés" },
  { icon: <FlaskConical size={24} />, title: "TP", description: "Travaux pratiques et simulations interactives" },
  { icon: <Film size={24} />, title: "Animations", description: "Représentations visuelles des phénomènes scientifiques" },
  { icon: <Video size={24} />, title: "Vidéos", description: "Vidéos pédagogiques courtes et ciblées" },
  { icon: <Trophy size={24} />, title: "Sujets de Bac", description: "Sujets du baccalauréat et corrigés" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestReady, setManifestReady] = useState(false);

  useEffect(() => {
    fetchManifest()
      .then(setManifest)
      .catch(() => setManifest(null))
      .finally(() => setManifestReady(true));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setQuizOpen(false);
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  }, [selectedLevel?.id]);

  useEffect(() => {
    if (!selectedLevel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedLevel(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedLevel]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const openLevel = (level: Level) => {
    setSelectedLevel(level);
  };

  const openFeature = (feature: Feature) => {
    toast(feature.title, { description: "Cette rubrique sera bientôt disponible." });
  };


  const currentQuiz = selectedLevel ? quizBank.find((quiz) => quiz.levelId === selectedLevel.id) ?? quizBank[0] : null;
  const currentQuestion = currentQuiz?.questions[quizIndex];
  // Image du site : celle choisie par le propriétaire, sinon l’image d’origine.
  const logoSrc = manifest?.settings?.heroImage || personalLogoUrl;
  const logoStyle = { opacity: manifestReady ? 1 : 0, transition: "opacity .3s" };

  return (
    <div className="site" dir="rtl">
      <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <button className="nav-brand" onClick={() => scrollTo("home")} aria-label="Retour à l’accueil">
            <span className="nav-logo-shell"><img src={logoSrc} style={logoStyle} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="logo-fallback">ز</span></span>
            <span className="nav-title"><strong>منصة الزيتونة</strong><small>للعلوم الفيزيائية</small></span>
          </button>

          <nav className={`nav-menu ${menuOpen ? "active" : ""}`} aria-label="Navigation principale">
            <button className="nav-link active" onClick={() => scrollTo("home")}>Accueil</button>
            <button className="nav-link" onClick={() => scrollTo("levels")}>Niveaux scolaires</button>
            <button className="nav-link" onClick={() => scrollTo("features")}>Ressources</button>
            <button className="nav-link" onClick={() => scrollTo("contact")}>اتصل بنا</button>
            <button className="nav-link" onClick={() => scrollTo("about")}>À propos</button>
            <button className="nav-mobile-cta" onClick={() => scrollTo("levels")}>Commencer <ArrowLeft size={15} /></button>
          </nav>

          <div className="nav-actions">
            <ThemeSwitch />
            <span className="new-note"><i /> Nouvelles ressources chaque semaine</span>
            <button className="nav-cta" onClick={() => scrollTo("levels")}>Commencer <ArrowLeft size={16} /></button>
            <button className="nav-toggle" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-pattern" aria-hidden="true" />
          <div className="hero-line hero-line-one" aria-hidden="true" />
          <div className="hero-line hero-line-two" aria-hidden="true" />
          <div className="hero-inner page-width">
            <div className="hero-content">
              <div className="teacher-badge"><span className="badge-dot" /> الأستاذ حمادي الزيتوني <b>•</b> Professeur de physique et de chimie</div>
              <h1>منصة الزيتونة<br /><span>للعلوم الفيزيائية</span></h1>
              <p className="hero-subtitle">La physique et la chimie à votre portée</p>
              <p className="hero-description">Des cours clairs, des exercices progressifs et des ressources choisies pour progresser avec confiance.</p>
              <div className="hero-motto"><span>Découvrez</span><i>•</i><span>Comprenez</span><i>•</i><span>Expérimentez</span><i>•</i><span>Maîtrisez</span></div>
              <div className="hero-actions"><button className="btn-primary" onClick={() => scrollTo("levels")}>Choisir son niveau <ArrowLeft size={17} /></button><button className="btn-secondary" onClick={() => scrollTo("features")}><span className="play-circle"><Play size={12} fill="currentColor" /></span> Découvrir les ressources</button></div>
            </div>

            <div className="hero-logo-area">
              <div className="logo-ring ring-one" aria-hidden="true" /><div className="logo-ring ring-two" aria-hidden="true" />
              <div className="personal-logo-frame"><img src={logoSrc} style={logoStyle} alt="الأستاذ حمادي الزيتوني - منصة الزيتونة" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="hero-logo-fallback">ز</span></div>
              <div className="logo-caption"><span>✦</span><strong>Espace Baccalauréat</strong><small>2027</small></div>
              <div className="orbit-label orbit-label-top">F = m × a</div><div className="orbit-label orbit-label-bottom">Physique • Chimie</div>
            </div>
          </div>
          <button className="hero-scroll" onClick={() => scrollTo("levels")}><span>Choisir votre niveau</span><ChevronDown size={16} /></button>
        </section>

        <section className="levels-section" id="levels">
          <div className="section-heading page-width"><div><span className="section-label">Choisissez votre parcours ✦</span><h2>Niveaux scolaires</h2></div><p>Quatre parcours pour organiser votre progression en physique et en chimie.</p></div>
          <div className="levels-grid page-width">
            {levels.filter((level) => !manifest?.levels[level.id]?.hidden).map((level) => <article className={`level-card ${level.id === "bac" ? "bac" : ""}`} key={level.id} role="button" tabIndex={0} aria-label={`${level.title} — ${level.action}`} onClick={() => openLevel(level)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLevel(level); } }}>
              <span className="level-number">{level.number}</span><span className="level-icon">{level.icon}</span><h3>{level.title}</h3><p className="level-subtitle">{level.subtitle}</p><ul>{level.branches.map((branch) => <li key={branch}>{branch}</li>)}</ul><button className="level-btn" onClick={(event) => { event.stopPropagation(); openLevel(level); }}>{level.action} <ArrowLeft size={15} /></button>
            </article>)}
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading centered page-width"><span className="section-label">✦ Ressources pédagogiques ✦</span><h2>Un monde de ressources</h2><p>Accédez rapidement aux supports dont vous avez besoin.</p></div>
          <div className="features-grid page-width">{features.map((feature) => <button className="feature-card" key={feature.title} onClick={() => openFeature(feature)}><span className="feature-icon">{feature.icon}</span><span className="feature-title">{feature.title}</span><span className="feature-description">{feature.description}</span><span className="feature-arrow"><ArrowLeft size={15} /></span></button>)}</div>
        </section>

        <section className="contact-section" id="contact">
          <div className="section-heading centered page-width"><span className="section-label">✦ اتصل بنا ✦</span><h2>اتصل بنا</h2><p>نحن هنا لمساعدتك. راسلنا أو اتصل بنا في أي وقت.</p></div>
          <div className="contact-grid page-width">
            <a className="contact-card" href="tel:+21623874955"><span className="contact-icon"><Phone size={22} /></span><span><small>الهاتف</small><strong dir="ltr">+216 23 874 955</strong></span></a>
            <a className="contact-card" href="mailto:zitounihamadi162@gmail.com"><span className="contact-icon mail"><Mail size={22} /></span><span><small>البريد الإلكتروني</small><strong dir="ltr">zitounihamadi162@gmail.com</strong></span></a>
          </div>
          <div className="contact-contrib page-width">
            <h3>مساهمات الأساتذة لإثراء الموقع</h3>
            <p>بفروض أو دروس أو محاكاة — عبر هذا البريد الإلكتروني:</p>
            <a className="contact-contrib-mail" href={`mailto:zitounihamadi162@gmail.com?subject=${encodeURIComponent("مساهمة في إثراء الموقع")}`}><Mail size={17} /><span dir="ltr">zitounihamadi162@gmail.com</span></a>
          </div>
        </section>

        {selectedLevel && <div className="level-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedLevel(null); }}>
          <section className="level-dialog" role="dialog" aria-modal="true" aria-labelledby={`level-dialog-title-${selectedLevel.id}`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="dialog-close" onClick={() => setSelectedLevel(null)} aria-label="Fermer la fenêtre du niveau"><X size={20} /></button>
            <span className="dialog-kicker">Espace niveau {selectedLevel.number}</span>
            <div className="dialog-heading"><span className="dialog-icon">{selectedLevel.icon}</span><div><h2 id={`level-dialog-title-${selectedLevel.id}`}>{selectedLevel.title}</h2><p>{selectedLevel.subtitle}</p></div></div>
            <div className="dialog-rule" />
              <p className="dialog-intro">{selectedLevel.id === "first" ? "Choisissez la section : Physique ou Chimie." : "Choisissez votre filière pour accéder aux cours, exercices, vidéos et TP."}</p>
              <button className="quiz-launch" onClick={() => { setQuizOpen(true); setQuizIndex(0); setQuizAnswer(null); setQuizScore(0); setQuizFinished(false); }}><span className="quiz-launch-icon"><ClipboardCheck size={17} /></span><span><strong>Tester ses connaissances</strong><small>Questions courtes avec correction immédiate</small></span><ArrowLeft size={16} /></button>
            {quizOpen && currentQuiz && <div className="quiz-panel">
              {!quizFinished && currentQuestion ? <>
                <div className="quiz-panel-top"><span>Question {quizIndex + 1} / {currentQuiz.questions.length}</span><span>{quizScore} bonne(s) réponse(s)</span></div>
                <div className="quiz-progress"><span style={{ width: `${((quizIndex + 1) / currentQuiz.questions.length) * 100}%` }} /></div>
                <h3>{currentQuestion.question}</h3>
                <div className="quiz-options">{currentQuestion.options.map((option, index) => <button key={option} className={quizAnswer === index ? (index === currentQuestion.correctIndex ? "correct" : "wrong") : ""} onClick={() => { if (quizAnswer !== null) return; setQuizAnswer(index); if (index === currentQuestion.correctIndex) setQuizScore((score) => score + 1); }}><span>{String.fromCharCode(65 + index)}</span>{option}{quizAnswer === index && (index === currentQuestion.correctIndex ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />)}</button>)}</div>
                {quizAnswer !== null && <div className={`quiz-feedback ${quizAnswer === currentQuestion.correctIndex ? "is-correct" : "is-wrong"}`}><strong>{quizAnswer === currentQuestion.correctIndex ? "Bonne réponse !" : "Réponse incorrecte"}</strong><span>{currentQuestion.explanation}</span></div>}
                {quizAnswer !== null && <button className="quiz-next" onClick={() => { if (quizIndex === currentQuiz.questions.length - 1) setQuizFinished(true); else { setQuizIndex((index) => index + 1); setQuizAnswer(null); } }}>{quizIndex === currentQuiz.questions.length - 1 ? "Voir le résultat" : "Question suivante"} <ArrowLeft size={15} /></button>}
              </> : <div className="quiz-result"><span className="quiz-result-icon"><Trophy size={25} /></span><span className="dialog-kicker">Quiz terminé</span><h3>Bravo, continuez vos efforts !</h3><p>Votre score : <strong>{quizScore} / {currentQuiz.questions.length}</strong></p><div className="quiz-score-bar"><span style={{ width: `${(quizScore / currentQuiz.questions.length) * 100}%` }} /></div><button className="quiz-next" onClick={() => { setQuizIndex(0); setQuizAnswer(null); setQuizScore(0); setQuizFinished(false); }}><RotateCcw size={15} /> Recommencer</button></div>}
            </div>}
            {!quizOpen && <ul className="dialog-list">{BRANCHES[selectedLevel.id as LevelId].map((branch, index) => <li key={branch.id}><a href={`#/niveau/${selectedLevel.id}/${branch.id}`} className="dialog-list-link"><span>{String(index + 1).padStart(2, "0")}</span><strong>{branch.label}</strong><ArrowLeft size={15} /></a></li>)}</ul>}
            <button className="dialog-action" onClick={() => setSelectedLevel(null)}>Retour aux niveaux <ArrowLeft size={16} /></button>
          </section>
        </div>}
      </main>

      <button className="contact-fab" onClick={() => scrollTo("contact")} aria-label="اتصل بنا"><Phone size={20} /><span>اتصل بنا</span></button>

      <footer className="footer" id="about"><div className="footer-inner page-width"><div className="footer-brand"><span className="nav-logo-shell"><img src={logoSrc} style={logoStyle} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="logo-fallback">ز</span></span><div><strong>منصة الزيتونة للعلوم الفيزيائية</strong><span>الأستاذ حمادي الزيتوني</span></div></div><div className="footer-motto">اكتشف <i>•</i> افهم <i>•</i> جرّب <i>•</i> أتقن</div><div className="footer-copy">© 2026 الأستاذ حمادي الزيتوني — جميع الحقوق محفوظة · <a href="#/admin" className="admin-entry-link">لوحة التحكم</a></div></div></footer>
    </div>
  );
}
