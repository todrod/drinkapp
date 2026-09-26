# Start here

**Read [`CONTEXT.md`](CONTEXT.md) before changing anything.** It covers the
architecture, the data model, the matching algorithm, and — most importantly —
a list of non-obvious traps that have each already caused a real bug here.

Quick orientation:

- The repo root **is** the Expo project. No nesting.
- Live: https://drinkapp-rust.vercel.app — Vercel deploys automatically on push
  to `main`.
- `src/logic/generator.ts` is the heart of the product. Start there.
- `npm run typecheck` must pass before you commit.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code.
