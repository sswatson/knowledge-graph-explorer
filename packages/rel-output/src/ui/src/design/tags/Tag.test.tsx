import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tag from './Tag';

describe('Tag', () => {
  it('should show item name and icon', () => {
    const tagItem = {
      id: 'tagId',
      name: 'tagName',
      icon: <div>tagIcon</div>,
    };

    render(<Tag tagItem={tagItem} />);

    expect(screen.getByText('tagName')).toBeInTheDocument();
    expect(screen.getByText('tagIcon')).toBeInTheDocument();
  });

  it('should fire on tag click', async () => {
    const user = userEvent.setup();
    const tagItem = {
      id: 'tagId',
      name: 'tagName',
    };
    const onTagClick = jest.fn();

    render(<Tag tagItem={tagItem} onTagClick={onTagClick} />);

    await user.click(screen.getByText('tagName'));
    await waitFor(() => {
      expect(onTagClick).toHaveBeenCalled();
    });

    await user.keyboard('{Enter}');
    expect(onTagClick).toHaveBeenCalledTimes(2);
  });
});
