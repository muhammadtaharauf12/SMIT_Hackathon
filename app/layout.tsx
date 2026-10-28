import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AttendanceWidget } from "./attendance-widget";
import { LeaveWidget } from "./leave-widget";
import { CorrectionWidget } from "./correction-widget";
import { HolidayWidget } from "./holiday-widget";
import { AiWidget } from "./ai-widget";
import { NotificationWidget } from "./notification-widget";
import { AuditWidget } from "./audit-widget";
import { PayrollWidget } from "./payroll-widget";
import { AnalyticsWidget } from "./analytics-widget";
import { ToolDock } from "./tool-dock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora | People operations, clearly",
  description: "Nexora is a focused human capital workspace for Admin, HR and Employees.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<ToolDock><AttendanceWidget /><LeaveWidget /><CorrectionWidget /><HolidayWidget /><NotificationWidget /><AuditWidget /><PayrollWidget /><AnalyticsWidget /><AiWidget /></ToolDock></body>
    </html>
  );
}
