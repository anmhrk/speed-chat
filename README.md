# Speed Chat

A fully featured AI chat app built with [Convex](https://www.convex.dev/) and [Next.js](https://nextjs.org/).

## 📦 Setup

1. Clone the repository

2. Run `bun install` to install the dependencies

3. Run `bun convex:dev` which will guide you through setting up a new Convex project and start the Convex development server

4. Follow the steps in the [Convex Auth](https://labs.convex.dev/auth/setup) docs to setup Convex Auth for your project

5. Set the following environment variables in Convex using `bunx convex env set <variable_key> <variable_value>`:

   - `OPENROUTER_API_KEY` (needed for title generation)
   - `AUTH_GOOGLE_ID` (required for Google OAuth)
   - `AUTH_GOOGLE_SECRET` (required for Google OAuth)

6. Run `bun dev` to start the development server

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the live web app.

8. After logging in, navigate to [http://localhost:3000/settings/keys](http://localhost:3000/settings/keys) to set your API keys.

9. Start chatting!

## 📝 Todos

- [ ] Resumable streams
- [ ] Image gen with gpt-image-1
- [ ] PDF attachment support
- [ ] Branching
- [ ] Sharing chats
- [ ] Pin, delete threads
- [ ] Chat context counter
- [ ] Add metadata per assistant message like TPS, tokens, model
- [ ] PWA support
