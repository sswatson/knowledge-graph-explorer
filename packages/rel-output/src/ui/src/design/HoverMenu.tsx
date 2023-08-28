import { Transition } from '@headlessui/react';
import classNames from 'classnames';
import { ReactNode, RefObject, useEffect, useState } from 'react';

type HoverMenuProps = {
  triggerRef: RefObject<HTMLElement>;
  children: ReactNode;
  position?: string;
};

export function HoverMenu({
  triggerRef,
  children,
  position = 'top-2 right-2',
}: HoverMenuProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onEnter = () => setShow(true);
    const onLeave = () => setShow(false);

    if (!triggerRef.current) {
      throw new Error('HoverMenu: triggerRef is undefined');
    }

    const triggerEl = triggerRef.current;

    triggerEl.style.position = 'relative';

    triggerEl.addEventListener('pointerenter', onEnter);
    triggerEl.addEventListener('pointerleave', onLeave);

    return () => {
      triggerEl.addEventListener('pointerenter', onEnter);
      triggerEl.addEventListener('pointerleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Transition
      show={show}
      enter='transition-opacity duration-300'
      enterFrom='opacity-0'
      enterTo='opacity-100'
      leave='transition-opacity duration-150'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      <div
        className={classNames(
          'absolute z-10',
          position,
          'flex space-x-2',
          'p-2 bg-white rounded-md shadow-md',
          'border border-indigo-100 text-indigo-500',
        )}
      >
        {children}
      </div>
    </Transition>
  );
}
