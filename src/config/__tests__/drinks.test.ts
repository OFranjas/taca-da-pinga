import { describe, expect, test } from 'vitest';
import { DRINK_CATALOGUE } from '../drinks';

describe('drink catalogue', () => {
  test('keeps the Phase 1 catalogue values and ordering explicit', () => {
    expect(
      DRINK_CATALOGUE.map(({ id, name, pingaValue, active, order, imageSrc }) => ({
        id,
        name,
        pingaValue,
        active,
        order,
        hasImage: Boolean(imageSrc),
      }))
    ).toEqual([
      {
        id: 'light',
        name: 'Bebida Leve',
        pingaValue: 1,
        active: true,
        order: 0,
        hasImage: true,
      },
      {
        id: 'white-spirit',
        name: 'Bebida Branca',
        pingaValue: 5,
        active: true,
        order: 1,
        hasImage: true,
      },
      {
        id: 'metro',
        name: 'Metro',
        pingaValue: 11,
        active: true,
        order: 2,
        hasImage: true,
      },
    ]);
  });
});
