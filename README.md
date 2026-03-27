# WonderfulMarketplace

A full-stack marketplace web application where users can buy and sell products, powered by AI-assisted content generation and semantic search. Built with a modern TypeScript stack across both frontend and backend.

🔗 **Live Demo:** [wonderful-marketplace.vercel.app](https://wonderful-market-place.vercel.app/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Database Schema](#database-schema)
- [AI Integration](#ai-integration)
- [Known Limitations & Future Improvements](#known-limitations--future-improvements)
- [Deployment](#deployment)

---

## Overview

WonderfulMarketplace is a peer-to-peer marketplace where any registered user can become a seller by listing products, while also browsing and purchasing from other sellers. The platform enforces ownership-based rules — sellers cannot purchase their own listings — and is enhanced by two AI capabilities: instant product description generation and semantic search powered by vector embeddings.

---

## Features

### 🛍️ Marketplace Core
- **Dual-role users** — every account can buy or sell; no admin role required. Sellers are prevented from purchasing their own products.
- **Listings management** — sellers can create, edit, and delete their own products, with full ownership enforcement on every mutation.
- **Product comments** — authenticated users can leave comments on any product listing.
- **Search & pagination** — keyword search with URL-synced pagination so results are shareable and bookmarkable.

### 🔐 Auth & Authorization
- **Clerk authentication** — sign-up, sign-in, session management, and JWT-based API protection handled by Clerk.
- **Ownership-based authorization** — edit/delete routes verify that the requesting user owns the resource. Non-owners receive a `403` response regardless of authentication status.

### 💳 Payments
- **Stripe Checkout** — buyers are redirected to a hosted Stripe Checkout session for payment.
- **Webhook handling** — a dedicated `/webhooks/stripe` endpoint listens for `checkout.session.completed` events to reliably confirm orders server-side, independent of client redirects.

### 🤖 AI Features
- **AI description generation** — sellers can auto-generate a product description from a title and category using an LLM via OpenRouter.
- **AI semantic search** — product embeddings are generated with OpenAI `text-embedding-3-small` and stored in PostgreSQL via `pgvector`, enabling meaning-aware search that goes beyond exact keyword matching.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, TypeScript |
| **Styling** | Tailwind CSS, DaisyUI |
| **Server state** | TanStack Query (React Query) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Neon serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | Clerk |
| **Payments** | Stripe (Checkout + Webhooks) |
| **AI — LLM** | OpenRouter (qwen-turbo · llama-3.1-8b · nemotron-nano-8b) |
| **AI — Embeddings** | OpenAI `text-embedding-3-small` + `pgvector` |
| **Frontend hosting** | Vercel |
| **Backend hosting** | Render |

---

## Architecture & Design Decisions

### Why Drizzle ORM over Prisma?
Drizzle is SQL-first — schemas are defined in TypeScript that maps closely to actual SQL, which keeps mental overhead low and gives full control over queries without hiding complexity behind magic. It also has a noticeably smaller runtime footprint, which matters on Render's free tier cold starts.

### Why Neon (serverless PostgreSQL)?
Neon provisions a PostgreSQL database with connection pooling built in, which is well suited for a serverless/edge deployment model. It also supports the `pgvector` extension natively, removing the need to self-host a separate vector store for the semantic search feature.

### Why TanStack Query over plain `useEffect`?
TanStack Query handles caching, background refetching, loading/error states, and cache invalidation in a consistent, declarative way. This significantly reduces boilerplate and makes optimistic UI updates easier to reason about — especially for listing mutations.

### URL-synced pagination
Pagination state (page number, search query) is stored in URL search params rather than local component state. This means users can share or bookmark a search result page and return to the same view — a small but meaningful UX detail.

### Ownership-based authorization (not RBAC)
The authorization model here is resource-ownership rather than role-based. Every protected mutation checks `product.sellerId === requestingUserId`. This is the correct model for a marketplace with no admin hierarchy — it is simpler, harder to misconfigure, and does not require a roles table.

### Stripe webhook reliability
Order confirmation is handled in the `checkout.session.completed` webhook rather than on the client's success redirect. This ensures orders are recorded even if a user closes the browser before the redirect fires, and protects against forged success redirects.

### AI description generation via OpenRouter
OpenRouter abstracts the underlying LLM provider, making it straightforward to swap or chain models without changing application code. The generation endpoint uses a **paid primary → paid fallback → free fallback** strategy across three models:

| Priority | Model | Type |
|----------|-------|------|
| 1st | `qwen/qwen-turbo` | Paid |
| 2nd | `meta-llama/llama-3.1-8b-instruct` | Paid |
| 3rd | `nvidia/llama-3.1-nemotron-nano-8b-v1:free` | Free |

If the primary model fails or is unavailable, the backend automatically retries with the next model in the chain. This keeps the feature functional even when a paid model is rate-limited or experiencing downtime, without surfacing the failure to the user.

### Semantic search with pgvector
When a product is created or updated, its title and description are embedded using `text-embedding-3-small` and the resulting vector is stored in a `vector(1536)` column. At query time, the search term is embedded with the same model and a cosine similarity search is performed. This allows queries like "comfortable running shoes" to surface listings described as "lightweight athletic footwear" — something keyword search cannot do.

---

## Database Schema

```
users
├── id (PK, from Clerk)
├── email
├── name
└── createdAt

products
├── id (PK)
├── sellerId → users.id
├── title
├── description
├── price
├── category
├── imageUrl
├── embedding  (vector(1536), pgvector)
└── createdAt

orders
├── id (PK)
├── buyerId → users.id
├── productId → products.id
├── stripeSessionId
├── status
└── createdAt

comments
├── id (PK)
├── userId → users.id
├── productId → products.id
├── content
└── createdAt
```

> Cascading deletes are configured on `products → comments` and `products → orders` so removing a listing cleans up all dependent rows automatically.

---

## AI Integration

### Description Generation

**Endpoint:** `POST /api/ai/generate-description`

The backend receives a product `title`, constructs a prompt, and calls the OpenRouter completions API using a model fallback chain — trying paid models first (`qwen/qwen-turbo` → `meta-llama/llama-3.1-8b-instruct`) before falling back to a free model (`nvidia/llama-3.1-nemotron-nano-8b-v1:free`). The generated description is returned to the frontend and pre-filled into the description textarea, which the seller can edit before saving.

```
Seller fills in product title
        ↓
POST /api/ai/generate-description
        ↓
Try qwen/qwen-turbo (paid)
  → on failure: try llama-3.1-8b-instruct (paid)
    → on failure: nvidia/nemotron-nano-8b (free)
        ↓
Generated description returned to client
        ↓
Seller reviews and submits listing
```

### Semantic Search

**Powered by:** OpenAI `text-embedding-3-small` + PostgreSQL `pgvector`

When a product is created or updated, an embedding of its title and description is generated and stored. When a user searches, the query string is embedded in real time and a cosine similarity query retrieves the most relevant products.

```sql
-- Simplified version of the vector similarity query
SELECT *, embedding <=> $1 AS distance
FROM products
ORDER BY distance
LIMIT 20;
```

The semantic search runs alongside the keyword search — both signals are used so that exact matches and meaning-based matches surface together.

---

---

## Known Limitations & Future Improvements

Current Limitations

No product filtering — users can search by keyword and use semantic search, but there is no filter UI for price range, category, or other attributes. All filtering would need to be done manually through search queries.

Image handling via URL only — sellers paste an external image URL which is saved directly to the database. There is no file upload support, meaning broken or deleted external URLs will result in missing images with no fallback.

No real-time notifications — buyers and sellers are not notified of new orders, comments, or listing changes in real time. Users must manually refresh to see updates.

Planned Improvements

Product filtering — add filter controls for price range and category on the listings page, backed by query param state to keep them URL-synced alongside existing pagination.

Cloudinary integration — replace URL-based image input with direct file uploads via Cloudinary, enabling image validation, resizing, and reliable hosting independent of third-party URLs.

Real-time notifications — use WebSockets or Server-Sent Events to push order confirmations and new comment alerts to the relevant user without requiring a page refresh.

## Deployment

### Frontend — Vercel

The React + Vite frontend is deployed on Vercel. Set all `VITE_` environment variables in the Vercel project dashboard under **Settings → Environment Variables**.

### Backend — Render

The Express API is deployed as a Web Service on Render.

- **Build command:** `npm install && npm run build`
- **Start command:** `node dist/index.js`
- Set all backend environment variables in the Render dashboard under **Environment**.

> **Stripe webhooks:** Update the webhook endpoint in the Stripe dashboard to point to your Render service URL: `https://your-render-service.onrender.com/api/webhooks/stripe`

> **Cold starts:**  Render's free tier spins down inactive services. A UptimeRobot monitor pings the service on a regular interval to keep it warm and prevent spin-down.
