/*
 * Converts an array of utf-8 numerical short strings into a readable string
 * @param {bigint[]} felts - The array of encoded short strings
 * @returns {string} - The readable string
 */
export function feltToStr(felts) {
  return felts.reduce( (memo, felt) => memo + Buffer.from(felt.toString(16), "hex").toString(), "" );
}

/**
 * Splits a string into an array of short strings (felts). A Cairo short string (felt) represents up to 31 utf-8 characters.
 * @param {string} str - The string to convert
 * @returns {bigint[]} - The string converted as an array of short strings as felts
 */
export function strToFelt(str) {
  const size = Math.ceil(str.length / 31);
  const arr = Array(size);

  let offset = 0;
  for (let i = 0; i < size; i++) {
    const substr = str.substring(offset, offset + 31).split("");
    const ss = substr.reduce(
      (memo, c) => memo + c.charCodeAt(0).toString(16),
      ""
    );
    arr[i] = BigInt("0x" + ss);
    offset += 31;
  }
  return arr.join();
}

export function hexToFelt(hex){
  return BigInt(hex).toString()
}

export function feltToHex(num){
  return '0x'+BigInt(num).toString(16)
}

