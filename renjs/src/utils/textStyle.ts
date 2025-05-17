type Token = { text: string; tag?: never } | { text?: never; tag: string };

const regexStyles = /\((?:color:(\s?)(?:\w+|#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})|italic|bold|end)\)/;
const regexPauses = /\((?:pause:(\s?)(?:click|\d+))\)/;

const re = /\((?:color:(\s?)(?:\w+|#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})|(?:pause:(\s?)(?:click|\d+))|italic|bold|end)\)/;

/** converts text into a list of tokens that can be used to construct styles */
export function tokenizeTextStyle(text: string, regex?: string): Token[] {
	const styles: Token[] = [];
	while (true) {
		const match = re.exec(text);
		if (!match) {
			styles.push({ text });
			return styles;
		}
		const { index, 0: tag } = match;
		styles.push({ text: text.substr(0, index) });
		styles.push({ tag: tag.slice(1, -1) });
		text = text.substr(index + tag.length);
	}
}
