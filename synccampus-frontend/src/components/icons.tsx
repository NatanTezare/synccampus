import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const BusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="5" width="17" height="12" rx="2.5" />
    <path d="M3.5 11h17M7 17v2M17 17v2" />
    <circle cx="7.5" cy="19.2" r="1.3" />
    <circle cx="16.5" cy="19.2" r="1.3" />
    <path d="M7 8h3M14 8h3" />
  </svg>
);

export const MapPinIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 105 9.5C5 14.9 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const SeatIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 4v9a2 2 0 002 2h6" />
    <path d="M8 15v4M16 15v4M6 15h12l1 5H5l1-5z" />
    <path d="M16 4v11" />
  </svg>
);

export const CheckCircleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.3l2.4 2.4 4.6-5.2" />
  </svg>
);

export const AlertCircleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v5M12 16h.01" />
  </svg>
);

export const TicketIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3.5 8.5a2 2 0 012-2h13a2 2 0 012 2v1.8a1.8 1.8 0 000 3.4v1.8a2 2 0 01-2 2h-13a2 2 0 01-2-2v-1.8a1.8 1.8 0 000-3.4V8.5z" />
    <path d="M14.5 6.5v11" strokeDasharray="2 2.5" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const BuildingIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M8 7h1.5M14.5 7H16M8 11h1.5M14.5 11H16M8 15h1.5M14.5 15H16M10 21v-4h4v4" />
  </svg>
);

export const LoaderIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2.25} {...props}>
    <path d="M12 3.5a8.5 8.5 0 108.5 8.5" />
  </svg>
);

export const RouteIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="5.5" cy="6" r="1.8" />
    <circle cx="18.5" cy="18" r="1.8" />
    <path d="M5.5 7.8V13a3 3 0 003 3h5a3 3 0 013 3v-.2" strokeDasharray="3 3" />
  </svg>
);
