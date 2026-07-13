import beerImage from '../assets/beer.svg';

export type ConfiguredDrink = {
  id: string;
  name: string;
  pingaValue: number;
  imageSrc?: string;
  active: boolean;
  order: number;
};

// Keep IDs stable: they are used as Firestore map keys and in immutable receipts.
// Edit this list in code for Phase 1; do not rename or recycle an ID once used.
export const DRINK_CATALOGUE: readonly ConfiguredDrink[] = [
  {
    id: 'beer',
    name: 'Cerveja',
    pingaValue: 1,
    imageSrc: beerImage,
    active: true,
    order: 0,
  },
  {
    id: 'shot',
    name: 'Shot',
    pingaValue: 2,
    active: true,
    order: 1,
  },
  {
    id: 'cider',
    name: 'Sidra',
    pingaValue: 1,
    active: true,
    order: 2,
  },
  {
    id: 'wine',
    name: 'Vinho',
    pingaValue: 2,
    active: false,
    order: 3,
  },
];
