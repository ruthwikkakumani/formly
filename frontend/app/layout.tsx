import "./globals.css";
export const metadata = {
  title: "Formly — forms that feel like a conversation",
  description: "Typeform-inspired form builder",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
