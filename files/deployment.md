# deployment.md — Structa Production Deployment Guide (Vercel)

This document provides complete, practical, step-by-step instructions for deploying Structa to production on **Vercel**.

> [!CAUTION]
> **CRITICAL SECURITY NOTICE:**
> Never commit actual production secrets, API keys, database connection strings, or private tokens to Git. All production secrets must be securely configured inside the Vercel Project Settings under **Environment Variables**.

---

## 1. Prerequisites

Before deploying Structa, ensure you have active accounts and credentials for the following services:

| Service | Purpose | Requirement |
|---|---|---|
| **Node.js** | Runtime Environment | `v20.x` or later |
| **npm** | Package Manager | `v10.x` or later (bundled with Node 20) |
| **GitHub** | Source Code & Repository API | GitHub account + OAuth App / Personal Access Token |
| **Vercel** | Hosting & Serverless Platform | Free or Pro Vercel account |
| **MongoDB Atlas** | Primary Database | M0 (Free Tier) or M10+ dedicated cluster |
| **Clerk** | Authentication & Organizations | Production or Development Clerk Application |
| **OpenAI** | LLM Summarization & Chat | OpenAI API key with access to `gpt-4o-mini` |
| **Stripe** | Monetization & Subscription Billing | Test mode or Live Stripe account |
| **Resend** | Email Architecture Alerts | Resend API key with verified sending domain |
| **Upstash Redis** | Distributed Rate Limiting (Optional) | Serverless Redis instance |

---

## 2. Environment Variables Specification

Configure the following variables in the **Vercel Dashboard** under **Project Settings → Environment Variables**:

| Variable Name | Required | Client/Server | Environment | Description / Where to Obtain |
|---|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Client (Public) | Production, Preview, Dev | Clerk Dashboard (`pk_live_...` or `pk_test_...`) |
| `CLERK_SECRET_KEY` | **Yes** | Server (Secret) | Production, Preview, Dev | Clerk Dashboard (`sk_live_...` or `sk_test_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | **Yes** | Client (Public) | All | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | **Yes** | Client (Public) | All | Set to `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | **Yes** | Client (Public) | All | Set to `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | **Yes** | Client (Public) | All | Set to `/dashboard` |
| `MONGODB_URI` | **Yes** | Server (Secret) | All | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `GITHUB_CLIENT_ID` | **Yes** | Server (Secret) | All | GitHub Developer Settings → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | **Yes** | Server (Secret) | All | GitHub Developer Settings → OAuth Apps |
| `GITHUB_PAT` | **Yes** | Server (Secret) | All | GitHub Settings → Developer Settings → Personal Access Tokens |
| `OPENAI_API_KEY` | **Yes** | Server (Secret) | All | OpenAI Platform → API Keys (`sk-...`) |
| `STRIPE_API_KEY` | **Optional** | Server (Secret) | All | Stripe Dashboard → API Keys (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | **Optional** | Server (Secret) | All | Stripe Dashboard → Webhooks (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | **Optional** | Client (Public) | All | Stripe Dashboard → Products (`price_...`) |
| `RESEND_API_KEY` | **Optional** | Server (Secret) | All | Resend Dashboard → API Keys (`re_...`) |
| `UPSTASH_REDIS_REST_URL` | **Optional** | Server (Secret) | All | Upstash Console → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | **Optional** | Server (Secret) | All | Upstash Console → REST Token |

---

## 3. Step-by-Step Vercel Deployment

```
GitHub Repository (main branch)
           ↓
Vercel Project Import
           ↓
Framework Preset: Next.js
           ↓
Build & Install Settings
           ↓
Configure Environment Variables
           ↓
Deploy
           ↓
Verify Health Endpoint (/api/health)
```

### Step 1: Push Repository to GitHub
Ensure your latest changes on `main` are committed and pushed to your GitHub repository:
```bash
git checkout main
git pull origin main
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... → Project**.
3. Select your GitHub repository (`Structa`).
4. Click **Import**.

### Step 3: Configure Build & Output Settings
Vercel automatically detects Next.js. Verify the defaults:
- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Build Command:** `npm run build` (or default `next build`)
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node.js Version:** `20.x` (Configure under Project Settings → General)

### Step 4: Add Environment Variables
Under the **Environment Variables** section in the Vercel setup screen, paste all required environment variables listed in Section 2 above.

### Step 5: Click Deploy
Click **Deploy**. Vercel will build the Next.js application, bundle static pages, compile serverless API routes, and deploy to a global edge network.

---

## 4. Production Service Configurations

### 4.1 MongoDB Atlas Configuration
1. In [MongoDB Atlas](https://cloud.mongodb.com), create a database cluster.
2. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit serverless function connections.
3. Under **Database Access**, create a dedicated database user with `readWrite` permissions.
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/structa?retryWrites=true&w=majority
   ```
5. Set `MONGODB_URI` in Vercel.

### 4.2 Clerk Authentication Configuration
1. In [Clerk Dashboard](https://dashboard.clerk.com), create or switch to your **Production Instance**.
2. Under **User & Authentication → Social Connections**, enable **GitHub**.
   - Input your GitHub OAuth App Client ID & Secret.
3. Under **Organizations Settings**, ensure Organizations are **Enabled**.
4. In **Paths**, confirm:
   - Sign In: `/sign-in`
   - Sign Up: `/sign-up`
   - After Sign In: `/dashboard`
   - After Sign Up: `/dashboard`
5. Copy Publishable and Secret keys to Vercel.

### 4.3 GitHub OAuth App Configuration
1. Navigate to GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Application name:** `Structa`
3. **Homepage URL:** `https://<your-project>.vercel.app`
4. **Authorization callback URL:**
   - When using Clerk OAuth: `https://clerk.<your-domain>.com/v1/oauth_callback` (obtained from Clerk Dashboard under GitHub connection settings).

### 4.4 Stripe Webhook Configuration (Phase 9/10)
1. In [Stripe Dashboard](https://dashboard.stripe.com), navigate to **Developers → Webhooks**.
2. Click **Add endpoint**.
3. **Endpoint URL:** `https://<your-project>.vercel.app/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Reveal Signing Secret and set `STRIPE_WEBHOOK_SECRET` in Vercel.

### 4.5 Resend Email Configuration
1. In [Resend](https://resend.com), add and verify your custom sending domain with DNS records (SPF, DKIM).
2. Generate an API Key and assign it to `RESEND_API_KEY` in Vercel.

---

## 5. Post-Deployment Verification & Smoke Tests

After deployment completes and your Vercel URL is active:

1. **Uptime & Health Check:**
   Query `https://<your-project>.vercel.app/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "latencyMs": 42,
     "services": {
       "database": "connected"
     }
   }
   ```
2. **Landing Page:** Visit `https://<your-project>.vercel.app/` — verify navigation header, mode switcher, and branding.
3. **Authentication:** Sign in with GitHub via Clerk OAuth.
4. **Workspace Mode:** Connect a repository, trigger 3D graph visualization, and perform an "Ask the Codebase" query.
5. **Explorer Mode:** Navigate to `/explorer`, search for a public repository (e.g., `octocat/Spoon-Knife`), verify background indexing progress and 3D graph exploration.
6. **Admin / Settings:** Navigate to `/admin`, verify Plan & Billing preview, Member seats table, and RBAC matrix.
7. **Logs Review:** Check Vercel Function Logs for zero 500 errors or unhandled exceptions.
