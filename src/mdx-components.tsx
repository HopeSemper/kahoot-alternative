import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-[#5E17EB]">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold my-4 text-[#111827]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold my-3 text-[#111827]">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-relaxed text-[#374151]">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-[#374151]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-[#374151]">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-1">{children}</li>,
    ...components,
  }
}
