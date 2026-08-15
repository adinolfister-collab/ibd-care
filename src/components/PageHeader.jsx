import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-base text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}