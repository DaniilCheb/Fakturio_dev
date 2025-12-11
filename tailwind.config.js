/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Design System Variables
        design: {
          background: "hsl(var(--design-background))",
          'content-default': "hsl(var(--design-content-default))",
          'content-weak': "hsl(var(--design-content-weak))",
          'content-weakest': "hsl(var(--design-content-weakest))",
          'border-default': "hsl(var(--design-border-default))",
          'surface-field': "hsl(var(--design-surface-field))",
          'button-primary': "hsl(var(--design-button-primary))",
          'surface-inverted': "hsl(var(--design-surface-inverted))",
          'surface-default': "hsl(var(--design-surface-default))",
          'on-button-content': "hsl(var(--design-on-button-content))",
          'on-button-content-inverted': "hsl(var(--design-on-button-content-inverted))",
        },
        // Preserve existing custom colors (now using design variables)
        'surface/inverted': "hsl(var(--design-surface-inverted))",
        'content/default': "hsl(var(--design-content-default))",
        'content/weak': "hsl(var(--design-content-weakest))",
        'surface/gray': "hsl(var(--design-surface-field))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'sans': ['var(--font-radio-canada-big)', 'Radio Canada Big', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
