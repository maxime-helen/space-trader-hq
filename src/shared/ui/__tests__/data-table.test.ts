import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

type Row = { id: string; name: string; units: number };

const ROWS: Row[] = [
  { id: 'a', name: 'ALUMINUM', units: 104 },
  { id: 'b', name: 'FUEL', units: 72 },
  { id: 'c', name: 'IRON_ORE', units: 61 },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', label: 'Good' },
  { key: 'units', label: 'Units', numeric: true },
];

type TableProps = {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row, index: number) => string | number;
};

// `mount` does not infer a generic component's type parameter, so it is given explicitly here.
// In a template `<DataTable :rows="ships">` infers it from the rows.
const mountTable = (props: Partial<TableProps> = {}, slots: Record<string, string> = {}) =>
  mount(DataTable<Row>, {
    props: { columns: COLUMNS, rows: ROWS, rowKey: (row: Row) => row.id, ...props },
    slots,
  });

describe('DataTable', () => {
  it('renders a real table with a header cell per column and a row per row', () => {
    const wrapper = mountTable();

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('thead').exists()).toBe(true);
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Good', 'Units']);
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);
    expect(
      wrapper
        .findAll('tbody tr')[0]
        ?.findAll('td')
        .map((td) => td.text()),
    ).toEqual(['ALUMINUM', '104']);
  });

  it('marks numeric columns so figures line up', () => {
    const wrapper = mountTable();

    expect(wrapper.findAll('thead th')[1]?.classes()).toContain('is-numeric');
    expect(wrapper.findAll('tbody td')[1]?.classes()).toContain('is-end');
  });

  it('renders a column value function and falls back to indexing the row by key', () => {
    const columns: DataTableColumn<Row>[] = [
      { key: 'name', label: 'Good' },
      { key: 'summary', label: 'Summary', value: (row: Row) => `${row.name}: ${String(row.units)}` },
    ];
    const wrapper = mountTable({ columns });

    expect(wrapper.findAll('tbody tr')[0]?.findAll('td')[1]?.text()).toBe('ALUMINUM: 104');
    expect(wrapper.findAll('tbody tr')[0]?.findAll('td')[0]?.text()).toBe('ALUMINUM');
  });

  it('hands the row to a per-column cell slot', () => {
    const wrapper = mountTable({}, { 'cell:units': '<em>{{ params.row.name }} x {{ params.row.units }}</em>' });

    expect(wrapper.find('tbody tr em').text()).toBe('ALUMINUM x 104');
  });

  it('flows the row type into the columns and the cell slots', () => {
    // A type-level check: the generic reaches `value`, so a field Row does not have is rejected.
    // If this ever stopped being an error, the @ts-expect-error itself would fail the typecheck.
    const typeCheck = () =>
      mountTable({
        columns: [
          {
            key: 'missing',
            label: 'Missing',
            // @ts-expect-error `missing` is not a field of Row.
            value: (row: Row) => row.missing,
          },
        ],
      });

    expect(typeCheck).toBeTypeOf('function');
  });

  it('renders the empty slot across the table when there are no rows', () => {
    const wrapper = mountTable({ rows: [] }, { empty: 'No goods here' });

    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.find('tbody td').attributes('colspan')).toBe('2');
    expect(wrapper.text()).toContain('No goods here');
  });
});
