type IconProps = { size?: number; style?: React.CSSProperties; className?: string };

function base(children: React.ReactNode, { size = 18, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) =>
  base(
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </>,
    p
  );

export const IconPlusCircle = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>,
    p
  );

export const IconUsers = (p: IconProps) =>
  base(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19c.6-3 2.9-5 6.2-5s5.6 2 6.2 5" />
      <circle cx="17" cy="8.6" r="2.6" />
      <path d="M16 13.4c2.6.2 4.6 2 5.2 4.6" />
    </>,
    p
  );

export const IconTrendingUp = (p: IconProps) =>
  base(
    <>
      <path d="m3 16 6-6 4 4 8-9" />
      <path d="M15 5h6v6" />
    </>,
    p
  );

export const IconTrophy = (p: IconProps) =>
  base(
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M9 21h6M9.5 21v-2.2a2 2 0 0 1 1.3-1.9M14.5 21v-2.2a2 2 0 0 0-1.3-1.9" />
    </>,
    p
  );

export const IconLogOut = (p: IconProps) =>
  base(
    <>
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
    p
  );

export const IconChevronRight = (p: IconProps) =>
  base(<path d="m9 18 6-6-6-6" />, p);

export const IconAlertTriangle = (p: IconProps) =>
  base(
    <>
      <path d="M10.3 3.9 1.9 18a1 1 0 0 0 .9 1.5h18.4a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-1.7 0Z" />
      <path d="M12 9v4M12 16.5h.01" />
    </>,
    p
  );

export const IconCheckCircle = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5.1" />
    </>,
    p
  );

export const IconArrowLeft = (p: IconProps) => base(<path d="M19 12H5M11 18l-6-6 6-6" />, p);

export const IconLock = (p: IconProps) =>
  base(
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>,
    p
  );

export const IconUser = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>,
    p
  );

export const IconBell = (p: IconProps) =>
  base(
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </>,
    p
  );

export const IconZap = (p: IconProps) => base(<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />, p);

export const IconCalendar = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>,
    p
  );

export const IconEdit = (p: IconProps) =>
  base(
    <>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l4 4" />
    </>,
    p
  );

export const IconTrash = (p: IconProps) =>
  base(
    <>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>,
    p
  );
