# Presentation app

This app hosts the talk deck as a Next.js application with `reveal.js`.

## Source material

- `content/appjs-conf-2026-talk-working-draft.md`
- `content/notification-system-implementation-order.md`

## Run it

```sh
bun --filter presentation dev
```

The dev server runs on `http://localhost:3001`.

## Why Next.js here?

- The deck itself stays client-side because `reveal.js` initializes in the browser.
- Data for the talk can still come from server components, route handlers, or client fetches.
- This keeps the deck deployable like any other app in the monorepo.
