import { render, screen } from '@testing-library/react';
import SponsorsRail from '../SponsorsRail';

const sponsors = [
  { imageDataUrl: 'data:image/png;base64,one', name: 'Primeiro', link: 'https://example.com/one' },
  { imageDataUrl: 'data:image/png;base64,two', name: 'Segundo' },
];

describe('SponsorsRail', () => {
  test('fills a shorter visual rail to the shared loop capacity without duplicating accessible sponsors', () => {
    const { container } = render(<SponsorsRail sponsors={sponsors} loopItemTarget={3} />);

    expect(container.querySelectorAll('a, div[class*="slot"]')).toHaveLength(12);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Primeiro' })).toHaveAttribute(
      'href',
      'https://example.com/one'
    );
  });

  test('uses a non-repeating filler at the loop boundary', () => {
    const { container } = render(<SponsorsRail sponsors={sponsors} loopItemTarget={3} />);
    const slotNames = Array.from(container.querySelectorAll('[class*="slot"]')).map((slot) =>
      slot.textContent?.trim()
    );

    expect(slotNames.slice(0, 5)).toEqual([
      'Primeiro',
      'Segundo',
      'Primeiro',
      'Segundo',
      'Primeiro',
    ]);
  });

  test('does not animate or duplicate a single unpaired sponsor', () => {
    const { container } = render(<SponsorsRail sponsors={[sponsors[0]]} loopItemTarget={1} />);

    expect(container.querySelectorAll('a, div[class*="slot"]')).toHaveLength(1);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});
