# KyuBoard v1.0 Beta Release

KyuBoard is a web-based board application for arranging memos and images in a free-form space.

The project is built as a personal productivity and visual note board tool. Each board can contain movable/resizable memo cards and uploaded images. Editing features are protected by a simple sign-in and permission approval flow.

![KyuBoard screenshot](screenshot/스크린샷 2026-05-19 21.13.53.png)
## Concept

KyuBoard was designed for a more spatial style of expression, rather than the linear format of a typical blog.

The goal is to make it possible to create varied expressions with a small set of core features. The board should feel free, but not directionless. Users should be able to arrange ideas, images, and written fragments freely while still having tools that help them find their way through the space.

## Core Features

### Boards and Memos

Boards and memos are the foundation of KyuBoard. Memos support rich text editing, allowing simple cards to carry a wider range of expression.

### Image Uploads

Images are simple, but they make the board much richer. They add visual context and make the space feel less like a plain text list.

### Search and Memo Order Navigation

Search and memo order navigation act as guides inside a large, free-form board. They help users avoid getting lost while moving through many scattered memos.

### Zoom Controls

Zoom controls let users adjust the board to a comfortable scale for different platforms and screen sizes.

### Sign-in and Permission Control

Sign-in and permission control are used to manage editing access efficiently. Since the app depends on limited external resources such as database and image storage services, write operations are restricted to approved users.

## Development

KyuBoard is still being improved. Feature updates and usability refinements will continue over time.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Neon PostgreSQL
- Tiptap
- react-rnd
- Cloudinary
- Vercel Analytics

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Variables

Create a local environment file and set the required values:

```env
NEON_CONNECTION_STRING=
AUTH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`AUTH_SECRET` is used to sign the local session token. Use a strong secret value in production.

## Database

The app uses Neon PostgreSQL through Drizzle ORM.

Main tables:

- `users`
- `boards`
- `memos`
- `images`

User accounts have a `permission_flg` field. A user can sign up, but editing is blocked until approval is granted. Board creation is restricted to users with the `admin` role.

## Current Notes

KyuBoard is still in active development. Mobile touch behavior, rich text editing, and board/image workflows are being refined.

## Deployment

The project is intended to run on Vercel.

Set the same environment variables in the Vercel project settings before deploying.
