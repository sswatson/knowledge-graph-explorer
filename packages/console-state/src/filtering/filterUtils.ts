import { FilterDefs } from './filterStore';

export function filter<T extends Record<string, any>>(
  list: T[],
  filters: FilterDefs,
) {
  const fields = Object.keys(filters);

  if (fields.length === 0) {
    return list;
  }

  return list.filter(item => {
    for (const field of fields) {
      const { value, type } = filters[field];

      if (value === undefined) {
        continue;
      }

      const itemFieldValue = item[field];

      switch (type) {
        case 'text': {
          if (
            typeof itemFieldValue === 'string' &&
            !itemFieldValue.toLowerCase().includes(value.toLowerCase())
          ) {
            return false;
          }

          break;
        }

        case 'boolean': {
          if (itemFieldValue !== value) {
            return false;
          }

          break;
        }

        case 'multi': {
          if (value.length && !value.includes(itemFieldValue)) {
            return false;
          }

          break;
        }

        case 'duration': {
          if (typeof itemFieldValue === 'number') {
            if (value.gt !== undefined && itemFieldValue <= value.gt) {
              return false;
            }

            if (value.lt !== undefined && itemFieldValue >= value.lt) {
              return false;
            }
          }

          break;
        }

        case 'date': {
          if (itemFieldValue instanceof Date) {
            if (value.from !== undefined && itemFieldValue <= value.from) {
              return false;
            }

            if (value.to !== undefined && itemFieldValue >= value.to) {
              return false;
            }
          }

          break;
        }

        default: {
          assertFilterType(type);
        }
      }
    }

    return true;
  });
}

function assertFilterType(value: never): never {
  throw new Error(`${value} filter type is not supported.`);
}
