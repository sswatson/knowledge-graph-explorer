import { cloneDeep } from 'lodash-es';

import {
  DateFilter,
  DurationFilter,
  Filters,
  FilterStore,
  MultiFilter,
  TextFilter,
} from './filterStore';

type FilterDefsMock = {
  id: TextFilter;
  createdAt: DateFilter;
  createdBy: MultiFilter;
  executionTime: DurationFilter;
};

const filtersMock: Filters<FilterDefsMock> = {
  id: {
    label: 'ID',
    type: 'text',
  },
  createdAt: {
    label: 'Created at',
    type: 'date',
  },
  createdBy: {
    label: 'Created by',
    type: 'multi',
    options: [],
  },
  executionTime: {
    label: 'Execution time',
    type: 'duration',
  },
};

const createFilterStore = (
  filters?: Filters<FilterDefsMock>,
  filtersOrder?: (keyof FilterDefsMock)[],
) => {
  return new FilterStore<FilterDefsMock>(
    filters ?? cloneDeep(filtersMock),
    filtersOrder,
  );
};

describe('FilterStore', () => {
  it('should create filter store', () => {
    const filterStore = createFilterStore();

    expect(filterStore['filtersOrder']).toEqual([
      'id',
      'createdAt',
      'createdBy',
      'executionTime',
    ]);
  });

  it('should set visible filters', () => {
    const filterStore = createFilterStore();

    expect(filterStore.visibleFilters).toEqual([]);

    filterStore.setVisibleFilters(['id', 'createdAt']);

    expect(filterStore.visibleFilters.map(f => f.name)).toEqual([
      'id',
      'createdAt',
    ]);
  });

  it('should set filter value', () => {
    const filterStore = createFilterStore();

    filterStore.setFilterValue('id', 'foo');

    expect(filterStore.getFilterValue('id')).toEqual('foo');

    const dateRange = {
      from: new Date('2023-07-01'),
      to: new Date('2023-07-02'),
    };

    filterStore.setFilterValue('createdAt', dateRange);

    expect(filterStore.getFilterValue('createdAt')).toEqual(dateRange);

    filterStore.setFilterValue('createdBy', ['foo', 'bar']);

    expect(filterStore.getFilterValue('createdBy')).toEqual(['foo', 'bar']);

    const duration = {
      gt: 100,
      lt: 200,
    };

    filterStore.setFilterValue('executionTime', duration);

    expect(filterStore.getFilterValue('executionTime')).toEqual(duration);

    expect(filterStore.visibleFilters.map(f => f.name)).toEqual([
      'id',
      'createdAt',
      'createdBy',
      'executionTime',
    ]);
  });

  it('should set default filters value', () => {
    const filterStore = createFilterStore({
      ...filtersMock,
      id: {
        type: 'text',
        label: 'ID',
        value: 'foo',
        isVisible: true,
      },
    });

    expect(filterStore.getFilterValue('id')).toEqual('foo');
    expect(filterStore.visibleFilters.map(f => f.name)).toEqual(['id']);
  });

  it('should set filter visibility', () => {
    const filterStore = createFilterStore();

    expect(filterStore.visibleFilters.map(f => f.name)).toEqual([]);

    filterStore.setVisibility('id', true);
    expect(filterStore.visibleFilters.map(f => f.name)).toEqual(['id']);
  });

  it('should set filter order', () => {
    const filterStore = createFilterStore(filtersMock, ['createdAt', 'id']);

    filterStore.setVisibility('id', true);
    filterStore.setVisibility('createdAt', true);
    filterStore.setVisibility('executionTime', true);
    filterStore.setVisibility('createdBy', true);
    expect(filterStore.visibleFilters.map(f => f.name)).toEqual([
      'createdAt',
      'id',
      'createdBy',
      'executionTime',
    ]);
  });

  it('should get filter values', () => {
    const filterStore = createFilterStore({
      ...filtersMock,
      id: {
        type: 'text',
        label: 'ID',
        value: 'foo',
        isVisible: true,
      },
      createdBy: {
        label: 'Created by',
        type: 'multi',
        value: ['a', 'b'],
        options: [],
      },
    });

    expect(filterStore.filterValues).toEqual({
      id: 'foo',
      createdBy: ['a', 'b'],
      createdAt: undefined,
      executionTime: undefined,
    });
  });
});
