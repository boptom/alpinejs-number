export default function (Alpine) {
  Alpine.directive(
    "number",
    (el, { value, modifiers, expression }, { cleanup }) => {
      const parts = (expression ?? "").split("|");

      /** @type {string} */
      const prefix = parts?.[0] ?? "";

      /** @type {string} */
      const suffix = parts?.[3] ?? value ?? "";

      /** @type {string} */
      const separator = parts?.[1] ?? ",";

      /** @type {string} */
      const decimalChar = parts?.[2] ?? ".";

      /** @type {number} */
      const precision = parseInt(
        modifiers.find((m) => !isNaN(parseInt(m))) ?? 2,
      );

      /** @type {boolean} */
      const unsigned = modifiers.find((m) => m === "unsigned") !== undefined;

      /**
       * @typedef {{ prefix: string, suffix: string, separator: string, decimalChar: string, precision: number, unsigned: boolean }} Params
       */

      /** @type {Params} **/
      const params = {
        prefix,
        suffix,
        separator,
        decimalChar,
        precision,
        unsigned,
      };

      update({ target: el });

      // Ensure cursor is between the prefix and suffix
      const clickHandler = () => {
        const value = el.value;
        const cursorPosition = el.selectionStart;

        if (cursorPosition < prefix.length) {
          el.setSelectionRange(prefix.length, prefix.length);
        }

        if (cursorPosition > value.length - suffix.length) {
          el.setSelectionRange(
            value.length - suffix.length,
            value.length - suffix.length,
          );
        }
      };

      el.addEventListener("click", clickHandler);

      // Keydown handler for toggling negative sign
      const keydownMinusHandler = (e) => {
        if (e.key !== "-") {
          return;
        }

        let value = el.value;

        // Remove selected text if any
        const selectionStart = el.selectionStart;
        const selectionEnd = el.selectionEnd;

        value =
          value.substring(0, selectionStart) + value.substring(selectionEnd);

        if (value === "") {
          return;
        }

        // Remove -
        if (el.value.startsWith(prefix + "-")) {
          el.value = el.value.replace("-", "");
          el.setSelectionRange(selectionStart - 1, selectionStart - 1);
          e.preventDefault();
          return;
        }

        // Prepend -
        el.value = el.value.replace(prefix, prefix + "-");
        el.setSelectionRange(selectionStart + 1, selectionStart + 1);
        e.preventDefault();
      };

      if (!unsigned) {
        // Toggle negative by pressing - anywhere in input
        el.addEventListener("keydown", keydownMinusHandler);
      }

      // Handler for keeping cursor between prefix and suffix
      const cursorBoundsHandler = (e) => {
        if (
          e.key !== "ArrowLeft" &&
          e.key !== "ArrowRight" &&
          e.key !== "ArrowUp" &&
          e.key !== "ArrowDown"
        ) {
          return;
        }

        const value = el.value;
        let cursorPosition = el.selectionStart;

        if (e.key === "ArrowLeft") {
          cursorPosition--;
        }

        if (e.key === "ArrowRight") {
          cursorPosition++;
        }

        if (e.key === "ArrowUp") {
          cursorPosition = 0;
        }

        if (e.key === "ArrowDown") {
          cursorPosition = value.length;
        }

        if (cursorPosition < prefix.length) {
          el.setSelectionRange(prefix.length, prefix.length);
          e.preventDefault();
        }

        if (cursorPosition > value.length - suffix.length) {
          el.setSelectionRange(
            value.length - suffix.length,
            value.length - suffix.length,
          );
          e.preventDefault();
        }
      };

      // Ensure cursor is between the prefix and suffix
      el.addEventListener("keydown", cursorBoundsHandler);

      el.addEventListener("input", update);

      function update(event) {
        const { value, cursorPosition } = modify(
          event.target.value,
          event.target.selectionStart,
          event?.data === decimalChar,
          params,
        );

        event.target.value = value;
        event.target.setSelectionRange(cursorPosition, cursorPosition);
      }

      cleanup(() => {
        el.removeEventListener("input", update);
        el.removeEventListener("click", clickHandler);
        el.removeEventListener("keydown", cursorBoundsHandler);

        if (!unsigned) {
          el.removeEventListener("keydown", keydownMinusHandler);
        }
      });
    },
  );

  // Returns a number from a number string
  Alpine.magic("toNumber", () => (value, decimalChar = ".", precision = 2) => {
    return Number(
      toNumber(value, 0, false, {
        decimalChar,
        precision,
        unsigned: false,
      }).value.replace(decimalChar, "."),
    );
  });

  /**
   * Returns a number string from an input string, as well as the cursor position.
   * @param {string} value
   * @param {number} cursorPosition
   * @param {boolean} decimalTyped
   * @param {Params} Params
   * @returns {{ value: string, cursorPosition: number }}
   */
  function toNumber(
    value,
    cursorPosition,
    decimalTyped,
    { decimalChar, precision, unsigned },
  ) {
    // An array of char positions to remove from the string
    let positionsToRemove = findNonNumericPositions(value, !unsigned);

    const decimalPosition = decimalTyped
      ? cursorPosition - 1
      : value.indexOf(decimalChar);

    // Add extraneous decimal points to the positions to remove
    if (precision > 0 && decimalPosition !== -1) {
      positionsToRemove = positionsToRemove.filter(
        (pos) => decimalPosition !== pos,
      );
    }

    // Add extraneous numbers after the decimal point to the positions to remove
    if (precision > 0 && decimalPosition !== -1) {
      let decimalCount = 0;

      for (let i = decimalPosition + 1; i < value.length; i++) {
        if (positionsToRemove.includes(i)) {
          continue;
        }

        decimalCount++;

        if (decimalCount > precision) {
          positionsToRemove.push(i);
        }
      }
    }

    value = removeCharsAtPositions(value, positionsToRemove);

    const charsRemovedBeforeCursor = positionsToRemove.reduce((acc, pos) => {
      return acc + (pos < cursorPosition ? 1 : 0);
    }, 0);

    cursorPosition = cursorPosition - charsRemovedBeforeCursor;

    return { value, cursorPosition };
  }

  /**
   * Modifies the input value and cursor position
   * @param {string} value
   * @param {number} cursorPosition
   * @param {boolean} decimalTyped
   * @param {Params} Params
   * @returns {{ value: string, cursorPosition: number }}
   */
  function modify(value, cursorPosition, decimalTyped, params) {
    // Convert to number
    ({ value, cursorPosition } = toNumber(
      value,
      cursorPosition,
      decimalTyped,
      params,
    ));

    const { prefix, suffix, separator, decimalChar } = params;

    // Temporary remove the minus sign
    const isNegative = value.startsWith("-");
    cursorPosition = cursorPosition - (isNegative ? 1 : 0);
    value = value.replace("-", "");

    // Split into integer and decimal parts
    const parts = value.split(decimalChar);

    const commasBeforeCursor = Math.max(
      0,
      Math.floor((Math.min(cursorPosition, parts[0].length) - 1) / 3),
    );

    // Add commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    // Add prefix, suffix, minus sign and decimal point.
    value = prefix + (isNegative ? "-" : "") + parts.join(decimalChar) + suffix;

    // Update cursor position
    cursorPosition =
      cursorPosition +
      prefix.length +
      (isNegative ? 1 : 0) +
      commasBeforeCursor;

    if (value === prefix + suffix) {
      value = "";
      cursorPosition = 0;
    }

    return { value, cursorPosition };
  }

  /**
   * Returns an array of non-numeric char positions in a string.
   * @param {string} str
   * @param {boolean} keepNegativeSign True to not include negative sign
   * @returns {Array}
   */
  function findNonNumericPositions(str, keepNegativeSign) {
    const nonNumericPositions = [];
    let numberFound = false;

    for (let i = 0; i < str.length; i++) {
      if (isNaN(parseInt(str[i]))) {
        if (!numberFound && str[i] === "-" && keepNegativeSign) {
          numberFound = true;
          continue;
        }
        nonNumericPositions.push(i);
      } else {
        numberFound = true;
      }
    }

    return nonNumericPositions;
  }

  /**
   * Remove chars from a string at set positions.
   * @param {string} str
   * @param {Array<number>} positions
   * @returns {string} String with characters removed
   */
  function removeCharsAtPositions(str, positions) {
    // Convert positions array to a Set for faster lookup
    const positionsSet = new Set(positions);

    // Filter out characters at specified positions
    const result = str
      .split("")
      .filter((_, index) => !positionsSet.has(index))
      .join("");

    return result;
  }
}
