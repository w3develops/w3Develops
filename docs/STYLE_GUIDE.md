# w3Develops Style Guide

This document outlines the coding standards and best practices for the w3Develops repository. Adhering to these guidelines ensures our codebase remains readable, maintainable, and accessible to a global community of contributors.

---

## 1. General Principles

- **Readability Over Conciseness**: Code is read much more often than it is written.
- **Radical Transparency**: Use clear, descriptive names for variables, functions, and components.
- **User Agency**: Follow the "Cory Doctorow" ethos—every line of code should empower the user and respect their digital sovereignty.

---

## 2. HTML & JSX

### 2.1 Whitespace & Logical Chunks
As noted by the community, high-density utility classes (like those in Tailwind) can make HTML hard to scan. We permit and encourage extra whitespace between logical chunks.

**Preferred:**
```jsx
<nav className="flex flex-col gap-4">
  <a href="/dashboard" className="p-2 bg-primary">
    Dashboard
  </a>

  <a href="/profile" className="p-2 bg-secondary">
    Profile
  </a>
</nav>
```

### 2.2 The 80-Column Rule
Try to terminate lines before the **80th column**. This keeps code readable on smaller screens and side-by-side diffs.
- **Exceptions**: Long URLs in `href` or `src` attributes may exceed this limit.
- **Wrapping**: When an element has many attributes, wrap them onto new lines.

**Preferred:**
```jsx
<Button
  variant="outline"
  size="lg"
  onClick={handleAction}
  className="w-full sm:w-auto"
>
  Click Me
</Button>
```

### 2.3 Indentation & Logical Dividers
While we generally use 2-space indentation, logical dividers (like `div` containers used for spacing) can have extra line breaks before and after to mark structural shifts.

---

## 3. CSS & Tailwind

- **Utility First**: Always prefer Tailwind utility classes over custom CSS.
- **Class Ordering**: Follow a consistent order for classes:
  1. **Layout** (position, z-index, top/right/bottom/left)
  2. **Box Model** (display, flex, grid, width, height, margin, padding)
  3. **Typography** (font, size, weight, leading, tracking, text-align)
  4. **Visual** (background, border, shadow, opacity)
  5. **Misc** (cursor, pointer-events, transitions)
- **Arbitrary Values**: Avoid `top-[13px]`. Use standard scale values (`top-4`) whenever possible.

---

## 4. JavaScript & TypeScript

- **Strong Typing**: Always define interfaces or types for props and data structures.
- **Semicolons**: Required.
- **Quotes**: Use single quotes `'` for strings, double quotes `"` for JSX attributes.
- **Naming**:
  - `PascalCase` for Components and Types.
  - `camelCase` for variables, functions, and files (except components).
  - `UPPER_SNAKE_CASE` for constants.

---

## 5. React & Next.js

- **Server Components**: Use Server Components by default. Only add `'use client';` when interactivity (hooks, event listeners) is required.
- **Hydration Safety**: To avoid hydration mismatches, wrap browser-only code (dates, random numbers, localStorage) in a `useEffect` hook.
- **Component Structure**:
  1. Imports (External -> Internal -> Types)
  2. Types/Interfaces
  3. Component Definition
  4. Helper functions (if applicable)
  5. Export

---

## 6. Firebase

- **Client-Side Only**: Do not use `firebase-admin` in this repository. Use only the Client SDK.
- **Error Handling**: Use the `errorEmitter` and `FirestorePermissionError` architecture found in `src/firebase/errors.ts` to surface rich context during development.
- **Security Rules**: Never assume the client is safe. Always mirror client-side validation in `firestore.rules`.

---

## 7. Version Control

- **Atomic Commits**: One feature or fix per commit.
- **Commit Messages**: Use the imperative mood (e.g., "Add pagination to news" instead of "Added pagination").
- **Branching**: Use descriptive branch names like `feat/announcement-banner` or `fix/hydration-error`.
