import { addDynamicIconSelectors } from '@iconify/tailwind';
export default {
  content: [
    './*.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // flowbite
    require('flowbite/plugin'),
    addDynamicIconSelectors(),
  ],
};
