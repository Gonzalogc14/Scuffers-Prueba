import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { accent: '#E8532F' },
    },
  },
  plugins: [],
};
export default config;
