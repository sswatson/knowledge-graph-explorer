import { render, screen } from '@testing-library/react';

import Label from './Label';

describe('Label', () => {
  it('should render label', () => {
    render(<Label name='foo' label='my-label' />);

    const element = screen.getByText('my-label');

    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute('for', 'foo');
  });
});
