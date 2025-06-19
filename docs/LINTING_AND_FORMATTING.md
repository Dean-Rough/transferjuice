# ESLint and Prettier Configuration Guide

## Overview

This document explains the comprehensive ESLint and Prettier configuration for Transfer Juice, designed to enforce code quality, consistency, and modern development best practices.

## Configuration Philosophy

Our linting and formatting setup follows these principles:

1. **Strict TypeScript**: Enforce type safety and modern TypeScript patterns
2. **Accessibility First**: Ensure all code meets WCAG accessibility standards
3. **Performance Focused**: Catch performance anti-patterns early
4. **Team Consistency**: Standardize code style across all contributors
5. **Security Aware**: Prevent common security vulnerabilities

## ESLint Configuration (.eslintrc.json)

### Core Rules and Reasoning

#### TypeScript Rules

```json
"@typescript-eslint/no-explicit-any": "error"
```

**Reasoning**: Prevents use of `any` type, maintaining type safety that's crucial for Transfer Juice's data pipeline integrity.

```json
"@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }]
```

**Reasoning**: Separates type imports from value imports, improving bundle size and build performance.

```json
"@typescript-eslint/no-floating-promises": "error"
```

**Reasoning**: Critical for async operations in our Twitter API and AI processing pipeline.

#### React Rules

```json
"react/jsx-no-leaked-render": "error"
```

**Reasoning**: Prevents rendering bugs in our article display components.

```json
"react/function-component-definition": ["error", { "namedComponents": "function-declaration" }]
```

**Reasoning**: Consistent component definition style for better debugging and stack traces.

#### Import Organization

```json
"import/order": [
  "error",
  {
    "groups": ["builtin", "external", "internal", "parent", "sibling"],
    "newlines-between": "always",
    "alphabetize": { "order": "asc" }
  }
]
```

**Reasoning**: Organized imports improve code readability and make dependency relationships clear.

#### Accessibility Rules

```json
"jsx-a11y/anchor-is-valid": ["error", { "components": ["Link"] }]
```

**Reasoning**: Ensures our newsletter links and article navigation meet accessibility standards.

#### Security Rules

```json
"no-eval": "error",
"no-implied-eval": "error"
```

**Reasoning**: Prevents code injection vulnerabilities, crucial for processing user-generated content.

#### Performance Rules

```json
"complexity": ["warn", 10],
"max-lines-per-function": ["warn", { "max": 50 }]
```

**Reasoning**: Maintains code maintainability and prevents performance bottlenecks in our content processing pipeline.

### Naming Conventions

```json
"@typescript-eslint/naming-convention": [
  "error",
  { "selector": "interface", "format": ["PascalCase"], "prefix": ["I"] },
  { "selector": "typeAlias", "format": ["PascalCase"], "suffix": ["Type"] }
]
```

**Reasoning**: Consistent naming makes the codebase more readable and maintainable.

## Prettier Configuration (.prettierrc)

### Settings and Reasoning

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80
}
```

- **semi: true**: Prevents ASI (Automatic Semicolon Insertion) issues
- **trailingComma: "es5"**: Cleaner git diffs when adding array/object items
- **singleQuote: true**: Consistent with modern JavaScript conventions
- **printWidth: 80**: Optimal line length for readability on all devices

## Development Workflow

### Pre-commit Hooks

Our Husky setup runs the following checks before each commit:

1. **ESLint with auto-fix**: Catches and fixes linting issues
2. **Prettier formatting**: Ensures consistent code formatting
3. **Type checking**: Validates TypeScript types

### Available Scripts

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Format all files with Prettier
npm run format

# Check formatting without modifying files
npm run format:check

# Run TypeScript type checking
npm run type-check

# Run all checks (lint, format, type-check)
npm run check-all
```

### VS Code Integration

Our VS Code configuration provides:

1. **Auto-formatting on save**: Code is automatically formatted when you save
2. **Real-time linting**: ESLint errors show immediately as you type
3. **Import organization**: Imports are automatically sorted and organized
4. **Type hints**: TypeScript provides helpful inline type information

### Recommended Extensions

Install these VS Code extensions for the best experience:

- **ESLint**: Real-time linting feedback
- **Prettier**: Code formatting
- **TypeScript and JavaScript Language Features**: Enhanced TypeScript support
- **TailwindCSS IntelliSense**: CSS class autocomplete
- **Prisma**: Database schema syntax highlighting

## File Patterns

### Files Included in Linting

- `*.ts`, `*.tsx` - TypeScript and React files
- `*.js`, `*.jsx` - JavaScript and React files (legacy support)

### Files Excluded from Formatting

- `node_modules/` - Dependencies
- `.next/` - Next.js build output
- `coverage/` - Test coverage reports
- `*.log` - Log files
- Generated files (see `.prettierignore`)

## Configuration Overrides

### Test Files

Test files have relaxed rules for:

- `@typescript-eslint/no-explicit-any`: Often needed for mocking
- `no-magic-numbers`: Test data often uses arbitrary numbers
- `max-lines-per-function`: Test functions can be longer

### Configuration Files

Config files (`next.config.js`, etc.) allow:

- `@typescript-eslint/no-var-requires`: CommonJS require statements
- Module-specific patterns for build configurations

## Troubleshooting

### Common Issues

1. **"Cannot resolve configuration" errors**

   - Ensure `.eslintrc.json` is in the project root
   - Check that all peer dependencies are installed

2. **Prettier conflicts with ESLint**

   - Our config includes `eslint-config-prettier` to disable conflicting rules
   - Always run Prettier after ESLint for consistent results

3. **Import resolution errors**

   - Verify `tsconfig.json` paths are correctly configured
   - Check that `@/` path mapping is set up properly

4. **Pre-commit hooks not running**
   - Ensure Husky is properly initialized: `npx husky install`
   - Check that `.husky/pre-commit` is executable

### Performance Optimization

If linting is slow:

1. Use `--cache` flag: `eslint --cache src/`
2. Exclude unnecessary files in `.eslintignore`
3. Run linting in parallel with other tools

## Continuous Integration

In CI/CD pipelines, use these commands:

```bash
# Check everything without fixing
npm run check-all

# Fail fast on any issues
npm run lint && npm run format:check && npm run type-check
```

## Customization Guidelines

When modifying rules:

1. **Document the reasoning**: Add comments explaining why rules were changed
2. **Test thoroughly**: Ensure changes don't break existing code
3. **Update this documentation**: Keep this guide current with any changes
4. **Consider team impact**: Discuss significant changes with the team

## Integration with Transfer Juice Architecture

Our linting rules specifically support Transfer Juice development:

1. **API Route Validation**: Ensures proper error handling in Next.js API routes
2. **Type Safety**: Critical for Twitter API data processing and AI content generation
3. **Accessibility**: Ensures our newsletter signup and article reading experience is accessible
4. **Performance**: Catches issues that could impact our automated content pipeline
5. **Security**: Prevents vulnerabilities in our content processing and email systems

This configuration ensures that Transfer Juice maintains high code quality standards while supporting rapid development of our automated Premier League transfer digest.
