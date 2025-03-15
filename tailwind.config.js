module.exports = {
  important: true,  // Force higher specificity
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      spacing: {
        128: '32rem',
        64: '16rem',
      },
      boxShadow: {
        'lg-chrome': '0 0 15px 0 rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],  // Remove the line-clamp plugin as it's now included in core
}