import { CodeEditorNoSsr } from '@relationalai/code-editor';
import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { ErrorAlert } from '@relationalai/ui';
import { toObject } from '@relationalai/utils';

import { toJson } from '../outputUtils';

type JsonProps = {
  relations: ArrowRelation[];
};

export default function Json({ relations }: JsonProps) {
  const jsonRelations = relations.filter(r =>
    r.relationId.startsWith('/:json/:data/'),
  );

  try {
    const data = toJson(toObject(jsonRelations));
    const json = data ? data.json.data : data;

    return (
      <div data-testid='json-mime'>
        <CodeEditorNoSsr value={JSON.stringify(json, null, 2)} />
      </div>
    );
  } catch (error: any) {
    return <ErrorAlert error={error} />;
  }
}
