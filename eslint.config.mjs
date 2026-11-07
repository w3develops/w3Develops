import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      // New in Next 16's React rules. Existing code breaks these in 21 files,
      // so they warn for now instead of failing lint; fix them over time.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts']),
]);
