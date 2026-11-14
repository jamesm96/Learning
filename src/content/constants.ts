// Shared by the build (schema checks) and the app (drawing gaps). Kept in its own file
// so importing it does not pull Zod into the app.

/** The marker for a gap in fill-the-gap code. */
export const BLANK = "___";
