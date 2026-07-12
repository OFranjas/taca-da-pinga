import { render, screen } from '@testing-library/react';
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
    render(<SponsorMarquee sponsors={sponsors} autoScroll ariaLabel="Patrocinadores de teste" />);

    expect(screen.getByRole('list', { name: 'Patrocinadores de teste' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: 'Primeiro sponsor' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Primeiro sponsor/i })).toHaveAttribute(
      'href',
      'https://example.com/one'
    );
  });

  test('does not duplicate a single sponsor just to animate it', () => {
    render(<SponsorMarquee sponsors={[sponsors[0]]} autoScroll />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getAllByRole('img', { name: 'Primeiro sponsor' })).toHaveLength(1);
  });
});
