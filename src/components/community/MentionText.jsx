import React from 'react';

// Renderizza il testo di un messaggio evidenziando le @menzioni come chip
// cliccabili (aprono il DM con l'utente menzionato).
export default function MentionText({ content, mentions, onMention }) {
  if (!content) return null;
  if (!mentions || mentions.length === 0) return <span>{content}</span>;

  const names = mentions.map((m) => m.name).filter(Boolean).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (names.length === 0) return <span>{content}</span>;

  const re = new RegExp('@(' + names.join('|') + ')', 'g');
  const parts = [];
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push({ t: 'text', v: content.slice(last, m.index), key: key++ });
    const name = m[1];
    const u = mentions.find((x) => x.name === name);
    parts.push({ t: 'mention', v: name, user: u, key: key++ });
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push({ t: 'text', v: content.slice(last), key: key++ });

  return (
    <span>
      {parts.map((p) =>
        p.t === 'text' ? (
          <span key={p.key}>{p.v}</span>
        ) : (
          <button
            key={p.key}
            type="button"
            onClick={() => onMention && p.user && onMention(p.user)}
            className="inline text-primary font-medium hover:underline"
          >
            @{p.v}
          </button>
        )
      )}
    </span>
  );
}