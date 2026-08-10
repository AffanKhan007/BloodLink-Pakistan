import "../styles/theme.css";
import "../styles.css";
import "leaflet/dist/leaflet.css";

import AppProviders from "./providers";

export const metadata = {
  title: "BloodLink Pakistan",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
