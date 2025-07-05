import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { CodeBlock } from "@/components/assistant-message";

export function Markdown({ children }: { children: React.ReactNode }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code: CodeBlock,

        hr: () => <hr className="border-border my-10" />,

        p: ({ children }) => (
          <p className="my-4 whitespace-pre-wrap last:mb-0 leading-[1.8]">
            {children}
          </p>
        ),

        ul: ({ children }) => (
          <ul className="mb-4 list-disc pl-5">{children}</ul>
        ),

        ol: ({ children }) => (
          <ol className="mb-4 list-decimal pl-5">{children}</ol>
        ),

        li: ({ children }) => (
          <li className="mb-1 pl-2 leading-[1.8]">{children}</li>
        ),

        h1: ({ children }) => (
          <h1 className="mt-6 mb-4 text-2xl font-bold">{children}</h1>
        ),

        h2: ({ children }) => (
          <h2 className="mt-5 mb-3 text-xl font-bold">{children}</h2>
        ),

        h3: ({ children }) => (
          <h3 className="mt-4 mb-3 text-lg font-bold">{children}</h3>
        ),

        h4: ({ children }) => (
          <h4 className="mt-3 mb-2 text-base font-bold">{children}</h4>
        ),

        h5: ({ children }) => (
          <h5 className="mt-3 mb-2 text-sm font-bold">{children}</h5>
        ),

        h6: ({ children }) => (
          <h6 className="mt-3 mb-2 text-xs font-bold">{children}</h6>
        ),

        blockquote: ({ children }) => (
          <blockquote className="border-primary bg-muted my-6 border-l-4 py-2 pl-4 italic">
            {children}
          </blockquote>
        ),

        table: ({ children }) => (
          <div className="border-border my-6 overflow-hidden rounded-lg border last:mb-0">
            <table className="min-w-full border-collapse">{children}</table>
          </div>
        ),

        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),

        tbody: ({ children }) => <tbody>{children}</tbody>,

        th: ({ children }) => (
          <th className="border-border border-r border-b px-4 py-2 text-left font-semibold last:border-r-0">
            {children}
          </th>
        ),

        td: ({ children }) => (
          <td className="border-border border-r border-b px-4 py-2 last:border-r-0 [tr:last-child>&]:border-b-0">
            {children}
          </td>
        ),

        a: ({ children, href }) => (
          <a
            href={href}
            className="dark:text-blue-400 text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {String(children)}
    </ReactMarkdown>
  );
}
