import type { Metadata, Viewport } from "next";
import { DataProvider } from "@/components/store";
import { OfflineSupport } from "@/components/offline";
import "./globals.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
export const metadata: Metadata = {
  title: "Flock & Scale · A little care, every day",
  description:
    "A thoughtful home for your poultry and reptile records. Track eggs, feeding, health, habitats and daily care.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = {
  themeColor: "#214b3d",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>
        <DataProvider>
          {children}
          <OfflineSupport />
        </DataProvider>
      </body>
    </html>
  );
}
