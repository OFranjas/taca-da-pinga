import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SponsorMarquee from '../SponsorMarquee';
import {
  getLoopTimeAfterDistance,
  getWheelDistance,
  normalizeLoopTime,
} from '../../hooks/useInteractiveLoop';
import { getLoopCopyCount, getLoopDurationSeconds } from '../../hooks/useMeasuredLoop';

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
  test('sizes a loop to cover wide viewports and uses a readable animation duration', () => {
    expect(getLoopCopyCount(1200, 200)).toBe(9);
    expect(getLoopDurationSeconds(360, 18)).toBe(20);
  });

  test('normalizes a dragged animation position inside one smooth loop', () => {
    expect(normalizeLoopTime(-200, 1000)).toBe(800);
    expect(normalizeLoopTime(1250, 1000)).toBe(250);
    expect(getLoopTimeAfterDistance(200, 50, 100, 1000)).toBe(700);
    expect(getWheelDistance('x', 0, 120)).toBe(120);
    expect(getWheelDistance('x', 30, 120)).toBe(30);
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
    expect(duplicateLinks.length).toBeGreaterThan(0);
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

  test('keeps a non-looping row as a single static cycle', () => {
    const { container } = render(<SponsorMarquee sponsors={[sponsors[0]]} autoScroll />);

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  test('prevents native browser dragging from stealing a laptop carousel gesture', () => {
    const { container } = render(<SponsorMarquee sponsors={sponsors} autoScroll />);
    const row = container.querySelector('[tabindex="0"]');

    expect(fireEvent.dragStart(row)).toBe(false);
  });

  test('maps a laptop mouse wheel gesture to the smooth animation timeline', () => {
    const originalAnimate = HTMLElement.prototype.animate;
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const originalClientWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientWidth'
    );
    const animation = { cancel: vi.fn(), currentTime: 100, pause: vi.fn(), play: vi.fn() };
    const animate = vi.fn(() => animation);

    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ height: 100, width: 300 }),
    });

    const { container, unmount } = render(<SponsorMarquee sponsors={sponsors} autoScroll />);
    const row = container.querySelector('[tabindex="0"]');
    const wheelEvent = createEvent.wheel(row, { cancelable: true, deltaY: 120 });

    expect(animate).toHaveBeenCalled();
    fireEvent(row, wheelEvent);
    expect(animation.currentTime).not.toBe(100);

    unmount();
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: originalAnimate,
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: originalGetBoundingClientRect,
    });
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
    } else {
      delete HTMLElement.prototype.clientWidth;
    }
  });
});
