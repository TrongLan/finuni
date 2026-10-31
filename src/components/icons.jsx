export const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.67 16.5 4 15.83 4 15v-9.5Z"
      fill="currentColor"
    />
  </svg>
);

export const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M3 11.5L20.5 3.5L14 20.5L11 13L3 11.5Z" fill="currentColor" />
  </svg>
);

export const IconPanel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
    <line x1="9.2" y1="4.5" x2="9.2" y2="19.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const IconChevron = ({ dir }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}
  >
    <path
      d="M9 5l7 7-7 7"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
