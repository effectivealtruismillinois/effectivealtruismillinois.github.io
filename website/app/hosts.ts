export type ConversationHost = {
  id: string;
  name: string;
  shortName?: string;
  bio: string | null;
  photo: string | null;
  calendar: string | null;
};

// Add a host here when they are ready. Photos and bios are optional;
// a missing calendar shows a forthcoming state instead of a broken booking link.
export const hosts: ConversationHost[] = [
  { id: "tj", name: "Tserendorj ‘TJ’ Batjragal", shortName: "TJ", bio: "Philosophy, 4th year undergrad", photo: null, calendar: "https://calendar.app.google/KSNKPHBvR6kbnTyJA" },
  { id: "utkarsh", name: "Utkarsh Singh", bio: "Computer Science, 1st year grad", photo: "/utkarsh.jpg", calendar: "https://calendly.com/utkarsh6-illinois/30min" },
];

