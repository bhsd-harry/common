/*
    json_parse.js
    2016-05-02

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.

        json_parse(text)
            This method parses a JSON text and throws a SyntaxError exception.

    This is a reference implementation. You are free to copy, modify, or redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO NOT CONTROL.
*/

export const json_parse = /* @__PURE__ */ (() => {

    // This is a function that can parse a JSON text.
    // It is a simple, recursive descent parser.
    // It does not use eval or regular expressions,
    // so it can be used as a model for implementing a JSON parser in other languages.

    // We are defining the function inside of another function to avoid creating global variables.

    let at: number; // The index of the current character
    let ch: string; // The current character
    const escapee = {
        "\"": "\"",
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t"
    };
    let text: string;

    const error = (m: string): never => {

        // Call error when something is wrong.

        throw {
            name: "SyntaxError",
            message: m,
            at: at,
            text: text
        };
    };

    const next = (c?: string): string => {

        // If a c parameter is provided, verify that it matches the current character.

        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }

        // Get the next character. When there are no more characters, return the empty string.

        ch = text.charAt(at);
        at += 1;
        return ch;
    };

    const number = (): void => {

        // Parse a number value.

        let string = "";

        if (ch === "-") {
            string = "-";
            next("-");
        }
        while (ch >= "0" && ch <= "9") {
            string += ch;
            next();
        }
        if (ch === ".") {
            string += ".";
            while (next() && ch >= "0" && ch <= "9") {
                string += ch;
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
        const value = +string;
        if (!isFinite(value)) {
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

        if (ch === "\"") {
            while (next()) {
                if (ch === "\"") {
                    next();
                    return value;
                }
                if (ch === "\\") {
                    next();
                    if (ch === "u") {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        value += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === "string") {
                        value += escapee[ch as keyof typeof escapee];
                    } else {
                        break;
                    }
                } else {
                    value += ch as string;
                }
            }
        }
        return error("Bad string");
    };

    const white = (): void => {

        // Skip whitespace.

        while (ch && ch <= " ") {
            next();
        }
    };

    const word = (): void => {

        // true, false, or null.

        switch (ch) {
        case "t":
            next("t");
            next("r");
            next("u");
            next("e");
            return;
        case "f":
            next("f");
            next("a");
            next("l");
            next("s");
            next("e");
            return;
        case "n":
            next("n");
            next("u");
            next("l");
            next("l");
            return;
        }
        error("Unexpected '" + ch + "'");
    };

    const array = (): void => {

        // Parse an array value.

        if (ch === "[") {
            next("[");
            white();
            if ((ch as string) === "]") {
                next("]");
                return;   // empty array
            }
            while (ch) {
                white();
                if ((ch as string) === "]") {
                    next("]");
                    return;
                }
                next(",");
                white();
            }
        }
        error("Bad array");
    };

    const object = (): void => {

        // Parse an object value.

        let key;
        const obj: Record<string, unknown> = {};

        if (ch === "{") {
            next("{");
            white();
            if ((ch as string) === "}") {
                next("}");
                return;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(":");
                if (Object.hasOwnProperty.call(obj, key)) {
                    error("Duplicate key '" + key + "'");
                }
                obj[key] = value();
                white();
                if ((ch as string) === "}") {
                    next("}");
                    return;
                }
                next(",");
                white();
            }
        }
        error("Bad object");
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
        case "\"":
            return string();
        case "-":
            return number();
        default:
            return (ch >= "0" && ch <= "9")
                ? number()
                : word();
        }
    };

    // Return the json_parse function. It will have access to all of the above
    // functions and variables.

    return (source: string): void => {
        text = source;
        at = 0;
        ch = " ";
        value();
        white();
        if (ch) {
            error("Syntax error");
        }
    };
})();
