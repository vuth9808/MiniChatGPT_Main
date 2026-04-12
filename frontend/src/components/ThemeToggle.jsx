import React from "react";
import { useTheme } from "../state/theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className="btn btnGhost" onClick={toggleTheme} title="Toggle theme">
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

