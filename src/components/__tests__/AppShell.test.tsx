import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi, type MockedFunction } from 'vitest';

vi.mock('../../services/branding.service', () => ({
  getBranding: vi.fn(),
}));

type BrandingModule = typeof import('../../services/branding.service');
type AppShellModule = typeof import('../AppShell');

let getBrandingMock: MockedFunction<BrandingModule['getBranding']>;
let AppShellComponent: AppShellModule['AppShell'] | null = null;

describe('AppShell', () => {
  beforeAll(async () => {
    const branding = await import('../../services/branding.service');
    getBrandingMock = vi.mocked(branding.getBranding);
    ({ AppShell: AppShellComponent } = await import('../AppShell'));
  });

  it('configures the responsive grid columns for each breakpoint', async () => {
    getBrandingMock.mockResolvedValue({});

    const Component = AppShellComponent;
    if (!Component) {
      throw new Error('AppShell component not loaded');
    }

    render(
      <Component title="Dashboard" subtitle="Welcome to Taça da Pinga">
        <div>Content</div>
      </Component>,
      {
        wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>,
      }
    );

    await waitFor(() => {
      expect(getBrandingMock).toHaveBeenCalledTimes(1);
    });

    const grid = screen.getByTestId('app-shell-grid');
    expect(grid.style.getPropertyValue('--grid-columns')).toBe('1');
    expect(grid.style.getPropertyValue('--grid-columns-md')).toBe('12');
    expect(grid.style.getPropertyValue('--grid-columns-tv')).toBe('16');
  });
});
