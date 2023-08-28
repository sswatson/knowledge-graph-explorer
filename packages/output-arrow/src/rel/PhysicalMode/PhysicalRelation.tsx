import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { OutputGrid } from '../../OutputGrid';
import { toPhysicalColumns, toPhysicalRows } from '../../outputUtils';

type PhysicalRelationProps = {
  relation: ArrowRelation;
};

export function PhysicalRelation({ relation }: PhysicalRelationProps) {
  const { table } = relation;
  const rowNums = table.numRows === 0 ? 1 : table.numRows; // 1 for true relations
  const columns = toPhysicalColumns(relation);
  const rowData = toPhysicalRows(relation);
  const maxRows = 15;
  const rowHeight = 31;
  const layout = rowNums >= maxRows ? 'normal' : 'autoHeight';
  const wrapperStyle =
    layout === 'normal' ? { height: maxRows * rowHeight } : {};

  return (
    <div
      className='w-full overflow-hidden ag-theme-rai-output'
      style={wrapperStyle}
    >
      <OutputGrid
        rowData={rowData}
        columnDefs={columns}
        domLayout={layout}
      ></OutputGrid>
    </div>
  );
}
