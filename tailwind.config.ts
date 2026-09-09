import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        acro: {
          blue: {
            DEFAULT: '#1B54D6',
            dark: '#0E2E70',
            light: '#2E6FEF',
          },
          silver: {
            DEFAULT: '#D8DADD',
            light: '#F2F2F2',
            dark: '#B8BCC2',
          },
          dark: '#0A0A0A',
          glass: 'rgba(255, 255, 255, 0.03)',
          glassBorder: 'rgba(255, 255, 255, 0.08)',
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
