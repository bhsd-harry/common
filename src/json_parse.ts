/*
	json_parse.js
	2016-05-02

	Public Domain.

	NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

	This file creates a json_parse function.

		json_parse(text)
			This method parses a JSON text and throws a SyntaxError exception.

	This is a reference implementation. You are free to copy, modify, or redistribute.

	Original source:
		https://github.com/douglascrockford/JSON-js/blob/107fc93c94aa3a9c7b48548631593ecf3aac60d2/json_parse.js

	Modifications:
		- Only returns errors and warnings instead of the parsed value.
		- Better agreement with JSON specification.
		- Warnings for duplicate object keys and unsafe integers.

	This code should be minified before deployment.
	See http://javascript.crockford.com/jsmin.html

	USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO NOT CONTROL.
*/

export interface JsonSyntaxError {
	warnings: ExtendedJsonSyntaxError[];
	severity?: "error" | "warning";
	message?: string;
	from?: number | null;
	to?: number;
	/** @deprecated */
	position?: number;
}
export interface ExtendedJsonSyntaxError extends Omit<JsonSyntaxError, "warnings"> {
	severity: "error" | "warning";
	message: string;
	line?: number | null;
	column?: number | null;
	endLine?: number;
	endColumn?: number;
}

const escapee = {
	'"': '"',
	"\\": "\\",
	"/": "/",
	b: "\b",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "\t",
};
const spaces = new Set([" ", "\t", "\n", "\r"]);

const stringify = (c: string): string => {
	if (c === "") {
		return "end of input";
	}
	return c === '"' ? `'"'` : JSON.stringify(c);
};

