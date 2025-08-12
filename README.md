# Speed Chat

An AI chat application built with Next.js 15, Convex, and AI SDK v5, featuring multiple AI models, attachment support, web search, and built in image generation.

## 🚀 Features

- **Multiple AI Models** - Support for OpenAI, Anthropic, Google, Meta, DeepSeek, Grok models and more via Vercel AI Gateway
- **Web Search Integration** - Enhanced responses with real-time web search using Exa
- **File Upload Support** - Upload and send images with your messages
- **Image Generation** - Built-in support for GPT Image 1 to edit and create images
- **Persistent Chat History** - Fully synced chat history to use across devices
- **Branching Conversations** - Create a new chat from an existing message in a chat
- **Search Chats** - Search through your chat history and messages
- **Formatting** - Beautiful formatting of code, latex, tables in AI responses to improve chat experience

## 🛠 Tech Stack

- [Next.js 15 App Router](https://nextjs.org) - Full stack React framework with server components/actions and api routes
- [React 19](https://react.dev) - Latest React
- [Convex](https://www.convex.dev) - Reactive backend as a service platform
- [TailwindCSS v4](https://tailwindcss.com) - Inline CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Modern component library built on Radix UI
- [Convex Auth](https://labs.convex.dev/auth) - Native authentication library for Convex
- [AI SDK](https://ai-sdk.dev) - Typescript AI toolkit to build AI applications
- [Exa](https://exa.ai) - AI powered web search API

### 🤖 AI Models Supported

- **OpenAI** - GPT 5, GPT 5 mini, GPT Image 1
- **Anthropic** - Claude Sonnet 4, Claude Opus 4.1
- **Google** - Gemini 2.5 Flash, Gemini 2.5 Pro

## 📦 Getting Started

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/anmhrk/speed-chat.git
cd speed-chat
bun install # or whatever package manager you prefer
```

2. Start the development server:

```bash
bun dev # app will be available at http://localhost:3000
```

3. Setup + start the Convex development server:

```bash
bun convex:dev # this will auto set the required env vars for you too
```

4. Make sure you have the env vars in `.env.example` setup in your `.env` or `.env.local` file.

5. Follow the instructions in the [Convex Auth](https://labs.convex.dev/auth/setup) guide to set up Google OAuth.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
