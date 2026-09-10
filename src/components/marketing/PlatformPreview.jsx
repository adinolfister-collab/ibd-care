import React from 'react';
import { HeartPulse, ThumbsUp, MessageCircle, Send, Bookmark, MoreHorizontal, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

// Anteprima formattata come apparirebbe su ciascuna piattaforma.
// post = { text, hashtags: [], cta }
function assembled(post) {
  if (!post) return '';
  const parts = [post.text];
  if (Array.isArray(post.hashtags) && post.hashtags.length) parts.push(post.hashtags.join(' '));
  return parts.join('\n');
}

export default function PlatformPreview({ platform, post }) {
  const text = assembled(post);
  if (!post || !post.text) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nessun post generato per questa piattaforma.
      </div>
    );
  }
  switch (platform) {
    case 'facebook':
      return <FacebookPreview text={text} />;
    case 'linkedin':
      return <LinkedInPreview text={text} />;
    case 'x':
      return <XPreview text={text} />;
    case 'instagram':
      return <InstagramPreview text={text} />;
    default:
      return null;
  }
}

function Avatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-terracotta/40 flex items-center justify-center shrink-0">
      <HeartPulse className="w-5 h-5 text-primary" />
    </div>
  );
}

function FacebookPreview({ text }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-3 flex items-start gap-2.5">
        <Avatar />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight">IBD Care</p>
          <p className="text-[0.7rem] text-muted-foreground">Promosso · ora</p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="px-3 pb-3 text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
      <div className="h-32 bg-gradient-to-br from-primary/10 via-terracotta/10 to-accent/40 flex items-center justify-center">
        <HeartPulse className="w-10 h-10 text-primary/40" />
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-t border-border">
        <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-blue-600" /> Piace</span>
        <span>12 commenti · 4 condivisioni</span>
      </div>
      <div className="grid grid-cols-3 border-t border-border text-xs font-medium">
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><ThumbsUp className="w-4 h-4" /> Mi piace</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><MessageCircle className="w-4 h-4" /> Commenta</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><Send className="w-4 h-4" /> Condividi</button>
      </div>
    </div>
  );
}

function LinkedInPreview({ text }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-3 flex items-start gap-2.5">
        <Avatar />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight">IBD Care</p>
          <p className="text-[0.7rem] text-muted-foreground">Health & wellness · 1° · ora</p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="px-3 pb-3 text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
      <div className="h-28 bg-gradient-to-br from-sky-100 to-primary/10 flex items-center justify-center gap-2 text-primary/50">
        <Briefcase className="w-8 h-8" />
        <span className="text-sm font-medium">ibd-care.it</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-t border-border">
        <span>👍 48 · ❤️ 12</span>
        <span>3 commenti</span>
      </div>
      <div className="grid grid-cols-4 border-t border-border text-xs font-medium">
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><ThumbsUp className="w-4 h-4" /> Consiglia</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><MessageCircle className="w-4 h-4" /> Commenta</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><Send className="w-4 h-4" /> Invia</button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-accent"><Bookmark className="w-4 h-4" /> Salva</button>
      </div>
    </div>
  );
}

function XPreview({ text }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <Avatar />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm leading-tight">IBD Care</p>
            <span className="text-muted-foreground text-sm">@ibdcare</span>
            <span className="text-muted-foreground text-sm">· ora</span>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed mt-0.5">{text}</p>
          <div className="flex items-center gap-4 mt-3 text-muted-foreground text-xs">
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 8</span>
            <span className="flex items-center gap-1"><Send className="w-3.5 h-3.5" /> 5</span>
            <span className="flex items-center gap-1"><HeartPulse className="w-3.5 h-3.5" /> 32</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ text }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-2.5 flex items-center gap-2.5">
        <Avatar />
        <p className="font-semibold text-sm leading-tight">ibdcare</p>
        <MoreHorizontal className="w-4 h-4 text-muted-foreground ml-auto" />
      </div>
      <div className="aspect-square bg-gradient-to-br from-primary/20 via-terracotta/20 to-pink-200 flex items-center justify-center">
        <HeartPulse className="w-16 h-16 text-primary/40" />
      </div>
      <div className="flex items-center gap-4 px-3 py-2">
        <HeartPulse className="w-5 h-5" />
        <MessageCircle className="w-5 h-5" />
        <Send className="w-5 h-5" />
        <Bookmark className="w-5 h-5 ml-auto" />
      </div>
      <p className="px-3 pb-3 text-sm whitespace-pre-wrap leading-relaxed">
        <span className="font-semibold">ibdcare</span> {text}
      </p>
    </div>
  );
}

export function CopyButton({ text, onCopy, className }) {
  return (
    <button
      onClick={() => onCopy(text)}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
        className
      )}
    >
      Copia
    </button>
  );
}