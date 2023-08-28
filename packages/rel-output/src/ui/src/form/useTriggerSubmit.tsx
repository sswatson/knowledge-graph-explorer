import { RefObject } from 'react';

export default function useTriggerSubmit(
  ref: RefObject<HTMLElement>,
  selector?: string,
) {
  if (!ref) {
    throw new Error('You must a ref to any element inside <form>.');
  }

  return function () {
    if (!selector) {
      const form = ref.current?.closest('form');

      if (!form) {
        throw new Error(`Couldn't trigger submit because <form> wasn't found.`);
      }

      form.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true }),
      );
    } else {
      const elements = ref.current?.querySelectorAll(selector);

      if (elements) {
        elements.forEach(el => {
          if (el.tagName === 'FORM') {
            el.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true }),
            );
          }
        });
      }
    }
  };
}
