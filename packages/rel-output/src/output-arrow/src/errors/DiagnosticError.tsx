import classNames from 'classnames';
import { useRef, useState } from 'react';
import { AiOutlineWarning } from 'react-icons/ai';
import { IoInformationCircle } from 'react-icons/io5';
import {
  RiCheckboxMultipleBlankLine,
  RiErrorWarningLine,
  RiMoreFill,
} from 'react-icons/ri';

import {
  ContextMenu,
  Menu,
  MenuItem,
} from '@relationalai/ui/src/design/ContextMenu';
import { ErrorFeedback } from '@relationalai/ui/src/design/ErrorFeedback';
import { Tooltip } from '@relationalai/ui/src/design/Tooltip';
import { copyToClipboard, Diagnostic } from '@relationalai/utils';

function makeDocsURL(errorCode: string) {
  // converting error code to what docs expect
  const code = errorCode.replace(/_/g, '-').toLowerCase();

  return `https://docs.relational.ai/error-code/${code}`;
}

function stringifyDiagnostic(diagnostic: Diagnostic, transactionId?: string) {
  const copyText = [
    `Code: ${diagnostic.code}`,
    `Message: ${diagnostic.message}`,
    diagnostic.model ? `Model: ${diagnostic.model}` : '',
    transactionId ? `Transaction-id: ${transactionId}` : '',
    ...((diagnostic.report && `Report:\n${diagnostic.report}`) || '').split(
      '\n',
    ),
  ];

  return copyText.filter(line => line?.toString().trim()).join('\n');
}

const DIAGNOSTICS_STYLES = {
  info: { textColor: 'text-sky-600', icon: IoInformationCircle },
  suggestion: { textColor: 'text-sky-600', icon: IoInformationCircle },
  error: { textColor: 'text-red-400', icon: RiErrorWarningLine },
  exception: { textColor: 'text-red-400', icon: RiErrorWarningLine },
  warning: { textColor: 'text-yellow-600', icon: AiOutlineWarning },
};

type DiagnosticErrorProps = {
  diagnostic: Diagnostic;
  transactionId?: string;
  onFeedback?: (message: string) => void;
};

export function DiagnosticError({
  diagnostic,
  transactionId,
  onFeedback,
}: DiagnosticErrorProps) {
  const [isActive, setIsActive] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuTriggerRef = useRef(null);
  const diagnosticString = stringifyDiagnostic(diagnostic, transactionId);
  const Icon = DIAGNOSTICS_STYLES[diagnostic.severity]?.icon;
  const pos = [];

  if (diagnostic.range && diagnostic.range.length > 0) {
    diagnostic.range[0].start.line &&
      pos.push(`line: ${diagnostic.range[0].start.line}`);
    diagnostic.range[0].start.character &&
      pos.push(`character: ${diagnostic.range[0].start.character}`);
  }

  const posStr = pos.length > 0 ? `(${pos.join(', ')})` : '';

  const handleCopy = async () => {
    await copyToClipboard(diagnosticString);
  };

  const menu = (
    <Menu label='diagnostic menu'>
      <MenuItem
        name='Copy'
        icon={RiCheckboxMultipleBlankLine}
        onClick={handleCopy}
      />
    </Menu>
  );

  return (
    <ContextMenu
      menu={menu}
      triggerRef={menuTriggerRef}
      onOpen={() => setIsActive(true)}
      onClose={() => setIsActive(false)}
    >
      <div
        className={classNames(
          DIAGNOSTICS_STYLES[diagnostic.severity]?.textColor || '',
        )}
      >
        <div className='flex gap-1 whitespace-nowrap text-sm font-light group py-1 w-full items-center'>
          {Icon && <Icon className='w-5 h-5 flex-none' />}
          <a
            target='_blank'
            href={makeDocsURL(diagnostic.code)}
            onClick={e => e.stopPropagation()}
            rel='noreferrer'
            className=' flex-none font-normal hover:underline'
          >
            {`${diagnostic.code.replace(/_/g, ' ')}:`}
          </a>

          <Tooltip
            text={
              <span className='text-xs max-w-lg'>{diagnostic.message}</span>
            }
            placement='bottom'
          >
            <div className='overflow-x-hidden overflow-ellipsis'>
              {diagnostic.message}
            </div>
          </Tooltip>

          <div className='flex-none text-dark-blue-300'>{posStr}</div>

          {pos.length === 0 && (
            <button
              className='underline background-transparent outline-none focus:outline-none'
              type='button'
              onClick={() => setShowDetails(!showDetails)}
              name='details-button'
            >
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          )}

          <div
            className={classNames(
              'flex-none flex gap-1 text-xs ml-auto group-hover:visible',
              !isActive && 'invisible',
            )}
          >
            <ErrorFeedback
              diagnostic={diagnostic}
              transactionId={transactionId}
              onFeedback={onFeedback}
            />
            <button
              aria-label='menu'
              className={classNames(
                'text-gray-400 flex-none px-2 -mx-2 hover:text-gray-500',
              )}
              ref={menuTriggerRef}
              data-testid={'context-menu-trigger'}
            >
              <RiMoreFill className='w-5 h-5' />
            </button>
          </div>
        </div>

        {showDetails && (
          <div className='text-sm pl-6 space-y-2 font-light pb-2'>
            <div>Transaction id: {transactionId}</div>
            <div className='whitespace-pre-wrap'>{diagnostic.report}</div>
          </div>
        )}
      </div>
    </ContextMenu>
  );
}
