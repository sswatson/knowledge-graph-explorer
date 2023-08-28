import { DependencyList, useEffect } from 'react';

// this can be done also via onBecomeObserved/onBecomeUnobserved
const useReload = (callback: () => void, dependencies: DependencyList = []) => {
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    };

    const onFocus = () => {
      callback();
    };

    // Initial load
    callback();

    // https://www.w3.org/TR/page-visibility/
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

export default useReload;
