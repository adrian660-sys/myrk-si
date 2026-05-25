/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#191410',
        sidebarHover: '#2c2118',
        sidebarActive: '#3d2e22',
        ink: '#1c1410',
        canvas: '#f7f5f1',
        card: '#ffffff',
        line: '#e5dfd6',
        muted: '#8a7d72',
        accent: '#b45309',
        accentLight: '#fef3c7',
        income: '#166534',
        expense: '#b91c1c',
        travel: '#6d28d9',
        business: '#c2410c',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
