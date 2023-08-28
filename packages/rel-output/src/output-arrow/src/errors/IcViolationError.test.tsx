import { render, screen } from '@testing-library/react';

import { ResultTable } from '@relationalai/rai-sdk-javascript/web';
import { IcViolation, plainToArrow } from '@relationalai/utils';

import { IcViolationError } from './IcViolationError';

describe('IcViolationError', () => {
  const icViolation: IcViolation = {
    decl_id: 'decl_id_1',
    report: 'violation_report',
    output: plainToArrow([
      { relationId: '/:bar/String', columns: [['foo', 'baz']] },
    ]).map(r => new ResultTable(r)),
  };
  const icViolationWithName: IcViolation = {
    decl_id: 'decl_id_2',
    name: 'violation_name',
    model: 'violation_model2',
    report: 'violation_report2',
    output: [],
  };

  it('should display diagnostic fields and txn id', () => {
    const { rerender } = render(
      <IcViolationError icViolation={icViolation} transactionId='txn_id' />,
    );

    expect(screen.queryByText('decl_id_1')).not.toBeInTheDocument();

    rerender(
      <IcViolationError
        icViolation={icViolationWithName}
        transactionId='txn_id'
      />,
    );

    expect(screen.queryByText('decl_id_2')).not.toBeInTheDocument();
    expect(screen.getByText('violation_name')).toBeInTheDocument();
  });

  it('should display output', () => {
    render(<IcViolationError icViolation={icViolation} />);

    expect(screen.queryByText('decl_id_1')).not.toBeInTheDocument();
    expect(screen.getByTestId('logical-output')).toBeInTheDocument();
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('baz')).toBeInTheDocument();
  });
});
