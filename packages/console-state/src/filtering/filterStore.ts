import { difference, mapValues } from 'lodash-es';
import { makeAutoObservable } from 'mobx';

export type DurationValue = {
  gt?: number;
  lt?: number;
};

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type MultiFilterOption = {
  label: string;
  value: string;
};

export type TextFilter = {
  type: 'text';
  value?: string;
};

export type BooleanFilter = {
  type: 'boolean';
  value?: boolean;
};

export type DateFilter = {
  type: 'date';
  value?: DateRange;
};

export type DurationFilter = {
  type: 'duration';
  value?: DurationValue;
};

export type MultiFilter = {
  type: 'multi';
  value?: string[];
  options: MultiFilterOption[];
};

export type FilterDef =
  | TextFilter
  | BooleanFilter
  | DateFilter
  | DurationFilter
  | MultiFilter;

export type FilterDefs = Record<string, FilterDef>;

export type FilterState = {
  label: string;
  isVisible?: boolean;
};
export type Filter = FilterDef & FilterState;
export type Filters<T extends FilterDefs> = Record<keyof T, Filter>;
export type FilterValues<T extends FilterDefs> = {
  [TField in keyof T]?: T[TField]['value'];
};

export class FilterStore<T extends FilterDefs> {
  filters: Filters<T>;
  private filtersOrder: (keyof T)[];

  constructor(filters: Filters<T>, filtersOrder?: (keyof T)[]) {
    this.filters = filters;
    const missingNames =
      difference(Object.keys(filters), filtersOrder ?? []) ?? [];

    this.filtersOrder = [...(filtersOrder ?? []), ...missingNames];

    makeAutoObservable(this);
  }

  setFilterValue<FilterName extends keyof T>(
    name: FilterName,
    value: T[FilterName]['value'],
  ) {
    this.setVisibility(name, true);
    this.filters[name].value = value;
  }

  get filterValues(): FilterValues<T> {
    return mapValues(this.filters, x => x.value);
  }

  getFilterValue<FilterName extends keyof T>(
    name: FilterName,
  ): T[FilterName]['value'] {
    return this.filters[name].value;
  }

  setVisibility<FilterName extends keyof T>(
    name: FilterName,
    isVisible: boolean,
  ) {
    this.filters[name].isVisible = isVisible;
  }

  get visibleFilters() {
    return this.filtersOrder
      .filter(n => this.filters[n].isVisible)
      .map(n => ({ name: String(n), ...this.filters[n] }));
  }

  setVisibleFilters(names: (keyof T)[]) {
    this.filtersOrder.forEach(n =>
      this.setVisibility(
        n,
        names.some(name => name === n),
      ),
    );
  }

  get filterOptions() {
    return this.filtersOrder.map(name => ({
      value: String(name),
      label: this.filters[name].label,
    }));
  }
}
