import "./globals.css";

export const metadata = {
  title: "Xedruo",
  description: "Music distribution, publishing, royalties and more for African artists.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
