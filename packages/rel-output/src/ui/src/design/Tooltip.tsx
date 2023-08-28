import {
  arrow,
  autoUpdate,
  FloatingArrow,
  Placement,
  shift,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react';
import { cloneElement, forwardRef, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  text: JSX.Element | string;
  placement?: Placement;
  children: JSX.Element;
  onVisibleChange?: (state: boolean) => void;
  delay?: number;
};

export const Tooltip = forwardRef<HTMLElement, TooltipProps>(
  (
    {
      text,
      placement = 'top',
      onVisibleChange,
      children,
      delay = 500,
      ...props
    }: TooltipProps,
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const arrowRef = useRef(null);

    const onOpenChange = (open: boolean) => {
      setIsOpen(open);
      onVisibleChange && onVisibleChange(open);
    };

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange,
      placement,
      whileElementsMounted: autoUpdate,
      middleware: [arrow({ element: arrowRef }), shift()],
    });

    const hover = useHover(context, {
      delay,
      move: false,
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    // We have two refs to worry about, the ref passed to the Tooltip component and the
    // ref that floating-ui uses. We need to update both of them whenever the
    // ref changes.
    const updateRefs = (inst: HTMLElement) => {
      refs.setReference(inst);

      if (ref) {
        if (typeof ref === 'function') {
          ref(inst);
        } else if (ref) {
          ref.current = inst;
        }
      }
    };

    return (
      <>
        {cloneElement(children, {
          ref: updateRefs,
          ...props,
          ...getReferenceProps(),
        })}
        {isOpen &&
          text &&
          createPortal(
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className='bg-gray-900 rounded border 
                        border-gray-900 shadow shadow-gray-900
                        text-gray-200 px-4 py-2 text-sm
                        flex flex-col z-[9999]'
              {...getFloatingProps()}
            >
              <FloatingArrow ref={arrowRef} context={context} />
              {text}
            </div>,
            document.body,
          )}
      </>
    );
  },
);
