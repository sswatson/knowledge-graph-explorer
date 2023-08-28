import { get } from 'lodash-es';

import { CodeEditorNoSsr } from '@relationalai/code-editor';
import {
  ArrowRelation,
  MetadataInfo,
} from '@relationalai/rai-sdk-javascript/web';

import { OutputGrid } from '../../OutputGrid';
import { toRawColumns, toRawRows } from '../../outputUtils';

type RawRelationProps = {
  relation: ArrowRelation;
};

export function RawRelation({ relation }: RawRelationProps) {
  const { table } = relation;
  const rowNums = table.numRows === 0 ? 1 : table.numRows; // 1 for true relations
  const columns = toRawColumns(relation);
  const rowData = toRawRows(relation);
  const maxRows = 15;
  const rowHeight = 31;
  const layout = rowNums >= maxRows ? 'normal' : 'autoHeight';
  const wrapperStyle =
    layout === 'normal' ? { height: maxRows * rowHeight } : {};
  const wrappedMetadata = MetadataInfo.toJson({
    relations: [{ fileName: '', relationId: relation.metadata }],
  });
  const metadata = get(wrappedMetadata, ['relations', '0', 'relationId']);

  return (
    <div>
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
      {metadata && (
        <div className='border border-gray-300 border-t-0'>
          <CodeEditorNoSsr value={JSON.stringify(metadata, null, 2)} />
        </div>
      )}
    </div>
  );
}
