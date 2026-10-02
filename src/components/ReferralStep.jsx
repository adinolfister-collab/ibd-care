import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE_BASE } from '@/lib/seo';
import { base44 } from '@/api/base44Client';

// One-time full-screen step shown after successful OTP verification, before
// redirecting to the app. Invites the newly-registered user to share IBD Care
// with someone else who has Crohn's or Colitis. Tracks the share click as the
// 'referral_shared' analytics event. `onDone` performs the final redirect.
export default function ReferralStep({ onDone }) {
  const shareText = "Do you know someone else with Crohn's or Colitis? Invite them to IBD Care - it's free.";
  const shareUrl = SITE_BASE || 'https://ibd-care.it';
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

  const handleShare = () => {
    try { base44.analytics.track({ eventName: 'referral_shared' }); } catch (e) { /* non blocking */ }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-terracotta/15 flex items-center justify-center">
          <Heart className="w-7 h-7 text-terracotta" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight mb-3">
          {shareText}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          A small share could help someone else take control of their condition.
        </p>
        <Button
          onClick={handleShare}
          className="w-full h-12 font-medium bg-[#25D366] hover:bg-[#1da851] text-white border-0"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Share on WhatsApp
        </Button>
        <button
          onClick={onDone}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}