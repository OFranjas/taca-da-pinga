import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SponsorMarquee, { normalizeMobileLoopPosition } from '../SponsorMarquee';

const sponsors = [
  {
    id: 'one',
    name: 'Primeiro sponsor',
    imageDataUrl: 'data:image/png;base64,one',
    link: 'https://example.com/one',
  },
  {
    id: 'two',
    name: 'Segundo sponsor',
    imageDataUrl: 'data:image/png;base64,two',
  },
];

describe('SponsorMarquee', () => {
  test('keeps mobile transform motion within the interactive middle segment', () => {
    expect(normalizeMobileLoopPosition(0, 120)).toBe(120);
    expect(normalizeMobileLoopPosition(179, 120)).toBe(179);
    expect(normalizeMobileLoopPosition(240, 120)).toBe(120);
  });

  test('does not render an empty sponsor list', () => {
    const { container } = render(<SponsorMarquee sponsors={[]} autoScroll />);

    expect(container).toBeEmptyDOMElement();
  });

  test('keeps one accessible, interactive copy of every looping sponsor', () => {
    const { container } = render(
      <SponsorMarquee sponsors={sponsors} autoScroll ariaLabel="Patrocinadores de teste" />
    );

    expect(screen.getByRole('list', { name: 'Patrocinadores de teste' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: 'Primeiro sponsor' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Primeiro sponsor/i })).toHaveAttribute(
      'href',
      'https://example.com/one'
    );
    expect(screen.getByRole('link', { name: /Primeiro sponsor/i })).toHaveAttribute(
      'target',
      '_blank'
    );
    const duplicateLinks = container.querySelectorAll('[aria-hidden="true"] a');
    expect(duplicateLinks).toHaveLength(2);
    duplicateLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://example.com/one');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });

  test('does not duplicate a single sponsor just to animate it', () => {
    render(<SponsorMarquee sponsors={[sponsors[0]]} autoScroll />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getAllByRole('img', { name: 'Primeiro sponsor' })).toHaveLength(1);
  });

  test('does not translate a non-looping row when swiped on touch devices', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query) => ({
        matches: query === '(hover: none)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { container, unmount } = render(<SponsorMarquee sponsors={[sponsors[0]]} autoScroll />);
    const row = container.querySelector('[tabindex="0"]');
    const track = row?.firstElementChild;

    fireEvent.pointerDown(row, { pointerId: 1, clientX: 20 });
    fireEvent.pointerMove(row, { pointerId: 1, clientX: 120 });

    expect(track?.style.transform).toBe('');

    unmount();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });
});
