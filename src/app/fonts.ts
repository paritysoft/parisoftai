import localFont from "next/font/local";

// Self-hosted variable fonts (Latin subset, OFL-licensed, sourced from Fontsource).
// next/font preloads them and generates metric-matched fallbacks to avoid layout shift.
export const inter = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
export const manrope = localFont({ src: "./fonts/manrope-latin-wght-normal.woff2", variable: "--font-manrope", weight: "200 800", display: "swap" });
export const jetbrainsMono = localFont({ src: "./fonts/jetbrains-mono-latin-wght-normal.woff2", variable: "--font-jetbrains", weight: "100 800", display: "swap", preload: false });
