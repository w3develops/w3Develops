/**
 * Structured data (https://schema.org) that search engines and AI tools read
 * to understand a page. `<` is escaped so text in the data can't end the tag.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
