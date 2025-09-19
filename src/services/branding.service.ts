import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { compressImage } from '../utils/image';
import { db } from '../firebase';

const BRANDING_COLLECTION = 'branding';
const BRANDING_DOC_ID = 'current';

export interface BrandingData {
  mainLogoDataUrl?: string;
  iconDataUrl?: string;
}

export async function getBranding(): Promise<BrandingData> {
  const ref = doc(db, BRANDING_COLLECTION, BRANDING_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return {};
  }
  const data = snap.data() as BrandingData | undefined;
  return {
    mainLogoDataUrl: data?.mainLogoDataUrl,
    iconDataUrl: data?.iconDataUrl,
  };
}

interface UpdateBrandingParams {
  mainLogoFile?: File | null;
  iconFile?: File | null;
  removeMainLogo?: boolean;
  removeIcon?: boolean;
}

export async function updateBranding({
  mainLogoFile,
  iconFile,
  removeMainLogo,
  removeIcon,
}: UpdateBrandingParams): Promise<void> {
  const ref = doc(db, BRANDING_COLLECTION, BRANDING_DOC_ID);
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (mainLogoFile) {
    updates.mainLogoDataUrl = await compressImage(mainLogoFile);
  } else if (removeMainLogo) {
    updates.mainLogoDataUrl = deleteField();
  }
  if (iconFile) {
    updates.iconDataUrl = await compressImage(iconFile);
  } else if (removeIcon) {
    updates.iconDataUrl = deleteField();
  }

  await setDoc(ref, updates, { merge: true });
}
