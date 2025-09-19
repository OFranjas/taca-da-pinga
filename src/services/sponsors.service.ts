import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { compressImage } from '../utils/image';
import { db } from '../firebase';

const SPONSORS_COLLECTION = 'sponsors';
const MAX_ORDER_VALUE = 999;

export interface Sponsor {
  id: string;
  name: string;
  link?: string;
  imageDataUrl: string;
  active: boolean;
  order: number;
}

interface ListSponsorsOptions {
  activeOnly?: boolean;
}

export async function listSponsors(options: ListSponsorsOptions = {}): Promise<Sponsor[]> {
  const { activeOnly = false } = options;
  const sponsorsRef = collection(db, SPONSORS_COLLECTION);
  const constraints = [orderBy('order', 'asc')];
  if (activeOnly) {
    constraints.push(where('active', '==', true));
  }
  const snap = await getDocs(query(sponsorsRef, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sponsor, 'id'>) }));
}

interface CreateSponsorParams {
  name: string;
  link?: string;
  imageFile: File;
}

async function nextOrderValue(): Promise<number> {
  const sponsorsRef = collection(db, SPONSORS_COLLECTION);
  const snap = await getDocs(query(sponsorsRef, orderBy('order', 'desc'), limit(1)));
  if (snap.empty) {
    return 0;
  }
  const topDoc = snap.docs[0];
  const currentOrder = (topDoc.data()?.order as number | undefined) ?? 0;
  if (currentOrder >= MAX_ORDER_VALUE) {
    throw new Error('Maximum sponsor order reached');
  }
  return currentOrder + 1;
}

export async function createSponsor({
  name,
  link,
  imageFile,
}: CreateSponsorParams): Promise<string> {
  const imageDataUrl = await compressImage(imageFile);
  const orderValue = await nextOrderValue();
  const timestamp = serverTimestamp();
  const docRef = await addDoc(collection(db, SPONSORS_COLLECTION), {
    name,
    link: link ?? '',
    imageDataUrl,
    active: true,
    order: orderValue,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return docRef.id;
}

interface UpdateSponsorParams {
  name?: string;
  link?: string | null;
  imageFile?: File | null;
  active?: boolean;
}

export async function updateSponsor(
  id: string,
  { name, link, imageFile, active }: UpdateSponsorParams
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof name !== 'undefined') {
    updates.name = name;
  }
  if (typeof link !== 'undefined') {
    updates.link = link ?? '';
  }
  if (typeof active !== 'undefined') {
    updates.active = active;
  }
  if (imageFile) {
    updates.imageDataUrl = await compressImage(imageFile);
  }

  await updateDoc(doc(db, SPONSORS_COLLECTION, id), updates);
}

export async function deleteSponsor(id: string): Promise<void> {
  await deleteDoc(doc(db, SPONSORS_COLLECTION, id));
}

export async function reorderSponsors(idsInOrder: string[]): Promise<void> {
  if (idsInOrder.length > MAX_ORDER_VALUE + 1) {
    throw new Error('Too many sponsors to reorder');
  }

  const batch = writeBatch(db);
  idsInOrder.forEach((id, index) => {
    batch.update(doc(db, SPONSORS_COLLECTION, id), { order: index });
  });
  await batch.commit();
}
