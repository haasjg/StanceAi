import type { Metadata } from "next";
// Self-hosted Inter and EB Garamond; sets --font-inter and --font-eb-garamond.
import "./fonts/fonts.css";
import "./globals.css";
import { Providers } from "@/app/components/providers";
import { withAppBasePath } from "@/shared/lib/appBasePath";

const appUrl = new URL("https://mostlybuilt.com/stanceai");

export const metadata: Metadata = {
    metadataBase: appUrl,
    title: "StanceAI - Legal Intelligence Platform",
    description:
        "AI-powered legal document analysis and contract review platform.",
    icons: {
        icon: [
            { url: withAppBasePath("/icon.svg"), type: "image/svg+xml" },
            { url: withAppBasePath("/favicon.ico") },
        ],
        apple: withAppBasePath("/apple-touch-icon.png"),
    },
    openGraph: {
        type: "website",
        url: "https://mostlybuilt.com/stanceai",
        siteName: "StanceAI",
        title: "StanceAI - Legal Intelligence Platform",
        description:
            "AI-powered legal document analysis and contract review platform.",
        images: [
            {
                url: withAppBasePath("/link-image.jpg"),
                width: 1200,
                height: 651,
                alt: "StanceAI",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "StanceAI - Legal Intelligence Platform",
        description:
            "AI-powered legal document analysis and contract review platform.",
        images: [withAppBasePath("/link-image.jpg")],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className="font-sans antialiased"
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
