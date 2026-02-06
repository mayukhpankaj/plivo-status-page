export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        operational: '#10b981',
        degraded: '#f59e0b',
        partial: '#f97316',
        outage: '#ef4444',
      }
    },
  },
  plugins: [],
}
