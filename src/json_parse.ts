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
	warnings?: ExtendedJsonSyntaxError[];
	severity?: "error" | "warning";
	message?: string;
	position?: number | null;
}
export interface ExtendedJsonSyntaxError extends Omit<JsonSyntaxError, "warnings"> {
	severity: "error" | "warning";
	message: string;
	line?: number | null;
	column?: number | null;
}

export const json_parse = /* @__PURE__ */ (() => {

	// This is a function that can parse a JSON text.
	// It is a simple, recursive descent parser.
	// It does not use eval or regular expressions,
	// so it can be used as a model for implementing a JSON parser in other languages.

	// We are defining the function inside of another function to avoid creating global variables.

	let at: number; // The index of the current character
	let ch: string; // The current character
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
	let text: string;
	let warnings: ExtendedJsonSyntaxError[];

	const stringify = (c: string): string => {
		if (c === "") {
			return "end of input";
		}
		return c === '"' ? `'"'` : JSON.stringify(c);
	};

	const warn = (m: string): void => {

		// Log warning when something is wrong.

		warnings.push({
			message: m,
			position: at - 1,
			severity: "warning",
		});
	};

	const error = (m: string): never => {

		// Call error when something is wrong.

		throw {
			warnings,
			message: m,
			position: at - 1,
			severity: "error",
		} satisfies JsonSyntaxError;
	};

	const next = (c?: string): string => {

		// If a c parameter is provided, verify that it matches the current character.

		if (c && c !== ch) {
			error(`Expected ${stringify(c)} instead of ${stringify(ch)}`);
		}

		// Get the next character. When there are no more characters, return the empty string.

		ch = text.charAt(at);
		at += 1;
		return ch;
	};

	const number = (): void => {

		// Parse a number value.

		let value: number | undefined;
		let string = "";

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
			value = Number(string);
			if (!Number.isSafeInteger(value)) {
				warn("Not a safe integer");
			}
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
		if (ch === "e" || ch === "E") {
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
		value ??= Number(string);
		if (!Number.isFinite(value)) {
			error("Bad number");
		}
	};

	const string = (): string => {

		// Parse a string value.

		let hex: number;
		let i: number;
		let value = "";
		let uffff: number;

		// When parsing for string values, we must look for " and \ characters.

		if (ch === '"') {
			while (next()) {
				if (ch === '"') {
					next();
					return value;
				}
				if (ch === "\\") {
					next();
					if (ch === "u") {
						uffff = 0;
						for (i = 0; i < 4; i++) {
							hex = parseInt(next(), 16);
							if (!isFinite(hex)) {
								break;
							}
							uffff = uffff * 16 + hex;
						}
						if (i < 4) {
							error("Bad unicode escape");
						}
						value += String.fromCharCode(uffff);
					} else if (typeof escapee[ch] === "string") {
						value += escapee[ch as keyof typeof escapee];
					} else {
						error("Bad escaped character");
					}
				} else if ((ch as string) < " ") {
					error("Bad control character");
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

		// Skip whitespace.

		while (ch && spaces.has(ch)) {
			next();
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

		next("[");
		white();
		if (ch === "]") {
			next();
			return; // empty array
		}
		while (ch) {
			if (ch === "]") {
				error("Trailing comma in array");
			}
			value();
			white();
			if (ch === "]") {
				next();
				return;
			} else if (ch === ",") {
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

		let key;
		const keys = new Set<string>();

		next("{");
		white();
		if (ch === "}") {
			next();
			return; // empty object
		}
		while (ch) {
			if (ch === "}") {
				error("Trailing comma in object");
			}
			key = string();
			white();
			next(":");
			if (keys.has(key)) {
				warn(`Duplicate key ${stringify(key)}`);
			} else {
				keys.add(key);
			}
			value();
			white();
			if (ch === "}") {
				next();
				return;
			} else if (ch === ",") {
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
			case "{":
				return object();
			case "[":
				return array();
			case '"':
				return string();
			case "-":
				return number();
			default:
				return ch >= "0" && ch <= "9"
					? number()
					: word();
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
})();
