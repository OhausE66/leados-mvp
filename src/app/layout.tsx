import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Coaching Vermittlung Prototyp",
  description: "Rule-based Triage, Matching, Messaging und Booking",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
