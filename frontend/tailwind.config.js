module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heliaCoreBook: ['HeliaCoreBook', 'sans-serif'],
        heliaCoreBold: ['HeliaCoreBold', 'sans-serif'],
        heliaCoreMedium: ['HeliaCoreMedium', 'sans-serif'],
        heliaCoreBlack: ['HeliaCoreBlack', 'sans-serif'],
      },
      fontWeight: {
        medium: 500,
        bold: 700,
        black: 900,
      },
      fontSize: {
        base: '16px',
        large: '36px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

