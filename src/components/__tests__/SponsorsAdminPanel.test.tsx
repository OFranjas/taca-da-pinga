import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SponsorsAdminPanel, { reorderSponsorsById } from '../SponsorsAdminPanel';
import type { Sponsor } from '../../services/sponsors.service';

const sponsors: Sponsor[] = [
  {
    id: 'first',
    name: 'Primeiro',
    imageDataUrl: 'data:image/png;base64,first',
    active: true,
    order: 0,
  },
  {
    id: 'second',
    name: 'Segundo',
    imageDataUrl: 'data:image/png;base64,second',
    active: true,
    order: 1,
  },
  {
    id: 'third',
    name: 'Terceiro',
    imageDataUrl: 'data:image/png;base64,third',
    active: false,
    order: 2,
  },
];

const sponsorServiceMocks = vi.hoisted(() => ({
  createSponsor: vi.fn(),
  observeSponsors: vi.fn(),
  reorderSponsors: vi.fn(),
  updateSponsor: vi.fn(),
}));

vi.mock('../../services/sponsors.service', () => ({
  createSponsor: sponsorServiceMocks.createSponsor,
  deleteSponsor: vi.fn(),
  observeSponsors: sponsorServiceMocks.observeSponsors,
  reorderSponsors: sponsorServiceMocks.reorderSponsors,
  updateSponsor: sponsorServiceMocks.updateSponsor,
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();

  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: ReactNode;
      onDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void;
    }) =>
      createElement(
        'div',
        null,
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => onDragEnd({ active: { id: 'third' }, over: { id: 'first' } }),
          },
          'Simular arrasto'
        ),
        children
      ),
  };
});

describe('reorderSponsorsById', () => {
  test('moves a sponsor to its dropped position without changing its data', () => {
    const reordered = reorderSponsorsById(sponsors, 'third', 'first');

    expect(reordered.map((sponsor) => sponsor.id)).toEqual(['third', 'first', 'second']);
    expect(reordered[0]).toEqual(sponsors[2]);
  });

  test('keeps the current list when the drop target is unchanged or unknown', () => {
    expect(reorderSponsorsById(sponsors, 'second', 'second')).toBe(sponsors);
    expect(reorderSponsorsById(sponsors, 'second', 'missing')).toBe(sponsors);
    expect(reorderSponsorsById(sponsors, 'missing', 'second')).toBe(sponsors);
  });
});

describe('SponsorsAdminPanel ordering controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sponsorServiceMocks.observeSponsors.mockImplementation(
      (callback: (nextSponsors: Sponsor[]) => void) => {
        callback(sponsors);
        return vi.fn();
      }
    );
    sponsorServiceMocks.reorderSponsors.mockResolvedValue(undefined);
    sponsorServiceMocks.createSponsor.mockResolvedValue('new-sponsor');
    sponsorServiceMocks.updateSponsor.mockResolvedValue(undefined);
  });

  test('renders a dedicated drag handle without redundant arrow controls', async () => {
    render(<SponsorsAdminPanel />);

    expect(await screen.findByRole('button', { name: 'Reordenar Primeiro' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Mover Primeiro para/i })).not.toBeInTheDocument();
  });

  test('persists a dropped position and restores the visual order when it fails', async () => {
    sponsorServiceMocks.reorderSponsors.mockRejectedValueOnce(new Error('Falha de rede'));
    render(<SponsorsAdminPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Simular arrasto' }));

    await waitFor(() => {
      expect(sponsorServiceMocks.reorderSponsors).toHaveBeenCalledWith([
        'third',
        'first',
        'second',
      ]);
    });

    await waitFor(() => {
      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Primeiro'),
          expect.stringContaining('Terceiro'),
        ])
      );
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Primeiro');
    });
  });

  test('passes the optional HTTPS site to sponsor creation and editing', async () => {
    render(<SponsorsAdminPanel />);

    fireEvent.change(screen.getByLabelText('Site (opcional)'), {
      target: { value: 'https://example.com/new' },
    });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Novo patrocinador' } });
    fireEvent.change(screen.getByLabelText('Logotipo'), {
      target: { files: [new File(['logo'], 'logo.png', { type: 'image/png' })] },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Adicionar patrocinador' }).closest('form')!
    );

    await waitFor(() => {
      expect(sponsorServiceMocks.createSponsor).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Novo patrocinador', link: 'https://example.com/new' })
      );
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    const siteInputs = screen.getAllByLabelText('Site (opcional)');
    fireEvent.change(siteInputs[1], { target: { value: 'https://example.com/updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(sponsorServiceMocks.updateSponsor).toHaveBeenCalledWith(
        'first',
        expect.objectContaining({ link: 'https://example.com/updated' })
      );
    });
  });

  test('keeps a legacy HTTP site unchanged when editing another sponsor field', async () => {
    sponsorServiceMocks.observeSponsors.mockImplementation(
      (callback: (nextSponsors: Sponsor[]) => void) => {
        callback([{ ...sponsors[0], link: 'http://legacy.example.com' }]);
        return vi.fn();
      }
    );
    render(<SponsorsAdminPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getAllByLabelText('Nome')[1], { target: { value: 'Nome atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(sponsorServiceMocks.updateSponsor).toHaveBeenCalledWith(
        'first',
        expect.objectContaining({ name: 'Nome atualizado' })
      );
    });
    expect(sponsorServiceMocks.updateSponsor.mock.calls.at(-1)?.[1]).not.toHaveProperty('link');
  });
});
