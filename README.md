# Speed Chat

A fully featured AI chat app built with [Convex](https://www.convex.dev/) and [Next.js](https://nextjs.org/).

## 📦 Setup

1. Clone this repository

2. Run `bun install` to install the dependencies

3. Run `bun convex:dev` to create a new Convex project and start the Convex development server

4. Get your Google client ID and secret from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Refer to the [Convex Auth](https://labs.convex.dev/auth/config/oauth/google) Google OAuth docs for more information.

5. Set the following environment variables in Convex using `bunx convex env set <var_key> <var_value>`:

   - `OPENROUTER_API_KEY` (required for chat title generation)
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`

6. Run `bun dev` to start the development server

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the live web app

8. After logging in, navigate to [http://localhost:3000/settings/keys](http://localhost:3000/settings/keys) to set your API keys

9. Start chatting!

## 📝 Todos

- [ ] Resumable streams
- [ ] Image gen with gpt-image-1
- [ ] Images & PDF attachment support
- [ ] Branching
- [ ] Sharing chats
- [ ] Pin, delete threads
- [ ] Chat context counter
- [ ] Add metadata per assistant message like TPS, tokens, model
- [ ] PWA support
- [ ] Keyboard shortcuts
