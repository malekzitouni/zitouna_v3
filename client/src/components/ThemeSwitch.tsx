import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/** Option de luminosité : فاتح (clair) / داكن (sombre). */
export default function ThemeSwitch({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const choose = (next: "light" | "dark") => {
    if (next !== theme) toggleTheme?.();
  };
  return (
    <div className={`theme-switch ${className}`} role="group" aria-label="Luminosité">
      <button type="button" className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => choose("light")}>
        <Sun size={14} />
        <span>فاتح</span>
      </button>
      <button type="button" className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
        <Moon size={14} />
        <span>داكن</span>
      </button>
    </div>
  );
}
