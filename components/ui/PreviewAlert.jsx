'use client';

import { useState } from 'react';
import { Transition } from '@headlessui/react';

const PreviewAlert = ({ slug }) => {
  const [show, setShow] = useState(true);

  return (
    <>
      <Transition
        show={show}
        appear
        enter="transform transition ease-out duration-300"
        enterFrom="translate-x-full opacity-0"
        enterTo="translate-x-0 opacity-100"
        leave="transform transition ease-in duration-200"
        leaveFrom="translate-x-0 opacity-100"
        leaveTo="translate-x-full opacity-0"
      >
        <div className="fixed top-4 right-4 z-50 w-80 px-4 py-3 rounded-lg bg-yellow-100 text-yellow-900 shadow-lg">
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm">You are currently in preview mode</p>
            <button
              onClick={() => setShow(false)}
              className="text-yellow-700 hover:text-yellow-900 text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <a
            href={`/api/exit-preview?slug=${slug}`}
            className="mt-2 underline text-yellow-700 hover:text-yellow-900 text-sm inline-block"
          >
            Click here
          </a>{' '}
          <span className="text-sm">to exit preview mode.</span>
        </div>
      </Transition>
    </>
  );
};

export default PreviewAlert;
