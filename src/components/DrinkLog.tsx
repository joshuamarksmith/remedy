import { memo, useMemo } from 'react';
import { DRINK_PRESETS, type Drink } from '../lib/bac';
import { formatTime, formatDrinkCount } from '../lib/theme';

interface DrinkLogProps {
  drinks: Drink[];
  onRemove: (id: string) => void;
}

export const DrinkLog = memo(function DrinkLog({ drinks, onRemove }: DrinkLogProps) {
  const sorted = useMemo(
    () => [...drinks].sort((a, b) => b.timestamp - a.timestamp),
    [drinks]
  );

  if (drinks.length === 0) {
    return (
      <div className="animate-fade-in text-center py-16">
        <p className="text-4xl mb-4 text-text-muted">○</p>
        <p className="text-text-secondary">No drinks logged today</p>
        <p className="text-sm text-text-muted mt-1">
          Head to Home to log your first drink
        </p>
      </div>
    );
  }

  return (
    <div className="stagger-children space-y-2 py-2">
      <h2 className="text-sm font-medium text-text-secondary mb-3">
        Today's drinks ({drinks.length})
      </h2>
      {sorted.map((drink) => (
        <div key={drink.id} className="card p-3 flex items-center justify-between press-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-teal/15 flex items-center justify-center">
              <span className="text-accent-teal font-semibold text-lg">
                {drink.drinkType && drink.drinkType !== 'custom' ? DRINK_PRESETS[drink.drinkType].icon : formatDrinkCount(drink.standardDrinks)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {drink.drinkType && drink.drinkType !== 'custom'
                  ? DRINK_PRESETS[drink.drinkType].label
                  : drink.standardDrinks === 1
                    ? '1 standard drink'
                    : `${formatDrinkCount(drink.standardDrinks)} standard drinks`}
              </p>
              <p className="text-xs text-text-muted">
                {formatTime(drink.timestamp)}
                {drink.drinkType && drink.drinkType !== 'custom' && drink.standardDrinks !== 1 && (
                  <> · {formatDrinkCount(drink.standardDrinks)} std</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onRemove(drink.id)}
            className="text-text-muted hover:text-accent-red transition-colors px-2 py-1 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
});
