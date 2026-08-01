import { useSyncExternalStore } from 'react';

// Subscribe an external store. OS does not change, so return a function that does nothing
const subscribe = () => () => {};

// Variable on client
const getSnapshot = () =>
  /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);

// Variable on server (no navigator)
const getServerSnapshot = () => false;

export const useIsMac = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
