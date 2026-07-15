import { render, screen } from '@testing-library/react';
import SponsorMarquee from '../SponsorMarquee';
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
});
