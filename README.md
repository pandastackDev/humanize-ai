# humanize

## Frontend

```bash
pnpm i
cd apps/next && pnpm setup-env
cd ../..

pnpm web
pnpm convex
pnpm python
pnpm native # expo app (currently not used)


pnpm check
pnpm check-fast
pnpm check-types

# Gen OpenAPI -> TypeScript client
pnpm api-client generate
```

## Backend

```bash
# Setup UV https://docs.astral.sh/uv/

cd backend

# Setup Python
uv python install 3.12

# Setup venv
uv venv
source .venv/bin/activate

# Make sure dependencies are installed
uv sync

# Start the development server:
uv run uvicorn src.index:app --reload --host 0.0.0.0 --port 8000

# Open http://localhost:8000
```

```
uv add ruff
uv run ruff check
uv lock
uv sync

uv run example.py
uvx pycowsay 'hello world!'

uv tool install ruff
uv python pin 3.12
uv venv

uv pip compile pyproject.toml -o requirements.txt --no-emit-package backend

```

## BE Deps

- UV https://docs.astral.sh/uv/
- Ruff https://docs.astral.sh/ruff/
- https://pre-commit.com/
- [FastAPI](https://fastapi.tiangolo.com/)
- https://guides.scalar.com/scalar/scalar-api-references/integrations/fastapi
- https://heyapi.dev/ - OpenAPI -> TypeScript code generator (https://github.com/hey-api/openapi-ts)

## FE Deps

- node 22, pnpm 10
- Solito https://solito.dev/ https://github.com/nandorojo/solito
- nextjs 16
- react 19.2
- expo sdk 54
- react-native 0.81.5
- workos + authkit
  - https://github.com/workos/authkit
  - https://github.com/workos/authkit-nextjs
  - https://workos.com/docs/authkit/nextjs
  - https://workos.com/docs
  - https://workos.com/docs/reference
  - https://workos.com/docs/widgets/user-management
- stripe
- convex

npm i -g eas-cli
pnpx expo install expo@^54.0.0 --fix
pnpx expo-doctor@latest

uv lock --locked
uv run ruff check --fix
uv run ruff format --check .
uv run pyright .
uv run pytest -v
uv build

or
chmod +x ./check.sh
./check.sh

## 📦 Included packages

- `solito` for cross-platform navigation
- `moti` for animations
- Expo SDK 53
- Next.js 15
- React Navigation 7
- React 19 (read more below)
- React Compiler

For more, see the [compatibility docs](https://solito.dev/compatibility).

## 🗂 Folder layout

- `apps` entry points for each app
  - `expo`
  - `next`

- `packages` shared packages across apps
  - `app` you'll be importing most files from `app/`
    - `features` (don't use a `screens` folder. organize by feature.)
    - `provider` (all the providers that wrap the app, and some no-ops for Web.)
    - `navigation` Next.js has a `pages/` folder. React Native doesn't. This folder contains navigation-related code for RN. You may use it for any navigation code, such as custom links.

You can add other folders inside of `packages/` if you know what you're doing and have a good reason to.

## 🏁 Start the app

- Install dependencies: `yarn`

- Next.js local dev: `yarn web`
- Expo local dev:
  - First, build a dev client onto your device or simulator
    - `cd apps/expo`
    - Then, either `expo run:ios`, or `eas build`
  - After building the dev client, from the root of the monorepo...
    - `yarn native` (This runs `expo start --dev-client`)

## 🆕 Add new dependencies

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `packages/app`:

```sh
cd packages/app
yarn add date-fns
cd ../..
yarn
```

### Native dependencies

If you're installing a library with any native code, you must install it in `apps/expo`:

```sh
cd apps/expo
yarn add react-native-reanimated

cd ../..
yarn
```

You can also install the native library inside of `packages/app` if you want to get autoimport for that package inside of the `app` folder. However, you need to be careful and install the _exact_ same version in both packages. If the versions mismatch at all, you'll potentially get terrible bugs. This is a classic monorepo issue. I use `lerna-update-wizard` to help with this (you don't need to use Lerna to use that lib).

## Getting started

### Prerequisites

You'll need a [Convex](https://www.convex.dev/) account, a [Stripe](https://stripe.com/) account and a [WorkOS](https://workos.com/) account.

### Install dependencies

```bash
pnpm install
```

### Run the setup script

```bash
pnpm run setup
```

### Start the development server

```bash
pnpm run dev
```

## Tech stack

- Framework: Next.js
- Database: Convex
- Authentication: AuthKit by WorkOS
- Payments: Stripe

## App flow

After viewing your marketing splash page (`/`) and pricing page (`/pricing`), users sign up before choosing a plan. This is so we can create an organization and link it to a Stripe customer.

Once signed up, users with the "admin" role can access the dashboard (`/dashboard`) where they can manage users, configure SSO and billing, and view audit logs. Note that in the default example, audit logs are only accessible when subscribed to the "Enterprise" plan.

Users without the "admin" role are instead redirected to the product page (`/product`) where they can interact with your product.

## Testing

When running locally or using staging, use the following test card numbers for the Stripe Checkout flow:

- Card number: 4242 4242 4242 4242
- CVC: Any 3 digits
- Expiration Date: Any future date
- ZIP: Any 5 digits

## Deploying

### 🚀 Unified Vercel Deployment (Next.js + FastAPI)

This project is configured to deploy both the Next.js frontend and FastAPI backend to a single Vercel deployment.

**Quick Deploy:**

```bash
vercel
```

For detailed instructions, see:

- **[Quick Start Guide](DEPLOYMENT_QUICK_START.md)** - Fast deployment reference
- **[Complete Deployment Guide](VERCEL_DEPLOYMENT.md)** - Detailed setup and configuration
- **[Setup Summary](SETUP_SUMMARY.md)** - Architecture overview and what was configured
- **[API Integration Examples](NEXT_API_EXAMPLE.md)** - How to call the FastAPI from Next.js

**Deployment Structure:**

- Frontend: All routes handled by Next.js (e.g., `/`, `/dashboard`, `/pricing`)
- Backend: All `/api/*` routes proxied to FastAPI serverless functions
- Single domain, no CORS issues, automatic scaling

**After Deployment:**

- Next.js App: `https://yourdomain.com/`
- API Docs: `https://yourdomain.com/api/`
- Swagger UI: `https://yourdomain.com/api/docs`
- Scalar UI: `https://yourdomain.com/api/scalar`

Refer to the [Convex documentation](https://docs.convex.dev/production) for Convex-specific deployment instructions.

Remember to use your production API keys for both Stripe and WorkOS before deploying to production.

## Need to Sync more data?

Learn more about the syncing system that connects [AuthKit](https://www.authkit.com/) and [Convex](https://www.convex.dev/).

1. In the [WorkOS dashboard](https://dashboard.workos.com), head to the Redirects tab and create a [sign-in callback redirect](https://workos.com/docs/user-management/1-configure-your-project/configure-a-redirect-uri) for `http://localhost:3000/callback` and set the app homepage URL to `http://localhost:3000`.

2. After creating the redirect URI, navigate to the API keys tab and copy the _Client ID_ and the _Secret Key_. Rename the `.env.local.example` file to `.env.local` and supply your Client ID and API key as environment variables.

3. Additionally, create a cookie password as the private key used to encrypt the session cookie. Copy the output into the environment variable `WORKOS_COOKIE_PASSWORD`.

   It has to be at least 32 characters long. You can use https://1password.com/password-generator/ to generate strong passwords.

4. Verify your `.env.local` file has the following variables filled.

   ```bash
   WORKOS_CLIENT_ID=<YOUR_CLIENT_ID>
   WORKOS_API_KEY=<YOUR_API_SECRET_KEY>
   WORKOS_COOKIE_PASSWORD=<YOUR_COOKIE_PASSWORD>

   NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
   ```

5. Run the following command and navigate to [http://localhost:3000](http://localhost:3000).

   ```bash
   npm run dev
   ```
