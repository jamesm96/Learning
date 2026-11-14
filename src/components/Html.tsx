interface HtmlProps {
  html: string;
  class?: string;
}

/**
 * Show HTML that the build produced from our own Markdown content.
 * Only ever pass content HTML here, never text typed by the user.
 */
export function Html({ html, class: className = "prose" }: HtmlProps) {
  return <div class={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
