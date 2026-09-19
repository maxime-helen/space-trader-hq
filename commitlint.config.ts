// commitlint.config.ts
import type { UserConfig } from '@commitlint/types';

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'api',
        'ui',
        'shared',
        'auth',
        'agent',
        'fleet',
        'systems',
        'markets',
        'notifications',
        'deps',
        'tooling',
      ],
    ],
  },
} satisfies UserConfig;
