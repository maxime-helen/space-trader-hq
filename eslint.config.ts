import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import type { Linter, Rule } from 'eslint';
import boundaries from 'eslint-plugin-boundaries';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import pluginVue from 'eslint-plugin-vue';

const TSCONFIG = fileURLToPath(new URL('./tsconfig.app.json', import.meta.url));

const SRC = fileURLToPath(new URL('./src', import.meta.url));

const MODULES_DIR = resolve(SRC, 'modules');
const MODULE_NAMES = existsSync(MODULES_DIR) ? readdirSync(MODULES_DIR) : [];

const NO_PARENT_IMPORTS = { group: ['../*', '..'], message: 'Import from another folder with the @/ alias.' };

// Comments are written with `//`, never `/* */` or `/** */`. The fixer rewrites a block comment as
// one line comment per line of text: JSDoc stars and dash rulers go, paragraph breaks stay.
const RULER_LINE = /^[\s*]*-{3,}[\s*-]*$/;
const LEADING_STARS = /^\s*\*+\s?/;

const trimEmptyEnds = (lines: string[]): string[] => {
  const first = lines.findIndex((line) => line !== '');
  if (first === -1) return [];
  let last = lines.length - 1;
  while (lines[last] === '') last -= 1;
  return lines.slice(first, last + 1);
};

const noBlockComments: Rule.RuleModule = {
  meta: { type: 'suggestion', fixable: 'code', messages: { block: 'Write comments with // rather than /* */.' } },
  create: (context) => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention -- an ESLint selector, named after the AST node
    Program: () => {
      for (const comment of context.sourceCode.getAllComments()) {
        if (comment.type !== 'Block' || comment.loc === undefined || comment.loc === null) continue;
        const { loc } = comment;
        const lines = trimEmptyEnds(
          comment.value
            .split('\n')
            .filter((line) => !RULER_LINE.test(line))
            .map((line) => line.replace(LEADING_STARS, '').trimEnd()),
        );
        const indent = ' '.repeat(loc.start.column);
        const replacement = lines.map((line, index) => `${index === 0 ? '' : indent}// ${line}`.trimEnd()).join('\n');
        context.report({
          loc,
          messageId: 'block',
          fix: (fixer) => (comment.range === undefined ? null : fixer.replaceTextRange(comment.range, replacement)),
        });
      }
    },
  }),
};

// Imports: `@/` alias across folders, `./` within a folder. The fixer rewrites an alias import
// that lands in the importing file's own folder as `./name`.
const ALIAS_PREFIX = '@/';

type ModuleSourceNode = { source?: { value?: unknown; range?: [number, number] } | null };

const siblingImports: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    messages: { sibling: 'Import a file in the same folder with ./{{name}} rather than the @/ alias.' },
  },
  create: (context) => {
    const check = (node: ModuleSourceNode & Rule.Node) => {
      const source = node.source?.value;
      const range = node.source?.range;
      if (typeof source !== 'string' || !source.startsWith(ALIAS_PREFIX) || range === undefined) return;
      const target = resolve(SRC, source.slice(ALIAS_PREFIX.length));
      if (dirname(target) !== dirname(context.filename)) return;
      const name = basename(target);
      context.report({
        node,
        messageId: 'sibling',
        data: { name },
        fix: (fixer) => fixer.replaceTextRange(range, `'./${name}'`),
      });
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
  },
};

