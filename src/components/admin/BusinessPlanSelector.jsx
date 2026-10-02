import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Selettore piano Base44 come cards cliccabili; Elite personalizzato mostra
// input per costo e crediti quando selezionato.
export default function BusinessPlanSelector({ plans, selectedId, onSelect, customPlan, onCustomChange }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {plans.map((p) => {
          const active = p.id === selectedId;
          const isCustom = p.custom;
          const showCost = isCustom ? customPlan.cost : p.cost;
          const showMsg = isCustom ? customPlan.msgCredits : p.msgCredits;
          const showInt = isCustom ? customPlan.integrationCredits : p.integrationCredits;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'relative text-left p-3 rounded-2xl border transition-all',
                active
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:bg-accent'
              )}
            >
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <p className="font-heading font-semibold text-sm pr-5">{p.name}</p>
              <p className="text-lg font-heading font-bold mt-0.5">${showCost}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              <div className="text-[0.65rem] text-muted-foreground mt-1.5 space-y-0.5">
                <p>{showMsg.toLocaleString('it-IT')} crediti msg</p>
                <p>{showInt.toLocaleString('it-IT')} crediti integ.</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedId === 'elite_custom' && (
        <div className="grid grid-cols-3 gap-3 mt-3 p-3 rounded-2xl bg-accent">
          <div>
            <Label className="text-xs">Costo $/mo</Label>
            <Input type="number" step="1" value={customPlan.cost} onChange={(e) => onCustomChange({ ...customPlan, cost: Number(e.target.value) })} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs">Crediti messaggi</Label>
            <Input type="number" step="1" value={customPlan.msgCredits} onChange={(e) => onCustomChange({ ...customPlan, msgCredits: Number(e.target.value) })} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs">Crediti integrazione</Label>
            <Input type="number" step="1" value={customPlan.integrationCredits} onChange={(e) => onCustomChange({ ...customPlan, integrationCredits: Number(e.target.value) })} className="mt-1 h-9" />
          </div>
        </div>
      )}
    </div>
  );
}