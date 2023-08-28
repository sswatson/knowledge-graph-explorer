import { fireEvent, render, screen } from '@testing-library/react';

import SideMenu, { SideMenuItem } from './SideMenu';

const menuItems: SideMenuItem[] = [
  {
    id: 'item-1',
    name: 'item1',
  },
  {
    id: 'item-2',
    name: 'item2',
  },
];

describe('SideMenu', () => {
  it('should show menu items', () => {
    const testIdPrefix = 'prefix-';

    render(<SideMenu items={menuItems} testIdPrefix={testIdPrefix} />);
    expect(screen.getByTestId(`${testIdPrefix}side-menu`)).toBeInTheDocument();
    menuItems.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  it('should handle menu item click', () => {
    const onMenuItemClick = jest.fn();

    render(<SideMenu items={menuItems} onMenuItemClick={onMenuItemClick} />);

    menuItems.forEach((item, index) => {
      fireEvent.click(screen.getByText(item.name));
      expect(onMenuItemClick).toHaveBeenCalledWith(item, index);
    });
  });
});
