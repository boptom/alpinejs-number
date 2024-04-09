# Alpine JS Number

An Alpine JS plugin/directive to format numbers in input fields.

## Install

### With a CDN

```html
<script
  defer
  src="https://unpkg.com/PLUGIN@latest/dist/alpinejs-number.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### With a Package Manager

```shell
yarn add -D alpinejs-number

npm install -D alpinejs-number
```

```js
import Alpine from "alpinejs";
import number from "alpinejs-number";

Alpine.plugin(number);

Alpine.start();
```

## Examples

### Basic Usage

Use x-number directive on an input to auto format the number.

```js
<input x-number value="1000.99" />
```

### Precision

Precision can be set with a with a number modifier.

```js
<input x-number.4 value="1000.9999" />
```

### Prefix

The expression between quotes is the prefix.
Note: numbers, minus and decimal point cannot be used in the prefix.

```js
<input x-number="$" value="1000.99" />
```

### Override Thousands Separator and Decimal Point

The thousands separator and the decimal point can be specified in the string between quotes. Simply separate the strings with a vertical bar. The first string is the prefix, the second is the thousands separator, and the third is the decimal point.

```js
<input x-number="€|.|," value="1000,99" />
```

### Suffix

A suffix can be specified within the quotes too. It is the fourth string in the list.

```js
<input x-number.0="|,|.|¢" value="99" />
```

A suffix can also be added with a string after a colon.
Note: special characters and uppercase characters cannot be used here.

```js
<input x-number:x value="1.5" />
```

### Unsigned

Use the unsigned modifier to disable negative numbers.

```js
<input x-number.unsigned value="1000.99" />
```

### To Number Magic

`$toNumber` magic can be used to convert a number string to a number.

<div x-text="$toNumber('$1,234.99')"></div>

### To Formatted Magic

`$toFormatted` magic can be used to convert a number to a formatted number string.

```js
<div x-text="$toFormatted('1234000.99')"></div>
```

The prefix, thousands separator, decimal character, precision and suffix can be passed as arguments to the function.

```js
<div x-text="$toFormatted('1234.9999', '$', ',', '.', ' USD', 2)"></div>
```

### Form Example

Alpine JS along with the magics can be utilized to transform inputs to numbers before submitting a form.

```js
<div x-data="{ amount: '10000', formData: {} }" class="space-y-4">
  <form @submit.prevent="formData = { amount: $toNumber(amount) }">
    <label for="form-example" class="mr-2">Amount:</label>
    <input
      x-number.unsigned="$"
      id="form-example"
      class="border rounded px-2 py-1 text-right w-32"
      x-model="amount"
      required
    />
    <button type="submit" class="border rounded px-2 py-1">Submit</button>
  </form>

  <pre
    x-text="JSON.stringify(formData)"
    class="bg-gray-100 p-4 rounded-lg"
  ></pre>
</div>

```
