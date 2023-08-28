import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { ConnectedRadioGroup, RadioGroup } from './RadioGroup';

const options = [
  { label: 'Option 1', value: 'option-1' },
  { label: 'Option 2', value: 'option-2' },
];

describe('RadioGroup', () => {
  it('should render options', () => {
    render(<RadioGroup name='test' options={options} />);

    options.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('should render selected option', () => {
    render(<RadioGroup name='test' options={options} value={options[1]} />);

    expect(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked();
  });

  it('should render selected option view when checked', () => {
    render(
      <RadioGroup name='test' options={options} value={options[1]}>
        <div>Test View</div>
      </RadioGroup>,
    );

    expect(screen.getByText('Test View')).toBeInTheDocument();
  });

  it('should change value', () => {
    const onChangeMock = jest.fn();

    render(
      <RadioGroup
        name='test'
        options={options}
        onChange={onChangeMock}
        value={options[1]}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Option 1' }));

    expect(onChangeMock).toHaveBeenCalledWith(options[0]);
  });

  it('should connect to form context', () => {
    const name = 'foo';

    function TestComponent() {
      const methods = useForm({
        mode: 'onChange',
        defaultValues: {
          foo: options[0],
        },
      });

      const option = methods.watch(name);

      return (
        <FormProvider {...methods}>
          <div>value is {option.value}</div>
          <ConnectedRadioGroup name={name} options={options} />
        </FormProvider>
      );
    }

    render(<TestComponent />);

    expect(screen.getByRole('radio', { name: 'Option 1' })).toBeChecked();
    expect(screen.getByText('value is option-1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Option 2'));

    expect(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked();
    expect(screen.getByText('value is option-2')).toBeInTheDocument();
  });
});
