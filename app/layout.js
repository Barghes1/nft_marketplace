import Script from 'next/script';
import { ThemeProvider } from 'next-themes';

import './globals.css';

import { NFTProvider } from '@/context/NFTContext';
import { Navbar, Footer } from '@/components';

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <body>
                <NFTProvider>
                    <ThemeProvider>
                        <div className="dark:bg-nft-dark bg-white min-h-screen">
                            <Navbar />
                            <div className="pt-65">{children}</div>

                            <Footer />
                        </div>

                        <Script
                            src="https://kit.fontawesome.com/a84f7eae52.js"
                            crossorigin="anonymous"
                        />
                    </ThemeProvider>
                </NFTProvider>
            </body>
        </html>
    );
}
