/*
    json_parse.js
    2016-05-02

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.

        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === "string") {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

export const json_parse = /* @__PURE__ */ (() => {

    // This is a function that can parse a JSON text, producing a JavaScript
    // data structure. It is a simple, recursive descent parser. It does not use
    // eval or regular expressions, so it can be used as a model for implementing
    // a JSON parser in other languages.

    // We are defining the function inside of another function to avoid creating
    // global variables.

    let at;     // The index of the current character
    let ch;     // The current character
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
    let text;

    const error = (m) => {

        // Call error when something is wrong.

        throw {
            name: "SyntaxError",
            message: m,
            at: at,
            text: text
        };
    };

    const next = (c) => {

        // If a c parameter is provided, verify that it matches the current character.

        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }

        // Get the next character. When there are no more characters,
        // return the empty string.

        ch = text.charAt(at);
        at += 1;
        return ch;
    };

    const number = () => {

        // Parse a number value.

        let value;
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
            if (ch === "-" || ch === "+") {
                string += ch;
                next();
            }
            while (ch >= "0" && ch <= "9") {
                string += ch;
                next();
            }
        }
        value = +string;
        if (!isFinite(value)) {
            error("Bad number");
        } else {
            return value;
        }
    };

    const string = () => {

        // Parse a string value.

        let hex;
        let i;
        let value = "";
        let uffff;

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
                        value += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    value += ch;
                }
            }
        }
        error("Bad string");
    };

    const white = () => {

        // Skip whitespace.

        while (ch && ch <= " ") {
            next();
        }
    };

    const word = () => {

        // true, false, or null.

        switch (ch) {
        case "t":
            next("t");
            next("r");
            next("u");
            next("e");
            return true;
        case "f":
            next("f");
            next("a");
            next("l");
            next("s");
            next("e");
            return false;
        case "n":
            next("n");
            next("u");
            next("l");
            next("l");
            return null;
        }
        error("Unexpected '" + ch + "'");
    };

    let value;  // Place holder for the value function.

    const array = () => {

        // Parse an array value.

        const arr = [];

        if (ch === "[") {
            next("[");
            white();
            if (ch === "]") {
                next("]");
                return arr;   // empty array
            }
            while (ch) {
                arr.push(value());
                white();
                if (ch === "]") {
                    next("]");
                    return arr;
                }
                next(",");
                white();
            }
        }
        error("Bad array");
    };

    const object = () => {

        // Parse an object value.

        let key;
        const obj = {};

        if (ch === "{") {
            next("{");
            white();
            if (ch === "}") {
                next("}");
                return obj;   // empty object
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
                if (ch === "}") {
                    next("}");
                    return obj;
                }
                next(",");
                white();
            }
        }
        error("Bad object");
    };

    value = () => {

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

    return (source) => {
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
