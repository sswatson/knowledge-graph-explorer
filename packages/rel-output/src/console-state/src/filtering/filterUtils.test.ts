import { filter } from './filterUtils';

const items = [
  {
    name: 'foo123',
    createdAt: new Date('2023-12-01T01:00:00'),
    duration: 10,
    readOnly: true,
  },
  {
    name: 'bar123',
    createdAt: new Date('2023-12-02T01:00:00'),
    duration: 20,
    readOnly: false,
  },
  {
    name: 'baz321',
    createdAt: new Date('2023-12-03T01:00:00'),
    duration: 30,
    readOnly: true,
  },
];

describe('filterUtils', () => {
  it('should support text filter', () => {
    const result1 = filter(items, { name: { type: 'text', value: 'bar' } });

    expect(result1).toEqual([items[1]]);

    const result2 = filter(items, { name: { type: 'text', value: '123' } });

    expect(result2).toEqual([items[0], items[1]]);

    const result3 = filter(items, { name: { type: 'text', value: undefined } });

    expect(result3).toEqual(items);
  });

  it('should support boolean filter', () => {
    const result1 = filter(items, {
      readOnly: { type: 'boolean', value: true },
    });

    expect(result1).toEqual([items[0], items[2]]);

    const result2 = filter(items, {
      readOnly: { type: 'boolean', value: false },
    });

    expect(result2).toEqual([items[1]]);

    const result3 = filter(items, {
      readOnly: { type: 'boolean', value: undefined },
    });

    expect(result3).toEqual(items);
  });

  it('should support multi filter', () => {
    const result1 = filter(items, {
      name: { type: 'multi', value: ['bar123'], options: [] },
    });

    expect(result1).toEqual([items[1]]);

    const result2 = filter(items, {
      name: { type: 'multi', value: ['bar123', 'baz321'], options: [] },
    });

    expect(result2).toEqual([items[1], items[2]]);

    const result3 = filter(items, {
      name: { type: 'multi', value: ['123', 'foo123'], options: [] },
    });

    expect(result3).toEqual([items[0]]);

    const result4 = filter(items, {
      name: { type: 'multi', value: undefined, options: [] },
    });

    expect(result4).toEqual(items);

    const result5 = filter(items, {
      name: { type: 'multi', value: [], options: [] },
    });

    expect(result5).toEqual(items);
  });

  it('should support duration filter', () => {
    const result1 = filter(items, {
      duration: { type: 'duration', value: { gt: 20 } },
    });

    expect(result1).toEqual([items[2]]);

    const result2 = filter(items, {
      duration: { type: 'duration', value: { lt: 20 } },
    });

    expect(result2).toEqual([items[0]]);

    const result3 = filter(items, {
      duration: { type: 'duration', value: { gt: 10, lt: 40 } },
    });

    expect(result3).toEqual([items[1], items[2]]);

    const result4 = filter(items, {
      duration: { type: 'duration', value: undefined },
    });

    expect(result4).toEqual(items);

    const result5 = filter(items, {
      duration: { type: 'duration', value: {} },
    });

    expect(result5).toEqual(items);
  });

  it('should support date filter', () => {
    const result1 = filter(items, {
      createdAt: {
        type: 'date',
        value: { from: new Date('2023-12-02T01:00:00') },
      },
    });

    expect(result1).toEqual([items[2]]);

    const result2 = filter(items, {
      createdAt: {
        type: 'date',
        value: { to: new Date('2023-12-02T01:00:00') },
      },
    });

    expect(result2).toEqual([items[0]]);

    const result3 = filter(items, {
      createdAt: {
        type: 'date',
        value: {
          from: new Date('2023-12-01T15:00:00'),
          to: new Date('2023-12-04T01:00:00'),
        },
      },
    });

    expect(result3).toEqual([items[1], items[2]]);

    const result4 = filter(items, {
      createdAt: { type: 'date', value: undefined },
    });

    expect(result4).toEqual(items);

    const result5 = filter(items, {
      createdAt: { type: 'date', value: {} },
    });

    expect(result5).toEqual(items);
  });

  it('should support multiple fitlers', () => {
    const result1 = filter(items, {
      readOnly: { type: 'boolean', value: true },
      duration: { type: 'duration', value: { gt: 15 } },
    });

    expect(result1).toEqual([items[2]]);

    const result2 = filter(items, {
      name: { type: 'multi', value: ['foo123', 'bar123'], options: [] },
      createdAt: {
        type: 'date',
        value: { to: new Date('2023-12-02T01:00:00') },
      },
    });

    expect(result2).toEqual([items[0]]);
  });
});
