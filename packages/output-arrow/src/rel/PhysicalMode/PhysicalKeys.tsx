import classNames from 'classnames';
import { Fragment } from 'react';

type PhysicalKeysProps = {
  relationId: string;
};

export function getKeys(relPath: string) {
  return relPath.split('/').filter(k => k);
}

export function PhysicalKeys({ relationId }: PhysicalKeysProps) {
  const relKeys = getKeys(relationId);

  return (
    <Fragment>
      {relKeys.map((key, index) => (
        <Fragment key={key + index}>
          <span>/</span>
          <span
            key={key}
            className={classNames(
              key.startsWith(':') ? 'font-bold text-md' : '',
            )}
          >
            {key}
          </span>
        </Fragment>
      ))}
    </Fragment>
  );
}
