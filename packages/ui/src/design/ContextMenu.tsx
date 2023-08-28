import { autoUpdate, computePosition, shift } from '@floating-ui/react';
import classNames from 'classnames';
import Link from 'next/link';
import {
  cloneElement,
  FC,
  ReactElement,
  ReactNode,
  RefObject,
  SVGProps,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type Point = {
  x: number;
  y: number;
};

type ContextMenuProps = {
  menu: JSX.Element;
  children: ReactElement;
  onOpen?: () => void;
  onClose?: () => void;
  triggerRef?: RefObject<HTMLElement>;
};

export function ContextMenu({
  menu,
  children,
  onOpen,
  onClose,
  triggerRef,
}: ContextMenuProps) {
  const [openPoint, setOpenPoint] = useState<Point>();
  const childrenRef = useRef<HTMLElement>();
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (point?: Point) => {
    setOpenPoint(point);

    if (point) {
      onOpen && onOpen();
    } else {
      onClose && onClose();
    }
  };

  useEffect(() => {
    if (!openPoint) {
      return;
    }

    if (!childrenRef.current || !menuRef.current) {
      throw new Error(`Couldn't open context menu.`);
    }

    // using virtual element so that we can open the menu
    // at the action point
    const virtualEl = {
      // if we want menu to follow the element when user scrolls
      contextElement: childrenRef.current,
      getBoundingClientRect: () => {
        const rect = childrenRef.current?.getBoundingClientRect() || {
          top: 0,
          left: 0,
          toJSON: () => {},
        };

        const y = rect.top + openPoint.y;
        const x = rect.left + openPoint.x;

        return {
          width: 0,
          height: 0,
          top: y,
          left: x,
          bottom: y,
          right: x,
          y,
          x,
          toJSON: () => {},
        };
      },
    };

    const cleanup = autoUpdate(virtualEl, menuRef.current, () => {
      if (!menuRef.current) {
        return;
      }

      computePosition(virtualEl, menuRef.current, {
        placement: 'bottom-start',
        middleware: [shift()],
      }).then(({ x, y }) => {
        if (!menuRef.current) {
          return;
        }

        Object.assign(menuRef.current.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    });

    return () => {
      cleanup();
    };
  }, [openPoint]);

  useEffect(() => {
    const element = childrenRef.current;
    const triggerEl = triggerRef?.current;

    if (!element) {
      // eslint-disable-next-line no-console
      console.error("Context menu: couldn't get children ref.");

      return;
    }

    const handleBodyEvent = (event: PointerEvent) => {
      const target = event.target as HTMLElement;

      if (!menuRef.current?.contains(target)) {
        toggleOpen(undefined);
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      if (!childrenRef.current) {
        return;
      }

      const rect = childrenRef.current.getBoundingClientRect();

      // relative coords
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      toggleOpen(point);
    };

    const handleTriggerClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      handleContextMenu(event);
    };

    document.body.addEventListener('pointerdown', handleBodyEvent);
    element.addEventListener('contextmenu', handleContextMenu);
    triggerEl?.addEventListener('click', handleTriggerClick);

    return () => {
      document.body.removeEventListener('pointerdown', handleBodyEvent);
      element.removeEventListener('contextmenu', handleContextMenu);
      triggerEl?.removeEventListener('click', handleTriggerClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRefs = (inst: HTMLElement) => {
    childrenRef.current = inst;

    // https://github.com/facebook/react/issues/8873#issuecomment-425522374
    const ref = (children as any).ref;

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
      {cloneElement(children, { ref: updateRefs })}
      {openPoint &&
        createPortal(
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div
            ref={menuRef}
            data-testid='context-menu'
            className='absolute top-0 left-0 z-[100]'
            onClick={() => toggleOpen(undefined)}
          >
            {menu}
          </div>,
          document.body,
        )}
    </>
  );
}

type MenuProps = {
  label: string;
  children: ReactNode;
};

export function Menu({ label, children }: MenuProps) {
  return (
    <div
      role='menu'
      aria-label={label}
      className={classNames(
        'mt-3 w-44 rounded-md shadow-lg',
        'bg-white ring-1 ring-black ring-opacity-5 focus:outline-none',
      )}
    >
      {children}
    </div>
  );
}

type MenuItemProps = {
  name: string;
  icon: FC<SVGProps<SVGSVGElement>>;
  iconColor?: keyof typeof iconColorMap;
  onClick?: () => void;
  href?: string;
};

const iconColorMap = {
  red: 'text-red-600',
  gray: 'text-gray-600',
};

export function MenuItem({
  name,
  icon,
  iconColor = 'gray',
  onClick,
  href,
  ...otherProps
}: MenuItemProps) {
  const Icon = icon;
  const defaultProps = {
    'aria-label': name,
    role: 'menuitem',
    className: classNames(
      'flex px-4 py-2 items-center w-full',
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    ),
  };
  const inner = (
    <>
      <div
        className={classNames(
          'h-4 w-4 bg-cover flex-none',
          iconColorMap[iconColor],
        )}
      >
        <Icon />
      </div>
      <div className='text-sm px-4'>{name}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} {...defaultProps} {...otherProps}>
        {inner}
      </Link>
    );
  }

  return (
    <button type='button' {...defaultProps} {...otherProps} onClick={onClick}>
      {inner}
    </button>
  );
}
