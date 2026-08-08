import '@/assets/styles/globals.css';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import 'highlight.js/styles/github-dark.css';
import { Fraunces } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const metadata = {
  title: "Kelly's Notes",
  description:
    'A collection of posts, projects, and reference notes on web development, technology, and everyday learning.',
};

const Layout = ({ children }) => {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`h-full scroll-smooth antialiased ${fraunces.variable}`}
    >
      <body className="h-full flex flex-col  text-stone-600">
        <header className="bg-stone-100">
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
