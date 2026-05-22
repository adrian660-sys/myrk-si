/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0e1116',
        sidebarHover: '#1a1f29',
        ink: '#0e1116',
        canvas: '#f6f7f9',
        card: '#ffffff',
        line: '#e4e7ec',
        muted: '#667085',
        accent: '#2563eb',
        income: '#16a34a',
        expense: '#dc2626',
        travel: '#7c3aed',
        business: '#ea580c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
