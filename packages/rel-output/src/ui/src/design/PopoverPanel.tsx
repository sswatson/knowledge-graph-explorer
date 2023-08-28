import {
  autoUpdate,
  offset,
  Placement,
  shift,
  useFloating,
} from '@floating-ui/react';
import { Popover, Transition } from '@headlessui/react';
import { isFunction } from 'lodash-es';
import { MouseEvent, ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type PanelRenderProps = { close: () => void; open: boolean };

type PopoverProps = {
  panel: ReactNode | ((props: PanelRenderProps) => ReactElement);
  trigger: JSX.Element;
  onOpen?: (event: MouseEvent) => void;
  unmount?: boolean;
  triggerClassName?: string;
  triggerTestId?: string;
  placement?: Placement;
  disabled?: boolean;
};

export function PopoverPanel({
  panel,
  trigger,
  onOpen,
  unmount = true,
  triggerClassName,
  triggerTestId = 'show-popover-btn',
  placement = 'bottom-start',
  disabled = false,
}: PopoverProps) {
  const { refs, floatingStyles } = useFloating({
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [shift(), offset(0)],
  });

  return (
    <Popover className='h-full text-gray-700'>
      <Popover.Button
        as='button'
        ref={refs.setReference}
        data-testid={triggerTestId}
        className={triggerClassName}
        onClick={onOpen}
        disabled={disabled}
      >
        {trigger}
      </Popover.Button>

      {createPortal(
        <Popover.Panel
          unmount={unmount}
          ref={refs.setFloating}
          style={floatingStyles}
          className='z-50 focus:outline-none'
          data-testid='popover-panel'
        >
          {({ open, close }) => (
            <Transition
              show={open}
              appear
              enter='transition ease-out duration-100'
              enterFrom='transform opacity-0 scale-95'
              enterTo='transform opacity-100 scale-100'
              leave='transition ease-in duration-75'
              leaveFrom='transform opacity-100 scale-100'
              leaveTo='transform opacity-0 scale-95'
            >
              {isFunction(panel) ? panel({ close, open }) : panel}
            </Transition>
          )}
        </Popover.Panel>,
        document.body,
      )}
    </Popover>
  );
}
