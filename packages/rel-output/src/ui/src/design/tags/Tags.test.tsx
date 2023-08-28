import { dimension } from '@shopify/jest-dom-mocks';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { TagItem } from './Tag';
import { Tags } from './Tags';

const tagItems: TagItem[] = [
  {
    id: 'tag-1',
    name: 'tag1',
  },
  {
    id: 'tag-2',
    name: 'tag2',
  },
];

describe('Tags', () => {
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = jest.fn(() => {
      return {
        width: 80,
        height: 40,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };
    });
  });

  afterEach(() => {
    dimension.restore();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should show tags', () => {
    dimension.mock({
      offsetWidth: 1000,
      offsetHeight: 800,
    });
    const onTagClick = jest.fn();

    render(<Tags tagItems={tagItems} onTagClick={onTagClick} />);
    expect(screen.getByText(tagItems[0].name ?? '')).toBeInTheDocument();
    expect(screen.getByText(tagItems[1].name ?? '')).toBeInTheDocument();
  });

  it('should show some tags and hide others based on width', async () => {
    dimension.mock({
      offsetWidth: 200,
      offsetHeight: 800,
    });
    const onTagClick = jest.fn();

    render(<Tags tagItems={tagItems} onTagClick={onTagClick} />);

    expect(screen.getByText(tagItems[0].name ?? '')).toBeInTheDocument();
    expect(screen.queryByText(tagItems[1].name ?? '')).not.toBeInTheDocument();

    const hiddenItemsTag = screen.getByTestId('hidden-tags-trigger-button');

    expect(hiddenItemsTag).toBeInTheDocument();

    await act(() => {
      fireEvent.click(hiddenItemsTag);
    });

    expect(screen.getByText(tagItems[1].id ?? '')).toBeInTheDocument();
  });

  it('should handle tags click', () => {
    dimension.mock({
      offsetWidth: 1000,
      offsetHeight: 800,
    });
    const onTagClick = jest.fn();

    render(<Tags tagItems={tagItems} onTagClick={onTagClick} />);
    fireEvent.click(screen.getByText(tagItems[0].name ?? ''));
    expect(onTagClick).toHaveBeenCalledWith(tagItems[0]);
  });
});
