import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Code } from '@/components/messages/code';

export function Markdown({ children }: { children: React.ReactNode }) {
  return (
    <ReactMarkdown
      components={{
        code: Code,

        hr: () => <hr className="my-10 border-border" />,

        p: ({ children }) => (
          <p className="my-4 whitespace-pre-wrap leading-[1.8] last:mb-0">
            {children}
          </p>
        ),

        ul: ({ children }) => (
          <ul className="mb-4 list-disc pl-5 last:mb-0">{children}</ul>
        ),

        ol: ({ children }) => (
          <ol className="mb-4 list-decimal pl-5 last:mb-0">{children}</ol>
        ),

        li: ({ children }) => (
          <li className="mb-1 pl-2 leading-[1.8] last:mb-0">{children}</li>
        ),

        h1: ({ children }) => (
          <h1 className="mt-6 mb-4 font-bold text-2xl last:mb-0">{children}</h1>
        ),

        h2: ({ children }) => (
          <h2 className="mt-5 mb-3 font-bold text-xl last:mb-0">{children}</h2>
        ),

        h3: ({ children }) => (
          <h3 className="mt-4 mb-3 font-bold text-lg last:mb-0">{children}</h3>
        ),

        h4: ({ children }) => (
          <h4 className="mt-3 mb-2 font-bold text-base last:mb-0">
            {children}
          </h4>
        ),

        h5: ({ children }) => (
          <h5 className="mt-3 mb-2 font-bold text-sm last:mb-0">{children}</h5>
        ),

        h6: ({ children }) => (
          <h6 className="mt-3 mb-2 font-bold text-xs last:mb-0">{children}</h6>
        ),

        blockquote: ({ children }) => (
          <blockquote className="my-6 border-primary border-l-4 bg-muted py-2 pl-4 italic last:mb-0">
            {children}
          </blockquote>
        ),

        table: ({ children }) => (
          <div className="my-6 overflow-hidden rounded-lg border border-border last:mb-0">
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
            className="text-blue-600 hover:underline dark:text-blue-400"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
          </a>
        ),
      }}
      rehypePlugins={[rehypeKatex]}
      remarkPlugins={[remarkMath, remarkGfm]}
    >
      {String(children)}
    </ReactMarkdown>
  );
}
