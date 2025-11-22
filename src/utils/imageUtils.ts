export const BLANK_IMAGE = '/assets/images/empty-user.png';

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>): void {
  const img = e.currentTarget;
  if (img.src !== BLANK_IMAGE && !img.src.includes('empty-user.png')) {
    img.src = BLANK_IMAGE;
  }
}

