import { Fraunces } from 'next/font/google';
import 'highlight.js/styles/github-dark.css';
import '@/assets/styles/globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const metadata = {
  title: 'Blog Using Contentful',
  description: 'Blog Using Contentful and Next.js',
};

const Layout = ({ children }) => {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`h-full scroll-smooth antialiased ${fraunces.variable}`}
    >
      <body className="h-full flex flex-col  text-stone-600">
        <header className="p-6 bg-stone-100">
          <Navbar />
        </header>

        <main className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grow p-8">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
};

export default Layout;
