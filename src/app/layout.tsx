import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"PowerPlugPicks — Thoughtful picks for everyday power",template:"%s | PowerPlugPicks"},description:"Independent buying guides, thoughtful comparisons, and practical advice for your everyday power essentials.",icons:{icon:"/favicon.svg"},robots:{index:false,follow:true}};
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#0F766E"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-US"><body>{children}</body></html>}
