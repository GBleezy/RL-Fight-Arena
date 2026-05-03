import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/lib/store';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'RL Fighter Arena',
  description: 'Design, train, and battle neural network fighters.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-zinc-950 text-zinc-50 antialiased min-h-screen selection:bg-rose-500/30" suppressHydrationWarning>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
