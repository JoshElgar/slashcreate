# Create a book

A minimal starter kit with Next.js, Tailwind CSS, shadcn/ui, and tRPC.

## Features

- **Next.js 14**: The React framework for building modern web applications
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development
- **shadcn/ui**: Beautifully designed components built with Tailwind CSS
- **tRPC**: End-to-end typesafe APIs made easy
- **TypeScript**: A strongly typed programming language that builds on JavaScript

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages and layouts
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and shared code
- `src/server`: tRPC server-side code

## Using tRPC

This starter kit includes [tRPC](https://trpc.io) for end-to-end typesafe APIs. Here's how to use it:

### Defining Procedures

tRPC procedures are defined in `src/server/routers.ts`. Here's an example of how to create a new procedure:

```typescript
// src/server/routers.ts
import { z } from "zod";
import { procedure, router } from "./trpc";

export const appRouter = router({
  // Query procedure example
  getUser: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Fetch user from database
      return { id: input.id, name: "John Doe" };
    }),

  // Mutation procedure example
  createPost: procedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      // Create post in database
      return {
        id: "post-123",
        title: input.title,
        content: input.content,
      };
    }),
});

export type AppRouter = typeof appRouter;
```

### Using Queries in Components

To use a tRPC query in a React component:

```typescript
"use client";

import { trpc } from "../lib/trpc";

export default function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = trpc.getUser.useQuery({ id: userId });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>User ID: {data.id}</p>
    </div>
  );
}
```

### Using Mutations in Components

To use a tRPC mutation in a React component:

```typescript
"use client";

import { useState } from "react";
import { trpc } from "../lib/trpc";

export default function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = trpc.createPost.useMutation({
    onSuccess: (data) => {
      console.log("Post created:", data);
      setTitle("");
      setContent("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({ title, content });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      />
      <button type="submit" disabled={createPost.isLoading}>
        {createPost.isLoading ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
```

### Input Validation with Zod

tRPC uses [Zod](https://github.com/colinhacks/zod) for input validation. Here's how to define complex validation schemas:

```typescript
import { z } from "zod";
import { procedure, router } from "./trpc";

export const appRouter = router({
  registerUser: procedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        age: z.number().min(18, "Must be at least 18 years old").optional(),
        role: z.enum(["user", "admin"]).default("user"),
      })
    )
    .mutation(async ({ input }) => {
      // Register user logic
      return { success: true, userId: "user-123" };
    }),
});
```

## Learn More

To learn more about the technologies used in this starter kit, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [tRPC Documentation](https://trpc.io/docs)
