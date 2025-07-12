# Speed Chat

An AI chat application built with Next.js 15, featuring multiple AI models, attachment support, web search, and even image generation.

## 🚀 Features

- **Multiple AI Models** - Support for OpenAI, Anthropic, Google, Meta, DeepSeek, Grok models and more via OpenRouter
- **Web Search Integration** - Enhanced responses with real-time web search using Exa
- **File Upload Support** - Upload and send images (PNG, JPEG, WebP) and PDFs to models that support them
- **Image Generation** - Built-in support for GPT Image 1 and FLUX Pro v1.1 Ultra
- **Persistent Chat History** - Fully synced chat history to use across devices
- **Memory** - Automically saves memories to use in future conversations
- **Branching Conversations** - Create multiple versions of the same chat
- **Advanced Customization** - Set custom instructions to personalize conversations
- **BYOK** - Bring your own API keys - OpenRouter, OpenAI (for o3 and GPT Image 1), and FalAI
- **Search Chats** - Search through your chat history and messages
- **Temporary Chat** - Create a temporary chat that does not save to your chat history
- **Chat Sharing** - Share a chat so others can view and fork it to create their own copy
- **Formatting** - Beautiful formatting of code, latex, tables in AI responses to improve chat experience
- **Prompt Enhancement** - One click prompt enhancement button to improve your prompts for better responses

## 🛠 Tech Stack

### Frontend

- [Next.js 15 App Router](https://nextjs.org) - Full stack React framework with server components/actions and api routes
- [React 19](https://react.dev) - Latest React
- [TailwindCSS v4](https://tailwindcss.com) - Inline CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Modern component library built on Radix UI
- [Kibo UI](https://www.kibo-ui.com/) - UI component library for use with shadcn/ui
- [Tanstack Query](https://tanstack.com/query/latest) - Efficient data fetching and caching
- [Shiki Highlighter](https://github.com/AVGVSTVS96/react-shiki) - Syntax highlighting for code blocks
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering

### Backend

- [Neon Postgres](https://neon.tech) - Serverless Postgres database
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe database and schema management
- [Better Auth](https://better-auth.com) - Modern authentication solution
- [UploadThing](https://uploadthing.com) - File uploads
- [AI SDK](https://ai-sdk.dev) - Typescript AI toolkit to build AI applications
- [Exa API](https://exa.ai) - Real-time web search API
- [Zod](https://zod.dev) - Type-safe data validation
- [T3 Env](https://env.t3.gg) - Type-safe environment variables management

### AI Models Supported

- **OpenAI** - GPT-4.1, GPT-4.1-mini, GPT-4.1-nano, o4-mini, o3, GPT-Image-1
- **Anthropic** - Claude 4 Sonnet/Opus, thinking models
- **Google** - Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemini 2.5 Pro
- **Meta** - Llama 4 Maverick/Scout
- **DeepSeek** - DeepSeek v3, DeepSeek R1
- **Grok** - Grok 4, Grok 3, Grok 3 Mini
- **Qwen** - Qwen 3 235B, Qwen 3 32B
- **FalAI** - FLUX Pro v1.1 Ultra
- **Moonshot** - Kimi K2

## 📦 Getting Started

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/anmhrk/speed-chat.git
cd speed-chat
bun install # or whatever package manager you prefer
```

2. Copy the .env.example file to .env:

```bash
cp .env.example .env
```

3. Set up your environment variables:

```bash
# Database
DATABASE_URL=your_neon_postgresql_connection_string

# Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# UploadThing
UPLOADTHING_TOKEN=your_uploadthing_token

# Optional
SITE_URL=http://localhost:3000 # only really needed for production and only used to send headers to OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key # used as fallback to generate chat titles in case not locally set and using a non-OpenRouter model
```

4. Push schema to database:

```bash
bun db:push
```

5. Start the development server:

```bash
bun dev # app will be available at http://localhost:3000
```

## 📝 Todos

- [ ] Migrate to AI SDK v5 once stable
- [x] Add message metadata per assistant message which displays tps, ttft, tokens in, tokens out
- [ ] Resumable streams if lost connection or refresh while streaming
- [ ] Synced stream to follow on any tab or device
- [x] Allow send empty message if attachments are present

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
