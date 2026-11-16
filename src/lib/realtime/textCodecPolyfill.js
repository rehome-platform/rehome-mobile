// @stomp/stompjs cần TextEncoder / TextDecoder. Hermes có TextEncoder (RN ≥ 0.74) nhưng có thể thiếu
// TextDecoder → bù bản tối thiểu (chỉ UTF-8, đủ cho khung STOMP). Có sẵn thì giữ nguyên bản của máy
/* global globalThis */

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = class {
    encode(str = "") {
      const utf8 = unescape(encodeURIComponent(str));
      const out = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) out[i] = utf8.charCodeAt(i);
      return out;
    }
  };
}

if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = class {
    decode(input) {
      if (!input) return "";
      const bytes =
        input instanceof Uint8Array
          ? input
          : input instanceof ArrayBuffer
            ? new Uint8Array(input)
            : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      const chars = [];
      let i = 0;
      while (i < bytes.length) {
        const b = bytes[i++];
        let cp;
        if (b < 0x80) cp = b;
        else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
        else if (b < 0xf0)
          cp =
            ((b & 0x0f) << 12) |
            ((bytes[i++] & 0x3f) << 6) |
            (bytes[i++] & 0x3f);
        else
          cp =
            ((b & 0x07) << 18) |
            ((bytes[i++] & 0x3f) << 12) |
            ((bytes[i++] & 0x3f) << 6) |
            (bytes[i++] & 0x3f);
        chars.push(String.fromCodePoint(cp));
      }
      return chars.join("");
    }
  };
}
