import classNames from 'classnames';
import {
  DragEvent as ReactDragEvent,
  ReactNode,
  useEffect,
  useState,
} from 'react';

import { readFilesFromDataTransfer } from '@relationalai/utils';

type FileDropZoneProps = {
  onFileDrop: (files: File[]) => void;
  children: ReactNode;
  className?: string;
  draggingClassName?: string;
  overClassName?: string;
  overlayClassName?: string;
};

type Timeout = ReturnType<typeof setTimeout>;

export default function FileDropZone({
  onFileDrop,
  children,
  className,
  // classes applied to the drop zone element when dragging over the document
  draggingClassName = 'border-dashed border-gray-400',
  // classes applied to the drop zone element when dragging over the drop zone
  overClassName = 'border-indigo-400',
  // classes applied to the overlay element
  // overlay element covers the whole dropzone
  // so that we can "intercept" dropping into inner elements
  overlayClassName = 'z-10',
}: FileDropZoneProps) {
  // dragging over dropzone
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  // dragging globally
  const [isDragging, setIsDragging] = useState(false);

  // detecting file dragging globally
  useEffect(() => {
    let timeout: Timeout;

    const globalDragEnter = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true);
      }
    };

    // dragenter/dragleave are called when you drag over any element on the page
    // then the events bubble up to the document, so we can't rely on them
    // instead re-set timeout on dragover
    // when dragover isn't firing anymore that means no global dragging is happening
    const globalDragOver = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsDragging(false);
      }, 500);
    };

    document.addEventListener('dragenter', globalDragEnter);
    document.addEventListener('dragover', globalDragOver);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('dragenter', globalDragEnter);
      document.removeEventListener('dragover', globalDragOver);
    };
  }, []);

  const handleDrop = async (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    if (!event.dataTransfer) {
      return;
    }

    const files = await readFilesFromDataTransfer(event.dataTransfer);

    if (files) {
      onFileDrop(files);
    }
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();

    setIsDraggingOver(false);
  };

  return (
    <div
      data-testid='file-drop-zone'
      className={classNames(
        className,
        'relative',
        isDraggingOver && overClassName,
        isDragging && draggingClassName,
      )}
    >
      {children}
      {(isDragging || isDraggingOver) && (
        <div
          data-testid='file-drop-zone-overlay'
          className={classNames('absolute inset-0', overlayClassName)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        />
      )}
    </div>
  );
}
