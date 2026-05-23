import "server-only";

interface JsonLdProps {
  data: object | object[];
}

/**
 * Server-only helper that emits a <script type="application/ld+json"> tag.
 * Use one tag per logical schema entity for clarity in Rich Results testing.
 */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((entry, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
