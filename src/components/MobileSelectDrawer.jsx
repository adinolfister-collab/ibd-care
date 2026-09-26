import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Bottom-sheet select for mobile WebViews, mirroring the MobileSelect pattern
// in EntityFormDialog.jsx: a trigger button opens a Vaul Drawer with a
// scrollable, check-marked list. On desktop the parent keeps using Radix
// Select popovers; this component only renders on small screens.
//
// Props:
//   value           current value
//   options         [{ value, label }]
//   onChange(value) callback with the chosen value
//   placeholder     label shown when no option matches
//   title           Drawer title (defaults to t('common.select'))
//   triggerClassName box styling (defaults to match ui/select SelectTrigger)
//   icon             optional leading lucide icon
//   disabled         greys out and blocks opening
export default function MobileSelectDrawer({
  value,
  options,
  onChange,
  placeholder,
  title,
  icon: Icon,
  disabled = false,
  triggerClassName,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => String(o.value) === String(value));

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring',
          disabled && 'cursor-not-allowed opacity-50',
          triggerClassName
        )}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-1">
          {Icon ? <Icon className="w-4 h-4 shrink-0" /> : null}
          <span className={cn('truncate text-left', current ? 'text-foreground' : 'text-muted-foreground')}>
            {current ? current.label : placeholder}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-left text-base">{title || t('common.select')}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {options.map((o) => {
              const active = String(o.value) === String(value);
              return (
                <button
                  type="button"
                  key={String(o.value)}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-5 py-4 text-base border-b border-border last:border-0 flex items-center justify-between',
                    active ? 'text-primary font-medium bg-primary/5' : 'hover:bg-accent'
                  )}
                >
                  {o.label}
                  {active && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}