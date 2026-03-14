import type { Drink } from '../lib/bac';

interface DrinkLogProps {
  drinks: Drink[];
  onRemove: (id: string) => void;
}

export function DrinkLog({ drinks, onRemove }: DrinkLogProps) {
  if (drinks.length === 0) {
    return (
      <div className="animate-fade-in text-center py-16">
        <p className="text-4xl mb-4">🌙</p>
        <p className="text-text-secondary">No drinks logged today</p>
        <p className="text-sm text-text-muted mt-1">
          Head to Home to log your first drink
        </p>
      </div>
    );
  }

  // Show in reverse chronological order
  const sorted = [...drinks].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="animate-fade-in space-y-2 py-2">
      <h2 className="text-sm font-medium text-text-secondary mb-3">
        Today's drinks ({drinks.length})
      </h2>
      {sorted.map((drink) => {
        const time = new Date(drink.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        return (
          <div
            key={drink.id}
            className="glass p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-purple/15 flex items-center justify-center">
                <span className="text-accent-purple font-semibold">
                  {drink.standardDrinks.toFixed(drink.standardDrinks % 1 === 0 ? 0 : 1)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {drink.standardDrinks === 1
                    ? '1 standard drink'
                    : `${drink.standardDrinks} standard drinks`}
                </p>
                <p className="text-xs text-text-muted">{timeStr}</p>
              </div>
            </div>
            <button
              onClick={() => onRemove(drink.id)}
              className="text-text-muted hover:text-accent-red transition-colors px-2 py-1 text-sm"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
