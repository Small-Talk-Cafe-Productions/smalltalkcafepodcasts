function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        // Brand colors driven by CSS variables for seamless light/dark theming
        brand: {
          primary: withOpacity('--color-brand-primary-rgb'),
          secondary: withOpacity('--color-brand-secondary-rgb'),
          accent: withOpacity('--color-brand-accent-rgb'),
          background: withOpacity('--color-brand-background-rgb'),
          text: withOpacity('--color-brand-text-rgb'),
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
