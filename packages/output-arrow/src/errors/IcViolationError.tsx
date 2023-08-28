import classNames from 'classnames';
import { useRef, useState } from 'react';
import { RiCheckboxMultipleBlankLine, RiMoreFill } from 'react-icons/ri';
import { TbUnlink } from 'react-icons/tb';

import { getDisplayValue } from '@relationalai/rai-sdk-javascript/web';
import { ContextMenu, Menu, MenuItem, Tooltip } from '@relationalai/ui';
import { copyToClipboard, IcViolation } from '@relationalai/utils';

import { LogicalOutput } from '../rel/LogicalMode/LogicalOutput';

type IcViolationErrorProps = {
  icViolation: IcViolation;
  transactionId?: string;
};

function stringifyIcViolation(
  icViolation: IcViolation,
  transactionId?: string,
) {
  const { name, model, report, output } = icViolation;

  const copyText = [
    name ? `IC Violation: ${name}` : '',
    model ? `Model: ${model}` : '',
    transactionId ? `Transaction-id: ${transactionId}` : '',
    ...((report && `Report:\n${report}`) || '').split('\n'),
  ];

  if (output && output.length > 0) {
    copyText.push('Output:');

    output.forEach(t => {
      const typeDefs = t.typeDefs();

      t.values().forEach(row => {
        const str = row
          .map((v, i) => getDisplayValue(typeDefs[i], v))
          .join(', ');

        copyText.push('    ' + str);
      });
    });
  }

  return copyText.filter(line => line?.toString().trim()).join('\n');
}

export function IcViolationError({
  icViolation,
  transactionId,
}: IcViolationErrorProps) {
  const { name, output, range } = icViolation;
  const [isActive, setIsActive] = useState(false);
  const menuTriggerRef = useRef(null);
  const icViolationString = stringifyIcViolation(icViolation, transactionId);
  const pos = [];

  if (range) {
    range.start.line && pos.push(`line: ${range.start.line}`);
    range.start.character && pos.push(`character: ${range.start.character}`);
  }

  const posStr = pos.length > 0 ? `(${pos.join(', ')})` : '';

  const handleCopy = async () => {
    await copyToClipboard(icViolationString);
  };

  const menu = (
    <Menu label='icViolation menu'>
      <MenuItem
        name='Copy'
        icon={RiCheckboxMultipleBlankLine}
        onClick={handleCopy}
      />
    </Menu>
  );

  return (
    <div
      className={classNames(
        'group w-full text-red-400 text-sm py-1 font-light',
      )}
    >
      <ContextMenu
        menu={menu}
        triggerRef={menuTriggerRef}
        onOpen={() => setIsActive(true)}
        onClose={() => setIsActive(false)}
      >
        <div className='flex gap-1 whitespace-nowrap'>
          <TbUnlink className='w-5 h-5 flex-none' />
          <a
            target='_blank'
            href='http://docs.relational.ai/help/error-messages/ic-violation-error'
            onClick={e => e.stopPropagation()}
            rel='noreferrer'
            className=' flex-none font-normal hover:underline'
          >
            {`IC Violation:`}
          </a>
          <Tooltip
            text={
              <span className='text-xs max-w-lg'>
                {name?.startsWith(':') ? name.slice(1) : name}
              </span>
            }
            placement='bottom'
          >
            <div className='overflow-x-hidden overflow-ellipsis'>
              {name?.startsWith(':') ? name.slice(1) : name}
            </div>
          </Tooltip>
          <div className='flex-none text-dark-blue-300'>{posStr}</div>
          <div
            className={classNames(
              'flex-none flex gap-1 text-xs ml-auto group-hover:visible',
              !isActive && 'invisible',
            )}
          >
            <button
              aria-label='menu'
              className={classNames(
                'text-gray-400 flex-none px-2 -mx-2 hover:text-gray-500',
              )}
              ref={menuTriggerRef}
            >
              <RiMoreFill className='w-5 h-5' />
            </button>
          </div>
        </div>
      </ContextMenu>

      <div className='ml-6 my-1'>
        {!!output.length && <LogicalOutput relations={output} />}
      </div>
    </div>
  );
}
