/**
 * JSON for an inline `<script type="application/json">` rendered with
 * `set:html`. `<` is escaped so a value containing `</script>` cannot end the
 * element early; JSON.parse reads `<` back as `<`.
 */
export function jsonForScript(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}
