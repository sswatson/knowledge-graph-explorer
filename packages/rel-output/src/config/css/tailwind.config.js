module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'red-orange': {
          50: '#FFF8F6',
          100: '#FFF1EE',
          200: '#FCE6E1',
          300: '#F9CCC1',
          500: '#F6B2A3',
          700: '#F39984',
          900: '#F07F65',
        },
        'dark-blue': {
          100: '#CDCFDB',
          300: '#9C9FB8',
          500: '#6A6F94',
          700: '#393F71',
          900: '#070F4D',
        },
        'light-blue': {
          100: '#F6F9FA',
          300: '#EDF3F5',
          500: '#E3ECF0',
          700: '#DAE6EB',
          900: '#D1E0E6',
        },
        'neutral': {
          100: '#F5F5F5',
          200: '#F6F6F6',
          300: '#bfbfbf',
          500: '#7d7d7d',
          700: '#424444',
        },
        'sprite-blue': {
          100: '#DEE4F4',
          300: '#BECDF2',
          500: '#9EB5EB',
          700: '#88A4E5',
          900: '#5C83DF',
        },
        'sprite-green': {
          50:  '#EBF5F4',
          100: '#D8EBEA',
          300: '#A7D2CF',
          500: '#73C7C2',
          700: '#65BEB7',
          900: '#3BACA3',
        },
        'sprite-purple': {
          50:  '#F3ECF9',
          100: '#EBE0F5',
          300: '#D2BCE9',
          500: '#C59FEB',
          700: '#BC8EEA',
          900: '#B27DE7',
        },
        'sprite-yellow-orange': {
          50:  '#FCF3E3',
          100: '#FDF3E2',
          300: '#F9E5C1',
          500: '#F6D9A6',
          700: '#EFBE67',
          900: '#EDB551',
        },
        'sprite-neutral': {
          100: '#F0F1F2',
          300: '#DCDEE0',
          500: '#B5BCC3',
          700: '#A8ACB0',
          900: '#92979C',
        },
      },
      screens: {
        print: { raw: 'print' },
        // => @media print { ... }
      },
      fontSize: {
        xxs: ['.625em', '1em'],
      },
      animation: {
        'reverse-spin': 'reverse-spin 1s linear infinite'
      },
      keyframes: {
        'reverse-spin': {
          from: {
            transform: 'rotate(360deg)'
          },
        }
      }
    },
    fontFamily: {
      sans: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Consolas',
        '"Liberation Mono"',
        'Menlo',
        'monospace',
      ],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
