import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../pages/Home', () => ({
  default: () => <Link to="/leaderboard">Ir para classificação</Link>,
}));

vi.mock('../pages/Leaderboard', () => ({
  default: () => <main>Classificação</main>,
}));

vi.mock('../pages/Admin', () => ({
  default: () => <main>Admin</main>,
}));

vi.mock('../pages/Branding', () => ({
  default: () => <main>Branding</main>,
}));

const { default: App } = await import('../App');

describe('App routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.documentElement.scrollTop = 480;
    document.body.scrollTop = 480;
  });

  it('resets scroll when navigating between app sections', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('link', { name: 'Ir para classificação' }));

    expect(await screen.findByText('Classificação')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });
});
