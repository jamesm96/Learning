// Build-time constant set in vite.config.ts.
declare const __APP_VERSION__: string;

// The whole course, validated and rendered at build time by content-plugin.ts.
declare module "virtual:course" {
  const course: import("./content/schema").Course;
  export default course;
}
