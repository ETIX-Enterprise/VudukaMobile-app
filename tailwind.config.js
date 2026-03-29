/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}',
    './src/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './navigation/**/*.{js,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
        fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};