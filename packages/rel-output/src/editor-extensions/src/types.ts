export type ModelReference = {
  name: string;
  type: 'model';
  databaseName: string;
  from: number;
  to: number;
  line: number;
  column: number;
};

export type WorksheetReference = {
  name: string;
  type: 'worksheet';
  worksheetId: string;
  from: number;
  to: number;
  line: number;
  column: number;
};

export type BaseRelationReference = {
  name: string;
  type: 'baseRelation';
  databaseName: string;
};

export type RelationReference =
  | ModelReference
  | WorksheetReference
  | BaseRelationReference;

export type ReferenceInfo =
  | Omit<ModelReference, 'from' | 'to' | 'line' | 'column'>
  | Omit<WorksheetReference, 'from' | 'to' | 'line' | 'column'>;

export type BaseDefinition = {
  name: string;
};

export type BaseRelationDefinition = BaseDefinition & {
  type: 'baseRelation';
  reference: BaseRelationReference;
};

export type ModuleDefinition = BaseDefinition & {
  type: 'module';
  children: RelDefinition[];
  reference: ModelReference | WorksheetReference;
};

export type RelationDefinition = BaseDefinition & {
  type: 'relation' | 'operandRelation' | 'constructor' | 'constraint';
  reference: ModelReference | WorksheetReference;
};

export type RelDefinition =
  | BaseRelationDefinition
  | RelationDefinition
  | ModuleDefinition;
