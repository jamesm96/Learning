import { useState } from "preact/hooks";

interface PromptCardProps {
  title: string;
  text: string;
}

/** A prompt for Claude, with a button that copies it. */
export function PromptCard({ title, text }: PromptCardProps) {
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("yes");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div class="prompt-card">
      <p class="prompt-title">{title}</p>
      <pre class="code is-output" tabIndex={0} aria-label={`Prompt: ${title}`}>
        {text.trim()}
      </pre>
      <button type="button" class="button-secondary" onClick={() => void copy()}>
        {copied === "yes" ? "Copied" : copied === "failed" ? "Could not copy. Select the text instead" : "Copy prompt"}
      </button>
    </div>
  );
}
