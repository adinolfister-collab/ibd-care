import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SocialShare from '@/components/SocialShare';

// Top-right cluster: login entry for visitors, social share for logged-in users.
export default function TopRightActions() {
  const { isAuthenticated, authChecked } = useAuth();
  if (!authChecked) {
    // Reserve space so the layout doesn't jump once auth resolves.
    return <div className="h-9 w-9" />;
  }
  if (isAuthenticated) {
    return <SocialShare />;
  }
  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
    >
      <LogIn className="w-4 h-4" />
      <span>Accedi</span>
    </Link>
  );
}