const factory = (jsonc?: boolean) => {

	// This is a function that can parse a JSON text.
	// It is a simple, recursive descent parser.
	// It does not use eval or regular expressions,
	// so it can be used as a model for implementing a JSON parser in other languages.

	// We are defining the function inside of another function to avoid creating global variables.

	let at: number; // The index of the current character
	let ch: string; // The current character
	let text: string;
	let warnings: ExtendedJsonSyntaxError[];

	const prepareError = (e: Partial<JsonSyntaxError>, from?: number, to?: number): void => {
		if (from === undefined) {
			e.from = at - 1;
		} else {
			e.from = from;
			e.to = to ?? at - 1;
		}
	};

	const warn = (message: string, from?: number, to?: number): void => {

		// Log warning when something is wrong.

		const warning: ExtendedJsonSyntaxError = {
			message,
			severity: "warning",
		};
		prepareError(warning, from, to);
		warnings.push(warning);
	};

	const error = (message: string, from?: number, to?: number): never => {

		// Call error when something is wrong.

		const e: JsonSyntaxError = {
			warnings,
			message,
			severity: "error",
		};
		prepareError(e, from, to);
		throw e;
	};

	const next = (c?: string): string => {

		// If a c parameter is provided, verify that it matches the current character.

		if (c && c !== ch) {
			error(`Expected ${stringify(c)} instead of ${stringify(ch)}`);
		}

		// Get the next character. When there are no more characters, return the empty string.

		ch = text.charAt(at);
		at++;
		return ch;
	};

	const number = (): void => {

		// Parse a number value.

		let string = "";
		const from = at - 1;

		if (ch === "-") {
			string = "-";
			next();
		}
		if (ch === "0") {
			string += ch;
			next();
			if (ch >= "0" && ch <= "9") {
				error("Bad number");
			}
		} else if (ch >= "1" && ch <= "9") {
			while (ch >= "0" && ch <= "9") {
				string += ch;
				next();
			}
		} else {
			error("No number after minus sign");
		}
		if (ch !== "." && ch !== "e" && ch !== "E") {
			const value = Number(string);
			if (!Number.isSafeInteger(value)) {
				warn("Not a safe integer", from);
			}
			return;
		}
		if (ch === ".") {
			string += ".";
			next();
			if (ch < "0" || ch > "9") {
				error("Unterminated fractional number");
			}
			while (ch >= "0" && ch <= "9") {
				string += ch;
				next();
			}
		}
		if (ch === "e" || ch === "E") { // eslint-disable-line unicorn/prefer-else-if
			string += ch;
			next();
			// @ts-expect-error `ch` modified
			if (ch === "-" || ch === "+") {
				string += ch as string;
				next();
			}
			while (ch >= "0" && ch <= "9") {
				string += ch;
				next();
			}
		}
		const value = Number(string);
		if (!Number.isFinite(value)) {
			error("Bad number");
		}
	};

	const string = (): string => {

		// Parse a string value.

		let value = "";

		// When parsing for string values, we must look for " and \ characters.

		if (ch === '"') {
			while (next()) {
				if (ch === '"') {
					next();
					return value;
				}
				const from = at - 1;
				if (ch === "\\") {
					next();
					if (ch === "u") {
						let i = 0;
						let uffff = 0;
						for (; i < 4; i++) {
							const hex = parseInt(next(), 16);
							if (!isFinite(hex)) {
								break;
							}
							uffff = uffff * 16 + hex;
						}
						if (i < 4) {
							error("Bad unicode escape", from);
						}
						value += String.fromCharCode(uffff);
					} else if (typeof escapee[ch] === "string") {
						value += escapee[ch as keyof typeof escapee];
					} else {
						error("Bad escaped character", from, at);
					}
				} else if ((ch as string) < " ") {
					error("Bad control character", from, at);
				} else {
					value += ch as string;
				}
			}
		} else {
			error(`Expected '"' instead of ${JSON.stringify(ch)}`);
		}
		return error("Unterminated string");
	};

	const white = (): void => {

		// Skip whitespace and comments (JSONC).

		while (ch) {

			// Skip whitespace.

			while (ch && spaces.has(ch)) {
				next();
			}

			if (jsonc && ch === "/") {
				const peek = text.charAt(at);
				if (peek === "/") {

					// Skip single-line comments.

					next(); // skip /
					next(); // skip /
					// @ts-expect-error `ch` modified
					while (ch && ch !== "\n" && ch !== "\r") {
						next();
					}
					continue;
				} else if (peek === "*") {

					// Skip multi-line comments.

					next(); // skip /
					next(); // skip *
					// @ts-expect-error `ch` modified
					while (ch && (ch !== "*" || text.charAt(at) !== "/")) {
						next();
					}
					if (ch === "*") {
						next(); // skip *
						next(); // skip /
					}
					continue;
				}
			}

			break;
		}
	};

	const word = (): void => {

		// true, false, or null.

		switch (ch) {
			case "t":
				next();
				next("r");
				next("u");
				next("e");
				return;
			case "f":
				next();
				next("a");
				next("l");
				next("s");
				next("e");
				return;
			case "n":
				next();
				next("u");
				next("l");
				next("l");
				return;
			default:
				error(`Unexpected ${JSON.stringify(ch)}`);
		}
	};

	const array = (): void => {

		// Parse an array value.

		next();
		white();
		if (ch === "]") {
			next();
			return; // empty array
		} else if (jsonc && ch === ",") {
			next();
			white();
			next("]");
			return;
		}
		let from: number | undefined;
		while (ch) {
			if (ch === "]") {
				if (jsonc) {
					next();
					return;
				}
				error("Trailing comma in array", from, from! + 1);
			}
			value();
			white();
			if (ch === "]") {
				next();
				return;
			} else if (ch === ",") {
				from = at - 1;
				next();
				white();
			} else {
				error(`Expected "," or "]" instead of ${stringify(ch)}`);
			}
		}
		error("Unterminated array");
	};

	const object = (): void => {

		// Parse an object value.

		const keys = new Set<string>();

		next();
		white();
		if (ch === "}") {
			next();
			return; // empty object
		} else if (jsonc && ch === ",") {
			next();
			white();
			next("}");
			return;
		}
		let from: number | undefined;
		while (ch) {
			if (ch === "}") {
				if (jsonc) {
					next();
					return;
				}
				error("Trailing comma in object", from, from! + 1);
			}
			from = at;
			const key = string();
			const to = at - 2;
			white();
			next(":");
			if (keys.has(key)) {
				warn(`Duplicate key ${stringify(key)}`, from, to);
			} else {
				keys.add(key);
			}
			value();
			white();
			if (ch === "}") {
				next();
				return;
			} else if (ch === ",") {
				from = at - 1;
				next();
				white();
			} else {
				error(`Expected "," or "}" instead of ${stringify(ch)}`);
			}
		}
		error(`Expected '"'`);
	};

	const value = (): unknown => {

		// Parse a JSON value. It could be an object, an array, a string, a number,
		// or a word.

		white();
		switch (ch) {
			case "":
				return undefined;
			case "{":
				return object();
			case "[":
				return array();
			case '"':
				return string();
			case "-":
				return number();
			default:
				return (ch >= "0" && ch <= "9" ? number : word)();
		}
	};

	// Return the json_parse function. It will have access to all of the above
	// functions and variables.

	return (source: string): void => {
		text = source;
		warnings = [];
		at = 0;
		ch = " ";
		value();
		white();
		if (ch) {
			error("Syntax error");
		} else if (warnings.length > 0) {
			throw {warnings} satisfies JsonSyntaxError;
		}
	};
};

export const json_parse = /* #__PURE__ */ factory(),
	jsonc_parse = /* #__PURE__ */ factory(true);
