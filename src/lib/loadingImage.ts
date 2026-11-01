const LOADING_IMAGE_KEY = 'loadingImage';

export function loadLoadingImage(): string | null {
  try {
    return localStorage.getItem(LOADING_IMAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLoadingImage(dataUrl: string): boolean {
  try {
    localStorage.setItem(LOADING_IMAGE_KEY, dataUrl);
    return true;
  } catch (err) {
    console.error('加载图保存失败', err);
    return false;
  }
}
