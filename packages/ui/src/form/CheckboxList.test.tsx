import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

import {
  CheckboxOptionGroup,
  ConnectedCheckboxList,
  PureCheckboxList,
} from './CheckboxList';

let options: CheckboxOptionGroup[];

describe('CheckboxList', () => {
  beforeEach(() => {
    options = [
      {
        label: 'Foo',
        description: 'Foo description',
        options: [
          {
            value: 'list:foo',
            label: 'List Foo',
            description: 'List Foo description',
          },
          {
            value: 'delete:foo',
            label: 'Delete Foo',
            description: 'Delete Foo description',
          },
        ],
      },
      {
        label: 'Bar',
        description: 'Bar description',
        options: [
          {
            value: 'list:bar',
            label: 'List Bar',
            description: 'List Bar description',
          },
          {
            value: 'delete:bar',
            label: 'Delete Bar',
            description: 'Delete Bar description',
          },
        ],
      },
    ];
  });

  describe('ConnectedCheckboxList', () => {
    it('should throw an error if no form context found', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ConnectedCheckboxList name='foo' options={options} />);
      }).toThrow();
      error.mockReset();
    });

    it('should connect pure checkbox list to form', async () => {
      const name = 'foo';

      function TestComponent() {
        const methods = useForm({
          mode: 'onChange',
          defaultValues: {
            foo: ['list:foo', 'list:bar', 'delete:bar'],
          },
        });

        return (
          <FormProvider {...methods}>
            <ConnectedCheckboxList name={name} options={options} />
          </FormProvider>
        );
      }

      render(<TestComponent />);

      expect(screen.getByRole('checkbox', { name: 'Bar' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'List Bar' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Delete Bar' }),
      ).toBeChecked();

      fireEvent.click(screen.getByLabelText('Bar'));

      expect(screen.getByRole('checkbox', { name: 'Bar' })).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'List Bar' }),
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Delete Bar' }),
      ).not.toBeChecked();
    });
  });

  describe('PureCheckboxList', () => {
    it('should render values', () => {
      const mockOnChange = jest.fn();

      render(
        <PureCheckboxList
          value={['list:foo', 'list:bar', 'delete:bar']}
          options={options}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Foo description')).toBeInTheDocument();
      expect(screen.getByText('List Foo description')).toBeInTheDocument();
      expect(screen.getByText('Delete Foo description')).toBeInTheDocument();

      expect(screen.getByRole('checkbox', { name: 'Foo' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'List Foo' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Delete Foo' }),
      ).not.toBeChecked();

      expect(screen.getByText('Bar description')).toBeInTheDocument();
      expect(screen.getByText('List Bar description')).toBeInTheDocument();
      expect(screen.getByText('Delete Bar description')).toBeInTheDocument();

      expect(screen.getByRole('checkbox', { name: 'Bar' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'List Bar' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Delete Bar' }),
      ).toBeChecked();
    });

    it('should render values with disabled options', () => {
      const mockOnChange = jest.fn();

      options[1].options.push({
        value: 'create:bar',
        label: 'Create Bar',
        disabled: true,
        description: 'Create Bar description',
      });

      render(
        <PureCheckboxList
          value={['list:bar', 'delete:bar']}
          options={options}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByRole('checkbox', { name: 'Bar' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'List Bar' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Delete Bar' }),
      ).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Create Bar' }),
      ).not.toBeChecked();
    });

    it('should be able to check/uncheck', () => {
      const mockOnChange = jest.fn();

      render(
        <PureCheckboxList
          value={['list:foo', 'list:bar', 'delete:bar']}
          options={options}
          onChange={mockOnChange}
        />,
      );

      fireEvent.click(screen.getByLabelText('Bar'));

      expect(mockOnChange).toHaveBeenNthCalledWith(1, ['list:foo']);

      fireEvent.click(screen.getByLabelText('Foo'));

      expect(mockOnChange).toHaveBeenNthCalledWith(2, [
        'list:foo',
        'list:bar',
        'delete:bar',
        'delete:foo',
      ]);

      fireEvent.click(screen.getByLabelText('List Foo'));

      expect(mockOnChange).toHaveBeenNthCalledWith(3, [
        'list:bar',
        'delete:bar',
      ]);
    });

    it('should be able to check/uncheck with disabled options', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      // disabling list:foo
      options[0].options[0].disabled = true;
      // disabling list:bar
      options[1].options[0].disabled = true;

      render(
        <PureCheckboxList
          value={['list:bar', 'delete:bar']}
          options={options}
          onChange={mockOnChange}
        />,
      );

      await user.click(screen.getByLabelText('Foo'));

      expect(mockOnChange).toHaveBeenNthCalledWith(1, [
        'list:bar',
        'delete:bar',
        'delete:foo',
      ]);

      await user.click(screen.getByLabelText('Bar'));

      expect(mockOnChange).toHaveBeenNthCalledWith(2, ['list:bar']);

      await user.click(screen.getByLabelText('List Foo'));

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it('should check "All" checkbox if all options is checked and disabled', () => {
      const mockOnChange = jest.fn();

      const mockOptions = [
        {
          label: 'All',
          description: '',
          options: [
            {
              value: 'option 1',
              label: 'option 1',
              description: 'option 1 description',
              disabled: true,
            },
            {
              value: 'option 2',
              label: 'option 2',
              description: 'option 2 description',
              disabled: true,
            },
            {
              value: 'option 3',
              label: 'option 3',
              description: 'option 3 description',
              disabled: true,
            },
          ],
        },
      ];

      render(
        <PureCheckboxList
          value={['option 1', 'option 2', 'option 3']}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByRole('checkbox', { name: 'All' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'option 1' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'option 2' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'option 3' })).toBeChecked();
    });

    it('should not check "All" checkbox if all options is disabled, but only one is checked', () => {
      const mockOnChange = jest.fn();

      const mockOptions = [
        {
          label: 'All',
          description: '',
          options: [
            {
              value: 'option 1',
              label: 'option 1',
              description: 'option 1 description',
              disabled: true,
            },
            {
              value: 'option 2',
              label: 'option 2',
              description: 'option 2 description',
              disabled: true,
            },
            {
              value: 'option 3',
              label: 'option 3',
              description: 'option 3 description',
              disabled: true,
            },
          ],
        },
      ];

      render(
        <PureCheckboxList
          value={['option 1']}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByRole('checkbox', { name: 'All' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'option 1' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'option 2' }),
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'option 3' }),
      ).not.toBeChecked();
    });

    it('should not render group label checkbox if label is not provided', () => {
      const mockOnChange = jest.fn();

      const mockOptions = [
        {
          label: '',
          description: '',
          options: [
            {
              value: 'option 1',
              label: 'option 1',
              description: 'option 1 description',
              disabled: true,
            },
            {
              value: 'option 2',
              label: 'option 2',
              description: 'option 2 description',
              disabled: true,
            },
            {
              value: 'option 3',
              label: 'option 3',
              description: 'option 3 description',
              disabled: true,
            },
          ],
        },
      ];

      render(
        <PureCheckboxList
          value={['option 1', 'option 2', 'option 3']}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(
        screen.queryByRole('checkbox', { name: 'All' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'option 1' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'option 2' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'option 3' })).toBeChecked();
    });
  });
});
