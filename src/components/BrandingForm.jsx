import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './BrandingForm.module.css';

function revokeObjectUrl(ref) {
  if (ref.current) {
    URL.revokeObjectURL(ref.current);
    ref.current = null;
  }
}

export default function BrandingForm({ initialBranding, isLoading, onSave }) {
  const [mainLogoFile, setMainLogoFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [mainPreview, setMainPreview] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [mainRemoved, setMainRemoved] = useState(false);
  const [iconRemoved, setIconRemoved] = useState(false);

  const mainObjectUrlRef = useRef(null);
  const iconObjectUrlRef = useRef(null);

  useEffect(() => {
    if (!mainLogoFile && !mainRemoved) {
      setMainPreview(initialBranding?.mainLogoDataUrl || '');
    }
    if (!iconFile && !iconRemoved) {
      setIconPreview(initialBranding?.iconDataUrl || '');
    }
  }, [initialBranding, mainLogoFile, iconFile, mainRemoved, iconRemoved]);

  useEffect(
    () => () => {
      revokeObjectUrl(mainObjectUrlRef);
      revokeObjectUrl(iconObjectUrlRef);
    },
    []
  );

  const handleFileChange = (
    file,
    setter,
    previewSetter,
    objectUrlRef,
    inputRef,
    resetRemoval
  ) => {
    setter(file || null);
    revokeObjectUrl(objectUrlRef);
    if (file) {
      if (inputRef?.current) {
        inputRef.current.value = '';
      }
      const nextUrl = URL.createObjectURL(file);
      objectUrlRef.current = nextUrl;
      previewSetter(nextUrl);
      resetRemoval(false);
    } else {
      previewSetter('');
    }
  };

  const mainInputRef = useRef(null);
  const iconInputRef = useRef(null);

  const resetFileSelection = (setter, previewSetter, objectUrlRef, inputRef) => {
    setter(null);
    previewSetter('');
    revokeObjectUrl(objectUrlRef);
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemoveMainLogo = () => {
    const removingStoredAsset =
      !mainLogoFile && Boolean(initialBranding?.mainLogoDataUrl);
    resetFileSelection(setMainLogoFile, setMainPreview, mainObjectUrlRef, mainInputRef);
    setMainRemoved(removingStoredAsset);
  };

  const handleRemoveIcon = () => {
    const removingStoredAsset = !iconFile && Boolean(initialBranding?.iconDataUrl);
    resetFileSelection(setIconFile, setIconPreview, iconObjectUrlRef, iconInputRef);
    setIconRemoved(removingStoredAsset);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      await onSave({
        mainLogoFile: mainLogoFile || undefined,
        iconFile: iconFile || undefined,
        removeMainLogo: mainRemoved,
        removeIcon: iconRemoved,
      });
      // Clear local selections so refreshed data takes over the previews
      setMainLogoFile(null);
      setIconFile(null);
      setMainRemoved(false);
      setIconRemoved(false);
      revokeObjectUrl(mainObjectUrlRef);
      revokeObjectUrl(iconObjectUrlRef);
      setStatusMessage('Branding saved successfully.');
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to save branding.');
    } finally {
      setSaving(false);
    }
  };

  const disableForm = saving || isLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset} disabled={disableForm}>
        <legend className={styles.legend}>Branding assets</legend>
        <div className={styles.assetsGrid}>
          <div className={styles.assetCard}>
            <div className={styles.assetHeader}>
              <div>
                <label htmlFor="mainLogo" className={styles.assetTitle}>
                  Main logo
                </label>
                <p className={styles.assetHint}>Displayed on scoreboards and landing page</p>
              </div>
              {mainPreview ? (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleRemoveMainLogo}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p className={styles.constraints}>JPEG/PNG up to 600×600px (auto-compressed)</p>
            <div className={styles.previewFrameWide}>
              {mainPreview ? (
                <img src={mainPreview} alt="Main logo preview" className={styles.previewImage} />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <span>Upload a logo to preview</span>
                </div>
              )}
            </div>
            <div className={styles.uploadRow}>
              <input
                id="mainLogo"
                ref={mainInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) =>
                  handleFileChange(
                    e.target.files?.[0] || null,
                    setMainLogoFile,
                    setMainPreview,
                    mainObjectUrlRef,
                    mainInputRef,
                    setMainRemoved
                  )
                }
              />
              <label htmlFor="mainLogo" className={styles.uploadButton}>
                Choose image
              </label>
              {mainLogoFile ? <span className={styles.fileName}>{mainLogoFile.name}</span> : null}
            </div>
          </div>

          <div className={styles.assetCard}>
            <div className={styles.assetHeader}>
              <div>
                <label htmlFor="icon" className={styles.assetTitle}>
                  Icon
                </label>
                <p className={styles.assetHint}>Used for favicons &amp; mobile shortcuts</p>
              </div>
              {iconPreview ? (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleRemoveIcon}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p className={styles.constraints}>Square images look best (auto-resized)</p>
            <div className={styles.previewFrameSquare}>
              {iconPreview ? (
                <img src={iconPreview} alt="Icon preview" className={styles.previewImageSmall} />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <span>Upload an icon to preview</span>
                </div>
              )}
            </div>
            <div className={styles.uploadRow}>
              <input
                id="icon"
                ref={iconInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) =>
                  handleFileChange(
                    e.target.files?.[0] || null,
                    setIconFile,
                    setIconPreview,
                    iconObjectUrlRef,
                    iconInputRef,
                    setIconRemoved
                  )
                }
              />
              <label htmlFor="icon" className={styles.uploadButton}>
                Choose image
              </label>
              {iconFile ? <span className={styles.fileName}>{iconFile.name}</span> : null}
            </div>
          </div>
        </div>
      </fieldset>

      {errorMessage ? (
        <p role="alert" className={styles.errorMessage}>
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p role="status" className={styles.statusMessage}>
          {statusMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.saveButton} disabled={disableForm}>
          {saving ? 'Saving…' : 'Save branding'}
        </button>
      </div>
    </form>
  );
}

BrandingForm.propTypes = {
  initialBranding: PropTypes.shape({
    mainLogoDataUrl: PropTypes.string,
    iconDataUrl: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
};

BrandingForm.defaultProps = {
  initialBranding: {},
  isLoading: false,
};
