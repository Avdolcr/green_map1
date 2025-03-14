# Tree Admin

An administration interface for managing tree data on the Green Map.

## Features

- Add, edit, and delete tree information
- Upload and manage tree images
- Assign custom pin icons to trees on the map
- Manage gallery approvals
- View and edit tree locations on a map

## Custom Pin Icons

This application now supports custom pin icons for each tree on the map. When adding or editing a tree, you can select from a variety of predefined icons or specify a custom icon URL.

### Using Custom Icons

1. When adding or editing a tree, scroll down to the "Pin Icon" section
2. Select one of the predefined icons or enter a custom URL
3. Save the tree to apply the selected icon
4. View the tree on the map to see your custom icon in action

### Adding New Icons

To add new icon options:

1. Place your icon images in the `public/tree-icons/` directory
2. Update the `treeIconOptions` array in the `tree-admin/app/admin/[id]/page.tsx` file

You can download the sample tree icons by running:

```
.\download-tree-icons.bat
```

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure the environment variables in `.env.local`
4. Start the development server: `npm run dev`

## Database Setup

The application requires a MySQL database. Make sure to set up the database and configure the connection in the `.env.local` file.

If you need to add the pin_icon column to your existing trees table, run the following SQL:

```sql
ALTER TABLE trees ADD COLUMN pin_icon VARCHAR(255) AFTER image_url;
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
