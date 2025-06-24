# Contributing to Apprvd Frontend

Welcome! To keep our codebase clean, scalable, and easy for everyone to work on, please follow these rules and best practices when contributing to this project.

---

## 1. Component Structure & Organization
- All UI elements (except for the highest-level page layout) must be placed in the `components/` directory.
- One component per file. Name the file and the component the same (e.g., `Sidebar.tsx` for `Sidebar`).
- Keep components focused: Each component should do one thing (e.g., `FileCard` only renders a file card, not a list).
- Use folders for complex components: If a component has subcomponents, place them in a subfolder (e.g., `components/Sidebar/SidebarItem.tsx`).

## 2. Pages
- Keep page files (`app/*.tsx`) minimal: Only import and compose components, do not put business logic or UI details in the page file.
- Wrap protected pages with the `withAuth` HOC to enforce authentication.

## 3. Hooks & State
- Use React hooks (`useState`, `useEffect`, etc.) for state and side effects.
- Do not use context or Redux unless the state must be shared across many components. Prefer prop drilling for now.
- Fetch user data using `getCurrentUser()` from Firebase utilities.

## 4. Authentication
- All authenticated pages must use the `withAuth` HOC from `components/withAuth.tsx`.
- Redirect unauthenticated users to `/login`.

## 5. Styling
- Use Tailwind CSS for all styling.
- Do not use inline styles or CSS modules.
- Use the theme colors:
  - Primary: `#88DF95`
  - Primary hover: `#7ACF87`
  - Text: `#000000` (black)
- Never use gray for primary text. Use `text-black` for all main text.

## 6. Props & Types
- Type all component props using TypeScript interfaces.
- Export prop interfaces if they may be reused.

## 7. File/Folder Data
- Pass data as props to list components (`FileList`, `FolderList`).
- Do not fetch data inside list or card components.

## 8. Naming Conventions
- Component files: `PascalCase` (e.g., `FileCard.tsx`)
- Props interfaces: `PascalCase` and suffix with `Props` (e.g., `FileCardProps`)
- Variables and functions: `camelCase`

## 9. Imports
- Use absolute imports (e.g., `@/components/Sidebar`) for all internal modules.
- Group imports: external libraries first, then internal modules.

## 10. Extending the App
- Add new UI as components in `components/` and import them into pages.
- If a component grows too large, break it into smaller subcomponents.
- If you need to share logic, use custom hooks in a `hooks/` directory.

## 11. Testing
- Write tests for components in a `__tests__` folder next to the component (if/when you add tests).

## 12. Do Not
- Do not put business logic or UI markup directly in page files.
- Do not use class components.
- Do not use CSS-in-JS or styled-components.
- Do not use global state management unless absolutely necessary.

---

## Example Directory Structure

```
app/
  page.tsx
  login/
    page.tsx
components/
  Sidebar.tsx
  Navbar.tsx
  FileList.tsx
  FileCard.tsx
  FolderList.tsx
  FolderCard.tsx
  withAuth.tsx
lib/
  firebase/
    config.ts
    auth.ts
    index.ts
```

---

**Stick to these rules to keep the codebase clean, scalable, and easy for everyone to work on!**

If you're unsure, check how existing components are structured and follow the same pattern. If you need to break a rule, discuss it with the team first. 