import { render, screen } from '@testing-library/react';
import React from 'react';

function Hello() {
  return <h1>Hello Taça</h1>;
}

test('renders hello', () => {
  render(<Hello />);
  expect(screen.getByText(/Hello Taça/i)).toBeInTheDocument();
});
