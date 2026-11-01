/**
 * Open dialogs and other full-screen layers (UiDialog, the album editor's preview), innermost last: Escape closes
 * only the top one, and the page scrolls again once all are closed.
 */
export const dialogStack: symbol[] = []