export default defineConfigWithVueTs(
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue}'] },
  {
    name: 'app/ignores',
    ignores: ['dist/**', 'coverage/**', 'src/shared/api/schema.d.ts'],
  },

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,

  {
    // Architecture, enforced rather than trusted: `shared` imports nothing from
    // `modules` or `app`; a module reaches another module only through its `index.ts`; only `app`
    // knows every module, and it too goes through the public API.
    name: 'app/boundaries',
    files: ['src/**/*.{ts,mts,tsx,vue}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: TSCONFIG } },

      // The three layers. `src/modules/*` captures the module name, so a rule can
      // talk about "another module" rather than about a list of folders.
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'module', pattern: 'src/modules/*', capture: ['module'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          // Anything not listed below is a violation, including a new layer nobody thought about.
          default: 'disallow',
          policies: [
            {
              // shared/ has no domain knowledge: it may only reach for more of itself. What it
              // needs from a module arrives as a prop or an argument.
              from: [{ element: { type: 'shared' } }],
              allow: [{ to: { element: { type: 'shared' } } }],
            },
            {
              // A module uses shared freely and another module only through its index.ts.
              from: [{ element: { type: 'module' } }],
              allow: [
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'module', fileInternalPath: 'index.ts' } } },
              ],
            },
            {
              // Only the shell knows every module, and it too goes through the public API.
              from: [{ element: { type: 'app' } }],
              allow: [
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'module', fileInternalPath: 'index.ts' } } },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    name: 'app/conventions',
    plugins: {
      unicorn,
      'simple-import-sort': simpleImportSort,
      local: { rules: { 'no-block-comments': noBlockComments, 'sibling-imports': siblingImports } },
    },
    rules: {
      // Comments: `//` only.
      'local/no-block-comments': 'error',

      // Imports: `./` for a file in the same folder (the `@/` half is `no-restricted-imports` below).
      'local/sibling-imports': 'error',

      // Files: kebab-case (ship-card.vue, rate-limiter.ts). `multipleFileExtensions` (the default)
      // is what allows the dotted role suffix: session.store.ts, format.test.ts.
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],

      // Vue: PascalCase components in templates; blocks in any order. Every component a template
      // uses is imported, RouterLink and RouterView included: nothing relies on global registration,
      // and a typo in a component name is a lint error rather than an empty spot in the page.
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
      'vue/no-undef-components': 'error',
      'vue/block-order': 'off',

      // TypeScript: `type` rather than `interface`.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // Naming: camelCase, UPPER_SNAKE_CASE for constants, PascalCase for types.
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'objectLiteralProperty', format: null }, // API payloads, headers, config keys
        { selector: 'typeProperty', format: null },
      ],

      'no-restricted-imports': ['error', { patterns: [NO_PARENT_IMPORTS] }],

      // ...and sorted automatically, into the groups of 13.7, with a blank line between groups and
      // alphabetical order within each. Side-effect imports keep the order they were written in,
      // because the order of stylesheets matters.
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'], // side-effect imports: import './styles/tokens.css';
            ['^node:'], // Node built-ins
            ['^@?\\w'], // packages
            ['^@/'], // the @/ alias (src/)
            ['^\\.'], // relative imports
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Functions: arrow functions. Object and class methods keep method syntax (`this` semantics);
      // callbacks are reported (and auto-fixed) by prefer-arrow-callback.
      'prefer-arrow-callback': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration[generator=false]',
          message: 'Use an arrow function: const name = () => {}.',
        },
        {
          selector:
            ':not(MethodDefinition, Property[method=true], CallExpression, NewExpression) > FunctionExpression[generator=false]',
          message: 'Use an arrow function.',
        },
      ],

      // Exports: named only.
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },

  // A module's index.ts is its public API for *other* modules. Inside the module, a file imports
  // what it needs directly: going through the barrel would make the barrel depend on its own
  // consumers, and the barrel only exports the public subset anyway. Tests are exempt, since the
  // module's own tests are where the barrel's contents get asserted.
  ...MODULE_NAMES.map((name): Linter.Config => ({
    name: `app/own-barrel/${name}`,
    files: [`src/modules/${name}/**`],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [NO_PARENT_IMPORTS],
          paths: [
            {
              name: `@/modules/${name}`,
              message: `Inside the ${name} module, import the file itself: index.ts is for other modules.`,
            },
          ],
        },
      ],
    },
  })),

  {
    // Tools that require a default export.
    name: 'app/config-files',
    files: ['*.config.ts'],
    rules: { 'no-restricted-exports': 'off' },
  },

  {
    // `__tests__` isn't kebab-case, so folder names must not be checked for files inside it,
    // while the test file's own name still is. The installed eslint-plugin-unicorn (61.x) only ever
    // looks at the basename — it has no directory check and no `checkDirectories` option — so
    // re-stating the rule here is all that is needed: the file name is checked, the folder is not.
    name: 'app/test-folders',
    files: ['src/**/__tests__/**'],
    rules: { 'unicorn/filename-case': ['error', { case: 'kebabCase' }] },
  },

  {
    // Tests live in __tests__/ folders and are named *.test.ts. Vitest only runs that pattern,
    // so a test anywhere else would silently never run: report it instead.
    name: 'app/misplaced-tests',
    files: ['**/*.spec.ts', 'src/**/*.test.ts'],
    ignores: ['src/**/__tests__/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'Program', message: 'Unit tests go in a __tests__/ folder and are named *.test.ts.' },
      ],
    },
  },

  skipFormatting, // Prettier owns formatting; ESLint owns code quality
);
