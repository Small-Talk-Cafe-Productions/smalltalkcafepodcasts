/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './src/components/**/*.{astro,html,js,jsx,ts,tsx}',
    './src/layouts/**/*.{astro,html,js,jsx,ts,tsx}',
    './src/styles/**/*.css',
    './src/utils/**/*.{js,ts}',
    // Fallback: any other Astro/HTML files under src
    './src/**/*.{astro,html}'
  ],
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
