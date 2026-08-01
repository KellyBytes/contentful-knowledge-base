const Footer = () => {
  return (
    <footer className="text-right p-8 bg-stone-100 text-sm font-medium  text-stone-400">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://kellybytes.dev"
            target="_blank"
            className="underline hover:text-stone-600"
          >
            Kelly
          </a>
          &apos;s Notes. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
