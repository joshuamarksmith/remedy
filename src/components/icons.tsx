// Minimal inline icon set (stroke-based, currentColor) — no icon dependency.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...props }: P) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

// A kettlebell — the app's signature mark.
export function Kettlebell({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M9 7.5a3 3 0 0 1 6 0" />
      <path d="M8.5 8.2C6.4 9.4 5 11.8 5 14.5 5 17.5 7.2 19.5 12 19.5s7-2 7-5c0-2.7-1.4-5.1-3.5-6.3" />
      <circle cx="12" cy="14.5" r="2.2" />
    </svg>
  );
}

export function Today({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M12 3c.7 2.5-.5 3.8-1.6 5C9 9.6 8 11 8 13a4 4 0 0 0 8 0c0-1.3-.5-2.4-1-3 .2 1-.3 1.8-1 2 .5-1.6-.2-3.4-2-4.8.3 1.4-.2 2.3-1 3-.1-1.6 1.7-3.6 2-7.2Z" />
    </svg>
  );
}

export function Calendar({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

export function Book({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M5 4.5h9a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H5Z" />
      <path d="M5 4.5V20" />
    </svg>
  );
}

export function Chart({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M4 20V5M4 20h16" />
      <path d="M8 16v-3M12 16V8M16 16v-5M20 16v-7" />
    </svg>
  );
}

export function Gear({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" />
    </svg>
  );
}

export function Play({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M7 5.5 18 12 7 18.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Pause({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <rect x="7" y="5.5" width="3.2" height="13" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.8" y="5.5" width="3.2" height="13" rx="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Check({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M5 12.5 10 17.5 19 6.5" />
    </svg>
  );
}

export function Close({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function Plus({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Minus({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function ChevronRight({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronDown({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

export function ArrowLeft({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function Download({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M12 4v11M8 11l4 4 4-4M5 20h14" />
    </svg>
  );
}

export function Upload({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M12 16V5M8 9l4-4 4 4M5 20h14" />
    </svg>
  );
}

export function Timer({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9M9.5 2.5h5M19 6l1.5-1.5" />
    </svg>
  );
}

export function Flame({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M12 3c.7 2.5-.5 3.8-1.6 5C9 9.6 8 11 8 13a4 4 0 0 0 8 0c0-1.3-.5-2.4-1-3 .2 1-.3 1.8-1 2 .5-1.6-.2-3.4-2-4.8.3 1.4-.2 2.3-1 3-.1-1.6 1.7-3.6 2-7.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Trophy({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M7 4.5h10v3a5 5 0 0 1-10 0Z" />
      <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3M12 12.5V16M9 19.5h6M10 16h4l.5 3.5h-5Z" />
    </svg>
  );
}

export function Info({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.6v.4" />
    </svg>
  );
}

export function Skip({ size = 24, ...props }: P) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M6 5l8 7-8 7ZM17 5v14" />
    </svg>
  );
}
