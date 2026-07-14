import beerImage from '../assets/beer.svg';
import ciderImage from '../assets/cider.svg';
import metroImage from '../assets/metro.svg';
import sangriaImage from '../assets/sangria.svg';
import whiteSpiritImage from '../assets/white-spirit.svg';

export type DrinkIconName = 'beer' | 'bottle' | 'sangria' | 'spirit' | 'metro';

export type ConfiguredDrink = {
  id: string;
  name: string;
  pingaValue: number;
  icon: DrinkIconName;
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
    icon: 'beer',
    imageSrc: beerImage,
    active: true,
    order: 0,
  },
  {
    id: 'cider',
    name: 'Cidra',
    pingaValue: 1,
    icon: 'bottle',
    imageSrc: ciderImage,
    active: true,
    order: 1,
  },
  {
    id: 'sangria',
    name: 'Sangria',
    pingaValue: 1,
    icon: 'sangria',
    imageSrc: sangriaImage,
    active: true,
    order: 2,
  },
  {
    id: 'white-spirit',
    name: 'Bebida branca',
    pingaValue: 5,
    icon: 'spirit',
    imageSrc: whiteSpiritImage,
    active: true,
    order: 3,
  },
  {
    id: 'metro',
    name: 'Metro',
    pingaValue: 11,
    icon: 'metro',
    imageSrc: metroImage,
    active: true,
    order: 4,
  },
];
