# Insurance Prep

A mobile-first study and practice test app for Indian insurance exams (IC38) across **General Insurance**, **Health Insurance**, and **Life Insurance** in **English**, **हिन्दी**, and **ગુજરાતી**.

## Features

- **Fast Prep mode**: Compact mobile-first question bank with sticky search (text, options, or `#42` question jump), match highlighting, three reading modes (*All options*, *Answer only*, *Tap to check*), subject switching, and persistent bookmarks (`localStorage`).
- **Test mode**: Randomized 20- or 50-question sessions with shuffled answer choices, optional timer (25 min / 60 min), **Bookmark for later**, and a 4-color question status tracker:
  - **Green**: Answered
  - **Red**: Unanswered (visited)
  - **Blue**: Bookmarked for later
  - **Gray**: Unvisited
- **Mobile-first progress drawer**: Sticky mini status bar with live counts, timer, and a slide-up question map drawer on small screens; sticky sidebar on desktop.
- **Per-language lazy loading**: Question data is split into `src/data/questions-{en,hi,gu}.json` so only the active language is fetched.

## Question Bank

| Language | General | Health | Life | Total distinct |
| --- | ---: | ---: | ---: | ---: |
| English | 457 | 803 | 1,063 | 1,976 |
| Hindi | 476 | 318 | 1,025 | 1,734 |
| Gujarati | 427 | 317 | 1,063 | 1,489 |

*(Some questions belong to multiple subjects, so subject counts exceed the per-language distinct total.)*

## Local Development & Build

```bash
npm install
npm run dev      # Start Vite dev server
npm run build    # Type-check and build static dist/
npm run preview  # Preview production build locally
```

To regenerate `src/data/questions-{en,hi,gu}.json` from fresh exports in the parent QueExtractor workspace, run `python ../build_site_data.py`.

## Deployment (Vercel)

Configured via `vercel.json` (`framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "dist"`). Connect the repository in Vercel or run `npx vercel` from this directory.
