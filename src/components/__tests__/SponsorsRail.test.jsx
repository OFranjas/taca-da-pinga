import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import SponsorsRail from '../SponsorsRail';

vi.mock('../../hooks/useMeasuredLoop', () => ({
  default: () => ({ copies: 3, cycleExtent: 100 }),
}));

const sponsors = [
  { imageDataUrl: 'data:image/png;base64,one', name: 'Primeiro', link: 'https://example.com/one' },
  { imageDataUrl: 'data:image/png;base64,two', name: 'Segundo' },
];

describe('SponsorsRail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    const { container } = render(
      <SponsorsRail sponsors={[sponsors[0]]} loopItemTarget={2} autoScroll={false} />
    );

    expect(container.querySelectorAll('a, div[class*="slot"]')).toHaveLength(1);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  test('stops animation frames while the rail is paused and resumes them afterwards', () => {
    const requestAnimationFrame = vi.fn(() => 1);
    const cancelAnimationFrame = vi.fn();
    const matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);
    vi.stubGlobal('matchMedia', matchMedia);

    const { container } = render(<SponsorsRail sponsors={sponsors} loopItemTarget={3} />);
    const rail = container.querySelector('aside');

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    fireEvent.mouseEnter(rail);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(rail, { relatedTarget: document.body });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  test('does not schedule animation frames when reduced motion is preferred', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<SponsorsRail sponsors={sponsors} loopItemTarget={3} />);

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});
