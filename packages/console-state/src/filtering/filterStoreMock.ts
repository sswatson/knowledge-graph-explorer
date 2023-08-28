import { FilterStore } from './filterStore';

type FilterStoreMock = Pick<FilterStore<any>, keyof FilterStore<any>>;

export function createFilterStoreMock(
  mockValues: Partial<FilterStoreMock> = {},
) {
  const mock: FilterStoreMock = {
    filters: {},
    visibleFilters: [],
    filterOptions: [],
    setVisibility: jest.fn(),
    getFilterValue: jest.fn(),
    setFilterValue: jest.fn(),
    setVisibleFilters: jest.fn(),
    filterValues: {},
    ...mockValues,
  };

  return mock as FilterStore<any>;
}
