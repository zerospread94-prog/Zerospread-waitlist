import "./globals.css";

export const metadata = {
  title: "ZeroSpread — قائمة الانتظار",
  description: "سجّل في قائمة الانتظار واحصل على خصم 35% على جميع الخدمات",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
