# humanize

## Deps
- node 22, pnpm 10
- Solito https://solito.dev/  https://github.com/nandorojo/solito
- nextjs 16
- react 19.2
- expo sdk 54
- react-native 0.81.5


npm i -g eas-cli
pnpx expo install expo@^54.0.0 --fix
pnpx expo-doctor@latest


# Blank Solito Example Monorepo 🕴

```sh
npx create-solito-app@latest my-solito-app
```

👾 [View the website](https://example.solito.dev)

## ⚡️ Instantly clone & deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnandorojo%2Fsolito%2Ftree%2Fmaster%2Fexample-monorepos%2Fblank&env=ENABLE_ROOT_PATH_BUILD_CACHE&root-directory=apps/next&envDescription=Set%20this%20environment%20variable%20to%201%20for%20Turborepo%20to%20cache%20your%20node_modules.&envLink=https%3A%2F%2Ftwitter.com%2Fjaredpalmer%2Fstatus%2F1488954563533189124&project-name=solito-app&repo-name=solito-app&demo-title=Solito%20App%20%E2%9A%A1%EF%B8%8F&demo-description=React%20Native%20%2B%20Next.js%20starter%20with%20Solito.%20Made%20by%20Fernando%20Rojo.&demo-url=https%3A%2F%2Fsolito.dev%2Fstarter&demo-image=https%3A%2F%2Fsolito.dev%2Fimg%2Fog.png&build-command=cd+..%2F..%3Bnpx+turbo+run+build+--filter%3Dnext-app)

## 🔦 About

This monorepo is a blank(ish) starter for an Expo + Next.js app.

While it's pretty barebones, it does a lot of the annoying config for you. The folder structure is opinionated, based on my long experience building for this stack.

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
  - Runs `yarn next`
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

## 🎙 About the creator

Follow Fernando Rojo on Twitter: [@FernandoTheRojo](https://twitter.com/fernandotherojo)

## 🧐 Why use Expo + Next.js?

See my talk about this topic at Next.js Conf 2021:

<a href="https://www.youtube.com/watch?v=0lnbdRweJtA"><img width="1332" alt="image" src="https://user-images.githubusercontent.com/13172299/157299915-b633e083-f271-48c6-a262-7b7eef765be5.png">
</a>


###########

<p align="center">
  <img src="./public/splash_page.jpeg" alt="Screenshot of splash page"/>
  <h1 align="center">Next.js B2B Starter Kit</h1>
</p>

<p align="center">
  A fully functional B2B SaaS template built with Next.js, Stripe, Convex, and WorkOS.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"/>
  </a>
  <a href="https://next-b2b-starter-kit.vercel.app/">
    <img src="https://img.shields.io/badge/Demo-Website-blue" alt="Demo: Website"/>
  </a>
</p>

<p align="center">
  Demo: <a href="https://next-b2b-starter-kit.vercel.app/">https://next-b2b-starter-kit.vercel.app/</a>
</p>

<p align="center">
  Read about the <a href="https://workos.com/blog/nextjs-b2b-starter-kit">Next.js B2B Starter Kit</a> on the WorkOS blog.
</p>

## Features

- Marketing splash page (`/`)
- Pricing page (`/pricing`) which allows signed in users to subscribe via Stripe Checkout
- Dashboard page (`/dashboard`) which is only accessible to admin users. Includes CRUD for users, audit logs and configuring SSO and billing
- Product page (`/product`) which is only accessible to signed in users
- Role-based access control
- Audit logs
- Billing
- Webhook syncing to Convex

## Getting started

### Prerequisites

You'll need a [Convex](https://www.convex.dev/) account, a [Stripe](https://stripe.com/) account and a [WorkOS](https://workos.com/) account.

### Clone the repo

```bash
git clone https://github.com/workos/next-b2b-starter-kit.git
```

### Navigate to the project directory

```bash
cd next-b2b-starter-kit
```

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

When running locally or using the deployed [demo app](https://b2b-starter-kit.vercel.app/), use the following test card numbers for the Stripe Checkout flow:

- Card number: 4242 4242 4242 4242
- CVC: Any 3 digits
- Expiration Date: Any future date
- ZIP: Any 5 digits

## Deploying

Once you're ready to deploy your app, refer to the [Convex documentation](https://docs.convex.dev/production) for instructions on deploying to hosted solutions like Vercel.

Remember to use your production API keys for both Stripe and WorkOS before deploying to production.

## Need to Sync more data?

Learn more about the syncing system that connects [AuthKit](https://www.authkit.com/) and [Convex](https://www.convex.dev/).

We made a short video series that covers the full integration.
Check it out on [YouTube](https://youtu.be/GGwBSu0XmP0?feature=shared).

[![Sync Data with Webhooks](https://github.com/user-attachments/assets/7a2f2098-fc57-42d1-89dc-f0f00777857a)](https://youtu.be/GGwBSu0XmP0?feature=shared)
