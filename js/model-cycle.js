// Index of the next model shown by the action button. After the last model
// it returns -1 (nothing shown, button reads "reset"); from -1 it goes back to 0.
export const nextModelIndex = (current, count) => (current + 1 >= count ? -1 : current + 1);
