export const ARRIVAL = 0.9;
export const labels = ['About', 'Projects', 'Contact'];
export const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
export function cardTilt(x, y, width, height) {
  return { x: -clamp((y / height - 0.5) * 2, -1, 1) * 5,
    y: clamp((x / width - 0.5) * 2, -1, 1) * 5 };
}
// Both the DOM layout and the Three camera use these screen-space anchors.
export function shipAnchor(index, opened, narrow) {
  return opened ? 0.5 : 0.5 + (index - 1) * (narrow ? 0.30 : 0.24);
}
