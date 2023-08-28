import classNames from 'classnames';
import { flatten } from 'lodash-es';

import {
  ArrowRelation,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';

import { OutputGrid } from '../../OutputGrid';
import { toLogicalColumns, toLogicalRows } from '../../outputUtils';

type LogicalOutputProps = {
  relations: (ArrowRelation | ResultTable)[];
  isNested?: boolean;
};

export function LogicalOutput({
  relations,
  isNested = false,
}: LogicalOutputProps) {
  const columns = toLogicalColumns(relations);
  const rowData = flatten(relations.map(toLogicalRows));
  const maxRows = 10;
  const rowHeight = 31;
  const layout = rowData.length >= maxRows ? 'normal' : 'autoHeight';
  const wrapperStyle =
    layout === 'normal' ? { height: maxRows * rowHeight } : {};

  return (
    <div
      data-testid='logical-output'
      className={classNames(
        'h-full w-full overflow-hidden ag-theme-rai-output',
        isNested && 'nested-grid',
      )}
      style={!isNested ? wrapperStyle : undefined}
    >
      <OutputGrid
        rowData={rowData}
        columnDefs={columns}
        showRowNumbers
        domLayout={!isNested ? layout : undefined}
      />
    </div>
  );
}
