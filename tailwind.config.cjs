/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Brand colors from site config
        brand: {
          primary: '#F5F1E8',    // Light beige
          secondary: '#523E26',  // Dark brown
          accent: '#F39C12',     // Warm orange
          background: '#F5F1E8', // Light beige
          text: '#121212',       // Almost black
        },
      },
      fontFamily: {
        // Brand fonts will be configured from site config
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
