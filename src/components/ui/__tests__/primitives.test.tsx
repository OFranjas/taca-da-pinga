import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';
import { Card } from '../Card';
import { FileInput } from '../FileInput';
import { Input } from '../Input';
import { Section } from '../Section';

describe('UI primitives', () => {
  it('renders a button and handles clicks', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} variant="primary">
        Click me
      </Button>
    );

    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders a card with children', () => {
    render(
      <Card>
        <p data-testid="card-child">Child content</p>
      </Card>
    );

    expect(screen.getByTestId('card-child')).toBeInTheDocument();
  });

  it('renders an input and notifies on change', () => {
    const handleChange = vi.fn();
    render(
      <Input
        placeholder="Email"
        value=""
        onChange={(event) => handleChange(event.target.value)}
      />
    );

    const input = screen.getByPlaceholderText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalledWith('test@example.com');
  });

  it('renders a file input and exposes change events', () => {
    const handleChange = vi.fn();
    const file = new File(['content'], 'logo.png', { type: 'image/png' });

    render(
      <FileInput
        label="Upload"
        onChange={(event) => handleChange(event.target.files?.[0]?.name)}
        data-testid="file-input"
      />
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenCalledWith('logo.png');
  });

  it('renders a section with custom element', () => {
    const { container } = render(
      <Section as="div" variant="surface">
        Content
      </Section>
    );

    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});
