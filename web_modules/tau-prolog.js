import { c as createCommonjsModule, a as commonjsGlobal } from './common/_commonjsHelpers-eb5a497e.js';
import { g as global } from './common/global-5c50bad9.js';
import { p as process } from './common/process-2545f00a.js';

var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var inited = false;
function init () {
  inited = true;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
}

function toByteArray (b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders);

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len;

  var L = 0;

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = (tmp >> 16) & 0xFF;
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[L++] = tmp & 0xFF;
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output.push(tripletToBase64(tmp));
  }
  return output.join('')
}

function fromByteArray (uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var output = '';
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[(tmp << 4) & 0x3F];
    output += '==';
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
    output += lookup[tmp >> 10];
    output += lookup[(tmp >> 4) & 0x3F];
    output += lookup[(tmp << 2) & 0x3F];
    output += '=';
  }

  parts.push(output);

  return parts.join('')
}

function read (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? (nBytes - 1) : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function write (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  var i = isLE ? 0 : (nBytes - 1);
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

var toString = {}.toString;

var isArray = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var INSPECT_MAX_BYTES = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : true;

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype;
  return arr
};

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
};

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype;
  Buffer.__proto__ = Uint8Array;
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
};

function allocUnsafe (that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
};

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array);
  }
  return that
}

function fromObject (that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}
Buffer.isBuffer = isBuffer;
function internalIsBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength (string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer.byteLength = byteLength;

function slowToString (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true;

function swap (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this
};

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this
};

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this
};

Buffer.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
};

Buffer.prototype.equals = function equals (b) {
  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
};

Buffer.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
};

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
};

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset]
};

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
};

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
};

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes (str) {
  return toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
}

function isFastBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
}

var require$$0 = {};

var __dirname = '/University Subjects\projects\maze-game\node_modules\readline-sync\lib';

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
function resolve() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : '/';

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
}
// path.normalize(path)
// posix version
function normalize(path) {
  var isPathAbsolute = isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isPathAbsolute).join('/');

  if (!path && !isPathAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isPathAbsolute ? '/' : '') + path;
}
// posix version
function isAbsolute(path) {
  return path.charAt(0) === '/';
}

// posix version
function join() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
}


// path.relative(from, to)
// posix version
function relative(from, to) {
  from = resolve(from).substr(1);
  to = resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
}

var sep = '/';
var delimiter = ':';

function dirname(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
}

function basename(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
}


function extname(path) {
  return splitPath(path)[3];
}
var path = {
  extname: extname,
  basename: basename,
  dirname: dirname,
  sep: sep,
  delimiter: delimiter,
  relative: relative,
  join: join,
  isAbsolute: isAbsolute,
  normalize: normalize,
  resolve: resolve
};
function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b' ?
    function (str, start, len) { return str.substr(start, len) } :
    function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

var path$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  resolve: resolve,
  normalize: normalize,
  isAbsolute: isAbsolute,
  join: join,
  relative: relative,
  sep: sep,
  delimiter: delimiter,
  dirname: dirname,
  basename: basename,
  extname: extname,
  'default': path
});

/*
The MIT License (MIT)

Copyright (c) 2016 CoderPuppy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
var _endianness;
function endianness() {
  if (typeof _endianness === 'undefined') {
    var a = new ArrayBuffer(2);
    var b = new Uint8Array(a);
    var c = new Uint16Array(a);
    b[0] = 1;
    b[1] = 2;
    if (c[0] === 258) {
      _endianness = 'BE';
    } else if (c[0] === 513){
      _endianness = 'LE';
    } else {
      throw new Error('unable to figure out endianess');
    }
  }
  return _endianness;
}

function hostname() {
  if (typeof global.location !== 'undefined') {
    return global.location.hostname
  } else return '';
}

function loadavg() {
  return [];
}

function uptime() {
  return 0;
}

function freemem() {
  return Number.MAX_VALUE;
}

function totalmem() {
  return Number.MAX_VALUE;
}

function cpus() {
  return [];
}

function type() {
  return 'Browser';
}

function release () {
  if (typeof global.navigator !== 'undefined') {
    return global.navigator.appVersion;
  }
  return '';
}

function networkInterfaces(){}
function getNetworkInterfaces(){}

function arch() {
  return 'javascript';
}

function platform() {
  return 'browser';
}

function tmpDir() {
  return '/tmp';
}
var tmpdir = tmpDir;

var EOL = '\n';
var os = {
  EOL: EOL,
  tmpdir: tmpdir,
  tmpDir: tmpDir,
  networkInterfaces:networkInterfaces,
  getNetworkInterfaces: getNetworkInterfaces,
  release: release,
  type: type,
  cpus: cpus,
  totalmem: totalmem,
  freemem: freemem,
  uptime: uptime,
  loadavg: loadavg,
  hostname: hostname,
  endianness: endianness,
};

var os$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  endianness: endianness,
  hostname: hostname,
  loadavg: loadavg,
  uptime: uptime,
  freemem: freemem,
  totalmem: totalmem,
  cpus: cpus,
  type: type,
  release: release,
  networkInterfaces: networkInterfaces,
  getNetworkInterfaces: getNetworkInterfaces,
  arch: arch,
  platform: platform,
  tmpDir: tmpDir,
  tmpdir: tmpdir,
  EOL: EOL,
  'default': os
});

var readlineSync = createCommonjsModule(function (module, exports) {

var
  IS_WIN = process.platform === 'win32',

  ALGORITHM_CIPHER = 'aes-256-cbc',
  ALGORITHM_HASH = 'sha256',
  DEFAULT_ERR_MSG = 'The current environment doesn\'t support interactive reading from TTY.',
  TTY = process.binding('tty_wrap').TTY,

  defaultOptions = {
    /* eslint-disable key-spacing */
    prompt:             '> ',
    hideEchoBack:       false,
    mask:               '*',
    limit:              [],
    limitMessage:       'Input another, please.$<( [)limit(])>',
    defaultInput:       '',
    trueValue:          [],
    falseValue:         [],
    caseSensitive:      false,
    keepWhitespace:     false,
    encoding:           'utf8',
    bufferSize:         1024,
    print:              void 0,
    history:            true,
    cd:                 false,
    phContent:          void 0,
    preCheck:           void 0
    /* eslint-enable key-spacing */
  },

  fdR = 'none', fdW, ttyR, isRawMode = false,
  extHostPath, extHostArgs, tempdir, salt = 0,
  lastInput = '', inputHistory = [], rawInput,
  _DBG_useExt = false, _DBG_checkOptions = false, _DBG_checkMethod = false;

function getHostArgs(options) {
  // Send any text to crazy Windows shell safely.
  function encodeArg(arg) {
    return arg.replace(/[^\w\u0080-\uFFFF]/g, function(chr) {
      return '#' + chr.charCodeAt(0) + ';';
    });
  }

  return extHostArgs.concat((function(conf) {
    var args = [];
    Object.keys(conf).forEach(function(optionName) {
      if (conf[optionName] === 'boolean') {
        if (options[optionName]) { args.push('--' + optionName); }
      } else if (conf[optionName] === 'string') {
        if (options[optionName]) {
          args.push('--' + optionName, encodeArg(options[optionName]));
        }
      }
    });
    return args;
  })({
    /* eslint-disable key-spacing */
    display:        'string',
    displayOnly:    'boolean',
    keyIn:          'boolean',
    hideEchoBack:   'boolean',
    mask:           'string',
    limit:          'string',
    caseSensitive:  'boolean'
    /* eslint-enable key-spacing */
  }));
}

// piping via files (for Node.js v0.10-)
function _execFileSync(options, execOptions) {

  function getTempfile(name) {
    var filepath, suffix = '', fd;
    tempdir = tempdir || os$1.tmpdir();

    while (true) {
      filepath = path$1.join(tempdir, name + suffix);
      try {
        fd = require$$0.openSync(filepath, 'wx');
      } catch (e) {
        if (e.code === 'EEXIST') {
          suffix++;
          continue;
        } else {
          throw e;
        }
      }
      require$$0.closeSync(fd);
      break;
    }
    return filepath;
  }

  var hostArgs, shellPath, shellArgs, res = {}, exitCode, extMessage,
    pathStdout = getTempfile('readline-sync.stdout'),
    pathStderr = getTempfile('readline-sync.stderr'),
    pathExit = getTempfile('readline-sync.exit'),
    pathDone = getTempfile('readline-sync.done'),
    crypto = require$$0, shasum, decipher, password;

  shasum = crypto.createHash(ALGORITHM_HASH);
  shasum.update('' + process.pid + (salt++) + Math.random());
  password = shasum.digest('hex');
  decipher = crypto.createDecipher(ALGORITHM_CIPHER, password);

  hostArgs = getHostArgs(options);
  if (IS_WIN) {
    shellPath = process.env.ComSpec || 'cmd.exe';
    process.env.Q = '"'; // The quote (") that isn't escaped.
    // `()` for ignore space by echo
    shellArgs = ['/V:ON', '/S', '/C',
      '(%Q%' + shellPath + '%Q% /V:ON /S /C %Q%' + /* ESLint bug? */ // eslint-disable-line no-path-concat
        '%Q%' + extHostPath + '%Q%' +
          hostArgs.map(function(arg) { return ' %Q%' + arg + '%Q%'; }).join('') +
        ' & (echo !ERRORLEVEL!)>%Q%' + pathExit + '%Q%%Q%) 2>%Q%' + pathStderr + '%Q%' +
      ' |%Q%' + process.execPath + '%Q% %Q%' + __dirname + '\\encrypt.js%Q%' +
        ' %Q%' + ALGORITHM_CIPHER + '%Q% %Q%' + password + '%Q%' +
        ' >%Q%' + pathStdout + '%Q%' +
      ' & (echo 1)>%Q%' + pathDone + '%Q%'];
  } else {
    shellPath = '/bin/sh';
    shellArgs = ['-c',
      // Use `()`, not `{}` for `-c` (text param)
      '("' + extHostPath + '"' + /* ESLint bug? */ // eslint-disable-line no-path-concat
          hostArgs.map(function(arg) { return " '" + arg.replace(/'/g, "'\\''") + "'"; }).join('') +
        '; echo $?>"' + pathExit + '") 2>"' + pathStderr + '"' +
      ' |"' + process.execPath + '" "' + __dirname + '/encrypt.js"' +
        ' "' + ALGORITHM_CIPHER + '" "' + password + '"' +
        ' >"' + pathStdout + '"' +
      '; echo 1 >"' + pathDone + '"'];
  }
  if (_DBG_checkMethod) { _DBG_checkMethod('_execFileSync', hostArgs); }
  try {
    require$$0.spawn(shellPath, shellArgs, execOptions);
  } catch (e) {
    res.error = new Error(e.message);
    res.error.method = '_execFileSync - spawn';
    res.error.program = shellPath;
    res.error.args = shellArgs;
  }

  while (require$$0.readFileSync(pathDone, {encoding: options.encoding}).trim() !== '1') {} // eslint-disable-line no-empty
  if ((exitCode =
      require$$0.readFileSync(pathExit, {encoding: options.encoding}).trim()) === '0') {
    res.input =
      decipher.update(require$$0.readFileSync(pathStdout, {encoding: 'binary'}),
        'hex', options.encoding) +
      decipher.final(options.encoding);
  } else {
    extMessage = require$$0.readFileSync(pathStderr, {encoding: options.encoding}).trim();
    res.error = new Error(DEFAULT_ERR_MSG + (extMessage ? '\n' + extMessage : ''));
    res.error.method = '_execFileSync';
    res.error.program = shellPath;
    res.error.args = shellArgs;
    res.error.extMessage = extMessage;
    res.error.exitCode = +exitCode;
  }

  require$$0.unlinkSync(pathStdout);
  require$$0.unlinkSync(pathStderr);
  require$$0.unlinkSync(pathExit);
  require$$0.unlinkSync(pathDone);

  return res;
}

function readlineExt(options) {
  var hostArgs, res = {}, extMessage,
    execOptions = {env: process.env, encoding: options.encoding};

  if (!extHostPath) {
    if (IS_WIN) {
      if (process.env.PSModulePath) { // Windows PowerShell
        extHostPath = 'powershell.exe';
        extHostArgs = ['-ExecutionPolicy', 'Bypass', '-File', __dirname + '\\read.ps1']; // eslint-disable-line no-path-concat
      } else {                        // Windows Script Host
        extHostPath = 'cscript.exe';
        extHostArgs = ['//nologo', __dirname + '\\read.cs.js']; // eslint-disable-line no-path-concat
      }
    } else {
      extHostPath = '/bin/sh';
      extHostArgs = [__dirname + '/read.sh']; // eslint-disable-line no-path-concat
    }
  }
  if (IS_WIN && !process.env.PSModulePath) { // Windows Script Host
    // ScriptPW (Win XP and Server2003) needs TTY stream as STDIN.
    // In this case, If STDIN isn't TTY, an error is thrown.
    execOptions.stdio = [process.stdin];
  }

  if (require$$0.execFileSync) {
    hostArgs = getHostArgs(options);
    if (_DBG_checkMethod) { _DBG_checkMethod('execFileSync', hostArgs); }
    try {
      res.input = require$$0.execFileSync(extHostPath, hostArgs, execOptions);
    } catch (e) { // non-zero exit code
      extMessage = e.stderr ? (e.stderr + '').trim() : '';
      res.error = new Error(DEFAULT_ERR_MSG + (extMessage ? '\n' + extMessage : ''));
      res.error.method = 'execFileSync';
      res.error.program = extHostPath;
      res.error.args = hostArgs;
      res.error.extMessage = extMessage;
      res.error.exitCode = e.status;
      res.error.code = e.code;
      res.error.signal = e.signal;
    }
  } else {
    res = _execFileSync(options, execOptions);
  }
  if (!res.error) {
    res.input = res.input.replace(/^\s*'|'\s*$/g, '');
    options.display = '';
  }

  return res;
}

/*
  display:            string
  displayOnly:        boolean
  keyIn:              boolean
  hideEchoBack:       boolean
  mask:               string
  limit:              string (pattern)
  caseSensitive:      boolean
  keepWhitespace:     boolean
  encoding, bufferSize, print
*/
function _readlineSync(options) {
  var input = '', displaySave = options.display,
    silent = !options.display &&
      options.keyIn && options.hideEchoBack && !options.mask;

  function tryExt() {
    var res = readlineExt(options);
    if (res.error) { throw res.error; }
    return res.input;
  }

  if (_DBG_checkOptions) { _DBG_checkOptions(options); }

  (function() { // open TTY
    var fsB, constants, verNum;

    function getFsB() {
      if (!fsB) {
        fsB = process.binding('fs'); // For raw device path
        constants = process.binding('constants');
      }
      return fsB;
    }

    if (typeof fdR !== 'string') { return; }
    fdR = null;

    if (IS_WIN) {
      // iojs-v2.3.2+ input stream can't read first line. (#18)
      // ** Don't get process.stdin before check! **
      // Fixed v5.1.0
      // Fixed v4.2.4
      // It regressed again in v5.6.0, it is fixed in v6.2.0.
      verNum = (function(ver) { // getVerNum
        var nums = ver.replace(/^\D+/, '').split('.');
        var verNum = 0;
        if ((nums[0] = +nums[0])) { verNum += nums[0] * 10000; }
        if ((nums[1] = +nums[1])) { verNum += nums[1] * 100; }
        if ((nums[2] = +nums[2])) { verNum += nums[2]; }
        return verNum;
      })(process.version);
      if (!(verNum >= 20302 && verNum < 40204 || verNum >= 50000 && verNum < 50100 || verNum >= 50600 && verNum < 60200) &&
          process.stdin.isTTY) {
        process.stdin.pause();
        fdR = process.stdin.fd;
        ttyR = process.stdin._handle;
      } else {
        try {
          // The stream by fs.openSync('\\\\.\\CON', 'r') can't switch to raw mode.
          // 'CONIN$' might fail on XP, 2000, 7 (x86).
          fdR = getFsB().open('CONIN$', constants.O_RDWR, parseInt('0666', 8));
          ttyR = new TTY(fdR, true);
        } catch (e) { /* ignore */ }
      }

      if (process.stdout.isTTY) {
        fdW = process.stdout.fd;
      } else {
        try {
          fdW = require$$0.openSync('\\\\.\\CON', 'w');
        } catch (e) { /* ignore */ }
        if (typeof fdW !== 'number') { // Retry
          try {
            fdW = getFsB().open('CONOUT$', constants.O_RDWR, parseInt('0666', 8));
          } catch (e) { /* ignore */ }
        }
      }

    } else {
      if (process.stdin.isTTY) {
        process.stdin.pause();
        try {
          fdR = require$$0.openSync('/dev/tty', 'r'); // device file, not process.stdin
          ttyR = process.stdin._handle;
        } catch (e) { /* ignore */ }
      } else {
        // Node.js v0.12 read() fails.
        try {
          fdR = require$$0.openSync('/dev/tty', 'r');
          ttyR = new TTY(fdR, false);
        } catch (e) { /* ignore */ }
      }

      if (process.stdout.isTTY) {
        fdW = process.stdout.fd;
      } else {
        try {
          fdW = require$$0.openSync('/dev/tty', 'w');
        } catch (e) { /* ignore */ }
      }
    }
  })();

  (function() { // try read
    var atEol, limit,
      isCooked = !options.hideEchoBack && !options.keyIn,
      buffer, reqSize, readSize, chunk, line;
    rawInput = '';

    // Node.js v0.10- returns an error if same mode is set.
    function setRawMode(mode) {
      if (mode === isRawMode) { return true; }
      if (ttyR.setRawMode(mode) !== 0) { return false; }
      isRawMode = mode;
      return true;
    }

    if (_DBG_useExt || !ttyR ||
        typeof fdW !== 'number' && (options.display || !isCooked)) {
      input = tryExt();
      return;
    }

    if (options.display) {
      require$$0.writeSync(fdW, options.display);
      options.display = '';
    }
    if (options.displayOnly) { return; }

    if (!setRawMode(!isCooked)) {
      input = tryExt();
      return;
    }

    reqSize = options.keyIn ? 1 : options.bufferSize;
    // Check `allocUnsafe` to make sure of the new API.
    buffer = Buffer.allocUnsafe && Buffer.alloc ? Buffer.alloc(reqSize) : new Buffer(reqSize);

    if (options.keyIn && options.limit) {
      limit = new RegExp('[^' + options.limit + ']',
        'g' + (options.caseSensitive ? '' : 'i'));
    }

    while (true) {
      readSize = 0;
      try {
        readSize = require$$0.readSync(fdR, buffer, 0, reqSize);
      } catch (e) {
        if (e.code !== 'EOF') {
          setRawMode(false);
          input += tryExt();
          return;
        }
      }
      if (readSize > 0) {
        chunk = buffer.toString(options.encoding, 0, readSize);
        rawInput += chunk;
      } else {
        chunk = '\n';
        rawInput += String.fromCharCode(0);
      }

      if (chunk && typeof (line = (chunk.match(/^(.*?)[\r\n]/) || [])[1]) === 'string') {
        chunk = line;
        atEol = true;
      }

      // other ctrl-chars
      // eslint-disable-next-line no-control-regex
      if (chunk) { chunk = chunk.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ''); }
      if (chunk && limit) { chunk = chunk.replace(limit, ''); }

      if (chunk) {
        if (!isCooked) {
          if (!options.hideEchoBack) {
            require$$0.writeSync(fdW, chunk);
          } else if (options.mask) {
            require$$0.writeSync(fdW, (new Array(chunk.length + 1)).join(options.mask));
          }
        }
        input += chunk;
      }

      if (!options.keyIn && atEol ||
        options.keyIn && input.length >= reqSize) { break; }
    }

    if (!isCooked && !silent) { require$$0.writeSync(fdW, '\n'); }
    setRawMode(false);
  })();

  if (options.print && !silent) {
    options.print(displaySave + (options.displayOnly ? '' :
        (options.hideEchoBack ? (new Array(input.length + 1)).join(options.mask)
          : input) + '\n'), // must at least write '\n'
      options.encoding);
  }

  return options.displayOnly ? '' :
    (lastInput = options.keepWhitespace || options.keyIn ? input : input.trim());
}

function flattenArray(array, validator) {
  var flatArray = [];
  function _flattenArray(array) {
    if (array == null) {
      return;
    } else if (Array.isArray(array)) {
      array.forEach(_flattenArray);
    } else if (!validator || validator(array)) {
      flatArray.push(array);
    }
  }
  _flattenArray(array);
  return flatArray;
}

function escapePattern(pattern) {
  return pattern.replace(/[\x00-\x7f]/g, // eslint-disable-line no-control-regex
    function(s) { return '\\x' + ('00' + s.charCodeAt().toString(16)).substr(-2); });
}

// margeOptions(options1, options2 ... )
// margeOptions(true, options1, options2 ... )
//    arg1=true : Start from defaultOptions and pick elements of that.
function margeOptions() {
  var optionsList = Array.prototype.slice.call(arguments),
    optionNames, fromDefault;

  if (optionsList.length && typeof optionsList[0] === 'boolean') {
    fromDefault = optionsList.shift();
    if (fromDefault) {
      optionNames = Object.keys(defaultOptions);
      optionsList.unshift(defaultOptions);
    }
  }

  return optionsList.reduce(function(options, optionsPart) {
    if (optionsPart == null) { return options; }

    // ======== DEPRECATED ========
    if (optionsPart.hasOwnProperty('noEchoBack') &&
        !optionsPart.hasOwnProperty('hideEchoBack')) {
      optionsPart.hideEchoBack = optionsPart.noEchoBack;
      delete optionsPart.noEchoBack;
    }
    if (optionsPart.hasOwnProperty('noTrim') &&
        !optionsPart.hasOwnProperty('keepWhitespace')) {
      optionsPart.keepWhitespace = optionsPart.noTrim;
      delete optionsPart.noTrim;
    }
    // ======== /DEPRECATED ========

    if (!fromDefault) { optionNames = Object.keys(optionsPart); }
    optionNames.forEach(function(optionName) {
      var value;
      if (!optionsPart.hasOwnProperty(optionName)) { return; }
      value = optionsPart[optionName];
      switch (optionName) {
                           // _readlineSync <- *    * -> defaultOptions
        // ================ string
        case 'mask':                        // *    *
        case 'limitMessage':                //      *
        case 'defaultInput':                //      *
        case 'encoding':                    // *    *
          value = value != null ? value + '' : '';
          if (value && optionName !== 'limitMessage') { value = value.replace(/[\r\n]/g, ''); }
          options[optionName] = value;
          break;
        // ================ number(int)
        case 'bufferSize':                  // *    *
          if (!isNaN(value = parseInt(value, 10)) && typeof value === 'number') {
            options[optionName] = value; // limited updating (number is needed)
          }
          break;
        // ================ boolean
        case 'displayOnly':                 // *
        case 'keyIn':                       // *
        case 'hideEchoBack':                // *    *
        case 'caseSensitive':               // *    *
        case 'keepWhitespace':              // *    *
        case 'history':                     //      *
        case 'cd':                          //      *
          options[optionName] = !!value;
          break;
        // ================ array
        case 'limit':                       // *    *     to string for readlineExt
        case 'trueValue':                   //      *
        case 'falseValue':                  //      *
          options[optionName] = flattenArray(value, function(value) {
            var type = typeof value;
            return type === 'string' || type === 'number' ||
              type === 'function' || value instanceof RegExp;
          }).map(function(value) {
            return typeof value === 'string' ? value.replace(/[\r\n]/g, '') : value;
          });
          break;
        // ================ function
        case 'print':                       // *    *
        case 'phContent':                   //      *
        case 'preCheck':                    //      *
          options[optionName] = typeof value === 'function' ? value : void 0;
          break;
        // ================ other
        case 'prompt':                      //      *
        case 'display':                     // *
          options[optionName] = value != null ? value : '';
          break;
        // no default
      }
    });
    return options;
  }, {});
}

function isMatched(res, comps, caseSensitive) {
  return comps.some(function(comp) {
    var type = typeof comp;
    return type === 'string' ?
        (caseSensitive ? res === comp : res.toLowerCase() === comp.toLowerCase()) :
      type === 'number' ? parseFloat(res) === comp :
      type === 'function' ? comp(res) :
      comp instanceof RegExp ? comp.test(res) : false;
  });
}

function replaceHomePath(path, expand) {
  var homePath = path$1.normalize(
    IS_WIN ? (process.env.HOMEDRIVE || '') + (process.env.HOMEPATH || '') :
    process.env.HOME || '').replace(/[\/\\]+$/, '');
  path = path$1.normalize(path);
  return expand ? path.replace(/^~(?=\/|\\|$)/, homePath) :
    path.replace(new RegExp('^' + escapePattern(homePath) +
      '(?=\\/|\\\\|$)', IS_WIN ? 'i' : ''), '~');
}

function replacePlaceholder(text, generator) {
  var PTN_INNER = '(?:\\(([\\s\\S]*?)\\))?(\\w+|.-.)(?:\\(([\\s\\S]*?)\\))?',
    rePlaceholder = new RegExp('(\\$)?(\\$<' + PTN_INNER + '>)', 'g'),
    rePlaceholderCompat = new RegExp('(\\$)?(\\$\\{' + PTN_INNER + '\\})', 'g');

  function getPlaceholderText(s, escape, placeholder, pre, param, post) {
    var text;
    return escape || typeof (text = generator(param)) !== 'string' ? placeholder :
      text ? (pre || '') + text + (post || '') : '';
  }

  return text.replace(rePlaceholder, getPlaceholderText)
    .replace(rePlaceholderCompat, getPlaceholderText);
}

function array2charlist(array, caseSensitive, collectSymbols) {
  var values, group = [], groupClass = -1, charCode = 0, symbols = '', suppressed;
  function addGroup(groups, group) {
    if (group.length > 3) { // ellipsis
      groups.push(group[0] + '...' + group[group.length - 1]);
      suppressed = true;
    } else if (group.length) {
      groups = groups.concat(group);
    }
    return groups;
  }

  values = array.reduce(
      function(chars, value) { return chars.concat((value + '').split('')); }, [])
    .reduce(function(groups, curChar) {
      var curGroupClass, curCharCode;
      if (!caseSensitive) { curChar = curChar.toLowerCase(); }
      curGroupClass = /^\d$/.test(curChar) ? 1 :
        /^[A-Z]$/.test(curChar) ? 2 : /^[a-z]$/.test(curChar) ? 3 : 0;
      if (collectSymbols && curGroupClass === 0) {
        symbols += curChar;
      } else {
        curCharCode = curChar.charCodeAt(0);
        if (curGroupClass && curGroupClass === groupClass &&
            curCharCode === charCode + 1) {
          group.push(curChar);
        } else {
          groups = addGroup(groups, group);
          group = [curChar];
          groupClass = curGroupClass;
        }
        charCode = curCharCode;
      }
      return groups;
    }, []);
  values = addGroup(values, group); // last group
  if (symbols) { values.push(symbols); suppressed = true; }
  return {values: values, suppressed: suppressed};
}

function joinChunks(chunks, suppressed) {
  return chunks.join(chunks.length > 2 ? ', ' : suppressed ? ' / ' : '/');
}

function getPhContent(param, options) {
  var text, values, resCharlist = {}, arg;
  if (options.phContent) {
    text = options.phContent(param, options);
  }
  if (typeof text !== 'string') {
    switch (param) {
      case 'hideEchoBack':
      case 'mask':
      case 'defaultInput':
      case 'caseSensitive':
      case 'keepWhitespace':
      case 'encoding':
      case 'bufferSize':
      case 'history':
      case 'cd':
        text = !options.hasOwnProperty(param) ? '' :
          typeof options[param] === 'boolean' ? (options[param] ? 'on' : 'off') :
          options[param] + '';
        break;
      // case 'prompt':
      // case 'query':
      // case 'display':
      //   text = options.hasOwnProperty('displaySrc') ? options.displaySrc + '' : '';
      //   break;
      case 'limit':
      case 'trueValue':
      case 'falseValue':
        values = options[options.hasOwnProperty(param + 'Src') ? param + 'Src' : param];
        if (options.keyIn) { // suppress
          resCharlist = array2charlist(values, options.caseSensitive);
          values = resCharlist.values;
        } else {
          values = values.filter(function(value) {
            var type = typeof value;
            return type === 'string' || type === 'number';
          });
        }
        text = joinChunks(values, resCharlist.suppressed);
        break;
      case 'limitCount':
      case 'limitCountNotZero':
        text = options[options.hasOwnProperty('limitSrc') ?
          'limitSrc' : 'limit'].length;
        text = text || param !== 'limitCountNotZero' ? text + '' : '';
        break;
      case 'lastInput':
        text = lastInput;
        break;
      case 'cwd':
      case 'CWD':
      case 'cwdHome':
        text = process.cwd();
        if (param === 'CWD') {
          text = path$1.basename(text);
        } else if (param === 'cwdHome') {
          text = replaceHomePath(text);
        }
        break;
      case 'date':
      case 'time':
      case 'localeDate':
      case 'localeTime':
        text = (new Date())['to' +
          param.replace(/^./, function(str) { return str.toUpperCase(); }) +
          'String']();
        break;
      default: // with arg
        if (typeof (arg = (param.match(/^history_m(\d+)$/) || [])[1]) === 'string') {
          text = inputHistory[inputHistory.length - arg] || '';
        }
    }
  }
  return text;
}

function getPhCharlist(param) {
  var matches = /^(.)-(.)$/.exec(param), text = '', from, to, code, step;
  if (!matches) { return null; }
  from = matches[1].charCodeAt(0);
  to = matches[2].charCodeAt(0);
  step = from < to ? 1 : -1;
  for (code = from; code !== to + step; code += step) { text += String.fromCharCode(code); }
  return text;
}

// cmd "arg" " a r g " "" 'a"r"g' "a""rg" "arg
function parseCl(cl) {
  var reToken = new RegExp(/(\s*)(?:("|')(.*?)(?:\2|$)|(\S+))/g), matches,
    taken = '', args = [], part;
  cl = cl.trim();
  while ((matches = reToken.exec(cl))) {
    part = matches[3] || matches[4] || '';
    if (matches[1]) {
      args.push(taken);
      taken = '';
    }
    taken += part;
  }
  if (taken) { args.push(taken); }
  return args;
}

function toBool(res, options) {
  return (
    (options.trueValue.length &&
      isMatched(res, options.trueValue, options.caseSensitive)) ? true :
    (options.falseValue.length &&
      isMatched(res, options.falseValue, options.caseSensitive)) ? false : res);
}

function getValidLine(options) {
  var res, forceNext, limitMessage,
    matches, histInput, args, resCheck;

  function _getPhContent(param) { return getPhContent(param, options); }
  function addDisplay(text) { options.display += (/[^\r\n]$/.test(options.display) ? '\n' : '') + text; }

  options.limitSrc = options.limit;
  options.displaySrc = options.display;
  options.limit = ''; // for readlineExt
  options.display = replacePlaceholder(options.display + '', _getPhContent);

  while (true) {
    res = _readlineSync(options);
    forceNext = false;
    limitMessage = '';

    if (options.defaultInput && !res) { res = options.defaultInput; }

    if (options.history) {
      if ((matches = /^\s*\!(?:\!|-1)(:p)?\s*$/.exec(res))) { // `!!` `!-1` +`:p`
        histInput = inputHistory[0] || '';
        if (matches[1]) { // only display
          forceNext = true;
        } else { // replace input
          res = histInput;
        }
        // Show it even if it is empty (NL only).
        addDisplay(histInput + '\n');
        if (!forceNext) { // Loop may break
          options.displayOnly = true;
          _readlineSync(options);
          options.displayOnly = false;
        }
      } else if (res && res !== inputHistory[inputHistory.length - 1]) {
        inputHistory = [res];
      }
    }

    if (!forceNext && options.cd && res) {
      args = parseCl(res);
      switch (args[0].toLowerCase()) {
        case 'cd':
          if (args[1]) {
            try {
              process.chdir(replaceHomePath(args[1], true));
            } catch (e) {
              addDisplay(e + '');
            }
          }
          forceNext = true;
          break;
        case 'pwd':
          addDisplay(process.cwd());
          forceNext = true;
          break;
        // no default
      }
    }

    if (!forceNext && options.preCheck) {
      resCheck = options.preCheck(res, options);
      res = resCheck.res;
      if (resCheck.forceNext) { forceNext = true; } // Don't switch to false.
    }

    if (!forceNext) {
      if (!options.limitSrc.length ||
        isMatched(res, options.limitSrc, options.caseSensitive)) { break; }
      if (options.limitMessage) {
        limitMessage = replacePlaceholder(options.limitMessage, _getPhContent);
      }
    }

    addDisplay((limitMessage ? limitMessage + '\n' : '') +
      replacePlaceholder(options.displaySrc + '', _getPhContent));
  }
  return toBool(res, options);
}

// for dev
exports._DBG_set_useExt = function(val) { _DBG_useExt = val; };
exports._DBG_set_checkOptions = function(val) { _DBG_checkOptions = val; };
exports._DBG_set_checkMethod = function(val) { _DBG_checkMethod = val; };
exports._DBG_clearHistory = function() { lastInput = ''; inputHistory = []; };

// ------------------------------------

exports.setDefaultOptions = function(options) {
  defaultOptions = margeOptions(true, options);
  return margeOptions(true); // copy
};

exports.question = function(query, options) {
  /* eslint-disable key-spacing */
  return getValidLine(margeOptions(margeOptions(true, options), {
    display:            query
  }));
  /* eslint-enable key-spacing */
};

exports.prompt = function(options) {
  var readOptions = margeOptions(true, options);
  readOptions.display = readOptions.prompt;
  return getValidLine(readOptions);
};

exports.keyIn = function(query, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions(margeOptions(true, options), {
    display:            query,
    keyIn:              true,
    keepWhitespace:     true
  });
  /* eslint-enable key-spacing */

  // char list
  readOptions.limitSrc = readOptions.limit.filter(function(value) {
    var type = typeof value;
    return type === 'string' || type === 'number';
  })
  .map(function(text) { return replacePlaceholder(text + '', getPhCharlist); });
  // pattern
  readOptions.limit = escapePattern(readOptions.limitSrc.join(''));

  ['trueValue', 'falseValue'].forEach(function(optionName) {
    readOptions[optionName] = readOptions[optionName].reduce(function(comps, comp) {
      var type = typeof comp;
      if (type === 'string' || type === 'number') {
        comps = comps.concat((comp + '').split(''));
      } else { comps.push(comp); }
      return comps;
    }, []);
  });

  readOptions.display = replacePlaceholder(readOptions.display + '',
    function(param) { return getPhContent(param, readOptions); });

  return toBool(_readlineSync(readOptions), readOptions);
};

// ------------------------------------

exports.questionEMail = function(query, options) {
  if (query == null) { query = 'Input e-mail address: '; }
  /* eslint-disable key-spacing */
  return exports.question(query, margeOptions({
    // -------- default
    hideEchoBack:       false,
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    limit:              /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    limitMessage:       'Input valid e-mail address, please.',
    trueValue:          null,
    falseValue:         null
  }, options, {
    // -------- forced
    keepWhitespace:     false,
    cd:                 false
  }));
  /* eslint-enable key-spacing */
};

exports.questionNewPassword = function(query, options) {
  /* eslint-disable key-spacing */
  var resCharlist, min, max,
    readOptions = margeOptions({
      // -------- default
      hideEchoBack:       true,
      mask:               '*',
      limitMessage:       'It can include: $<charlist>\n' +
                            'And the length must be: $<length>',
      trueValue:          null,
      falseValue:         null,
      caseSensitive:      true
    }, options, {
      // -------- forced
      history:            false,
      cd:                 false,
      // limit (by charlist etc.),
      phContent: function(param) {
        return param === 'charlist' ? resCharlist.text :
          param === 'length' ? min + '...' + max : null;
      }
    }),
    // added:     charlist, min, max, confirmMessage, unmatchMessage
    charlist, confirmMessage, unmatchMessage,
    limit, limitMessage, res1, res2;
  /* eslint-enable key-spacing */
  options = options || {};

  charlist = replacePlaceholder(
    options.charlist ? options.charlist + '' : '$<!-~>', getPhCharlist);
  if (isNaN(min = parseInt(options.min, 10)) || typeof min !== 'number') { min = 12; }
  if (isNaN(max = parseInt(options.max, 10)) || typeof max !== 'number') { max = 24; }
  limit = new RegExp('^[' + escapePattern(charlist) +
    ']{' + min + ',' + max + '}$');
  resCharlist = array2charlist([charlist], readOptions.caseSensitive, true);
  resCharlist.text = joinChunks(resCharlist.values, resCharlist.suppressed);

  confirmMessage = options.confirmMessage != null ? options.confirmMessage :
    'Reinput a same one to confirm it: ';
  unmatchMessage = options.unmatchMessage != null ? options.unmatchMessage :
    'It differs from first one.' +
      ' Hit only the Enter key if you want to retry from first one.';

  if (query == null) { query = 'Input new password: '; }

  limitMessage = readOptions.limitMessage;
  while (!res2) {
    readOptions.limit = limit;
    readOptions.limitMessage = limitMessage;
    res1 = exports.question(query, readOptions);

    readOptions.limit = [res1, ''];
    readOptions.limitMessage = unmatchMessage;
    res2 = exports.question(confirmMessage, readOptions);
  }

  return res1;
};

function _questionNum(query, options, parser) {
  var validValue;
  function getValidValue(value) {
    validValue = parser(value);
    return !isNaN(validValue) && typeof validValue === 'number';
  }
  /* eslint-disable key-spacing */
  exports.question(query, margeOptions({
    // -------- default
    limitMessage:       'Input valid number, please.'
  }, options, {
    // -------- forced
    limit:              getValidValue,
    cd:                 false
    // trueValue, falseValue, caseSensitive, keepWhitespace don't work.
  }));
  /* eslint-enable key-spacing */
  return validValue;
}
exports.questionInt = function(query, options) {
  return _questionNum(query, options, function(value) { return parseInt(value, 10); });
};
exports.questionFloat = function(query, options) {
  return _questionNum(query, options, parseFloat);
};

exports.questionPath = function(query, options) {
  /* eslint-disable key-spacing */
  var validPath, error = '',
    readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false,
      limitMessage:       '$<error(\n)>Input valid path, please.' +
                            '$<( Min:)min>$<( Max:)max>',
      history:            true,
      cd:                 true
    }, options, {
      // -------- forced
      keepWhitespace:     false,
      limit: function(value) {
        var exists, stat, res;
        value = replaceHomePath(value, true);
        error = ''; // for validate
        // mkdir -p
        function mkdirParents(dirPath) {
          dirPath.split(/\/|\\/).reduce(function(parents, dir) {
            var path = path$1.resolve((parents += dir + path$1.sep));
            if (!require$$0.existsSync(path)) {
              require$$0.mkdirSync(path);
            } else if (!require$$0.statSync(path).isDirectory()) {
              throw new Error('Non directory already exists: ' + path);
            }
            return parents;
          }, '');
        }

        try {
          exists = require$$0.existsSync(value);
          validPath = exists ? require$$0.realpathSync(value) : path$1.resolve(value);
          // options.exists default: true, not-bool: no-check
          if (!options.hasOwnProperty('exists') && !exists ||
              typeof options.exists === 'boolean' && options.exists !== exists) {
            error = (exists ? 'Already exists' : 'No such file or directory') +
              ': ' + validPath;
            return false;
          }
          if (!exists && options.create) {
            if (options.isDirectory) {
              mkdirParents(validPath);
            } else {
              mkdirParents(path$1.dirname(validPath));
              require$$0.closeSync(require$$0.openSync(validPath, 'w')); // touch
            }
            validPath = require$$0.realpathSync(validPath);
          }
          if (exists && (options.min || options.max ||
              options.isFile || options.isDirectory)) {
            stat = require$$0.statSync(validPath);
            // type check first (directory has zero size)
            if (options.isFile && !stat.isFile()) {
              error = 'Not file: ' + validPath;
              return false;
            } else if (options.isDirectory && !stat.isDirectory()) {
              error = 'Not directory: ' + validPath;
              return false;
            } else if (options.min && stat.size < +options.min ||
                options.max && stat.size > +options.max) {
              error = 'Size ' + stat.size + ' is out of range: ' + validPath;
              return false;
            }
          }
          if (typeof options.validate === 'function' &&
              (res = options.validate(validPath)) !== true) {
            if (typeof res === 'string') { error = res; }
            return false;
          }
        } catch (e) {
          error = e + '';
          return false;
        }
        return true;
      },
      // trueValue, falseValue, caseSensitive don't work.
      phContent: function(param) {
        return param === 'error' ? error :
          param !== 'min' && param !== 'max' ? null :
          options.hasOwnProperty(param) ? options[param] + '' : '';
      }
    });
    // added:     exists, create, min, max, isFile, isDirectory, validate
  /* eslint-enable key-spacing */
  options = options || {};

  if (query == null) { query = 'Input path (you can "cd" and "pwd"): '; }

  exports.question(query, readOptions);
  return validPath;
};

// props: preCheck, args, hRes, limit
function getClHandler(commandHandler, options) {
  var clHandler = {}, hIndex = {};
  if (typeof commandHandler === 'object') {
    Object.keys(commandHandler).forEach(function(cmd) {
      if (typeof commandHandler[cmd] === 'function') {
        hIndex[options.caseSensitive ? cmd : cmd.toLowerCase()] = commandHandler[cmd];
      }
    });
    clHandler.preCheck = function(res) {
      var cmdKey;
      clHandler.args = parseCl(res);
      cmdKey = clHandler.args[0] || '';
      if (!options.caseSensitive) { cmdKey = cmdKey.toLowerCase(); }
      clHandler.hRes =
        cmdKey !== '_' && hIndex.hasOwnProperty(cmdKey) ?
          hIndex[cmdKey].apply(res, clHandler.args.slice(1)) :
        hIndex.hasOwnProperty('_') ? hIndex._.apply(res, clHandler.args) : null;
      return {res: res, forceNext: false};
    };
    if (!hIndex.hasOwnProperty('_')) {
      clHandler.limit = function() { // It's called after preCheck.
        var cmdKey = clHandler.args[0] || '';
        if (!options.caseSensitive) { cmdKey = cmdKey.toLowerCase(); }
        return hIndex.hasOwnProperty(cmdKey);
      };
    }
  } else {
    clHandler.preCheck = function(res) {
      clHandler.args = parseCl(res);
      clHandler.hRes = typeof commandHandler === 'function' ?
        commandHandler.apply(res, clHandler.args) : true; // true for break loop
      return {res: res, forceNext: false};
    };
  }
  return clHandler;
}

exports.promptCL = function(commandHandler, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false,
      limitMessage:       'Requested command is not available.',
      caseSensitive:      false,
      history:            true
    }, options),
      // -------- forced
      // trueValue, falseValue, keepWhitespace don't work.
      // preCheck, limit (by clHandler)
    clHandler = getClHandler(commandHandler, readOptions);
  /* eslint-enable key-spacing */
  readOptions.limit = clHandler.limit;
  readOptions.preCheck = clHandler.preCheck;
  exports.prompt(readOptions);
  return clHandler.args;
};

exports.promptLoop = function(inputHandler, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
    // -------- default
    hideEchoBack:       false,
    trueValue:          null,
    falseValue:         null,
    caseSensitive:      false,
    history:            true
  }, options);
  /* eslint-enable key-spacing */
  while (true) { if (inputHandler(exports.prompt(readOptions))) { break; } }
  return;
};

exports.promptCLLoop = function(commandHandler, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false,
      limitMessage:       'Requested command is not available.',
      caseSensitive:      false,
      history:            true
    }, options),
      // -------- forced
      // trueValue, falseValue, keepWhitespace don't work.
      // preCheck, limit (by clHandler)
    clHandler = getClHandler(commandHandler, readOptions);
  /* eslint-enable key-spacing */
  readOptions.limit = clHandler.limit;
  readOptions.preCheck = clHandler.preCheck;
  while (true) {
    exports.prompt(readOptions);
    if (clHandler.hRes) { break; }
  }
  return;
};

exports.promptSimShell = function(options) {
  /* eslint-disable key-spacing */
  return exports.prompt(margeOptions({
    // -------- default
    hideEchoBack:       false,
    history:            true
  }, options, {
    // -------- forced
    prompt:             (function() {
      return IS_WIN ?
        '$<cwd>>' :
        // 'user@host:cwd$ '
        (process.env.USER || '') +
        (process.env.HOSTNAME ?
          '@' + process.env.HOSTNAME.replace(/\..*$/, '') : '') +
        ':$<cwdHome>$ ';
    })()
  }));
  /* eslint-enable key-spacing */
};

function _keyInYN(query, options, limit) {
  var res;
  if (query == null) { query = 'Are you sure? '; }
  if ((!options || options.guide !== false) && (query += '')) {
    query = query.replace(/\s*:?\s*$/, '') + ' [y/n]: ';
  }
  /* eslint-disable key-spacing */
  res = exports.keyIn(query, margeOptions(options, {
    // -------- forced
    hideEchoBack:       false,
    limit:              limit,
    trueValue:          'y',
    falseValue:         'n',
    caseSensitive:      false
    // mask doesn't work.
  }));
  // added:     guide
  /* eslint-enable key-spacing */
  return typeof res === 'boolean' ? res : '';
}
exports.keyInYN = function(query, options) { return _keyInYN(query, options); };
exports.keyInYNStrict = function(query, options) { return _keyInYN(query, options, 'yn'); };

exports.keyInPause = function(query, options) {
  if (query == null) { query = 'Continue...'; }
  if ((!options || options.guide !== false) && (query += '')) {
    query = query.replace(/\s+$/, '') + ' (Hit any key)';
  }
  /* eslint-disable key-spacing */
  exports.keyIn(query, margeOptions({
    // -------- default
    limit:              null
  }, options, {
    // -------- forced
    hideEchoBack:       true,
    mask:               ''
  }));
  // added:     guide
  /* eslint-enable key-spacing */
  return;
};

exports.keyInSelect = function(items, query, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false
    }, options, {
      // -------- forced
      trueValue:          null,
      falseValue:         null,
      caseSensitive:      false,
      // limit (by items),
      phContent: function(param) {
        return param === 'itemsCount' ? items.length + '' :
          param === 'firstItem' ? (items[0] + '').trim() :
          param === 'lastItem' ? (items[items.length - 1] + '').trim() : null;
      }
    }),
    // added:     guide, cancel
    keylist = '', key2i = {}, charCode = 49 /* '1' */, display = '\n';
  /* eslint-enable key-spacing */
  if (!Array.isArray(items) || !items.length || items.length > 35) {
    throw '`items` must be Array (max length: 35).';
  }

  items.forEach(function(item, i) {
    var key = String.fromCharCode(charCode);
    keylist += key;
    key2i[key] = i;
    display += '[' + key + '] ' + (item + '').trim() + '\n';
    charCode = charCode === 57 /* '9' */ ? 97 /* 'a' */ : charCode + 1;
  });
  if (!options || options.cancel !== false) {
    keylist += '0';
    key2i['0'] = -1;
    display += '[0] ' +
      (options && options.cancel != null && typeof options.cancel !== 'boolean' ?
        (options.cancel + '').trim() : 'CANCEL') + '\n';
  }
  readOptions.limit = keylist;
  display += '\n';

  if (query == null) { query = 'Choose one from list: '; }
  if ((query += '')) {
    if (!options || options.guide !== false) {
      query = query.replace(/\s*:?\s*$/, '') + ' [$<limit>]: ';
    }
    display += query;
  }

  return key2i[exports.keyIn(display, readOptions).toLowerCase()];
};

exports.getRawInput = function() { return rawInput; };

// ======== DEPRECATED ========
function _setOption(optionName, args) {
  var options;
  if (args.length) { options = {}; options[optionName] = args[0]; }
  return exports.setDefaultOptions(options)[optionName];
}
exports.setPrint = function() { return _setOption('print', arguments); };
exports.setPrompt = function() { return _setOption('prompt', arguments); };
exports.setEncoding = function() { return _setOption('encoding', arguments); };
exports.setMask = function() { return _setOption('mask', arguments); };
exports.setBufferSize = function() { return _setOption('bufferSize', arguments); };
});

var core = createCommonjsModule(function (module) {
(function() {
	
	// VERSION
	var version = { major: 0, minor: 3, patch: 0, status: "beta" };



	// IO FILE SYSTEM
	
	// Virtual file
	function TauFile(name, type, parent, text) {
		text = text === undefined ? "" : text;
		this.name = name;
		this.type = type;
		this.parent = parent;
		this.text = text;
		this.created = Date.now() / 1000;
		this.modified = this.created;
	}

	TauFile.prototype.get = function(length, position) {
		if(position === this.text.length) {
			return "end_of_stream";
		} else if(position > this.text.length) {
			return "end_of_stream";
		} else {
			return this.text.substring(position, position+length);
		}
	};

	TauFile.prototype.eof = function(position) {
		return position === this.text.length;
	};

	TauFile.prototype.put = function(text, position) {
		if(position === "end_of_stream") {
			this.text += text;
			return true;
		} else if(position === "past_end_of_stream") {
			return null;
		} else {
			this.text = this.text.substring(0, position) + text + this.text.substring(position+text.length);
			return true;
		}
	};

	TauFile.prototype.get_byte = function(position) {
		if(position === "end_of_stream")
			return -1;
		var index = Math.floor(position/2);
		if(this.text.length <= index)
			return -1;
		var code = codePointAt(this.text[Math.floor(position/2)], 0);
		if(position % 2 === 0)
			return code & 0xff;
		else
			return code / 256 >>> 0;
	};

	TauFile.prototype.put_byte = function(byte, position) {
		var index = position === "end_of_stream" ? this.text.length : Math.floor(position/2);
		if(this.text.length < index)
			return null;
		var code = this.text.length === index ? -1 : codePointAt(this.text[Math.floor(position/2)], 0);
		if(position % 2 === 0) {
			code = code / 256 >>> 0;
			code = ((code & 0xff) << 8) | (byte & 0xff);
		} else {
			code = code & 0xff;
			code = ((byte & 0xff) << 8) | (code & 0xff);
		}
		if(this.text.length === index)
			this.text += fromCodePoint(code);
		else 
			this.text = this.text.substring(0, index) + fromCodePoint(code) + this.text.substring(index+1);
		return true;
	};

	TauFile.prototype.flush = function() {
		return true;
	};

	TauFile.prototype.close = function() {
		this.modified = Date.now() / 1000;
		return true;
	};

	TauFile.prototype.size = function() {
		return this.text.length;
	};

	// Virtual directory
	function TauDirectory(name, parent) {
		this.name = name;
		this.parent = parent;
		this.files = {};
		this.length = 0;
		this.created = Date.now() / 1000;
		this.modified = this.created;
	}

	TauDirectory.prototype.lookup = function(file) {
		if(this.files.hasOwnProperty(file))
			return this.files[file];
		return null;
	};

	TauDirectory.prototype.push = function(name, file) {
		if(!this.files.hasOwnProperty(name))
			this.length++;
		this.files[name] = file;
		this.modified = Date.now() / 1000;
	};

	TauDirectory.prototype.remove = function(name) {
		if(this.files.hasOwnProperty(name)) {
			this.length--;
			delete this.files[name];
			this.modified = Date.now() / 1000;
		}
	};

	TauDirectory.prototype.empty = function() {
		return this.length === 0;
	};

	TauDirectory.prototype.size = function() {
		return 4096;
	};

	// Virtual file system for browser
	tau_file_system = {
		// Current files
		files: new TauDirectory("/", "/", null),
		// Open file
		open: function(path, type, mode) {
			var dirs = path.replace(/\/$/, "").split("/");
			var dir = tau_file_system.files;
			var name = dirs[dirs.length-1];
			for(var i = 1; i < dirs.length-1; i++) {
				dir = dir.lookup(dirs[i]);
				if(!pl.type.is_directory(dir))
					return null;
			}
			var file = dir.lookup(name);
			if(file === null) {
				if(mode === "read")
					return null;
				file = new TauFile(name, type, dir);
				dir.push(name, file);
			} else if(!pl.type.is_file(file)) {
				return null;
			}
			if(mode === "write")
				file.text = "";
			return file;
		},
		// Get item
		get: function(path) {
			var dirs = path.replace(/\/$/, "").split("/");
			var file = tau_file_system.files;
			for(var i = 1; i < dirs.length; i++)
				if(pl.type.is_directory(file))
					file = file.lookup(dirs[i]);
				else
					return null;
			return file;
		}
	};

	// User input for browser
	tau_user_input = {
		buffer: "",
		get: function( length, _ ) {
			var text;
			while( tau_user_input.buffer.length < length ) {
				text = window.prompt();
				if( text.length === 0 )
					return "end_of_stream";
				if( text ) {
					tau_user_input.buffer += text;
				}
			}
			text = tau_user_input.buffer.substr( 0, length );
			tau_user_input.buffer = tau_user_input.buffer.substr( length );
			return text;
		},
		eof: function(_) {
			return false;
		}
	};

	// User output for browser
	tau_user_output = {
		put: function( text, _ ) {
			console.log( text );
			return true;
		},
		flush: function() {
			return true;
		} 
	};

	// User error for browser
	tau_user_error = {
		put: function( text, _ ) {
			(console.error || console.log)( text );
			return true;
		},
		flush: function() {
			return true;
		} 
	};

	// Virtual file system for Node.js
	nodejs_file_system = {
		// Open file
		open: function( path, type, mode ) {
			var fd, fs = require$$0;
			if( mode === "read" && !fs.existsSync( path ) )
				return null;
			try {
				fd = fs.openSync( path, mode[0] );
			} catch(ex) {
				return false;
			}
			return {
				get: function( length, position ) {
					var buffer = new Buffer( length );
					fs.readSync( fd, buffer, 0, length, position );
					var end_of_file = true;
					var text = buffer.toString();
					for(var i = 0; i < length && end_of_file; i++)
						end_of_file = text[i] === "\u0000";
					return end_of_file ? "end_of_stream" : buffer.toString();
				},
				eof: function(position) {
					var stats = fs.statSync(path);
					return position === stats["size"];
				},
				put: function( text, position ) {
					var buffer = Buffer.from( text );
					if( position === "end_of_stream" )
						fs.writeSync( fd, buffer );
					else if( position === "past_end_of_stream" )
						return null;
					else
						fs.writeSync( fd, buffer, 0, buffer.length, position );
					return true;
				},
				get_byte: function( position ) {
					try {
						var buffer = new Buffer(1);
						fs.readSync(fd, buffer, 0, 1, position);
						var text = buffer.toString();
						var end_of_file = text[0] === "\u0000";
						return end_of_file ? "end_of_stream" : buffer.readUInt8(0);
					} catch(ex) {
						return "end_of_stream";
					}
				},
				put_byte: function(byte, position) {
					var buffer = Buffer.from([byte]);
					if(position === "end_of_stream")
						fs.writeSync(fd, buffer);
					else if(position === "past_end_of_stream")
						return null;
					else
						fs.writeSync(fd, buffer, 0, buffer.length, position);
					return true;
				},
				flush: function() {
					return true;
				},
				close: function() {
					fs.closeSync( fd );
					return true;
				}
			};
		}
	};

	// User input for Node.js
	nodejs_user_input = {
		buffer: "",
		get: function( length, _ ) {
			var text;
			var readlineSync$1 = readlineSync;
			while( nodejs_user_input.buffer.length < length )
				nodejs_user_input.buffer += readlineSync$1.question("", {keepWhitespace: true}) + "\n";
			text = nodejs_user_input.buffer.substr( 0, length );
			nodejs_user_input.buffer = nodejs_user_input.buffer.substr( length );
			return text;
		},
		eof: function(length) {
			return false;
		}
	};

	// User output for Node.js
	nodejs_user_output = {
		put: function( text, _ ) {
			process.stdout.write( text );
			return true;
		},
		flush: function() {
			return true;
		}
	};

	// User error for Node.js
	nodejs_user_error = {
		put: function( text, _ ) {
			process.stderr.write( text );
			return true;
		},
		flush: function() {
			return true;
		} 
	};
	
	
	
	// COMPATITBILITY
	
	var indexOf;
	if(!Array.prototype.indexOf) {
		indexOf = function(array, elem) {
			var len = array.length;
			for(var i = 0; i < len; i++) {
				if(elem === array[i]) return i;
			}
			return -1;
		};
	} else {
		indexOf = function(array, elem) {
			return array.indexOf(elem);
		};
	}

	var reduce = function(array, fn) {
		if(array.length === 0) return undefined;
		var elem = array[0];
		var len = array.length;
		for(var i = 1; i < len; i++) {
			elem = fn(elem, array[i]);
		}
		return elem;
	};

	var map;
	if(!Array.prototype.map) {
		map = function(array, fn) {
			var a = [];
			var len = array.length;
			for(var i = 0; i < len; i++) {
				a.push( fn(array[i]) );
			}
			return a;
		};
	} else {
		map = function(array, fn) {
			return array.map(fn);
		};
	}
	
	var filter;
	if(!Array.prototype.filter) {
		filter = function(array, fn) {
			var a = [];
			var len = array.length;
			for(var i = 0; i < len; i++) {
				if(fn(array[i]))
					a.push( array[i] );
			}
			return a;
		};
	} else {
		filter = function(array, fn) {
			return array.filter(fn);
		};
	}
	
	var codePointAt;
	if(!String.prototype.codePointAt) {
		codePointAt = function(str, i) {
			return str.charCodeAt(i);
		};
	} else {
		codePointAt = function(str, i) {
			return str.codePointAt(i);
		};
	}
	
	var fromCodePoint;
	if(!String.fromCodePoint) {
		fromCodePoint = function() {
			return String.fromCharCode.apply(null, arguments);
		};
	} else {
		fromCodePoint = function() {
			return String.fromCodePoint.apply(null, arguments);
		};
	}

	var stringLength;
	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	if(Array.from)
		stringLength = function(str) {
			return Array.from(str).length;
		};
	else
		stringLength = function(str) {
			return str.replace(regexAstralSymbols, '_').length;
		};

	
	
	// PARSER

	var ERROR = 0;
	var SUCCESS = 1;

	var regex_escape = /(\\a)|(\\b)|(\\d)|(\\e)|(\\f)|(\\n)|(\\r)|(\\s)|(\\t)|(\\v)|\\x([0-9a-fA-F]+)\\|\\([0-7]+)\\|(\\\\)|(\\')|('')|(\\")|(\\`)|(\\.)|(.)/g;
	var escape_map = {"\\a": 7, "\\b": 8, "\\d": 127, "\\e": 27, "\\f": 12, "\\n": 10, "\\r": 13, "\\s": 32, "\\t": 9, "\\v": 11};
	function escape(str) {
		var stack = [];
		var _error = false;
		str.replace(regex_escape, function(match, a, b, d, e, f, n, r, s, t, v, hex, octal, back, single, dsingle, double, backquote, error, char) {
			switch(true) {
				case hex !== undefined:
					stack.push( parseInt(hex, 16) );
					return "";
				case octal !== undefined:
					stack.push( parseInt(octal, 8) );
					return "";
				case back !== undefined:
				case single !== undefined:
				case dsingle !== undefined:
				case double !== undefined:
				case backquote !== undefined:
					stack.push( codePointAt(match.substr(1),0) );
					return "";
				case char !== undefined:
					stack.push( codePointAt(char,0) );
					return "";
				case error !== undefined:
					_error = true;
				default:
					stack.push(escape_map[match]);
					return "";
			}
		});
		if(_error)
			return null;
		return stack;
	}

	// Escape atoms
	function escapeAtom(str, quote) {
		var atom = '';
		if( str === "\\" ) return null;
		if( str.length < 2 ) return str;
		try {
			str = str.replace(/((?:^|[^\\])(?:\\\\)*)\\([0-7]+)\\/g, function(match, g1, g2) {
				return g1 + fromCodePoint(parseInt(g2, 8));
			});
			str = str.replace(/((?:^|[^\\])(?:\\\\)*)\\x([0-9a-fA-F]+)\\/g, function(match, g1, g2) {
				return g1 + fromCodePoint(parseInt(g2, 16));
			});
		} catch(error) {
			return null;
		}
		for( var i = 0; i < str.length; i++) {
			var a = str.charAt(i);
			var b = str.charAt(i+1);
			if( a === quote && b === quote ) {
				i++;
				atom += quote;
			} else if( a === '\\' ) {
				if( ['a','b','f','n','r','t','v',"'",'"','\\','\a','\b','\f','\n','\r','\t','\v'].indexOf(b) !== -1 ) {
					i += 1;
					switch( b ) {
						case 'a': atom += '\a'; break;
						case 'b': atom += '\b'; break;
						case 'f': atom += '\f'; break;
						case 'n': atom += '\n'; break;
						case 'r': atom += '\r'; break;
						case 't': atom += '\t'; break;
						case 'v': atom += '\v'; break;
						case "'": atom += "'"; break;
						case '"': atom += '"'; break;
						case '\\': atom += '\\'; break;
					}
				} else {
					return null;
				}
			} else {
				atom += a;
			}
		}
		return atom;
	}
	
	// Redo escape
	function redoEscape(str) {
		var atom = '';
		for( var i = 0; i < str.length; i++) {
			switch( str.charAt(i) ) {
				case "'": atom += "\\'"; break;
				case '\\': atom += '\\\\'; break;
				//case '\a': atom += '\\a'; break;
				case '\b': atom += '\\b'; break;
				case '\f': atom += '\\f'; break;
				case '\n': atom += '\\n'; break;
				case '\r': atom += '\\r'; break;
				case '\t': atom += '\\t'; break;
				case '\v': atom += '\\v'; break;
				default: atom += str.charAt(i); break;
			}
		}
		return atom;
	}

	// String to num
	function convertNum(num) {
		var n = num.substr(2);
		switch(num.substr(0,2).toLowerCase()) {
			case "0x":
				return parseInt(n, 16);
			case "0b":
				return parseInt(n, 2);
			case "0o":
				return parseInt(n, 8);
			case "0'":
				return escape(n)[0];
			default:
				return parseFloat(num);
		}
	}

	// Is graphic token
	function is_graphic_token(string) {
		return /^[#\$\&\*\+\-\.\/\:\<\=\>\?\@\^\~\\]+/.test(string);
	}

	// Regular expressions for tokens
	var rules = {
		whitespace: /^\s*(?:(?:%.*)|(?:\/\*(?:\n|\r|.)*?(?:\*\/|$))|(?:\s+))\s*/,
		variable: /^(?:[A-Z_][a-zA-Z0-9_]*)/,
		atom: /^(\!|,|;|[a-z][0-9a-zA-Z_]*|[#\$\&\*\+\-\.\/\:\<\=\>\?\@\^\~\\]+|'(?:(?:'')|(?:\\\\)|(?:\\')|[^'])*')/,
		number: /^(?:0o[0-7]+|0x[0-9a-fA-F]+|0b[01]+|0'(?:''|\\[abdefnrstv\\'"`]|\\x?\d+\\|[^\\])|\d+(?:\.\d+(?:[eE][+-]?\d+)?)?)/,
		string: /^(?:"([^"]|""|\\")*"|`([^`]|``|\\`)*`)/,
		l_brace: /^(?:\[)/,
		r_brace: /^(?:\])/,
		l_bracket: /^(?:\{)/,
		r_bracket: /^(?:\})/,
		bar: /^(?:\|)/,
		l_paren: /^(?:\()/,
		r_paren: /^(?:\))/
	};

	// Replace chars of char_conversion session
	function replace( thread, text ) {
		if( thread.get_flag( "char_conversion" ).id === "on" ) {
			return text.replace(/./g, function(char) {
				return thread.get_char_conversion( char );
			});
		}
		return text;
	}

	// Tokenize strings
	function Tokenizer(thread) {
		this.thread = thread;
		this.text = ""; // Current text to be analized
		this.tokens = []; // Consumed tokens
	}

	Tokenizer.prototype.set_last_tokens = function(tokens) {
		return this.tokens = tokens;
	};

	Tokenizer.prototype.new_text = function(text) {
		this.text = text;
		this.tokens = [];
	};

	Tokenizer.prototype.get_tokens = function(init) {
		var text;
		var len = 0; // Total length respect to text
		var line = 0;
		var start = 0;
		var tokens = [];
		var last_is_blank;

		if(init) {
			var token = this.tokens[init-1];
			len = token.len;
			text = replace( this.thread, this.text.substr(token.len) );
			line = token.line;
			start = token.start;
		}
		else
			text = this.text;


		// If there is nothing to be analized, return null
		if(/^\s*$/.test(text))
			return null;

		while(text !== "") {
			var matches = [];
			last_is_blank = false;

			if(/^\n/.exec(text) !== null) {
				line++;
				start = 0;
				len++;
				text = text.replace(/\n/, "");
				last_is_blank = true;
				continue;
			}

			for(var rule in rules) {
				if(rules.hasOwnProperty(rule)) {
					var matchs = rules[rule].exec( text );
					if(matchs) {
						matches.push({
							value: matchs[0],
							name: rule,
							matches: matchs
						});
					}
				}
			}

			// Lexical error
			if(!matches.length)
				return this.set_last_tokens( [{ value: text, matches: [], name: "lexical", line: line, start: start }] );

			var token = reduce( matches, function(a, b) {
				return a.value.length >= b.value.length ? a : b;
			} );

			token.start = start;
			token.line = line;

			text = text.replace(token.value, "");
			start += token.value.length;
			len += token.value.length;

			var nl = (token.value.match(/\n/g) || []).length;
			line += nl;
			if(nl > 0) 
				start = token.value.length - token.value.lastIndexOf("\n") - 1;
			token.line_count = line;
			token.line_position = start;

			switch(token.name) {
				case "atom":
					token.raw = token.value;
					if(token.value.charAt(0) === "'") {
						token.value = escapeAtom( token.value.substring(1, token.value.length - 1), "'" );
						if( token.value === null ) {
							token.name = "lexical";
							token.value = "unknown escape sequence";
						}
					}
					break;
				case "number":
					var substr = token.value.substring(0,2);
					token.float = substr !== "0x" && substr !== "0'" && token.value.match(/[.eE]/) !== null;
					token.value = convertNum( token.value );
					token.blank = last_is_blank;
					break;
				case "string":
					var del = token.value.charAt(0);
					token.value = escapeAtom( token.value.substring(1, token.value.length - 1), del );
					if( token.value === null ) {
						token.name = "lexical";
						token.value = "unknown escape sequence";
					}
					break;
				case "whitespace":
					var last = tokens[tokens.length-1];
					if(last) last.space = true;
					last_is_blank = true;
					continue;
				case "r_bracket":
					if( tokens.length > 0 && tokens[tokens.length-1].name === "l_bracket" ) {
						token = tokens.pop();
						token.name = "atom";
						token.value = "{}";
						token.raw = "{}";
						token.space = false;
					}
					break;
				case "r_brace":
					if( tokens.length > 0 && tokens[tokens.length-1].name === "l_brace" ) {
						token = tokens.pop();
						token.name = "atom";
						token.value = "[]";
						token.raw = "[]";
						token.space = false;
					}
					break;
			}
			token.len = len;
			tokens.push( token );
			last_is_blank = false;
		}

		var t = this.set_last_tokens( tokens );
		return t.length === 0 ? null : t;
	};

	// Parse an expression
	function parseExpr(thread, tokens, start, priority, toplevel) {
		if(!tokens[start]) return {type: ERROR, value: pl.error.syntax(tokens[start-1], "expression expected", true)};
		var error;

		if(priority === "0") {
			var token = tokens[start];
			switch(token.name) {
				case "number":
					return {type: SUCCESS, len: start+1, value: new pl.type.Num(token.value, token.float)};
				case "variable":
					return {type: SUCCESS, len: start+1, value: new pl.type.Var(token.value)};
				case "string":
					var str;
					switch( thread.get_flag( "double_quotes" ).id ) {
						case "atom":							str = new Term( token.value, [] );
							break;
						case "codes":
							str = new Term( "[]", [] );
							for(var i = token.value.length-1; i >= 0; i-- )
								str = new Term( ".", [new pl.type.Num( codePointAt(token.value,i), false ), str] );
							break;
						case "chars":
							str = new Term( "[]", [] );
							for(var i = token.value.length-1; i >= 0; i-- )
								str = new Term( ".", [new pl.type.Term( token.value.charAt(i), [] ), str] );
							break;
					}
					return {type: SUCCESS, len: start+1, value: str};
				case "l_paren":
					var expr = parseExpr(thread, tokens, start+1, thread.__get_max_priority(), true);
					if(expr.type !== SUCCESS) return expr;
					if(tokens[expr.len] && tokens[expr.len].name === "r_paren") {
						expr.len++;
						return expr;
					}
					return {type: ERROR, derived: true, value: pl.error.syntax(tokens[expr.len] ? tokens[expr.len] : tokens[expr.len-1], ") or operator expected", !tokens[expr.len])}
				case "l_bracket":
					var expr = parseExpr(thread, tokens, start+1, thread.__get_max_priority(), true);
					if(expr.type !== SUCCESS) return expr;
					if(tokens[expr.len] && tokens[expr.len].name === "r_bracket") {
						expr.len++;
						expr.value = new Term( "{}", [expr.value] );
						return expr;
					}
					return {type: ERROR, derived: true, value: pl.error.syntax(tokens[expr.len] ? tokens[expr.len] : tokens[expr.len-1], "} or operator expected", !tokens[expr.len])}
			}
			// Compound term
			var result = parseTerm(thread, tokens, start, toplevel);
			if(result.type === SUCCESS || result.derived)
				return result;
			// List
			result = parseList(thread, tokens, start);
			if(result.type === SUCCESS || result.derived)
				return result;
			// Unexpected
			return {type: ERROR, derived: false, value: pl.error.syntax(tokens[start], "unexpected token")};
		}

		var max_priority = thread.__get_max_priority();
		var next_priority = thread.__get_next_priority(priority);
		var aux_start = start;
		
		// Prefix operators
		if(tokens[start].name === "atom" && tokens[start+1] && (tokens[start].space || tokens[start+1].name !== "l_paren")) {
			var token = tokens[start++];
			var classes = thread.__lookup_operator_classes(priority, token.value);
			
			// Associative prefix operator
			if(classes && classes.indexOf("fy") > -1) {
				var expr = parseExpr(thread, tokens, start, priority, toplevel);
				if(expr.type !== ERROR) {
					if( token.value === "-" && !token.space && pl.type.is_number( expr.value ) ) {
						return {
							value: new pl.type.Num(-expr.value.value, expr.value.is_float),
							len: expr.len,
							type: SUCCESS
						};
					} else {
						return {
							value: new pl.type.Term(token.value, [expr.value]),
							len: expr.len,
							type: SUCCESS
						};
					}
				} else {
					error = expr;
				}
			// Non-associative prefix operator
			} else if(classes && classes.indexOf("fx") > -1) {
				var expr = parseExpr(thread, tokens, start, next_priority, toplevel);
				if(expr.type !== ERROR) {
					return {
						value: new pl.type.Term(token.value, [expr.value]),
						len: expr.len,
						type: SUCCESS
					};
				} else {
					error = expr;
				}
			}
		}

		start = aux_start;
		var expr = parseExpr(thread, tokens, start, next_priority, toplevel);
		if(expr.type === SUCCESS) {
			start = expr.len;
			var token = tokens[start];
			if(tokens[start] && (
				tokens[start].name === "atom" && thread.__lookup_operator_classes(priority, token.value) ||
				tokens[start].name === "bar" && thread.__lookup_operator_classes(priority, "|")
			) ) {
				var next_priority_lt = next_priority;
				var next_priority_eq = priority;
				var classes = thread.__lookup_operator_classes(priority, token.value);

				if(classes.indexOf("xf") > -1) {
					return {
						value: new pl.type.Term(token.value, [expr.value]),
						len: ++expr.len,
						type: SUCCESS
					};
				} else if(classes.indexOf("xfx") > -1) {
					var expr2 = parseExpr(thread, tokens, start + 1, next_priority_lt, toplevel);
					if(expr2.type === SUCCESS) {
						return {
							value: new pl.type.Term(token.value, [expr.value, expr2.value]),
							len: expr2.len,
							type: SUCCESS
						};
					} else {
						expr2.derived = true;
						return expr2;
					}
				} else if(classes.indexOf("xfy") > -1) {
					var expr2 = parseExpr(thread, tokens, start + 1, next_priority_eq, toplevel);
					if(expr2.type === SUCCESS) {
						return {
							value: new pl.type.Term(token.value, [expr.value, expr2.value]),
							len: expr2.len,
							type: SUCCESS
						};
					} else {
						expr2.derived = true;
						return expr2;
					}
				} else if(expr.type !== ERROR) {
					while(true) {
						start = expr.len;
						var token = tokens[start];
						if(token && token.name === "atom" && thread.__lookup_operator_classes(priority, token.value)) {
							var classes = thread.__lookup_operator_classes(priority, token.value);
							if( classes.indexOf("yf") > -1 ) {
								expr = {
									value: new pl.type.Term(token.value, [expr.value]),
									len: ++start,
									type: SUCCESS
								};
							} else if( classes.indexOf("yfx") > -1 ) {
								var expr2 = parseExpr(thread, tokens, ++start, next_priority_lt, toplevel);
								if(expr2.type === ERROR) {
									expr2.derived = true;
									return expr2;
								}
								start = expr2.len;
								expr = {
									value: new pl.type.Term(token.value, [expr.value, expr2.value]),
									len: start,
									type: SUCCESS
								};
							} else { break; }
						} else { break; }
					}
				}
			} else {
				error = {type: ERROR, value: pl.error.syntax(tokens[expr.len-1], "operator expected")};
			}
			return expr;
		}
		return expr;
	}

	// Parse a compound term
	function parseTerm(thread, tokens, start, toplevel) {
		if(!tokens[start] || (tokens[start].name === "atom" && tokens[start].raw === "." && !toplevel && (tokens[start].space || !tokens[start+1] || tokens[start+1].name !== "l_paren")))
			return {type: ERROR, derived: false, value: pl.error.syntax(tokens[start-1], "unfounded token")};
		var atom = tokens[start];
		var exprs = [];
		if(tokens[start].name === "atom" && tokens[start].raw !== ",") {
			start++;
			if(tokens[start-1].space) return {type: SUCCESS, len: start, value: new pl.type.Term(atom.value, exprs)};
			if(tokens[start] && tokens[start].name === "l_paren") {
				if(tokens[start+1] && tokens[start+1].name === "r_paren") 
					return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start+1], "argument expected")};
				var expr = parseExpr(thread, tokens, ++start, "999", true);
				if(expr.type === ERROR) {
					if( expr.derived )
						return expr;
					else
						return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start] ? tokens[start] : tokens[start-1], "argument expected", !tokens[start])};
				}
				exprs.push(expr.value);
				start = expr.len;
				while(tokens[start] && tokens[start].name === "atom" && tokens[start].value === ",") {
					expr = parseExpr(thread, tokens, start+1, "999", true);
					if(expr.type === ERROR) {
						if( expr.derived )
							return expr;
						else
							return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start+1] ? tokens[start+1] : tokens[start], "argument expected", !tokens[start+1])};
					}
					exprs.push(expr.value);
					start = expr.len;
				}
				if(tokens[start] && tokens[start].name === "r_paren") start++;
				else return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start] ? tokens[start] : tokens[start-1], ", or ) expected", !tokens[start])};
			}
			return {type: SUCCESS, len: start, value: new pl.type.Term(atom.value, exprs)};
		}
		return {type: ERROR, derived: false, value: pl.error.syntax(tokens[start], "term expected")};
	}

	// Parse a list
	function parseList(thread, tokens, start) {
		if(!tokens[start]) 
			return {type: ERROR, derived: false, value: pl.error.syntax(tokens[start-1], "[ expected")};
		if(tokens[start] && tokens[start].name === "l_brace") {
			var expr = parseExpr(thread, tokens, ++start, "999", true);
			var exprs = [expr.value];
			var cons = undefined;

			if(expr.type === ERROR) {
				if(tokens[start] && tokens[start].name === "r_brace") {
					return {type: SUCCESS, len: start+1, value: new pl.type.Term("[]", [])};
				}
				return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start], "] expected")};
			}
			
			start = expr.len;

			while(tokens[start] && tokens[start].name === "atom" && tokens[start].value === ",") {
				expr = parseExpr(thread, tokens, start+1, "999", true);
				if(expr.type === ERROR) {
					if( expr.derived )
						return expr;
					else
						return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start+1] ? tokens[start+1] : tokens[start], "argument expected", !tokens[start+1])};
				}
				exprs.push(expr.value);
				start = expr.len;
			}
			var bar = false;
			if(tokens[start] && tokens[start].name === "bar") {
				bar = true;
				expr = parseExpr(thread, tokens, start+1, "999", true);
				if(expr.type === ERROR) {
					if( expr.derived )
						return expr;
					else
						return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start+1] ? tokens[start+1] : tokens[start], "argument expected", !tokens[start+1])};
				}
				cons = expr.value;
				start = expr.len;
			}
			if(tokens[start] && tokens[start].name === "r_brace")
				return {type: SUCCESS, len: start+1, value: arrayToList(exprs, cons) };
			else
				return {type: ERROR, derived: true, value: pl.error.syntax(tokens[start] ? tokens[start] : tokens[start-1], bar ? "] expected" : ", or | or ] expected", !tokens[start])};
		}
		return {type: ERROR, derived: false, value: pl.error.syntax(tokens[start], "list expected")};
	}

	// Parse a rule
	function parseRule(thread, tokens, start) {
		var line = tokens[start].line;
		var expr = parseExpr(thread, tokens, start, thread.__get_max_priority(), false);
		var rule = null;
		var obj;
		if(expr.type !== ERROR) {
			start = expr.len;
			if(tokens[start] && tokens[start].name === "atom" && tokens[start].raw === ".") {
				start++;
				if( pl.type.is_term(expr.value) ) {
					if(expr.value.indicator === ":-/2") {
						rule = new pl.type.Rule(expr.value.args[0], body_conversion(expr.value.args[1]));
						obj = {
							value: rule,
							len: start,
							type: SUCCESS
						};
					} else if(expr.value.indicator === "-->/2") {
						rule = rule_to_dcg(new pl.type.Rule(expr.value.args[0], expr.value.args[1]), thread);
						if(!pl.type.is_rule(rule))
							return {
								value: rule,
								len: start,
								type: ERROR
							};
						rule.body = body_conversion( rule.body );
						obj = {
							value: rule,
							len: start,
							type: pl.type.is_rule( rule ) ? SUCCESS : ERROR
						};
					} else {
						rule = new pl.type.Rule(expr.value, null);
						obj = {
							value: rule,
							len: start,
							type: SUCCESS
						};
					}
					if( rule ) {
						var singleton = rule.singleton_variables();
						if( singleton.length > 0 )
							thread.throw_warning( pl.warning.singleton( singleton, rule.head.indicator, line ) );
					}
					return obj;
				} else {
					return { type: ERROR, value: pl.error.syntax(tokens[start], "callable expected") };
				}
			} else {
				return { type: ERROR, value: pl.error.syntax(tokens[start] ? tokens[start] : tokens[start-1], ". or operator expected") };
			}
		}
		return expr;
	}

	// Parse a program
	function parseProgram(thread, string, options) {
		var opts = {};
		options = options ? options : {};
		opts.success = options.success ? options.success : function(){};
		opts.error = options.error ? options.error : function(){};
		opts.from = options.from ? options.from : "$tau-js";
		opts.reconsult = options.reconsult !== undefined ? options.reconsult : true;
		opts.reconsulted = options.reconsulted === undefined ? {} : options.reconsulted;
		opts.context_module = options.context_module === undefined ? "user" : options.context_module;
		opts.initialization = options.initialization === undefined ? [] : options.initialization;
		opts.current_token = options.current_token === undefined ? 0 : options.current_token;
		opts.tokenizer = options.tokenizer === undefined ? null : options.tokenizer;
		opts.tokens = options.tokens === undefined ? null : options.tokens;
		opts.string = string;
		opts.term_expansion = false;
		var reconsulted = opts.reconsulted;
		var tokenizer = opts.tokenizer;
		var tokens = opts.tokens;
		if(tokenizer === null) {
			tokenizer = new Tokenizer(thread);
			tokenizer.new_text(string);
			opts.tokenizer = tokenizer;
			tokens = tokenizer.get_tokens(0);
			opts.tokens = tokens;
		}
		var n = opts.current_token;
		while(tokens !== null && tokens[n]) {
			var expr = parseRule(thread, tokens, n);
			opts.current_token = expr.len;
			if(expr.type === ERROR) {
				if(opts.error !== undefined)
				opts.error(new Term("throw", [expr.value]));
				return;
			} else {
				// Term expansion
				var term_expansion = thread.session.modules.user.rules["term_expansion/2"];
				if(term_expansion && term_expansion.length > 0) {
					opts.term_expansion = true;
					var n_thread = new Thread(thread.session);
					var term = expr.value.body ? new Term(":-", [expr.value.head, expr.value.body]) : expr.value.head;
					thread.session.renamed_variables = {};
					term = term.rename(thread.session);
					n_thread.query("term_expansion(" + term.toString({
						quoted: true
					}) + ", X).");
					n_thread.answer(function(answer) {
						if(answer && !pl.type.is_error(answer) && pl.type.is_term(answer.links['X'])) {
							var term = answer.links['X'];
							var rule = term.indicator === ":-/2" ? new Rule(term.args[0], term.args[1]) : new Rule( term, null ) ;
							parseProgramExpansion(thread, opts, reconsulted, {value: rule, len: expr.len, type: expr.type});
						} else {
							parseProgramExpansion(thread, opts, reconsulted, expr);
						}
					});
					return;
				} else {
					opts.term_expansion = false;
					var async = parseProgramExpansion(thread, opts, reconsulted, expr);
					if(async)
						return;
					n = expr.len;
				}
			}
		}
		// run goals from initialization/1 directive
		var callback = opts.success;
		var nthread = new Thread(thread.session);
		for(var i = opts.initialization.length-1; i > 0; i--) {
			var next_callback = (function(init, callback) {
				return function(answer) {
					if(answer === null) {
						nthread.answer();
					} else if(pl.type.is_error(answer)) {
						opts.error(answer);
					} else {
						nthread.add_goal(init);
						nthread.answer(callback);
					}
				};
			})(opts.initialization[i], callback);
			callback = next_callback;
		}
		if(opts.initialization.length > 0) {
			nthread.add_goal(opts.initialization[0]);
			nthread.answer(callback);
		} else {
			callback();
		}
	}

	function parseGoalExpansion(thread, options, expr) {
		var n_thread = new Thread( thread.session );
		n_thread.__goal_expansion = true;
		var varterm = thread.next_free_variable();
		var varhead = thread.next_free_variable();
		var goal = varhead + " = " + expr.value.head + ", goal_expansion(" + expr.value.body.toString({
			quoted: true
		}) + ", " + varterm.toString({
			quoted: true
		}) + ").";
		n_thread.query(goal);
		n_thread.answer(function(answer) {
			if(answer && !pl.type.is_error(answer) && answer.links[varterm]) {
				expr.value.head = answer.links[varhead];
				expr.value.body = body_conversion(answer.links[varterm]);
				parseGoalExpansion(thread, options, expr);
			} else {
				thread.add_rule(expr.value, options);
				parseProgram(thread, options.string, options);
			}
		});
	}

	function parseQueryExpansion(thread, term, options) {
		var n_thread = new Thread(thread.session);
		n_thread.__goal_expansion = true;
		var varterm = thread.next_free_variable();
		var goal = "goal_expansion(" + term.toString({
			quoted: true
		}) + ", " + varterm.toString({
			quoted: true
		}) + ").";
		n_thread.query(goal);
		var variables = n_thread.head_point().substitution.domain();
		n_thread.answer(function(answer) {
			if(answer && !pl.type.is_error(answer) && answer.links[varterm]) {
				for(var i = 0; i < variables.length; i++) {
					if(variables[i] !== varterm.id && answer.links[variables[i]]) {
						var subs = new Substitution();
						subs.links[answer.links[variables[i]]] = variables[i];
						answer.links[varterm] = answer.links[varterm].apply( subs );
					}
				}
				parseQueryExpansion(thread, body_conversion(answer.links[varterm]), options);
			} else {
				thread.add_goal(term);
				options.success(term);
				parseQuery(thread, options.string, options);
			}
		});
	}

	function parseProgramExpansion(thread, options, reconsulted, expr) {
		var async = options.term_expansion === true;
		if(expr.value.body === null && expr.value.head.indicator === "?-/1") {
			async = true;
			var n_thread = new Thread(thread.session);
			n_thread.add_goal(expr.value.head.args[0]);
			n_thread.answer(function(answer) {
				if(pl.type.is_error(answer)) {
					thread.throw_warning(answer.args[0]);
				} else if(answer === false || answer === null) {
					thread.throw_warning(pl.warning.failed_goal(expr.value.head.args[0], expr.len));
				}
				parseProgram(thread, options.string, options);
			});
		} else if(expr.value.body === null && expr.value.head.indicator === ":-/1") {
			var result = thread.run_directive(expr.value.head.args[0], options);
			async = async || (result === true);
			/*if(async)
				parseProgram(thread, options.string, options);*/
		} else {
			indicator = expr.value.head.indicator;
			if(options.reconsult !== false && reconsulted[indicator] !== true && !thread.is_multifile_predicate(indicator)) {
				thread.session.modules[options.context_module].rules[indicator] = filter(thread.session.rules[indicator] || [], function(rule) { return rule.dynamic; });
				reconsulted[indicator] = true;
			}
			var goal_expansion = thread.session.modules.user.rules["goal_expansion/2"];
			if(expr.value.body !== null && goal_expansion && goal_expansion.length > 0) {
				async = true;
				thread.session.renamed_variables = {};
				var origin = {
					head: function() { return expr.value.head; },
					term: function() { return expr.value.body; },
					set: function(h, p){
						expr.value.head = h;
						expr.value.body = p;
					}
				};
				parseGoalExpansion(thread, options, expr, body_conversion(expr.value.body), origin.set);
			} else {
				thread.add_rule(expr.value, options);
				/*if(async)
					parseProgram(thread, options.string, options);*/
			}
		}
		return async;
	}
	
	// Parse a query
	function parseQuery(thread, string, options) {
		var opts = {};
		var callback = typeof options === "function" ? options : function(){};
		options = options === undefined || typeof options === "function" ? {} : options;
		opts.success = options.success === undefined ? callback : options.success;
		opts.error = options.error === undefined ? callback : options.error;
		opts.tokenizer = options.tokenizer === undefined ? null : options.tokenizer;
		opts.current_token = options.current_token === undefined ? 0 : options.current_token;
		opts.string = string;
		var tokenizer = opts.tokenizer;
		var n = opts.current_token;
		if(tokenizer === null) {
			tokenizer = new Tokenizer(thread);
			opts.tokenizer = tokenizer;
			tokenizer.new_text(string);
		}
		do {
			var tokens = tokenizer.get_tokens(n);
			if(tokens === null)
				break;
			var expr = parseExpr(thread, tokens, 0, thread.__get_max_priority(), false);
			if(expr.type !== ERROR) {
				var expr_position = expr.len;
				n = expr.len + 1;
				opts.current_token = n;
				if(tokens[expr_position] && tokens[expr_position].name === "atom" && tokens[expr_position].raw === ".") {
					expr.value = body_conversion(expr.value);
					// Goal expansion
					var goal_expansion = thread.session.modules.user.rules["goal_expansion/2"];
					if(!thread.__goal_expansion && goal_expansion && goal_expansion.length > 0) {
						parseQueryExpansion(thread, expr.value, opts);
						return;
					} else {
						thread.add_goal(expr.value);
						opts.success(expr.value);
					}
				} else {
					var token = tokens[expr_position];
					opts.error(
						new Term("throw", [
							pl.error.syntax(
								token ? token : tokens[expr_position-1],
								". or operator expected",
								!token
							)
						])
					);
					return;
				}
			} else {
				opts.error(new Term("throw", [expr.value]));
				return;
			}
		} while(true);
	}


	
	// UTILS

	// Rule to DCG
	function rule_to_dcg(rule, thread) {
		rule = rule.rename( thread );
		var begin = thread.next_free_variable();
		var dcg = body_to_dcg( rule.body, begin, thread );
		if( dcg.error )
			return dcg.value;
		rule.body = dcg.value;
		// push-back lists
		if(rule.head.indicator === ",/2") {
			var terminals = rule.head.args[1];
			rule.head = rule.head.args[0];
			var last = thread.next_free_variable();
			var pointer = terminals;
			if(!pl.type.is_list(pointer)) {
				return pl.error.type("list", pointer, "DCG/0");
			}
			if(pointer.indicator === "[]/0") {
				terminals = dcg.variable;
			} else {
				while(pointer.indicator === "./2" && pl.type.is_list(pointer) && pointer.args[1].indicator !== "[]/0") {
					pointer = pointer.args[1];
				}
				if(pl.type.is_variable(pointer))
					return pl.error.instantiation("DCG/0");
				else if(!pl.type.is_list(pointer))
					return pl.error.type("list", terminals, "DCG/0");
				pointer.args[1] = dcg.variable;
			}
			rule.body = new Term(",", [rule.body, new Term("=", [last, terminals])]);
			rule.head = new Term(rule.head.id, rule.head.args.concat([begin, last]));
		} else {
			// replace first assignment
			var first_assign = rule.body;
			if(pl.type.is_term(first_assign) && first_assign.indicator === ",/2")
				first_assign = first_assign.args[0];
			if(pl.type.is_term(first_assign) && first_assign.indicator === "=/2" &&
			   pl.type.is_variable(first_assign.args[0]) && first_assign.args[0] === begin) {
				begin = first_assign.args[1];
				rule.body = rule.body.replace(null);
			}
			// add last variable
			rule.head = new Term(rule.head.id, rule.head.args.concat([begin, dcg.variable]));
		}
		return rule;
	}

	// Body to DCG
	function body_to_dcg(expr, last, thread) {
		var free;
		if( pl.type.is_term( expr ) && expr.indicator === "!/0" ) {
			free = thread.next_free_variable();
			return {
				value: new Term(",", [expr, new Term("=", [last, free])]),
				variable: free,
				error: false
			};
		} else if( pl.type.is_term( expr ) && expr.indicator === ":/2" ) {
			var right = body_to_dcg(expr.args[1], last, thread);
			if( right.error ) return right;
			return {
				value: new Term(":", [expr.args[0], right.value]),
				variable: right.variable,
				error: false
			};
		} else if( pl.type.is_term( expr ) && expr.indicator === "\\+/1" ) {
			var left = body_to_dcg(expr.args[0], last, thread);
			if( left.error ) return left;
			return {
				value: new Term(expr.id, [left.value]),
				variable: last,
				error: false
			};
		} else if( pl.type.is_term( expr ) && (expr.indicator === ",/2" || expr.indicator === "->/2") ) {
			var left = body_to_dcg(expr.args[0], last, thread);
			if( left.error ) return left;
			var right = body_to_dcg(expr.args[1], left.variable, thread);
			if( right.error ) return right;
			return {
				value: new Term(expr.id, [left.value, right.value]),
				variable: right.variable,
				error: false
			};
		} else if( pl.type.is_term( expr ) && expr.indicator === ";/2" ) {
			var left = body_to_dcg(expr.args[0], last, thread);
			if( left.error ) return left;
			var right = body_to_dcg(expr.args[1], last, thread);
			if( right.error ) return right;
			return {
				value: new Term(",", [new Term(";", [left.value, right.value]), new Term("=", [left.variable, right.variable])]),
				variable: right.variable,
				error: false
			};
		} else if( pl.type.is_term( expr ) && expr.indicator === "{}/1" ) {
			free = thread.next_free_variable();
			return {
				value: new Term(",", [expr.args[0], new Term("=", [last, free])]),
				variable: free,
				error: false
			};
		} else if( pl.type.is_empty_list( expr ) ) {
			return {
				value: new Term("true", []),
				variable: last,
				error: false
			};
		} else if( pl.type.is_list( expr ) ) {
			free = thread.next_free_variable();
			var pointer = expr;
			var prev;
			while( pointer.indicator === "./2" ) {
				prev = pointer;
				pointer = pointer.args[1];
			}
			if( pl.type.is_variable( pointer ) ) {
				return {
					value: pl.error.instantiation("DCG/0"),
					variable: last,
					error: true
				};
			} else if( !pl.type.is_empty_list( pointer ) ) {
				return {
					value: pl.error.type("list", expr, "DCG/0"),
					variable: last,
					error: true
				};
			} else {
				prev.args[1] = free;
				return {
					value: new Term("=", [last, expr]),
					variable: free,
					error: false
				};
			}
		} else if( pl.type.is_callable( expr ) ) {
			free = thread.next_free_variable();
			expr = new Term( expr.id, expr.args.concat([last,free]) );
			return {
				value: expr,
				variable: free,
				error: false
			};
		} else {
			return {
				value: pl.error.type( "callable", expr, "DCG/0" ),
				variable: last,
				error: true
			};
		}
	}
	
	// Body conversion
	function body_conversion( expr ) {
		if( pl.type.is_variable( expr ) )
			return new Term( "call", [expr] );
		else if( pl.type.is_term( expr ) && [",/2", ";/2", "->/2"].indexOf(expr.indicator) !== -1 )
			return new Term( expr.id, [body_conversion( expr.args[0] ), body_conversion( expr.args[1] )] );
		else if( pl.type.is_term(expr) && expr.indicator === ":/2" ) {
			var body = body_conversion(expr.args[1]);
			return new Term(":", [expr.args[0], body]);
		}
		return expr;
	}
	
	// List to Prolog list
	function arrayToList( array, cons ) {
		var list = cons ? cons : new Term( "[]", [] );
		for(var i = array.length-1; i >= 0; i-- )
			list = new Term( ".", [array[i], list] );
		return list;
	}
	
	// Remove element from array
	function remove( array, element ) {
		for( var i = array.length - 1; i >= 0; i-- ) {
			if( array[i] === element ) {
				array.splice(i, 1);
			}
		}
	}
	
	// Remove duplicate elements
	function nub( array ) {
		var seen = {};
		var unique = [];
		for( var i = 0; i < array.length; i++ ) {
			if( !(array[i] in seen) ) {
				unique.push( array[i] );
				seen[array[i]] = true;
			}
		}
		return unique;
	}

	// Retract a rule
	function retract(thread, point, indicator, rule, get_module) {
		if(get_module.rules[indicator]) {
			for(var i = 0; i < get_module.rules[indicator].length; i++) {
				if(get_module.rules[indicator][i] === rule) {
					get_module.rules[indicator].splice(i, 1);
					thread.success( point );
					break;
				}
			}
		}
	}
	
	// call/n
	function callN(n) {
		return function(thread, point, atom) {
			var closure = atom.args[0], args = atom.args.slice(1, n);
			var module_atom;
			if(pl.type.is_term(closure) && closure.indicator === ":/2") {
				if(!pl.type.is_atom(closure.args[0])) {
					thread.throw_error(pl.error.type("module", closure.args[0], atom.indicator));
					return;
				}
				module_atom = closure.args[0];
				closure = closure.args[1];
			}
			if(pl.type.is_variable(closure)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(closure)) {
				thread.throw_error(pl.error.type("callable", closure, atom.indicator));
			} else {
				var goal = body_conversion(new Term(closure.id, closure.args.concat(args)));
				if(!pl.type.is_callable(goal)) {
					thread.throw_error(pl.error.type("callable", goal, atom.indicator));
					return;
				}
				if(module_atom)
					goal = new Term(":", [module_atom, goal]);
				thread.prepend([new State(point.goal.replace(goal), point.substitution, point)]);
			}
		};
	}
	
	// String to indicator
	function str_indicator( str ) {
		for( var i = str.length - 1; i >= 0; i-- )
			if( str.charAt(i) === "/" )
				return new Term( "/", [new Term( str.substring(0, i) ), new Num( parseInt(str.substring(i+1)), false )] );
	}

	// Greatest common divisor
	function gcd(a, b) {
		if(b === 0)
			return a;
		return Math.abs(gcd(b, a % b));
	}
	
	

	// PROLOG OBJECTS
	
	// Variables
	function Var( id ) {
		this.id = id;
	}
	
	// Numbers
	function Num( value, is_float ) {
		this.is_float = is_float !== undefined ? is_float : parseInt( value ) !== value;
		this.value = this.is_float ? value : parseInt( value );
	}
	
	// Terms
	var term_ref = 0;
	function Term( id, args, ref ) {
		term_ref++;
		this.ref = ref || term_ref;
		this.id = id;
		this.args = args || [];
		this.indicator = id + "/" + this.args.length;
	}

	// Streams
	var stream_ref = 0;
	function Stream( stream, mode, alias, type, reposition, eof_action ) {
		this.id = stream_ref++;
		this.stream = stream;
		this.mode = mode; // "read" or "write" or "append"
		this.alias = alias;
		this.type = type !== undefined ? type : "text"; // "text" or "binary"
		this.reposition = reposition !== undefined ? reposition : true; // true or false
		this.eof_action = eof_action !== undefined ? eof_action : "eof_code"; // "error" or "eof_code" or "reset"
		this.position = this.mode === "append" ? "end_of_stream" : 0;
		this.output = this.mode === "write" || this.mode === "append";
		this.input = this.mode === "read";
		this.line_position = 0;
		this.line_count = 1;
		this.char_count = 0;
	}
	
	// Substitutions
	function Substitution( links, attrs ) {
		links = links || {};
		attrs = attrs || {};
		this.links = links;
		this.attrs = attrs;
	}
	
	// States
	function State( goal, subs, parent ) {
		subs = subs || new Substitution();
		parent = parent || null;
		this.goal = goal;
		this.substitution = subs;
		this.parent = parent;
	}
	
	// Rules
	function Rule( head, body, dynamic ) {
		this.head = head;
		this.body = body;
		this.dynamic = dynamic ? dynamic : false;
	}

	// Session
	function Session( limit ) {
		limit = limit === undefined || limit <= 0 ? 1000 : limit;
		this.rename = 0;
		this.modules = {};
		this.modules.user = new Module("user", {}, "all", {
			session: this,
			dependencies: ["system"]
		});
		this.modules.system = pl.modules.system;
		this.rules = this.modules.user.rules;
		this.total_threads = 0;
		this.renamed_variables = {};
		this.public_predicates = this.modules.user.public_predicates;
		this.multifile_predicates = this.modules.user.multifile_predicates;
		this.limit = limit;
		this.streams = {
			"user_input": new Stream(
				nodejs_flag ? nodejs_user_input : tau_user_input,
				"read", "user_input", "text", false, "reset" ),
			"user_output": new Stream(
				nodejs_flag ? nodejs_user_output : tau_user_output,
				"append", "user_output", "text", false, "reset" ),
			"user_error": new Stream(
				nodejs_flag ? nodejs_user_error : tau_user_error,
				"append", "user_error", "text", false, "reset" ),
		};
		this.file_system = nodejs_flag ? nodejs_file_system : tau_file_system;
		this.standard_input = this.streams["user_input"];
		this.standard_output = this.streams["user_output"];
		this.standard_error = this.streams["user_error"];
		this.current_input = this.streams["user_input"];
		this.current_output = this.streams["user_output"];
		this.working_directory = "/"; // only for browser
		this.format_success = function( state ) { return state.substitution; };
		this.format_error = function( state ) { return state.goal; };
		this.flag = {	
			bounded: pl.flag.bounded.value,
			max_integer: pl.flag.max_integer.value,
			min_integer: pl.flag.min_integer.value,
			integer_rounding_function: pl.flag.integer_rounding_function.value,
			char_conversion: pl.flag.char_conversion.value,
			debug: pl.flag.debug.value,
			max_arity: pl.flag.max_arity.value,
			unknown: pl.flag.unknown.value,
			double_quotes: pl.flag.double_quotes.value,
			occurs_check: pl.flag.occurs_check.value,
			dialect: pl.flag.dialect.value,
			version_data: pl.flag.version_data.value,
			nodejs: pl.flag.nodejs.value,
			argv: pl.flag.argv.value
		};
		this.__loaded_modules = [];
		this.__char_conversion = {};
		this.__operators = {
			1200: { ":-": ["fx", "xfx"],  "-->": ["xfx"], "?-": ["fx"] },
			1150: { "meta_predicate": ["fx"] },
			1100: { ";": ["xfy"] },
			1050: { "->": ["xfy"] },
			1000: { ",": ["xfy"] },
			900: { "\\+": ["fy"] },
			700: {
				"=": ["xfx"], "\\=": ["xfx"], "==": ["xfx"], "\\==": ["xfx"],
				"@<": ["xfx"], "@=<": ["xfx"], "@>": ["xfx"], "@>=": ["xfx"],
				"=..": ["xfx"], "is": ["xfx"], "=:=": ["xfx"], "=\\=": ["xfx"],
				"<": ["xfx"], "=<": ["xfx"], ">": ["xfx"], ">=": ["xfx"]
			},
			600: { ":": ["xfy"] },
			500: { "+": ["yfx"], "-": ["yfx"], "/\\": ["yfx"], "\\/": ["yfx"] },
			400: {
				"*": ["yfx"], "/": ["yfx"], "//": ["yfx"], "rem": ["yfx"],
				"mod": ["yfx"], "<<": ["yfx"], ">>": ["yfx"], "div": ["yfx"]
			},
			200: { "**": ["xfx"], "^": ["xfy"], "-": ["fy"], "+": ["fy"], "\\": ["fy"] }
		};
		this.thread = new Thread( this );
	}
	
	// Threads
	function Thread( session ) {
		this.epoch = Date.now();
		this.session = session;
		this.session.total_threads++;
		this.format_success = session.format_success;
		this.format_error = session.format_error;
		this.total_steps = 0;
		this.cpu_time = 0;
		this.cpu_time_last = 0;
		this.points = [];
		this.debugger = false;
		this.debugger_states = [];
		this.level = new Term("top_level");
		this.current_limit = this.session.limit;
		this.warnings = [];
		this.__calls = [];
		this.__goal_expansion = false;
	}
	
	// Modules
	function Module(id, rules, exports, options) {
		options = options === undefined ? {} : options;
		options.public_predicates = options.public_predicates === undefined ? {} : options.public_predicates;
		options.multifile_predicates = options.multifile_predicates === undefined ? {} : options.multifile_predicates;
		options.meta_predicates = options.meta_predicates === undefined ? {} : options.meta_predicates;
		options.session = options.session === undefined ? null : options.session;
		options.dependencies = options.dependencies === undefined ? [] : options.dependencies;
		this.id = id;
		this.rules = rules;
		this.public_predicates = options.public_predicates;
		this.multifile_predicates = options.multifile_predicates;
		this.meta_predicates = options.meta_predicates;
		this.src_predicates = {};
		this.dependencies = options.dependencies;
		this.exports = exports;
		this.is_library = options.session === null;
		this.modules = {};
		if(options.session) {
			options.session.modules[id] = this;
			for(var i = 0; i < options.dependencies.length; i++) {
				var lib = options.dependencies[i];
				if(!options.session.modules.hasOwnProperty(lib))
					options.session.modules[lib] = pl.modules[lib];
			}
		} else {
			pl.modules[id] = this;
		}
		if(exports !== "all") {
			for(var i = 0; i < exports.length; i++) {
				this.public_predicates[exports[i]] =
					options.public_predicates.hasOwnProperty(exports[i]) &&
					options.public_predicates[exports[i]] === true;
			}
		}
	}
	
	// Check if a predicate is exported
	Module.prototype.exports_predicate = function(indicator) {
		return this.exports === "all" || indexOf(this.exports, indicator) !== -1;
	};

	// Check if a predicate is public
	Module.prototype.is_public_predicate = function(indicator) {
		return !this.public_predicates.hasOwnProperty(indicator) || this.public_predicates[indicator] === true;
	};
	
	// Check if a predicate is multifile
	Module.prototype.is_multifile_predicate = function( indicator ) {
		return this.multifile_predicates.hasOwnProperty(indicator) && this.multifile_predicates[indicator] === true;
	};

	// Check if a predicate is a meta-predicate
	Module.prototype.is_meta_predicate = function( indicator ) {
		if(this.meta_predicates.hasOwnProperty(indicator))
			return this.meta_predicates[indicator];
		return null;
	};



	// UNIFY PROLOG OBJECTS
	
	// Variables
	Var.prototype.unify = function( obj, occurs_check ) {
		if( occurs_check && indexOf( obj.variables(), this.id ) !== -1 && !pl.type.is_variable( obj ) ) {
			return null;
		}
		var links = {};
		links[this.id] = obj;
		return new Substitution( links );
	};
	
	// Numbers
	Num.prototype.unify = function( obj, _ ) {
		if( pl.type.is_number( obj ) && this.value === obj.value && this.is_float === obj.is_float ) {
			return new Substitution();
		}
		return null;
	};
	
	// Terms
	Term.prototype.unify = function( obj, occurs_check ) {
		if( pl.type.is_term( obj ) && this.indicator === obj.indicator ) {
			var subs = new Substitution();
			for( var i = 0; i < this.args.length; i++ ) {
				var mgu = pl.unify( this.args[i].apply( subs ), obj.args[i].apply( subs ), occurs_check );
				if( mgu === null )
					return null;
				for( var x in mgu.links )
					subs.links[x] = mgu.links[x];
				subs = subs.apply( mgu );
			}
			return subs;
		}
		return null;
	};

	// Streams
	Stream.prototype.unify = function( obj, occurs_check ) {
		if( pl.type.is_stream( obj ) && this.id === obj.id ) {
			return new Substitution();
		}
		return null;
	};
	
	

	// PROLOG OBJECTS TO STRING
	
	// Variables
	Var.prototype.toString = function( _ ) {
		return this.id;
	};
	
	// Numbers
	Num.prototype.toString = function( _ ) {
		var str = this.value.toString();
		var e = str.indexOf("e");
		if(e !== -1) {
			if(str.indexOf(".") !== -1)
				return str
			else
				return str.replace("e", ".0e");
		}
		return this.is_float && indexOf(str, ".") === -1 ? this.value + ".0" : str;
	};
	
	// Terms
	Term.prototype.toString = function( options, priority, from ) {
		options = !options ? {} : options;
		options.quoted = options.quoted === undefined ? false: options.quoted;
		options.ignore_ops = options.ignore_ops === undefined ? false : options.ignore_ops;
		options.numbervars = options.numbervars === undefined ? false : options.numbervars;
		priority = priority === undefined ? {priority: 1200, class: "", indicator: ""} : priority;
		from = from === undefined ? "" : from;
		var arg_priority = {priority: 999, class: "", indicator: ""};
		if( options.numbervars && this.indicator === "$VAR/1" && pl.type.is_integer( this.args[0] ) && this.args[0].value >= 0 ) {
			var i = this.args[0].value;
			var number = Math.floor( i/26 );
			var letter =  i % 26;
			return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[letter] + (number !== 0 ? number : "");
		}
		switch( this.indicator ){
			case "[]/0":
			case "{}/0":
			case "!/0":
				return this.id;
			case "{}/1":
				return "{" + this.args[0].toString( options ) + "}";
			case "./2":
				if( options.ignore_ops === false ) {
					var list = "[" + this.args[0].toString( options, arg_priority );
					var pointer = this.args[1];
					while( pointer.indicator === "./2" ) {
						list += "," + pointer.args[0].toString( options, arg_priority );
						pointer = pointer.args[1];
					}
					if( pointer.indicator !== "[]/0" ) {
						list += "|" + pointer.toString( options, arg_priority );
					}
					list += "]";
					return list;
				}
			default:
				var id = this.id;
				var operator = options.session ? options.session.lookup_operator( this.id, this.args.length ) : null;
				if( options.session === undefined || options.ignore_ops || operator === null ) {
					if( options.quoted && (! /^(!|[a-z][0-9a-zA-Z_]*|[#\$\&\*\+\-\.\/\:\<\=\>\?\@\^\~\\]+)$/.test( id ) && id !== "{}" && id !== "[]" || indexOf([".",",",";"], id) !== -1 ) )
						id = "'" + redoEscape(id) + "'";
					if( this.args.length === 0 && is_graphic_token(this.id) && priority.indicator !== "")
						return "(" + id + ")";
					return id + (this.args.length > 0 ? "(" + map( this.args,
						function(x) { return x.toString(options, arg_priority); }
					).join(",") + ")" : "");
				} else {
					var priority_op = parseInt(operator.priority);
					var priority_arg = parseInt(priority.priority);
					var cond = priority_op > priority_arg || priority_op === priority_arg && (
						operator.class === "xfx" ||
						operator.class === "xfy" && this.indicator !== priority.indicator ||
						operator.class === "yfx" && this.indicator !== priority.indicator ||
						this.indicator === priority.indicator && operator.class === "yfx" && from === "right" ||
						this.indicator === priority.indicator && operator.class === "xfy" && from === "left" ||
						this.indicator === priority.indicator && operator.class === "xf" && from === "left" ||
						this.indicator === priority.indicator && operator.class === "fx" && from === "right");
					operator.indicator = this.indicator;
					var lpar = cond ? "(" : "";
					var rpar = cond ? ")" : "";
					var space = !(is_graphic_token(this.id) || this.id === "," || this.id === ";")
						|| operator.class.length === 2
						|| operator.class.length === 3 && pl.type.is_number(this.args[1]) && this.args[1].value < 0 ? " " : "";
					if( this.args.length === 0 ) {
						return lpar + this.id + rpar;
					} else if( ["fy","fx"].indexOf( operator.class) !== -1 ) {
						return lpar + id + space + this.args[0].toString( options, operator, "right" ) + rpar;
					} else if( ["yf","xf"].indexOf( operator.class) !== -1 ) {
						return lpar + this.args[0].toString( options, operator, "left" ) + space + id + rpar;
					} else {
						return lpar + this.args[0].toString( options, operator, "left" ) + space + this.id + space + this.args[1].toString( options, operator, "right" ) +  rpar;
					}
				}
		}
	};

	// Streams
	Stream.prototype.toString = function( _ ) {
		return "<stream>(" + this.id + ")";
	};
	
	// Substitutions
	Substitution.prototype.toString = function( options ) {
		var str = "{";
		for( var link in this.links ) {
			if(!this.links.hasOwnProperty(link)) continue;
			if( str !== "{" ) {
				str += ", ";
			}
			str += link + "/" + this.links[link].toString( options );
		}
		str += "}";
		return str;
	};
	
	// States
	State.prototype.toString = function( options ) {
		if( this.goal === null ) {
			return "<" + this.substitution.toString( options ) + ">";
		} else {
			return "<" + this.goal.toString( options ) + ", " + this.substitution.toString( options ) + ">";
		}
	};
	
	// Rules
	Rule.prototype.toString = function( options ) {
		if( !this.body ) {
			return this.head.toString( options ) + ".";
		} else {
			return this.head.toString( options, 1200, "left" ) + " :- " + this.body.toString( options, 1200, "right" ) + ".";
		}
	};
	
	// Session
	Session.prototype.toString = function( options ) {
		var str = "";
		for(var prop in this.modules) {
			if(this.modules.hasOwnProperty(prop) && this.modules[prop].is_library)
				str += ":- use_module(library(" + this.modules[prop] + ")).\n";
		}
		str += "\n";
		for(var key in this.modules.user.rules) {
			if(!this.modules.user.rules.hasOwnProperty(key)) continue;
			for(i = 0; i < this.modules.user.rules[key].length; i++) {
				str += this.modules.user.rules[key][i].toString(options);
				str += "\n";
			}
		}
		return str;
	};
	
	
	
	// CLONE PROLOG OBJECTS
	
	// Variables
	Var.prototype.clone = function() {
		return new Var( this.id );
	};
	
	// Numbers
	Num.prototype.clone = function() {
		return new Num( this.value, this.is_float );
	};
	
	// Terms
	Term.prototype.clone = function() {
		var term = new Term( this.id, map( this.args, function( arg ) {
			return arg.clone();
		} ) );
		if(this.definition_module)
			term.definition_module = this.definition_module;
		return term;
	};

	// Streams
	Stream.prototype.clone = function() {
		return new Stream( this.stream, this.mode, this.alias, this.type, this.reposition, this.eof_action );
	};
	
	// Substitutions
	Substitution.prototype.clone = function() {
		var links = {};
		var attrs = {};
		for( var link in this.links ) {
			if(!this.links.hasOwnProperty(link)) continue;
			links[link] = this.links[link].clone();
		}
		for( var attr in this.attrs ) {
			if(!this.attrs.hasOwnProperty(attrs)) continue;
			attrs[attr] = {};
			for( var m in this.attrs[attr] ) {
				if(!this.attrs[attr].hasOwnProperty(m)) continue;
				attrs[attr][m] = this.attrs[attr][m].clone();
			}
		}
		return new Substitution( links, attrs );
	};
	
	// States
	State.prototype.clone = function() {
		return new State( this.goal.clone(), this.substitution.clone(), this.parent );
	};
	
	// Rules
	Rule.prototype.clone = function() {
		return new Rule( this.head.clone(), this.body !== null ? this.body.clone() : null );
	};
	
	
	
	// COMPARE PROLOG OBJECTS
	
	// Variables
	Var.prototype.equals = function( obj ) {
		return pl.type.is_variable( obj ) && this.id === obj.id;
	};
	
	// Numbers
	Num.prototype.equals = function( obj ) {
		return pl.type.is_number( obj ) && this.value === obj.value && this.is_float === obj.is_float;
	};
	
	// Terms
	Term.prototype.equals = function( obj ) {
		if( !pl.type.is_term( obj ) || this.indicator !== obj.indicator ) {
			return false;
		}
		for( var i = 0; i < this.args.length; i++ ) {
			if( !this.args[i].equals( obj.args[i] ) ) {
				return false;
			}
		}
		return true;
	};

	// Streams
	Stream.prototype.equals = function( obj ) {
		return pl.type.is_stream( obj ) && this.id === obj.id;
	};
	
	// Substitutions
	Substitution.prototype.equals = function( obj ) {
	var link;
		if( !pl.type.is_substitution( obj ) ) {
			return false;
		}
		for( link in this.links ) {
			if(!this.links.hasOwnProperty(link)) continue;
			if( !obj.links[link] || !this.links[link].equals( obj.links[link] ) ) {
				return false;
			}
		}
		for( link in obj.links ) {
			if(!obj.links.hasOwnProperty(link)) continue;
			if( !this.links[link] ) {
				return false;
			}
		}
		return true;
	};
	
	// States
	State.prototype.equals = function( obj ) {
		return pl.type.is_state( obj ) && this.goal.equals( obj.goal ) && this.substitution.equals( obj.substitution ) && this.parent === obj.parent;
	};
	
	// Rules
	Rule.prototype.equals = function( obj ) {
		return pl.type.is_rule( obj ) && this.head.equals( obj.head ) && (this.body === null && obj.body === null || this.body !== null && this.body.equals( obj.body ));
	};
	
	
	
	// RENAME VARIABLES OF PROLOG OBJECTS
	
	// Variables
	Var.prototype.rename = function( thread ) {
		return thread.get_free_variable( this );
	};
	
	// Numbers
	Num.prototype.rename = function( _ ) {
		return this;
	};
	
	// Terms
	Term.prototype.rename = function( thread ) {
		// atom
		/*if(this.args.length === 0)
			return this;*/
		// list
		if( this.indicator === "./2" ) {
			var arr = [], pointer = this;
			var last_neq = -1, pointer_neq = null, i = 0;
			while( pointer.indicator === "./2" ) {
				var app = pointer.args[0].rename(thread);
				var cmp = app == pointer.args[0];
				arr.push(app);
				pointer = pointer.args[1];
				if(!cmp) {
					last_neq = i;
					pointer_neq = pointer;
				}
				i++;
			}
			var list = pointer.rename(thread);
			var cmp = list == pointer;
			if(last_neq === -1 && cmp)
				return this;
			var start = cmp ? last_neq : arr.length-1;
			var list = cmp ? pointer_neq : list;
			for(var i = start; i >= 0; i--) {
				list = new Term( ".", [arr[i], list] );
			}
			return list;
		}
		// compound term
		var eq = true;
		var args = [];
		for(var i = 0; i < this.args.length; i++) {
			var app = this.args[i].rename(thread);
			eq = eq && this.args[i] == app;
			args.push(app);
		}
		/*if(eq)
			return this;*/
		return new Term(this.id, args);
	};

	// Streams
	Stream.prototype.rename = function( thread ) {
		return this;
	};
	
	// Rules
	Rule.prototype.rename = function( thread ) {
		return new Rule( this.head.rename( thread ), this.body !== null ? this.body.rename( thread ) : null );
	};



	// CHECK IF RENAME

	// Variables
	Var.prototype.is_rename = function(obj, links) {
		links = links || {};
		if(!pl.type.is_variable(obj)
		|| links.hasOwnProperty(this.id) && links[this.id] !== obj.id
		|| links.hasOwnProperty(obj.id) && links[obj.id] !== this.id)
			return false;
		links[this.id] = obj.id;
		links[obj.id] = this.id;
		return true;
	};
	
	// Numbers
	Num.prototype.is_rename = function(obj, _links) {
		return this.equals(obj);
	};
	
	// Terms
	Term.prototype.is_rename = function(obj, links) {
		links = links || {};
		if(!pl.type.is_term(obj) || this.indicator !== obj.indicator)
			return false;
		for(var i = 0; i < this.args.length; i++) {
			if(!pl.is_rename(this.args[i], obj.args[i], links))
				return false;
		}
		return true;
	};

	// Streams
	Stream.prototype.is_rename = function(obj, _links) {
		return this.equals(obj);
	};
	
	
	
	// GET ID OF VARIABLES FROM PROLOG OBJECTS
	
	// Variables
	Var.prototype.variables = function() {
		return [this.id];
	};
	
	// Numbers
	Num.prototype.variables = function() {
		return [];
	};
	
	// Terms
	Term.prototype.variables = function() {
		return [].concat.apply( [], map( this.args, function( arg ) {
			return arg.variables();
		} ) );
	};

	// Streams
	Stream.prototype.variables = function() {
		return [];
	};
	
	// Rules
	Rule.prototype.variables = function() {
		if( this.body === null ) {
			return this.head.variables();
		} else {
			return this.head.variables().concat( this.body.variables() );
		}
	};
	
	
	
	// APPLY SUBSTITUTIONS TO PROLOG OBJECTS
	
	// Variables
	Var.prototype.apply = function( subs ) {
		if( subs.lookup( this.id ) ) {
			return subs.lookup( this.id );
		}
		return this;
	};
	
	// Numbers
	Num.prototype.apply = function( _ ) {
		return this;
	};
	
	// Terms
	Term.prototype.apply = function( subs ) {
		// atom
		if(this.args.length === 0)
			return this;
		// list
		if( this.indicator === "./2" ) {
			var arr = [], pointer = this;
			var last_neq = -1, pointer_neq = null, i = 0;
			while( pointer.indicator === "./2" ) {
				var app = pointer.args[0].apply(subs);
				var cmp = app == pointer.args[0];
				arr.push(app);
				pointer = pointer.args[1];
				if(!cmp) {
					last_neq = i;
					pointer_neq = pointer;
				}
				i++;
			}
			var list = pointer.apply(subs);
			var cmp = list == pointer;
			if(last_neq === -1 && cmp)
				return this;
			var start = cmp ? last_neq : arr.length-1;
			var list = cmp ? pointer_neq : list;
			for(var i = start; i >= 0; i--) {
				list = new Term( ".", [arr[i], list] );
			}
			return list;
		}
		// compound term
		var eq = true;
		var args = [];
		for(var i = 0; i < this.args.length; i++) {
			var app = this.args[i].apply(subs);
			eq = eq && this.args[i] == app;
			args.push(app);
		}
		if(eq)
			return this;
		return new Term(this.id, args, this.ref);
	};

	// Streams
	Stream.prototype.apply = function( _ ) {
		return this;
	};
	
	// Rules
	Rule.prototype.apply = function( subs ) {
		return new Rule( this.head.apply( subs ), this.body !== null ? this.body.apply( subs ) : null );
	};
	
	// Substitutions
	Substitution.prototype.apply = function( subs ) {
		var link, links = {}, attr, attrs = {}, m;
		for( link in this.links ) {
			if(!this.links.hasOwnProperty(link)) continue;
			links[link] = this.links[link].apply(subs);
		}
		for( attr in this.attrs ) {
			if(!this.attrs.hasOwnProperty(attr)) continue;
			attrs[attr] = {};
			for( m in this.attrs[attr] ) {
				if(!this.attrs[attr].hasOwnProperty(m)) continue;
				attrs[attr][m] = this.attrs[attr][m].apply(subs);
			}
		}
		return new Substitution( links, attrs );
	};
	
	
	
	// SELECTION FUNCTION
	
	// Select term
	Term.prototype.select = function() {
		var pointer = this;
		while(pl.type.is_term(pointer) && pointer.indicator === ",/2")
			pointer = pointer.args[0];
		return pointer;
	};
	
	// Replace term
	Term.prototype.replace = function( expr ) {
		if( this.indicator === ",/2" ) {
			if( this.args[0].indicator === ",/2" ) {
				return new Term( ",", [this.args[0].replace( expr ), this.args[1]] );
			} else {
				return expr === null ? this.args[1] : new Term( ",", [expr, this.args[1]] );
			}
		} else {
			return expr;
		}
	};

	// Search term
	Term.prototype.search = function( expr ) {
		if(this == expr || this.ref === expr.ref)
			return true;
		for( var i = 0; i < this.args.length; i++ )
			if( pl.type.is_term( this.args[i] ) && this.args[i].search( expr ) )
				return true;
		return false;
	};
	
	
	
	// PROLOG SESSIONS AND THREADS

	// Format answer
	Session.prototype.format_answer = function(answer, options) {
		return this.thread.format_answer(answer, options);
	};
	Thread.prototype.format_answer = function(answer, options) {
		return pl.format_answer(answer, this, options);
	};

	// Get current input
	Session.prototype.get_current_input = function() {
		return this.current_input;
	};
	Thread.prototype.get_current_input = function() {
		return this.session.get_current_input();
	};

	// Get current output
	Session.prototype.get_current_output = function() {
		return this.current_output;
	};
	Thread.prototype.get_current_output = function() {
		return this.session.get_current_output();
	};

	// Set current input
	Session.prototype.set_current_input = function( input ) {
		this.current_input = input;
	};
	Thread.prototype.set_current_input = function( input ) {
		return this.session.set_current_input( input );
	};

	// Set current output
	Session.prototype.set_current_output = function( output ) {
		this.current_output = output;
	};
	Thread.prototype.set_current_output = function( output ) {
		return this.session.set_current_output( output);
	};

	// Get stream by alias
	Session.prototype.get_stream_by_alias = function( alias ) {
		return this.streams[alias];
	};
	Thread.prototype.get_stream_by_alias = function( alias ) {
		return this.session.get_stream_by_alias( alias );
	};

	// Open file
	Session.prototype.file_system_open = function( path, type, mode ) {
		if(this.get_flag("nodejs").indicator === "false/0")
			path = this.absolute_file_name(path);
		return this.file_system.open( path, type, mode );
	};
	Thread.prototype.file_system_open = function( path, type, mode ) {
		return this.session.file_system_open( path, type, mode );
	};

	// Absolute file name
	Session.prototype.absolute_file_name = function(filename) {
		var absolute;
		// node.js
		if(this.get_flag("nodejs").indicator === "true/0") {
			var path = path$1;
			absolute = filename;
			for(var prop in process.env) {
				if(!process.env.hasOwnProperty(prop))
					continue;
				absolute = absolute.replace(new RegExp("\\$" + prop, "g"), process.env[prop]);
			}
			return path.resolve(absolute);
		// browser
		} else {
			var cwd = this.working_directory;
			if(filename[0] === "/")
				absolute = filename;
			else
				absolute = cwd + (cwd[cwd.length-1] === "/" ? filename : "/" + filename);
			absolute = absolute.replace(/\/\.\//g, "/");
			var dirs = absolute.split("/");
			var dirs2 = [];
			for(var i = 0; i < dirs.length; i++) {
				if(dirs[i] !== "..") {
					dirs2.push(dirs[i]);
				} else {
					if(dirs2.length !== 0)
						dirs2.pop();
				}
			}
			absolute = dirs2.join("/").replace(/\/\.$/, "/");
		}
        return absolute;
	};
	Thread.prototype.absolute_file_name = function(path, cwd) {
		return this.session.absolute_file_name(path, cwd);
	};

	// Get conversion of the char
	Session.prototype.get_char_conversion = function( char ) {
		return this.__char_conversion[char] || char;
	};
	Thread.prototype.get_char_conversion = function( char ) {
		return this.session.get_char_conversion( char );
	};
	
	// Parse an expression
	Session.prototype.parse = function( string ) {
		return this.thread.parse( string );
	};
	Thread.prototype.parse = function( string ) {
		var tokenizer = new Tokenizer( this );
		tokenizer.new_text( string );
		var tokens = tokenizer.get_tokens();
		if( tokens === null )
			return false;
		var expr = parseExpr(this, tokens, 0, this.__get_max_priority(), false);
		if( expr.len !== tokens.length )
			return false;
		return { value: expr.value, expr: expr, tokens: tokens };
	};
	
	// Get flag value
	Session.prototype.get_flag = function( flag ) {
		return this.flag[flag];
	};
	Thread.prototype.get_flag = function( flag ) {
		return this.session.get_flag( flag );
	};

	// Add a rule
	Session.prototype.add_rule = function(rule, options) {
		return this.thread.add_rule(rule, options);
	};
	Thread.prototype.add_rule = function(rule, options) {
		options = options ? options : {};
		options.from = options.from ? options.from : "$tau-js";
		var module_id, get_module;
		if(pl.type.is_term(rule.head) && rule.head.indicator === ":/2") {
			if(!pl.type.is_atom(rule.head.args[0])) {
				this.throw_warning(pl.error.type("module", rule.head.args[0], "top_level/0"));
				return;
			}
			module_id = rule.head.args[0].id;
			rule.head = rule.head.args[1];
		}
		if(module_id) {
			get_module = this.session.modules[module_id];
			if(!pl.type.is_module(get_module)) {
				get_module = new Module(module_id, {}, "all", {session: this.session});
				this.session.modules[module_id] = get_module;
			}
		} else {
			get_module = this.session.modules[options.context_module];
		}
		get_module.src_predicates[rule.head.indicator] = options.from;
		if(!get_module.rules.hasOwnProperty(rule.head.indicator)) {
			get_module.rules[rule.head.indicator] = [];
		}
		get_module.rules[rule.head.indicator].push(rule);
		if(!get_module.public_predicates.hasOwnProperty(rule.head.indicator))
			get_module.public_predicates[rule.head.indicator] = false;
		return true;
	};

	// Run a directive
	Session.prototype.run_directive = function(directive, options) {
		return this.thread.run_directive(directive, options);
	};
	Thread.prototype.run_directive = function(directive, options) {
		if(pl.type.is_directive(directive)) {
			if(pl.directive[directive.indicator])
				return pl.directive[directive.indicator](this, directive, options);
			else
				return pl.directive[directive.id + "/*"](this, directive, options);
		}
		return false;
	};
	
	// Get maximum priority of the operators
	Session.prototype.__get_max_priority = function() {
		return "1200";
	};
	Thread.prototype.__get_max_priority = function() {
		return this.session.__get_max_priority();
	};
	
	// Get next priority of the operators
	Session.prototype.__get_next_priority = function( priority ) {
		var max = 0;
		priority = parseInt( priority );
		for( var key in this.__operators ) {
			if( !this.__operators.hasOwnProperty(key) ) continue;
			var n = parseInt(key);
			if( n > max && n < priority ) max = n;
		}
		return max.toString();
	};
	Thread.prototype.__get_next_priority = function( priority ) {
		return this.session.__get_next_priority( priority );
	};
	
	// Get classes of an operator
	Session.prototype.__lookup_operator_classes = function( priority, operator ) {
		if( this.__operators.hasOwnProperty( priority ) && this.__operators[priority][operator] instanceof Array ) {
			return this.__operators[priority][operator]  || false;
		}
		return false;
	};
	Thread.prototype.__lookup_operator_classes = function( priority, operator ) {
		return this.session.__lookup_operator_classes( priority, operator );
	};

	// Get operator
	Session.prototype.lookup_operator = function( name, arity ) {
		for(var p in this.__operators)
			if(this.__operators[p][name])
				for(var i = 0; i < this.__operators[p][name].length; i++)
					if( this.__operators[p][name][i].length === arity+1 )
						return {priority: p, class: this.__operators[p][name][i]};
		return null;
	};
	Thread.prototype.lookup_operator = function( name, arity ) {
		return this.session.lookup_operator( name, arity );
	};
	
	// Throw a warning
	Session.prototype.throw_warning = function( warning ) {
		this.thread.throw_warning( warning );
	};
	Thread.prototype.throw_warning = function( warning ) {
		this.warnings.push( warning );
	};
	
	// Get warnings
	Session.prototype.get_warnings = function() {
		return this.thread.get_warnings();
	};
	Thread.prototype.get_warnings = function() {
		return this.warnings;
	};

	// Add a goal
	Session.prototype.add_goal = function( goal, unique ) {
		this.thread.add_goal( goal, unique );
	};
	Thread.prototype.add_goal = function( goal, unique, parent ) {
		parent = parent ? parent : null;
		if( unique === true )
			this.points = [];
		var vars = goal.variables();
		var links = {};
		for( var i = 0; i < vars.length; i++ )
			links[vars[i]] = new Var(vars[i]);
		this.points.push( new State( goal, new Substitution(links), parent ) );
	};

	// Consult a program from a string
	Session.prototype.consult = function(program, options) {
		return this.thread.consult(program, options);
	};
	Thread.prototype.consult = function(program, options) {
		var string = "", success = false;
		var opts = {};
		var callback = typeof options === "function" ? options : callback;
		options = options === undefined || typeof options === "function" ? {} : options;
		opts.context_module = options.context_module === undefined ? "user" : options.context_module;
		opts.text = options.text === undefined ? true : options.text;
		opts.html = options.html === undefined ? true : options.html;
		opts.url = options.url === undefined ? true : options.url;
		opts.file = options.file === undefined ? true : options.file;
		opts.script = options.script === undefined ? true : options.script;
		opts.success = options.success === undefined ? callback : options.success;
		opts.error = options.error === undefined ? callback : options.error;
		// string
		if(typeof program === "string") {
			string = program;
			// script id
			if(opts.script && this.get_flag("nodejs").indicator === "false/0" && program != "" && document.getElementById(string)) {
				var script = document.getElementById(string);
				var type = script.getAttribute("type");
				if(type !== null && type.replace(/ /g, "").toLowerCase() === "text/prolog") {
					string = script.text;
					success = true;
				}
			}
			// file (node.js)
			if(!success && opts.file && this.get_flag("nodejs").indicator === "true/0") {
				var fs = require$$0;
				var thread = this;
				fs.readFile(program, function(error, data) {
					if(error) {
						opts.file = false;
						thread.consult(program, opts);
					} else {
						parseProgram(thread, data.toString(), opts);
					}
				});
				return;
			}
			// http request
			if(!success && this.get_flag("nodejs").indicator === "false/0" && opts.url && program !== "" && !(/\s/.test(program))) {
				try {
					var xhttp = new XMLHttpRequest();
					var thread = this;
					xhttp.onreadystatechange = function() {
						if(this.readyState == 4) {
							if(this.status == 200) {
								string = xhttp.responseText;
								success = true;
								parseProgram(thread, string, opts);
							} else {
								opts.url = false;
								thread.consult(program, opts);
							}
						}
					};
					xhttp.open("GET", program, true);
					xhttp.send();
					return;
				} catch(ex) {
					opts.error(ex);
					return;
				}
			}
			// text
			if(!success && opts.text) {
				success = true;
			}
		// html
		} else if(opts.html && program.nodeName) {
			switch(program.nodeName.toLowerCase()) {
				case "input":
				case "textarea":
					string = program.value;
					success = true;
					break;
				default:
					string = program.innerHTML;
					success = true;
					break;
			}
		} else {
			opts.error(pl.error.existence("source_sink", new Term(string), "top_level/0"));
		}
		this.warnings = [];
		parseProgram(this, string, opts);
	};

	// Query goal from a string (without ?-)
	Session.prototype.query = function(string, options) {
		return this.thread.query(string, options);
	};
	Thread.prototype.query = function(string, options) {
		this.points = [];
		this.debugger_states = [];
		this.level = new Term("top_level");
		return parseQuery(this, string, options);
	};
	
	// Get first choice point
	Session.prototype.head_point = function() {
		return this.thread.head_point();
	};
	Thread.prototype.head_point = function() {
		return this.points[this.points.length-1];
	};
	
	// Get free variable
	Session.prototype.get_free_variable = function( variable ) {
		return this.thread.get_free_variable( variable );
	};
	Thread.prototype.get_free_variable = function( variable ) {
		var variables = [];
		if( variable.id === "_" || this.session.renamed_variables[variable.id] === undefined ) {
			this.session.rename++;
			if( this.current_point )
				variables = this.current_point.substitution.domain();
			while( indexOf( variables, pl.format_variable( this.session.rename, variable.id ) ) !== -1 ) {
				this.session.rename++;
			}
			if( variable.id === "_" ) {
				return new Var( pl.format_variable( this.session.rename, variable.id ) );
			} else {
				this.session.renamed_variables[variable.id] = pl.format_variable( this.session.rename, variable.id );
			}
		}
		return new Var( this.session.renamed_variables[variable.id] );
	};
	
	// Get next free variable
	Session.prototype.next_free_variable = function() {
		return this.thread.next_free_variable();
	};
	Thread.prototype.next_free_variable = function() {
		this.session.rename++;
		var variables = [];
		if( this.current_point )
			variables = this.current_point.substitution.domain();
		while( indexOf( variables, pl.format_variable( this.session.rename ) ) !== -1 ) {
			this.session.rename++;
		}
		return new Var( pl.format_variable( this.session.rename ) );
	};
	
	// Check if a predicate is public
	Session.prototype.is_public_predicate = function(indicator, module_id) {
		module_id = module_id === undefined ? "user" : module_id;
		return pl.type.is_module(this.modules[module_id]) && this.modules[module_id].is_public_predicate(indicator);
	};
	Thread.prototype.is_public_predicate = function(indicator, module_id) {
		return this.session.is_public_predicate(indicator, module_id);
	};
	
	// Check if a predicate is multifile
	Session.prototype.is_multifile_predicate = function(indicator, module_id) {
		module_id = module_id === undefined ? "user" : module_id;
		return pl.type.is_module(this.modules[module_id]) && this.modules[module_id].is_multifile_predicate(indicator);
	};
	Thread.prototype.is_multifile_predicate = function(indicator, module_id) {
		return this.session.is_multifile_predicate(indicator, module_id);
	};

	// Check if a predicate is a meta-predicate
	Session.prototype.is_meta_predicate = function(indicator, module_id) {
		module_id = module_id === undefined ? "user" : module_id;
		if(pl.type.is_module(this.modules[module_id]))
			return this.modules[module_id].is_meta_predicate(indicator);
		return null;
	};
	Thread.prototype.is_meta_predicate = function(indicator, module_id) {
		return this.session.is_meta_predicate(indicator, module_id);
	};
	
	// Insert states at the beginning
	Session.prototype.prepend = function( states ) {
		return this.thread.prepend( states );
	};
	Thread.prototype.prepend = function( states ) {
		for(var i = states.length-1; i >= 0; i--)
			this.points.push( states[i] );
	};
	
	// Remove the selected term and prepend the current state
	Session.prototype.success = function( point, parent ) {
		return this.thread.success( point, parent );
	};
	Thread.prototype.success = function( point, parent ) {
		var parent = typeof parent === "undefined" ? point : parent;
		this.prepend( [new State( point.goal.replace( null ), point.substitution, parent ) ] );
	};
	
	// Throw error
	Session.prototype.throw_error = function(error) {
		return this.thread.throw_error(error);
	};
	Thread.prototype.throw_error = function(error) {
		if(pl.type.is_variable(error))
			error = pl.error.instantiation(this.level.indicator);
		var state = new State(
			new Term("throw", [error]),
			new Substitution(),
			null
		);
		state.error = true;
		this.prepend([state]);
	};
	
	// Get the module of a predicate
	Session.prototype.lookup_module = function(atom, context_module) {
		return this.thread.lookup_module(atom, context_module);
	};
	Thread.prototype.lookup_module = function(atom, context_module) {
		var get_module = this.session.modules[context_module];
		if(!pl.type.is_module(get_module))
			get_module = this.session.modules.user;
		if(get_module.rules.hasOwnProperty(atom.indicator) && (
			get_module.exports_predicate(atom.indicator) ||
			get_module.rules.hasOwnProperty(this.level.indicator) ||
			context_module === get_module.id))
				return get_module;
		get_module.modules.system = pl.modules.system;
		get_module.modules.user = this.session.modules.user;
		for(var prop in get_module.modules) {
			if(!this.session.modules.hasOwnProperty(prop))
				continue;
			var get_module = this.session.modules[prop];
			if(get_module.rules.hasOwnProperty(atom.indicator) && (
				get_module.exports_predicate(atom.indicator) ||
				get_module.rules.hasOwnProperty(this.level.indicator) ||
				context_module === get_module.id))
					return get_module;
		}
		return null;
	};

	// Expand a meta-predicate
	Session.prototype.expand_meta_predicate = function(atom, definition_module, context_module) {
		return this.thread.expand_meta_predicate(atom, definition_module, context_module);
	};
	Thread.prototype.expand_meta_predicate = function(atom, definition_module, context_module) {
		var get_module = this.session.modules[definition_module];
		if(!get_module)
			return;
		var meta = get_module.is_meta_predicate(atom.indicator);
		if(!meta)
			return;
		for(var i = 0; i < meta.args.length; i++) {
			if(pl.type.is_integer(meta.args[i]) || pl.type.is_atom(meta.args[i]) && indexOf([":"], meta.args[i].id) !== -1) {
				if(!pl.type.is_term(atom.args[i]) || atom.args[i].indicator !== ":/2") {
					atom.args[i] = new Term(":", [new Term(context_module), atom.args[i]]);
				}
			} else if(pl.type.is_atom(meta.args[i]) && meta.args[i].id === "^") {
				var pointer_last = atom;
				var pointer_index = i;
				var pointer = atom.args[i];
				while(pl.type.is_term(pointer) && pointer.indicator === "^/2") {
					pointer_last = pointer;
					pointer_index = 1;
					pointer = pointer.args[1];
				}
				if(!pl.type.is_term(pointer) || pointer.indicator !== ":/2") {
					pointer_last.args[pointer_index] = new Term(":", [new Term(context_module), pointer]);
				}
			}
		}
	};
	
	// Resolution step
	Session.prototype.step = function() {
		return this.thread.step();
	};
	Thread.prototype.step = function() {
		if(this.points.length === 0) {
			return;
		}
		var asyn = false;
		var point = this.points.pop();
		this.current_point = point;
		if(this.debugger)
			this.debugger_states.push(point);
		var atom = pl.type.is_term(point.goal) ? point.goal.select() : point.goal;
		if(pl.type.is_term(atom) && (atom.indicator !== ":/2" || pl.type.is_term(atom.args[1]))) {
			var context_module = null;
			var states = [];
			if(atom !== null) {
				this.total_steps++;
				var level = point;
				while(level.parent !== null && level.parent.goal.search(atom))
					level = level.parent;
				if(level.parent === null) {
					this.level = new Term("top_level");
				} else {
					this.level = level.parent.goal.select();
					if(this.level.indicator === ":/2")
						this.level = this.level.args[1];
				}
				if(pl.type.is_term(atom) && atom.indicator === ":/2") {
					context_module = atom.args[0];
					atom = atom.args[1];
					if(!pl.type.is_atom(context_module)) {
						this.throw_error(pl.error.type("module", context_module, this.level.indicator));
						return;
					}
					context_module = context_module.id;
				} else {
					if(this.level.definition_module) {
						context_module = this.level.definition_module;
					} else {
						context_module = "user";
					}
				}
				if(atom.indicator === ",/2") {
					this.prepend([new State(
						point.goal.replace(new Term(",", [
							new Term(":", [new Term(context_module), atom.args[0]]),
							new Term(":", [new Term(context_module), atom.args[1]])])),
						point.substitution,
						point
					)]);
					return;
				}
				this.__call_indicator = atom.indicator;
				var get_module = this.lookup_module(atom, context_module);
				atom.definition_module = pl.type.is_module(get_module) ? get_module.id : "user";
				this.expand_meta_predicate(atom, atom.definition_module, context_module);
				var get_rules = get_module === null ? null : get_module.rules[atom.indicator];
				if(get_rules === null) {
					if(!this.session.modules.user.rules.hasOwnProperty(atom.indicator)) {
						if(this.get_flag("unknown").id === "error") {
							this.throw_error( pl.error.existence( "procedure", atom.indicator, this.level.indicator));
						} else if(this.get_flag("unknown").id === "warning") {
							this.throw_warning("unknown procedure " + atom.indicator + " (from " + this.level.indicator + ")");
						}
					}
				} else if(get_rules instanceof Function) {
					asyn = get_rules(this, point, atom);
				} else {
					// Goal expansion
					if(this.__goal_expansion && atom.indicator === "goal_expansion/2")
						get_rules = get_rules.concat(pl.builtin.rules["goal_expansion/2"]);
					for(var _rule in get_rules) {
						if(!get_rules.hasOwnProperty(_rule))
							continue;
						var rule = get_rules[_rule];
						this.session.renamed_variables = {};
						rule = rule.rename( this );
						var occurs_check = this.get_flag("occurs_check").indicator === "true/0";
						var state = new State();
						var mgu = pl.unify( atom, rule.head, occurs_check );
						if(mgu !== null) {
							state.goal = point.goal.replace( rule.body );
							if( state.goal !== null ) {
								state.goal = state.goal.apply(mgu);
							}
							state.substitution = point.substitution.apply(mgu);
							state.parent = point;
							states.push( state );
						}
					}
					this.prepend(states);
				}
			}
		} else {
			var term = pl.type.is_term(atom) && atom.indicator === ":/2" ? atom.args[1] : atom;
			if(pl.type.is_variable(term))
				this.throw_error(pl.error.instantiation(this.level.indicator));
			else
				this.throw_error(pl.error.type("callable", term, this.level.indicator));
		}
		return asyn;
	};
	
	// Find next computed answer
	Session.prototype.answer = function(options) {
		return this.thread.answer(options);
	};
	Thread.prototype.answer = function(options) {
		var opts = {};
		options = options || function() {};
		if(typeof options === "function") {
			opts = {
				success: options,
				error: options,
				fail: options,
				limit: options
			};
		} else {
			opts.success = options.success === undefined ? function() {} : options.success;
			opts.error = options.error === undefined ? function() {} : options.error;
			opts.fail = options.fail === undefined ? function() {} : options.fail;
			opts.limit = options.limit === undefined ? function() {} : options.limit;
		}
		this.__calls.push(opts);
		if( this.__calls.length > 1 ) {
			return;
		}
		this.again();
	};
	
	// Find all computed answers
	Session.prototype.answers = function( callback, max, after ) {
		return this.thread.answers( callback, max, after );
	};
	Thread.prototype.answers = function( callback, max, after ) {
		var thread = this;
		if( max <= 0 ) {
			if(after)
				after();
			return;
		}
		this.answer( function( answer ) {
			callback( answer );
			if( answer !== false ) {
				setTimeout( function() {
					thread.answers( callback, max-1, after );
				}, 0 );
			} else if(after) {
				after();
			}
		} );
	};

	// Again finding next computed answer
	Session.prototype.again = function(reset_limit) {
		return this.thread.again(reset_limit);
	};
	Thread.prototype.again = function(reset_limit) {
		var t0 = Date.now();
		while(this.__calls.length > 0) {
			this.warnings = [];
			if(reset_limit !== false)
				this.current_limit = this.session.limit;
			while(this.current_limit > 0 && this.points.length > 0 && this.head_point().goal !== null && !pl.type.is_error_state(this.head_point())) {
				this.current_limit--;
				if(this.step() === true) {
					return;
				}
			}
			var t1 = Date.now();
			this.cpu_time_last = t1-t0;
			this.cpu_time += this.cpu_time_last;
			var options = this.__calls.shift();
			if(this.current_limit <= 0) {
				setTimeout(function() {
					options.limit(null);
				}, 0);
			} else if(this.points.length === 0) {
				setTimeout(function() {
					options.fail(false);
				}, 0);
			} else if(pl.type.is_error(this.head_point().goal)) {
				var answer = this.format_error(this.points.pop());
				this.points = [];
				(function(answer) {
					return setTimeout(function() {
						options.error(answer);
					}, 0);
				})(answer);
			} else {
				if(this.debugger)
					this.debugger_states.push(this.head_point());
				var answer = this.format_success(this.points.pop());
				(function(answer) {
					return setTimeout(function() {
						options.success(answer);
					}, 0);
				})(answer);
			}
		}
	};
	
	// Unfolding transformation
	Session.prototype.unfold = function( rule ) {
		if(rule.body === null)
			return false;
		var head = rule.head;
		var body = rule.body;
		var atom = body.select();
		var thread = new Thread( this );
		var unfolded = [];
		thread.add_goal( atom );
		thread.step();
		for( var i = thread.points.length-1; i >= 0; i-- ) {
			var point = thread.points[i];
			var head2 = head.apply( point.substitution );
			var body2 = body.replace( point.goal );
			if( body2 !== null )
				body2 = body2.apply( point.substitution );
			unfolded.push( new Rule( head2, body2 ) );
		}
		var rules = this.modules.user.rules[head.indicator];
		var index = indexOf( rules, rule );
		if( unfolded.length > 0 && index !== -1 ) {
			rules.splice.apply( rules, [index, 1].concat(unfolded) );
			return true;
		}
		return false;
	};
	Thread.prototype.unfold = function(rule) {
		return this.session.unfold(rule);
	};

	
	
	// INTERPRET EXPRESSIONS
	
	// Variables
	Var.prototype.interpret = function( thread ) {
		return pl.error.instantiation( thread.level.indicator );
	};
	
	// Numbers
	Num.prototype.interpret = function( thread ) {
		return this;
	};
	
	// Terms
	Term.prototype.interpret = function( thread ) {
		if( pl.type.is_unitary_list( this ) ) {
			return this.args[0].interpret( thread );
		} else {
			return pl.operate( thread, this );
		}
	};
	
	
	
	// COMPARE PROLOG OBJECTS
	
	// Variables
	Var.prototype.compare = function( obj ) {
		if( this.id < obj.id ) {
			return -1;
		} else if( this.id > obj.id ) {
			return 1;
		} else {
			return 0;
		}
	};
	
	// Numbers
	Num.prototype.compare = function( obj ) {
		if( this.value === obj.value && this.is_float === obj.is_float ) {
			return 0;
		} else if( this.value < obj.value || this.value === obj.value && this.is_float && !obj.is_float ) {
			return -1;
		} else if( this.value > obj.value ) {
			return 1;
		}
	};
	
	// Terms
	Term.prototype.compare = function( obj ) {
		if( this.args.length < obj.args.length || this.args.length === obj.args.length && this.id < obj.id ) {
			return -1;
		} else if( this.args.length > obj.args.length || this.args.length === obj.args.length && this.id > obj.id ) {
			return 1;
		} else {
			for( var i = 0; i < this.args.length; i++ ) {
				var arg = pl.compare( this.args[i], obj.args[i] );
				if( arg !== 0 ) {
					return arg;
				}
			}
			return 0;
		}
	};
	

	
	// SUBSTITUTIONS
	
	// Lookup variable
	Substitution.prototype.lookup = function( variable ) {
		if( this.links[variable] ) {
			return this.links[variable];
		} else {
			return null;
		}
	};
	
	// Filter variables
	Substitution.prototype.filter = function( predicate ) {
		var links = {};
		for( var id in this.links ) {
			if(!this.links.hasOwnProperty(id)) continue;
			var value = this.links[id];
			if( predicate( id, value ) ) {
				links[id] = value;
			}
		}
		return new Substitution( links, this.attrs );
	};
	
	// Exclude variables
	Substitution.prototype.exclude = function( variables ) {
		var links = {};
		for( var variable in this.links ) {
			if(!this.links.hasOwnProperty(variable)) continue;
			if( indexOf( variables, variable ) === -1 ) {
				links[variable] = this.links[variable];
			}
		}
		return new Substitution( links, this.attrs );
	};
	
	// Add link
	Substitution.prototype.add = function( variable, value ) {
		this.links[variable] = value;
	};
	
	// Get domain
	Substitution.prototype.domain = function( plain ) {
		var f = plain === true ? function(x){return x;} : function(x){return new Var(x);};
		var vars = [];
		for( var x in this.links )
			vars.push( f(x) );
		return vars;
	};

	// Get an attribute
	Substitution.prototype.get_attribute = function( variable, module ) {
		if( this.attrs[variable] )
			return this.attrs[variable][module];
	};

	// Set an attribute (in a new substitution)
	Substitution.prototype.set_attribute = function( variable, module, value ) {
		var subs = new Substitution( this.links );
		for( var v in this.attrs ) {
			if( v === variable ) {
				subs.attrs[v] = {};
				for( var m in this.attrs[v] ) {
					subs.attrs[v][m] = this.attrs[v][m];
				}
			} else {
				subs.attrs[v] = this.attrs[v];
			}
		}
		if( !subs.attrs[variable] ) {
			subs.attrs[variable] = {};
		}
		subs.attrs[variable][module] = value;
		return subs;
	};

	// Check if a variables has attributes
	Substitution.prototype.has_attributes = function( variable ) {
		return this.attrs[variable] && this.attrs[variable] !== {};
	};
	
	
	
	// GENERATE JAVASCRIPT CODE FROM PROLOG OBJECTS
	
	// Variables
	Var.prototype.compile = function() {
		return 'new pl.type.Var("' + this.id.toString() + '")';
	};
	
	// Numbers
	Num.prototype.compile = function() {
		return 'new pl.type.Num(' + this.value.toString() + ', ' + this.is_float.toString() + ')';
	};
	
	// Terms
	Term.prototype.compile = function() {
		return 'new pl.type.Term("' + this.id.replace(/"/g, '\\"') + '", [' + map( this.args, function( arg ) {
			return arg.compile();
		} ) + '])';
	};
	
	// Rules
	Rule.prototype.compile = function() {
		return 'new pl.type.Rule(' + this.head.compile() + ', ' + (this.body === null ? 'null' : this.body.compile()) + ')';
	};
	
	// Sessions
	Session.prototype.compile = function() {
		var str, obj = [], rules;
		for( var _indicator in this.modules.user.rules ) {
			if(!this.modules.user.rules.hasOwnProperty(_indicator)) continue;
			var indicator = this.modules.user.rules[_indicator];
			rules = [];
			str = "\"" + _indicator + "\": [";
			for(var i = 0; i < indicator.length; i++) {
				rules.push(indicator[i].compile());
			}
			str += rules.join();
			str += "]";
			obj.push( str );
		}
		return "{" + obj.join() + "};";
	};

	// Module
	Module.prototype.compile = function() {
		var length = 0;
		var dependencies = 0;
		var str = "var pl;\n";
		str += "(function(pl) {\n";
		// name
		str += "\tvar name = \"" + this.id + "\";\n";
		// predicates
		str += "\tvar predicates = function() {\n";
		str += "\t\treturn {\n";
		for(var prop in this.rules) {
			if(length > 0)
				str += ",\n";
			str += "\t\t\t\"" + prop + "\": ";
			if(typeof this.rules[prop] === "function") {
				str += this.rules[prop];
			} else {
				str += "[\n";
				for(var i = 0; i < this.rules[prop].length; i++) {
					str += "\t\t\t\t" + this.rules[prop][i].compile();
					if(i < this.rules[prop].length-1)
						str += ",";
					str += "\n";
				}
				str += "\t\t\t]";
			}
			length++;
		}
		str += "\n\t\t};\n";
		str += "\t};\n";
		// exports
		str += "\tvar exports = [";
		for(var i = 0; i < this.exports.length; i++) {
			if(i > 0)
				str += ", ";
			str += "\"" + this.exports[i] + "\"";
		}
		str += "];\n";
		// options
		str += "\tvar options = function() {\n";
		str += "\t\treturn {\n";
		// dependencies
		str += "\t\t\tdependencies: [";
		for(var prop in this.modules) {
			if(dependencies > 0)
				str += ", ";
			str += "\"" + prop + "\"";
			dependencies++;
		}
		str += "]\n";
		str += "\t\t};\n";
		str += "};\n";
		// fixed code
		str += "\tif(typeof module !== 'undefined') {\n";
		str += "\t\tmodule.exports = function(p) {\n";
		str += "\t\t\tpl = p;\n";
		str += "\t\t\tnew pl.type.Module(name, predicates(), exports, options());\n";
		str += "\t\t};\n";
		str += "\t} else {\n";
		str += "\t\tnew pl.type.Module(name, predicates(), exports, options());\n";
		str += "\t}\n";
		str += "})(pl);\n";
		return str;
	};
	
	
	
	// PROLOG TO JAVASCRIPT
	Var.prototype.toJavaScript = function() {
		return this.toString();
	};
	
	// Numbers
	Num.prototype.toJavaScript = function() {
		return this.value;
	};
	
	// Terms
	Term.prototype.toJavaScript = function(options) {
		// Atom => String
		if( this.args.length === 0 && this.indicator !== "[]/0" ) {
			return this.toString(options);
		} else if( pl.type.is_list( this ) ) {
			// List => Array
			var all_obj = true;
			var arr = [];
			var obj = {};
			var pointer = this;
			var value;
			while( pointer.indicator === "./2" ) {
				value = pointer.args[0].toJavaScript(options);
				arr.push( value );
				all_obj = all_obj && pl.type.is_term(pointer.args[0]) && pointer.args[0].indicator === "-/2" && pl.type.is_atom(pointer.args[0].args[0]);
				if(all_obj)
					obj[pointer.args[0].args[0].id] = pointer.args[0].args[1].toJavaScript(options);
				pointer = pointer.args[1];
			}
			if( pointer.indicator === "[]/0" )
				return all_obj && arr.length > 0 ? obj : arr;

		}
		return this.toString(options);
	};
	
	
	
	// RULES
	
	// Return singleton variables in the session
	Rule.prototype.singleton_variables = function(include_named) {
		include_named = include_named || false;
		var variables = this.head.variables();
		var count = {};
		var singleton = [];
		if(this.body !== null)
			variables = variables.concat(this.body.variables());
		for(var i = 0; i < variables.length; i++) {
			if(count[variables[i]] === undefined)
				count[variables[i]] = 0;
			count[variables[i]]++;
		}
		for(var key in count) {
			if(!count.hasOwnProperty(key))
				continue;
			if(count[key] === 1) {
				var charcode = codePointAt(key, 1);
				if(!include_named || key === "_")
					if(key === "_" || key[0] === "_" && (charcode === 95 || charcode >= 65 && charcode <= 90))
						continue;
				singleton.push(key);
			}
		}
		return singleton;
	};



	// NODEJS

	var nodejs_flag = typeof process !== 'undefined' && !process.browser;

	var nodejs_arguments = nodejs_flag ?
		arrayToList( map(process.argv.slice(1), function(arg) { return new Term( arg ); })) :
		new Term("[]", []);
	
	
	
	// PROLOG

	var pl = {
		
		// Environment
		__env: nodejs_flag ? commonjsGlobal : window,
		
		// Modules
		modules: {},
		
		// Version
		version: version,
		
		// Parser
		parser: {
			tokenizer: Tokenizer,
			expression: parseExpr
		},
		
		// Utils
		utils: {
			
			// String to indicator
			str_indicator: str_indicator,
			// Code point at
			codePointAt: codePointAt,
			// From code point
			fromCodePoint: fromCodePoint,
			// Length of string
			stringLength: stringLength
			
		},
		
		// Statistics
		statistics: {
			
			// Number of created terms
			getCountTerms: function() {
				return term_ref;
			}
			
		},
		
		// JavaScript to Prolog
		fromJavaScript: {
			
			// Type testing
			test: {
				
				// Boolean
				boolean: function( obj, tobj ) {
					return obj === true || obj === false;
				},
				
				// Number
				number: function( obj, tobj ) {
					return typeof obj === "number";
				},
				
				// String
				string: function( obj, tobj ) {
					return typeof obj === "string";
				},
				
				// List
				list: function( obj, tobj ) {
					return obj instanceof Array;
				},
				
				// Variable
				variable: function( obj, tobj ) {
					return obj === undefined;
				},

				// Object
				object: function( obj, tobj ) {
					tobj = tobj === undefined ? false : tobj;
					return tobj && !(obj instanceof Array) && typeof obj === "object";
				},
				
				// Any
				any: function( _, tobj ) {
					return true;
				}
				
			},
			
			// Function conversion
			conversion: {
				
				// Bolean
				boolean: function( obj, tobj ) {
					return new Term( obj ? "true" : "false", [] );
				},
				
				// Number
				number: function( obj, tobj ) {
					return new Num( obj, obj % 1 !== 0 );
				},
				
				// String
				string: function( obj, tobj ) {
					return new Term( obj, [] );
				},
				
				// List
				list: function( obj, tobj ) {
					tobj = tobj === undefined ? false : tobj;
					var arr = [];
					var elem;
					for( var i = 0; i < obj.length; i++ ) {
						elem = pl.fromJavaScript.apply( obj[i], tobj );
						if( elem === undefined )
							return undefined;
						arr.push( elem );
					}
					return arrayToList( arr );
				},
				
				// Variable
				variable: function( obj, tobj ) {
					return new Var( "_" );
				},

				// Object
				object: function( obj, tobj ) {
					tobj = tobj === undefined ? false : tobj;
					var list = new Term("[]", []);
					var arr = [];
					for(var prop in obj) {
						if(!obj.hasOwnProperty(prop)) continue;
						arr.push(new Term("-", [
							pl.fromJavaScript.apply(prop, tobj),
							pl.fromJavaScript.apply(obj[prop], tobj)
						]));
					}
					return arrayToList(arr);
				},
				
				// Any
				any: function( obj, tobj ) {
					return undefined;
				}
				
			},
			
			// Transform object
			apply: function( obj, tobj ) {
				tobj = tobj === undefined ? false : tobj;
				for( var i in pl.fromJavaScript.test )
					if( i !== "any" && pl.fromJavaScript.test[i]( obj, tobj ) )
						return pl.fromJavaScript.conversion[i]( obj, tobj );
				return pl.fromJavaScript.conversion.any( obj, tobj );
			}
		},
		
		// Types
		type: {
			
			// Objects
			Var: Var,
			Num: Num,
			Term: Term,
			Rule: Rule,
			State: State,
			Stream: Stream,
			Module: Module,
			Thread: Thread,
			Session: Session,
			Substitution: Substitution,
			File: TauFile,
			Directory: TauDirectory,
			
			// Order
			order: [Var, Num, Term, Stream],
			
			// Compare types
			compare: function( x, y ) {
				var ord_x = indexOf( pl.type.order, x.constructor );
				var ord_y = indexOf( pl.type.order, y.constructor );
				if( ord_x < ord_y ) {
					return -1;
				} else if( ord_x > ord_y ) {
					return 1;
				} else {
					if( x.constructor === Num )
						if( x.is_float && y.is_float )
							return 0;
						else if( x.is_float )
							return -1;
						else if( y.is_float )
							return 1;
					return 0;
				}
			},
			
			// Is a substitution
			is_substitution: function( obj ) {
				return obj instanceof Substitution;
			},
			
			// Is a state
			is_state: function( obj ) {
				return obj instanceof State;
			},
			
			// Is a rule
			is_rule: function( obj ) {
				return obj instanceof Rule;
			},
			
			// Is a variable
			is_variable: function( obj ) {
				return obj instanceof Var;
			},

			// Is a stream
			is_stream: function( obj ) {
				return obj instanceof Stream;
			},
			
			// Is an anonymous variable
			is_anonymous_var: function( obj ) {
				return obj instanceof Var && obj.id === "_";
			},
			
			// Is a callable term
			is_callable: function( obj ) {
				return obj instanceof Term
				&& (indexOf([",/2",";/2","->/2"], obj.indicator) === -1
				|| pl.type.is_callable(obj.args[0]) && pl.type.is_callable(obj.args[1]))
				|| obj instanceof Var;
			},
			
			// Is a number
			is_number: function( obj ) {
				return obj instanceof Num;
			},
			
			// Is an integer
			is_integer: function( obj ) {
				return obj instanceof Num && !obj.is_float;
			},
			
			// Is a float
			is_float: function( obj ) {
				return obj instanceof Num && obj.is_float;
			},
			
			// Is a term
			is_term: function( obj ) {
				return obj instanceof Term;
			},
			
			// Is an atom
			is_atom: function( obj ) {
				return obj instanceof Term && obj.args.length === 0;
			},
			
			// Is a ground term
			is_ground: function( obj ) {
				if( obj instanceof Var ) return false;
				if( obj instanceof Term )
					for( var i = 0; i < obj.args.length; i++ )
						if( !pl.type.is_ground( obj.args[i] ) )
							return false;
				return true;
			},
			
			// Is atomic
			is_atomic: function( obj ) {
				return obj instanceof Term && obj.args.length === 0 || obj instanceof Num;
			},
			
			// Is compound
			is_compound: function( obj ) {
				return obj instanceof Term && obj.args.length > 0;
			},
			
			// Is a list
			is_list: function( obj ) {
				return obj instanceof Term && (obj.indicator === "[]/0" || obj.indicator === "./2");
			},
			
			// Is an empty list
			is_empty_list: function( obj ) {
				return obj instanceof Term && obj.indicator === "[]/0";
			},
			
			// Is a non empty list
			is_non_empty_list: function( obj ) {
				return obj instanceof Term && obj.indicator === "./2";
			},
			
			// Is a fully list
			is_fully_list: function( obj ) {
				while( obj instanceof Term && obj.indicator === "./2" ) {
					obj = obj.args[1];
				}
				return obj instanceof Var || obj instanceof Term && obj.indicator === "[]/0";
			},
			
			// Is a instantiated list
			is_instantiated_list: function( obj ) {
				while( obj instanceof Term && obj.indicator === "./2" ) {
					obj = obj.args[1];
				}
				return obj instanceof Term && obj.indicator === "[]/0";
			},
			
			// Is an unitary list
			is_unitary_list: function( obj ) {
				return obj instanceof Term && obj.indicator === "./2" && obj.args[1] instanceof Term && obj.args[1].indicator === "[]/0";
			},
			
			// Is a character
			is_character: function( obj ) {
				return obj instanceof Term && obj.args.length === 0 && (obj.id.length === 1 || obj.id.length > 0 && obj.id.length <= 2 && codePointAt( obj.id, 0 ) >= 65536);
			},
			
			// Is a in_character
			is_in_character: function( obj ) {
				return obj instanceof Term && (obj.indicator === "end_of_file/0"
				|| obj.id.length === 1
				|| obj.id.length > 0 && obj.id.length <= 2 && codePointAt(obj.id, 0) >= 65536);
			},
			
			// Is a character_code
			is_character_code: function( obj ) {
				return obj instanceof Num && !obj.is_float && obj.value >= 0 && obj.value <= 1114111;
			},
			
			// Is a in_character_code
			is_in_character_code: function( obj ) {
				return obj instanceof Num && !obj.is_float && obj.value >= -1 && obj.value <= 1114111;
			},

			// Is a byte
			is_byte: function( obj ) {
				return obj instanceof Num && !obj.is_float && obj.value >= 0 && obj.value <= 255;
			},

			// Is a in_byte
			is_in_byte: function( obj ) {
				return obj instanceof Num && !obj.is_float && obj.value >= -1 && obj.value <= 255;
			},
			
			// Is an operator
			is_operator: function( obj ) {
				return obj instanceof Term && pl.arithmetic.evaluation[obj.indicator];
			},
			
			// Is a directive
			is_directive: function( obj ) {
				return obj instanceof Term && (pl.directive[obj.indicator] !== undefined || pl.directive[obj.id + "/*"] !== undefined);
			},
			
			// Is a built-in predicate
			is_builtin: function( obj ) {
				return obj instanceof Term && pl.builtin.rules.hasOwnProperty(obj.indicator) && obj.indicator !== "goal_expansion/2";
			},
			
			// Is an error
			is_error: function( obj ) {
				return obj instanceof Term && obj.indicator === "throw/1";
			},

			// Is an error state
			is_error_state: function( obj ) {
				return pl.type.is_state( obj ) && obj.error && obj.error === true;
			},
			
			// Is a predicate indicator
			is_predicate_indicator: function( obj ) {
				return obj instanceof Term && obj.indicator === "//2" && obj.args[0] instanceof Term && obj.args[0].args.length === 0 && obj.args[1] instanceof Num && obj.args[1].is_float === false;
			},
			
			// Is a flag
			is_flag: function( obj ) {
				return obj instanceof Term && obj.args.length === 0 && pl.flag[obj.id] !== undefined;
			},
			
			// Is a valid value for a flag
			is_value_flag: function( flag, obj ) {
				if( !pl.type.is_flag( flag ) ) return false;
				for( var value in pl.flag[flag.id].allowed ) {
					if(!pl.flag[flag.id].allowed.hasOwnProperty(value)) continue;
					if( pl.flag[flag.id].allowed[value].equals( obj ) ) return true;
				}
				return false;
			},

			// Is a io mode
			is_io_mode: function( obj ) {
				return pl.type.is_atom( obj ) && ["read","write","append"].indexOf( obj.id ) !== -1;
			},

			// Is a stream option
			is_stream_option: function( obj ) {
				return pl.type.is_term( obj ) && (
					obj.indicator === "alias/1" && pl.type.is_atom(obj.args[0]) ||
					obj.indicator === "reposition/1" && pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "true" || obj.args[0].id === "false") ||
					obj.indicator === "type/1" && pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "text" || obj.args[0].id === "binary") ||
					obj.indicator === "eof_action/1" && pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "error" || obj.args[0].id === "eof_code" || obj.args[0].id === "reset")
				);
			},

			// Is a stream position
			is_stream_position: function( obj ) {
				return pl.type.is_term(obj) && (
					obj.indicator === "end_of_stream/0" ||
					obj.indicator === "past_end_of_stream/0" ||
					obj.indicator === "position/3"
						&& pl.type.is_integer(obj.args[0])
						&& pl.type.is_integer(obj.args[1])
						&& pl.type.is_integer(obj.args[2])
				)
			},

			// Is a stream property
			is_stream_property: function( obj ) {
				return pl.type.is_term( obj ) && (
					obj.indicator === "input/0" || 
					obj.indicator === "output/0" || 
					obj.indicator === "alias/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom( obj.args[0] )) ||
					obj.indicator === "file_name/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom( obj.args[0] )) ||
					obj.indicator === "reposition/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "true" || obj.args[0].id === "false")) ||
					obj.indicator === "type/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "text" || obj.args[0].id === "binary")) ||
					obj.indicator === "mode/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "read" || obj.args[0].id === "write" || obj.args[0].id === "append")) ||
					obj.indicator === "eof_action/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "error" || obj.args[0].id === "eof_code" || obj.args[0].id === "reset")) ||
					obj.indicator === "end_of_stream/1" && (pl.type.is_variable( obj.args[0] ) || pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "at" || obj.args[0].id === "past" || obj.args[0].id === "not")) ||
					obj.indicator === "position/1"
						&& (pl.type.is_variable(obj.args[0]) || pl.type.is_term(obj.args[0]) && obj.args[0].indicator === "position/3"
							&& (pl.type.is_variable(obj.args[0].args[0]) || pl.type.is_integer(obj.args[0].args[0]))
							&& (pl.type.is_variable(obj.args[0].args[1]) || pl.type.is_integer(obj.args[0].args[1]))
							&& (pl.type.is_variable(obj.args[0].args[2]) || pl.type.is_integer(obj.args[0].args[2])))
				);
			},

			// Is a streamable term
			is_streamable: function( obj ) {
				return obj.__proto__.stream !== undefined;
			},

			// Is a read option
			is_read_option: function( obj ) {
				return pl.type.is_term( obj ) && ["variables/1","variable_names/1","singletons/1"].indexOf( obj.indicator ) !== -1;
			},

			// Is a write option
			is_write_option: function( obj ) {
				return pl.type.is_term( obj ) && (
					obj.indicator === "quoted/1" && pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "true" || obj.args[0].id === "false") ||
					obj.indicator === "ignore_ops/1" && pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "true" || obj.args[0].id === "false") ||
					obj.indicator === "numbervars/1" && pl.type.is_atom(obj.args[0]) && (obj.args[0].id === "true" || obj.args[0].id === "false")
				);
			},

			// Is a close option
			is_close_option: function( obj ) {
				return pl.type.is_term( obj ) &&
					obj.indicator === "force/1" &&
					pl.type.is_atom(obj.args[0]) &&
					(obj.args[0].id === "true" || obj.args[0].id === "false");
			},
			
			// Is a modifiable flag
			is_modifiable_flag: function( obj ) {
				return pl.type.is_flag( obj ) && pl.flag[obj.id].changeable;
			},

			// Is a module
			is_module: function( obj ) {
				return obj instanceof Module;
			},

			// Is a virtual file
			is_file: function( obj ) {
				return obj instanceof TauFile;
			},

			// Is a virtual directory
			is_directory: function( obj ) {
				return obj instanceof TauDirectory;
			},

			// Is a predicate property
			is_predicate_property: function(obj) {
				return pl.type.is_term(obj) && (
					obj.indicator === "built_in/0" ||
					obj.indicator === "static/0" ||
					obj.indicator === "dynamic/0" ||
					obj.indicator === "native_code/0" ||
					obj.indicator === "multifile/0" ||
					obj.indicator === "meta_predicate/1"
				);
			},

			// Is a meta-argument specifier
			is_meta_argument_specifier: function(obj) {
				return pl.type.is_integer(obj) && obj.value >= 0 ||
					pl.type.is_atom(obj) && indexOf(["+", "-", "?", "*", "^", ":", "//"], obj.id) !== -1;
			},

			// Is a time property
			is_time_property: function( obj ) {
				return pl.type.is_term(obj) && obj.args.length === 1 
				&& (pl.type.is_variable(obj.args[0]) || pl.type.is_integer(obj.args[0]))
				&& indexOf(["year", "month", "day", "hours", "minutes", "seconds", "milliseconds", "weekday"], obj.id) !== -1;
			},
			
		},

		// Arithmetic functions
		arithmetic: {
			
			// Evaluation
			evaluation: {
				"e/0": {
					type_args: null,
					type_result: true,
					fn: function( _ ) { return Math.E; }
				},
				"pi/0": {
					type_args: null,
					type_result: true,
					fn: function( _ ) { return Math.PI; }
				},
				"tau/0": {
					type_args: null,
					type_result: true,
					fn: function( _ ) { return 2*Math.PI; }
				},
				"epsilon/0": {
					type_args: null,
					type_result: true,
					fn: function( _ ) { return Number.EPSILON; }
				},
				"+/1": {
					type_args: null,
					type_result: null,
					fn: function( x, _ ) { return x; }
				},
				"-/1": {
					type_args: null,
					type_result: null,
					fn: function( x, _ ) { return -x; }
				},
				"\\/1": {
					type_args: false,
					type_result: false,
					fn: function( x, _ ) { return ~x; }
				},
				"abs/1": {
					type_args: null,
					type_result: null,
					fn: function( x, _ ) { return Math.abs( x ); }
				},
				"sign/1": {
					type_args: null,
					type_result: null,
					fn: function( x, _ ) { return Math.sign( x ); }
				},
				"float_integer_part/1": {
					type_args: true,
					type_result: false,
					fn: function( x, _ ) { return parseInt( x ); }
				},
				"float_fractional_part/1": {
					type_args: true,
					type_result: true,
					fn: function( x, _ ) { return x - parseInt( x ); }
				},
				"float/1": {
					type_args: null,
					type_result: true,
					fn: function( x, _ ) { return parseFloat( x ); }
				},
				"floor/1": {
					type_args: true,
					type_result: false,
					fn: function( x, _ ) { return Math.floor( x ); }
				},
				"truncate/1": {
					type_args: true,
					type_result: false,
					fn: function( x, _ ) { return parseInt( x ); }
				},
				"round/1": {
					type_args: true,
					type_result: false,
					fn: function( x, _ ) { return Math.round( x ); }
				},
				"ceiling/1": {
					type_args: true,
					type_result: false,
					fn: function( x, _ ) { return Math.ceil( x ); }
				},
				"sin/1": {
					type_args: null,
					type_result: true,
					fn: function( x, _ ) { return Math.sin( x ); }
				},
				"cos/1": {
					type_args: null,
					type_result: true,
					fn: function( x, _ ) { return Math.cos( x ); }
				},
				"tan/1": {
					type_args: null,
					type_result: true,
					fn: function( x, _ ) { return Math.tan( x ); }
				},
				"asin/1": {
					type_args: null,
					type_result: true,
					fn: function( x, thread ) { return Math.abs(x) <= 1 ? Math.asin(x) : pl.error.evaluation("undefined", thread.__call_indicator); }
				},
				"acos/1": {
					type_args: null,
					type_result: true,
					fn: function( x, thread ) { return Math.abs(x) <= 1 ? Math.acos(x) : pl.error.evaluation("undefined", thread.__call_indicator); }
				},
				"atan/1": {
					type_args: null,
					type_result: true,
					fn: function( x, _ ) { return Math.atan( x ); }
				},
				"atan2/2": {
					type_args: null,
					type_result: true,
					fn: function( x, y, thread ) { return x === 0 && y === 0 ? pl.error.evaluation("undefined", thread.__call_indicator) : Math.atan2(x, y); }
				},
				"exp/1": {
					type_args: null,
					type_result: true,
					fn: function( x, _ ) { return Math.exp( x ); }
				},
				"sqrt/1": {
					type_args: null,
					type_result: true,
					fn: function( x, thread ) { return x >= 0 ? Math.sqrt( x ) : pl.error.evaluation( "undefined", thread.__call_indicator ); }
				},
				"log/1": {
					type_args: null,
					type_result: true,
					fn: function( x, thread ) { return x > 0 ? Math.log( x ) : pl.error.evaluation( "undefined", thread.__call_indicator ); }
				},
				"log/2": {
					type_args: null,
					type_result: true,
					fn: function( x, y, thread ) { return x > 0 && y > 0 ? Math.log(y)/Math.log(x) : pl.error.evaluation( "undefined", thread.__call_indicator ); }
				},
				"log10/1": {
					type_args: null,
					type_result: true,
					fn: function( x, thread ) { return x > 0 ? Math.log(x)/Math.log(10) : pl.error.evaluation( "undefined", thread.__call_indicator ); }
				},
				"+/2": {
					type_args: null,
					type_result: null,
					fn: function( x, y, _ ) { return x + y; }
				},
				"-/2": {
					type_args: null,
					type_result: null,
					fn:  function( x, y, _ ) { return x - y; }
				},
				"*/2": {
					type_args: null,
					type_result: null,
					fn: function( x, y, _ ) { return x * y; }
				},
				"//2": {
					type_args: null,
					type_result: true,
					fn: function( x, y, thread ) { return y ? x / y : pl.error.evaluation( "zero_divisor", thread.__call_indicator ); }
				},
				"///2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, thread ) { return y ? Math.trunc( x / y ) : pl.error.evaluation( "zero_divisor", thread.__call_indicator ); }
				},
				"div/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, thread ) { return y ? Math.floor( x / y ) : pl.error.evaluation( "zero_divisor", thread.__call_indicator ); }
				},
				"**/2": {
					type_args: null,
					type_result: true,
					fn: function( x, y, _ ) { return Math.pow(x, y); }
				},
				"^/2": {
					type_args: null,
					type_result: null,
					fn: function( x, y, _ ) { return Math.pow(x, y); }
				},
				"<</2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, _ ) { return x << y; }
				},
				">>/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, _ ) { return x >> y; }
				},
				"/\\/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, _ ) { return x & y; }
				},
				"\\//2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, _ ) { return x | y; }
				},
				"xor/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, _ ) { return x ^ y; }
				},
				"rem/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, thread ) { return y ? x % y : pl.error.evaluation( "zero_divisor", thread.__call_indicator ); }
				},
				"mod/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, thread ) { return y ? x - Math.floor( x / y ) * y : pl.error.evaluation( "zero_divisor", thread.__call_indicator ); }
				},
				"max/2": {
					type_args: null,
					type_result: null,
					fn: function( x, y, _ ) { return Math.max( x, y ); }
				},
				"min/2": {
					type_args: null,
					type_result: null,
					fn: function( x, y, _ ) { return Math.min( x, y ); }
				},
				"gcd/2": {
					type_args: false,
					type_result: false,
					fn: function( x, y, _ ) { return gcd(x, y); }
				}
				
			}
			
		},
		
		// Directives
		directive: {
			
			// dynamic/1
			"dynamic/1": function( thread, atom, options ) {
				var indicators = atom.args[0];
				if(!pl.type.is_list(indicators))
					indicators = arrayToList([indicators]);
				var pointer = indicators;
				while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
					indicator = pointer.args[0];
					if( pl.type.is_variable( indicator ) ) {
						thread.throw_warning( pl.error.instantiation( atom.indicator ) );
					} else if( !pl.type.is_compound( indicator ) || indicator.indicator !== "//2" ) {
						thread.throw_warning( pl.error.type( "predicate_indicator", indicator, atom.indicator ) );
					} else if( pl.type.is_variable( indicator.args[0] ) || pl.type.is_variable( indicator.args[1] ) ) {
						thread.throw_warning( pl.error.instantiation( atom.indicator ) );
					} else if( !pl.type.is_atom( indicator.args[0] ) ) {
						thread.throw_warning( pl.error.type( "atom", indicator.args[0], atom.indicator ) );
					} else if( !pl.type.is_integer( indicator.args[1] ) ) {
						thread.throw_warning( pl.error.type( "integer", indicator.args[1], atom.indicator ) );
					} else {
						var key = indicator.args[0].id + "/" + indicator.args[1].value;
						var get_module = thread.session.modules[options.context_module];
						get_module.public_predicates[key] = true;
						if( !get_module.rules[key] )
						get_module.rules[key] = [];
					}
					pointer = pointer.args[1];
				}
				if(pl.type.is_variable(pointer)) {
					thread.throw_warning( pl.error.instantiation( atom.indicator ) );
				} else if(!pl.type.is_term(pointer) || pointer.indicator !== "[]/0") {
					thread.throw_warning( pl.error.type( "predicate_indicator", indicator, atom.indicator ) );
				}
			},

			// dynamic/[2..]
			"dynamic/*": function( thread, atom ) {
				for(var i = 0; i < atom.args.length; i++) {
					pl.directive["dynamic/1"](thread, new Term("dynamic", [atom.args[i]]));
				}
			},
			
			// multifile/1
			"multifile/1": function( thread, atom, options ) {
				var indicator = atom.args[0];
				if( pl.type.is_variable( indicator ) ) {
					thread.throw_warning( pl.error.instantiation( atom.indicator ) );
				} else if( !pl.type.is_compound( indicator ) || indicator.indicator !== "//2" ) {
					thread.throw_warning( pl.error.type( "predicate_indicator", indicator, atom.indicator ) );
				} else if( pl.type.is_variable( indicator.args[0] ) || pl.type.is_variable( indicator.args[1] ) ) {
					thread.throw_warning( pl.error.instantiation( atom.indicator ) );
				} else if( !pl.type.is_atom( indicator.args[0] ) ) {
					thread.throw_warning( pl.error.type( "atom", indicator.args[0], atom.indicator ) );
				} else if( !pl.type.is_integer( indicator.args[1] ) ) {
					thread.throw_warning( pl.error.type( "integer", indicator.args[1], atom.indicator ) );
				} else {
					var predicate_indicator = atom.args[0].args[0].id + "/" + atom.args[0].args[1].value;
					var get_module = thread.session.modules[options.context_module];
					get_module.multifile_predicates[predicate_indicator] = true;
					if(!get_module.rules.hasOwnProperty(predicate_indicator)) {
						get_module.rules[predicate_indicator] = [];
						get_module.public_predicates[predicate_indicator] = false;
					}
				}
			},

			// meta_predicate/1
			"meta_predicate/1": function(thread, atom, options) {
				var options = options === undefined ? {} : options;
				var head = atom.args[0];
				if( pl.type.is_variable(head) ) {
					thread.throw_warning(pl.error.instantiation(atom.indicator));
				} else if(!pl.type.is_callable(head)) {
					thread.throw_warning(pl.error.type("callable", head, atom.indicator));
				} else {
					for(var i = 0; i < head.args.length; i++) {
						var arg = head.args[i];
						if(!pl.type.is_meta_argument_specifier(arg)) {
							thread.throw_warning(pl.error.type("meta_argument_specifier", arg, atom.indicator));
							return;
						}
					}
					thread.session.modules[options.context_module].meta_predicates[head.indicator] = head;
				}
			},
			
			// set_prolog_flag
			"set_prolog_flag/2": function( thread, atom ) {
				var flag = atom.args[0], value = atom.args[1];
				if( pl.type.is_variable( flag ) || pl.type.is_variable( value ) ) {
					thread.throw_warning( pl.error.instantiation( atom.indicator ) );
				} else if( !pl.type.is_atom( flag ) ) {
					thread.throw_warning( pl.error.type( "atom", flag, atom.indicator ) );
				} else if( !pl.type.is_flag( flag ) ) {
					thread.throw_warning( pl.error.domain( "prolog_flag", flag, atom.indicator ) );
				} else if( !pl.type.is_modifiable_flag( flag ) ) {
					thread.throw_warning( pl.error.permission( "modify", "flag", flag, atom.indicator ) );
				} else if( !pl.type.is_value_flag( flag, value ) ) {
					thread.throw_warning( pl.error.domain( "flag_value", new Term( "+", [flag, value] ), atom.indicator ) );
				} else {
					thread.session.flag[flag.id] = value;
				}
			},

			// module/2
			"module/2": function(thread, atom, options) {
				var options = options === undefined ? {} : options;
				options.context_module = options.context_module === undefined ? "user" : options.context_module;
				var module_id = atom.args[0], exports = atom.args[1];
				if(pl.type.is_variable(module_id) || pl.type.is_variable(exports)) {
					thread.throw_warning(pl.error.instantiation(atom.indicator));
				} else if(!pl.type.is_atom(module_id)) {
					thread.throw_warning(pl.error.type("atom", module_id, atom.indicator));
				} else if(!pl.type.is_list(exports)) {
					thread.throw_warning(pl.error.type("list", exports, atom.indicator));
				} else {
					if(!pl.type.is_module(thread.session.modules[module_id.indicator])) {
						var pointer = exports;
						var indicators = [];
						while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
							var predicate = pointer.args[0];
							if(!pl.type.is_predicate_indicator(predicate)) {
								thread.throw_warning(pl.error.type("predicate_indicator", predicate, atom.indicator));
							} else {
								indicators.push(predicate.args[0].id + "/" + predicate.args[1].value);
							}
							pointer = pointer.args[1];
						}
						if(pl.type.is_variable(pointer)) {
							thread.throw_warning(pl.error.instantiation(atom.indicator));
						} else if(!pl.type.is_empty_list(pointer)) {
							thread.throw_warning(pl.error.type("list", exports, atom.indicator));
						}
						var new_module = new Module(module_id.id, {}, indicators, {
							session: thread.session
						});
						thread.session.modules[module_id.id] = new_module;
						thread.session.modules[options.context_module].modules[module_id.id] = new_module;
						options.context_module = module_id.id;
					} else {
						thread.throw_warning(pl.error.permission("create", "module", module_id, atom.indicator));
					}
				}
			},
			
			// use_module/1
			"use_module/1": function(thread, atom, options) {
				var options = options === undefined ? {} : options;
				options.context_module = options.context_module === undefined ? "user" : options.context_module;
				var module_id = atom.args[0];
				if(pl.type.is_variable(module_id)) {
					thread.throw_warning(pl.error.instantiation(atom.indicator));
				} else if(!pl.type.is_term(module_id)) {
					thread.throw_warning(pl.error.type("term", module_id, atom.indicator));
				} else {
					if(module_id.indicator === "library/1") {
						var name = module_id.args[0].id;
						var get_module = pl.modules[name];
						if(pl.type.is_module(get_module)) {
							if(!thread.session.modules[options.context_module].modules.hasOwnProperty(name)) {
								thread.session.modules[name] = get_module;
								thread.session.modules[options.context_module].modules[name] = get_module;
								for(var i = 0; i < get_module.dependencies.length; i++) {
									var term = new Term("use_module", [new Term("library", [new Term(get_module.dependencies[i])])]);
									pl.directive["use_module/1"](thread, term, {
										context_module: name
									});
								}
							}
						} else {
							thread.throw_warning(pl.error.existence("module", module_id, atom.indicator));
						}
					} else {
						var name = module_id.id;
						thread.consult(name, {
							context_module: options.context_module,
							text: false,
							success: function() {
								parseProgram(thread, options.string, options);
							},
							error: function() {
								options.error(pl.error.existence("module", module_id, atom.indicator));
							}
						});
						return true;
					}
				}
			},
			
			// char_conversion/2
			"char_conversion/2": function(thread, atom, options) {
				var inchar = atom.args[0], outchar = atom.args[1];
				if(pl.type.is_variable(inchar) || pl.type.is_variable(outchar)) {
					thread.throw_warning(pl.error.instantiation(atom.indicator));
				} else if(!pl.type.is_character(inchar)) {
					thread.throw_warning(pl.error.type("character", inchar, atom.indicator));
				} else if(!pl.type.is_character(outchar)) {
					thread.throw_warning(pl.error.type("character", outchar, atom.indicator));
				} else {
					if(inchar.id === outchar.id) {
						delete thread.session.__char_conversion[inchar.id];
					} else {
						thread.session.__char_conversion[inchar.id] = outchar.id;
					}
					options.tokens = options.tokenizer.get_tokens(options.current_token);
					options.current_token = 0;
					return true;
				}
			},
			
			// op/3
			"op/3": function( thread, atom ) {
				var priority = atom.args[0], type = atom.args[1], operators = atom.args[2];
				if(pl.type.is_atom(operators))
					operators = new Term(".", [operators, new Term("[]")]);
				if( pl.type.is_variable( priority ) || pl.type.is_variable( type ) || pl.type.is_variable( operators ) ) {
					thread.throw_warning( pl.error.instantiation( atom.indicator ) );
				} else if( !pl.type.is_integer( priority ) ) {
					thread.throw_warning( pl.error.type( "integer", priority, atom.indicator ) );
				} else if( !pl.type.is_atom( type ) ) {
					thread.throw_warning( pl.error.type( "atom", type, atom.indicator ) );
				} else if( !pl.type.is_list( operators ) ) {
					thread.throw_warning( pl.error.type( "list", operators, atom.indicator ) );
				} else {
					var pointer = operators;
					while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
						var operator = pointer.args[0];
						pointer = pointer.args[1];
						if( pl.type.is_variable( operator ) ) {
							thread.throw_warning( pl.error.instantiation( atom.indicator ) );
						} else if( !pl.type.is_atom( operator ) ) {
							thread.throw_warning( pl.error.type( "atom", operator, atom.indicator ) );
						} else if( priority.value < 0 || priority.value > 1200 ) {
							thread.throw_warning( pl.error.domain( "operator_priority", priority, atom.indicator ) );
						} else if( operator.id === "," ) {
							thread.throw_error( pl.error.permission( "modify", "operator", operator, atom.indicator ) );
						} else if( operator.id === "{}" ) {
							thread.throw_warning( pl.error.permission( "create", "operator", operator, atom.indicator ) );
						} else if( operator.id === "|" && priority.value !== 0 && (priority.value < 1001 || type.id.length !== 3 ) ) {
							thread.throw_warning( pl.error.permission( "create", "operator", operator, atom.indicator ) );
						} else if( ["fy", "fx", "yf", "xf", "xfx", "yfx", "xfy"].indexOf( type.id ) === -1 ) {
							thread.throw_warning( pl.error.domain( "operator_specifier", type, atom.indicator ) );
						} else {
							var fix = { prefix: null, infix: null, postfix: null };
							for( var p in thread.session.__operators ) {
								if(!thread.session.__operators.hasOwnProperty(p)) continue;
								var classes = thread.session.__operators[p][operator.id];
								if( classes ) {
									if( indexOf( classes, "fx" ) !== -1 ) { fix.prefix = { priority: p, type: "fx" }; }
									if( indexOf( classes, "fy" ) !== -1 ) { fix.prefix = { priority: p, type: "fy" }; }
									if( indexOf( classes, "xf" ) !== -1 ) { fix.postfix = { priority: p, type: "xf" }; }
									if( indexOf( classes, "yf" ) !== -1 ) { fix.postfix = { priority: p, type: "yf" }; }
									if( indexOf( classes, "xfx" ) !== -1 ) { fix.infix = { priority: p, type: "xfx" }; }
									if( indexOf( classes, "xfy" ) !== -1 ) { fix.infix = { priority: p, type: "xfy" }; }
									if( indexOf( classes, "yfx" ) !== -1 ) { fix.infix = { priority: p, type: "yfx" }; }
								}
							}
							var current_class;
							switch( type.id ) {
								case "fy": case "fx": current_class = "prefix"; break;
								case "yf": case "xf": current_class = "postfix"; break;
								default: current_class = "infix"; break;
							}
							if(fix.infix && current_class === "postfix" || fix.postfix && current_class === "infix") {
								thread.throw_warning( pl.error.permission( "create", "operator", operator, atom.indicator ) );
							} else {
								if( fix[current_class] ) {
									remove( thread.session.__operators[fix[current_class].priority][operator.id], fix[current_class].type );
									if( thread.session.__operators[fix[current_class].priority][operator.id].length === 0 ) {
										delete thread.session.__operators[fix[current_class].priority][operator.id];
									}
								}
								if( priority.value > 0 ) {
									if( !thread.session.__operators[priority.value] ) thread.session.__operators[priority.value.toString()] = {};
									if( !thread.session.__operators[priority.value][operator.id] ) thread.session.__operators[priority.value][operator.id] = [];
									thread.session.__operators[priority.value][operator.id].push( type.id );
								}
							}
						}
					}
					if(pl.type.is_variable(pointer)) {
						thread.throw_warning( pl.error.instantiation( atom.indicator ) );
						return;
					} else if(!pl.type.is_term(pointer) || pointer.indicator !== "[]/0") {
						thread.throw_warning( pl.error.type( "list", operators, atom.indicator ) );
						return;
					}
				}
			},

			// initialization/1
			"initialization/1": function(thread, atom, options) {
				var goal = atom.args[0];
				options.initialization.push(goal);
			}
			
		},
		
		// Flags
		flag: {
			
			// Bounded numbers
			bounded: {
				allowed: [new Term( "true" ), new Term( "false" )],
				value: new Term( "true" ),
				changeable: false
			},
			
			// Maximum integer
			max_integer: {
				allowed: [new Num( Number.MAX_SAFE_INTEGER )],
				value: new Num( Number.MAX_SAFE_INTEGER ),
				changeable: false
			},
			
			// Minimum integer
			min_integer: {
				allowed: [new Num( Number.MIN_SAFE_INTEGER )],
				value: new Num( Number.MIN_SAFE_INTEGER ),
				changeable: false
			},
			
			// Rounding function
			integer_rounding_function: {
				allowed: [new Term( "down" ), new Term( "toward_zero" )],
				value: new Term( "toward_zero" ),
				changeable: false
			},
			
			// Character conversion
			char_conversion: {
				allowed: [new Term( "on" ), new Term( "off" )],
				value: new Term( "on" ),
				changeable: true
			},
			
			// Debugger
			debug: {
				allowed: [new Term( "on" ), new Term( "off" )],
				value: new Term( "off" ),
				changeable: true
			},
			
			// Maximum arity of predicates
			max_arity: {
				allowed: [new Term( "unbounded" )],
				value: new Term( "unbounded" ),
				changeable: false
			},
			
			// Unkwnow predicates behavior
			unknown: {
				allowed: [new Term( "error" ), new Term( "fail" ), new Term( "warning" )],
				value: new Term( "error" ),
				changeable: true
			},
			
			// Double quotes behavior
			double_quotes: {
				allowed: [new Term( "chars" ), new Term( "codes" ), new Term( "atom" )],
				value: new Term( "chars" ),
				changeable: true
			},
			
			// Occurs check behavior
			occurs_check: {
				allowed: [new Term( "false" ), new Term( "true" )],
				value: new Term( "false" ),
				changeable: true
			},
			
			// Dialect
			dialect: {
				allowed: [new Term( "tau" )],
				value: new Term( "tau" ),
				changeable: false
			},
			
			// Version
			version_data: {
				allowed: [new Term( "tau", [new Num(version.major,false), new Num(version.minor,false), new Num(version.patch,false), new Term(version.status)] )],
				value: new Term( "tau", [new Num(version.major,false), new Num(version.minor,false), new Num(version.patch,false), new Term(version.status)] ),
				changeable: false
			},
			
			// NodeJS
			nodejs: {
				allowed: [new Term( "true" ), new Term( "false" )],
				value: new Term( nodejs_flag ? "true" : "false" ),
				changeable: false
			},

			// Arguments
			argv: {
				allowed: [nodejs_arguments],
				value: nodejs_arguments,
				changeble: false
			}
			
		},
		
		// Unify
		unify: function( s, t, occurs_check ) {
			occurs_check = occurs_check === undefined ? false : occurs_check;
			var G = [{left: s, right: t}], links = {};
			while( G.length !== 0 ) {
				var eq = G.pop();
				s = eq.left;
				t = eq.right;
				if(s == t)
					continue;
				if( pl.type.is_term(s) && pl.type.is_term(t) ) {
					if( s.indicator !== t.indicator )
						return null;
					// list
					if(s.indicator === "./2") {
						var pointer_s = s, pointer_t = t;
						while(pointer_s.indicator === "./2" && pointer_t.indicator === "./2") {
							G.push( {left: pointer_s.args[0], right: pointer_t.args[0]} );
							pointer_s = pointer_s.args[1];
							pointer_t = pointer_t.args[1];
						}
						G.push( {left: pointer_s, right: pointer_t} );
					// compound term
					} else {
						for( var i = 0; i < s.args.length; i++ )
							G.push( {left: s.args[i], right: t.args[i]} );
					}
				} else if( pl.type.is_number(s) && pl.type.is_number(t) ) {
					if( s.value !== t.value || s.is_float !== t.is_float )
						return null;
				} else if( pl.type.is_variable(s) ) {
					// X = X
					if( pl.type.is_variable(t) && s.id === t.id )
						continue;
					// Occurs check
					if( occurs_check === true && indexOf( t.variables(), s.id ) !== -1 )
						return null;
					if( s.id !== "_" ) {
						var subs = new Substitution();
						subs.add( s.id, t );
						for( var i = 0; i < G.length; i++ ) {
							G[i].left = G[i].left.apply( subs );
							G[i].right = G[i].right.apply( subs );
						}
						for( var i in links )
							links[i] = links[i].apply( subs );
						links[s.id] = t;
					}
				} else if( pl.type.is_variable(t) ) {
					G.push( {left: t, right: s} );
				} else if( s.unify !== undefined ) {
					if( !s.unify(t) )
						return null;
				} else {
					return null;
				}
			}
			return new Substitution( links );
		},

		// Is rename
		is_rename: function(obj1, obj2, links) {
			links = links || {};
			if(obj1.is_rename && obj2.is_rename)
				return obj1.is_rename(obj2, links);
			else if(obj1.equals && obj2.equals)
				return obj1.equals(obj2);
			else
				return false;
		},
		
		// Compare
		compare: function( obj1, obj2 ) {
			var type = pl.type.compare( obj1, obj2 );
			return type !== 0 ? type : obj1.compare( obj2 );
		},
		
		// Arithmetic comparison
		arithmetic_compare: function( thread, obj1, obj2 ) {
			var expr1 = obj1.interpret( thread );
			if( !pl.type.is_number( expr1 ) ) {
				return expr1;
			} else {
				var expr2 = obj2.interpret( thread );
				if( !pl.type.is_number( expr2 ) ) {
					return expr2;
				} else {
					return expr1.value < expr2.value ? -1 : (expr1.value > expr2.value ? 1 : 0);
				}
			}
		},
		
		// Operate
		operate: function( thread, obj ) {
			if( pl.type.is_operator( obj ) ) {
				var op = pl.type.is_operator( obj );
				var args = [], value;
				var type = false;
				for( var i = 0; i < obj.args.length; i++ ) {
					value = obj.args[i].interpret( thread );
					if( !pl.type.is_number( value ) ) {
						return value;
					} else if( op.type_args !== null && value.is_float !== op.type_args ) {
						return pl.error.type( op.type_args ? "float" : "integer", value, thread.__call_indicator );
					} else {
						args.push( value.value );
					}
					type = type || value.is_float;
				}
				args.push( thread );
				value = pl.arithmetic.evaluation[obj.indicator].fn.apply( this, args );
				if(obj.indicator === "^/2" && !type && value !== parseInt(value, 10))
					return pl.error.type( "float", new Num(args[0],false), thread.__call_indicator );
				type = op.type_result === null ? type : op.type_result;
				if( pl.type.is_term( value ) ) {
					return value;
				} else if( value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY ) {
					return pl.error.evaluation( "overflow", thread.__call_indicator );
				} else if( type === false && thread.get_flag( "bounded" ).id === "true" && (value > thread.get_flag( "max_integer" ).value || value < thread.get_flag( "min_integer" ).value) ) {
					return pl.error.evaluation( "int_overflow", thread.__call_indicator );
				} else {
					return new Num( value, type );
				}
			} else {
				return pl.error.type( "evaluable", str_indicator(obj.indicator), thread.__call_indicator );
			}
		},
		
		// Errors
		error: {
			
			// Existence error
			existence: function( type, object, indicator ) {
				if( typeof object === "string" )
					object = str_indicator( object );
				return new Term( "error", [new Term( "existence_error", [new Term( type ), object] ), str_indicator( indicator )] );
			},
			
			// Type error
			type: function( expected, found, indicator ) {
				return new Term( "error", [new Term( "type_error", [new Term( expected ), found] ), str_indicator( indicator )] );
			},
			
			// Instantation error
			instantiation: function( indicator ) {
				return new Term( "error", [new Term( "instantiation_error" ), str_indicator( indicator )] );
			},
			
			// Uninstantation error
			uninstantiation: function( found, indicator ) {
				return new Term( "error", [new Term( "uninstantiation_error", [new Term( found )] ), str_indicator( indicator )] );
			},
			
			// Domain error
			domain: function( expected, found, indicator ) {
				return new Term( "error", [new Term( "domain_error", [new Term( expected ), found]), str_indicator( indicator )] );
			},
			
			// Representation error
			representation: function( flag, indicator ) {
				return new Term( "error", [new Term( "representation_error", [new Term( flag )] ), str_indicator( indicator )] );
			},
			
			// Permission error
			permission: function( operation, type, found, indicator ) {
				return new Term( "error", [new Term( "permission_error", [new Term( operation ), new Term( type ), found] ), str_indicator( indicator )] );
			},
			
			// Evaluation error
			evaluation: function( error, indicator ) {
				return new Term( "error", [new Term( "evaluation_error", [new Term( error )] ), str_indicator( indicator )] );
			},
			
			// Syntax error
			syntax: function( token, expected, last ) {
				token = token || {value: "", line: 0, column: 0, matches: [""], start: 0};
				var position = last && token.matches.length > 0 ? token.start + token.matches[0].length : token.start;
				var found = last ? new Term("token_not_found") : new Term("found", [new Term(token.value.toString())]);
				var info = new Term( ".", [new Term( "line", [new Num(token.line+1)] ), new Term( ".", [new Term( "column", [new Num(position)] ), new Term( ".", [found, new Term( "[]", [] )] )] )] );
				return new Term( "error", [new Term( "syntax_error", [new Term( expected )] ), info] );
			},
			
			// Syntax error by predicate
			syntax_by_predicate: function( expected, indicator ) {
				return new Term( "error", [new Term( "syntax_error", [new Term( expected ) ] ), str_indicator( indicator )] );
			}
			
		},
		
		// Warnings
		warning: {
			
			// Singleton variables
			singleton: function( variables, rule, line ) {
				var list = new Term( "[]" );
				for( var i = variables.length-1; i >= 0; i-- )
					list = new Term( ".", [new Var(variables[i]), list] );
				return new Term( "warning", [new Term( "singleton_variables", [list, str_indicator(rule)]), new Term(".",[new Term( "line", [ new Num( line, false ) ]), new Term("[]")])] );
			},
			
			// Failed goal
			failed_goal: function( goal, line ) {
				return new Term( "warning", [new Term( "failed_goal", [goal]), new Term(".",[new Term( "line", [ new Num( line, false ) ]), new Term("[]")])] );
			}

		},
		
		// Format of renamed variables
		format_variable: function( id, variable ) {
			var charcode = variable && variable.length > 0 ? codePointAt(variable, 1) : 0;
			if(variable === "_" || variable && variable[0] === "_" && (charcode === 95 || charcode >= 65 && charcode <= 90))
				return "__" + id;
			return "_" + id;
		},
		
		// Format of computed answers
		format_answer: function( answer, thread, options ) {
			if( thread instanceof Session )
				thread = thread.thread;
			var options = options ? options : {};
			options.session = thread ? thread.session : undefined;
			if( pl.type.is_error( answer ) ) {
				return "uncaught exception: " + answer.args[0].toString(options);
			} else if( answer === false ) {
				return "false.";
			} else if( answer === null ) {
				return "limit exceeded ;";
			} else {
				var i = 0;
				var str = "";
				if( pl.type.is_substitution( answer ) ) {
					var dom = answer.domain( true );
					for( var link in answer.links ){
						if( !answer.links.hasOwnProperty(link) ) continue;
						if( pl.type.is_variable(answer.links[link]) ) {
							var links = {};
							links[answer.links[link].id] = new Var(link);
							answer = answer.apply( new Substitution(links) );
						}
					}
					answer = answer.filter( function( id, value ) {
						return !pl.type.is_variable( value ) ||
							pl.type.is_variable( value ) && answer.has_attributes( id ) ||
							indexOf( dom, value.id ) !== -1 && id !== value.id;
					} );
				}
				for( var link in answer.links ) {
					if(!answer.links.hasOwnProperty(link))
						continue;
					if( pl.type.is_variable( answer.links[link] ) && link === answer.links[link].id ) {
						var attrs = answer.attrs[link];
						for( var module in attrs ) {
							if(!attrs.hasOwnProperty(module))
								continue;
							i++;
							if( str !== "" )
								str += ", ";
							str += "put_attr(" + link + ", " + module + ", " + attrs[module].toString(options) + ")";
						}
					} else {
						i++;
						if( str !== "" )
							str += ", ";
						str += link.toString( options ) + " = " +
							answer.links[link].toString( options, {priority: "700", class: "xfx", indicator: "=/2"}, "right" );
					}
				}
				var delimiter = typeof thread === "undefined" || thread.points.length > 0 ? " ;" : "."; 
				if( i === 0 ) {
					return "true" + delimiter;
				} else {
					return str + delimiter;
				}
			}
		},
		
		// Flatten default errors
		flatten_error: function( error ) {
			if( !pl.type.is_error( error ) ) return null;
			error = error.args[0];
			var obj = {};
			obj.type = error.args[0].id;
			obj.thrown = obj.type === "syntax_error" ? null : error.args[1].id;
			obj.expected = null;
			obj.found = null;
			obj.representation = null;
			obj.existence = null;
			obj.existence_type = null;
			obj.line = null;
			obj.column = null;
			obj.permission_operation = null;
			obj.permission_type = null;
			obj.evaluation_type = null;
			if( obj.type === "type_error" || obj.type === "domain_error" ) {
				obj.expected = error.args[0].args[0].id;
				obj.found = error.args[0].args[1].toString();
			} else if( obj.type === "syntax_error" ) {
				if( error.args[1].indicator === "./2" ) {
					obj.expected = error.args[0].args[0].id;
					obj.found = error.args[1].args[1].args[1].args[0];
					obj.found = obj.found.id === "token_not_found" ? obj.found.id : obj.found.args[0].id;
					obj.line = error.args[1].args[0].args[0].value;
					obj.column = error.args[1].args[1].args[0].args[0].value;
				} else {
					obj.thrown = error.args[1].id;
				}
			} else if( obj.type === "permission_error" ) {
				obj.found = error.args[0].args[2].toString();
				obj.permission_operation = error.args[0].args[0].id;
				obj.permission_type = error.args[0].args[1].id;
			} else if( obj.type === "evaluation_error" ) {
				obj.evaluation_type = error.args[0].args[0].id;
			} else if( obj.type === "representation_error" ) {
				obj.representation = error.args[0].args[0].id;
			} else if( obj.type === "existence_error" ) {
				obj.existence = error.args[0].args[1].toString();
				obj.existence_type = error.args[0].args[0].id;
			}
			return obj;
		},
		
		// Create new session
		create: function( limit ) {
			return new pl.type.Session( limit );
		}
		
	};

	// Built-in predicates
	pl.builtin = new Module("system", {

		// TERM AND GOAL EXPANSION

		// goal_expansion/2
		"goal_expansion/2": [
			new Rule(new Term("goal_expansion", [new Term(",", [new Var("X"),new Var("Y")]),new Term(",", [new Var("X_"),new Var("Y_")])]), new Term(";", [new Term(",", [new Term("goal_expansion", [new Var("X"),new Var("X_")]),new Term(";", [new Term("goal_expansion", [new Var("Y"),new Var("Y_")]),new Term("=", [new Var("Y_"),new Var("Y")])])]),new Term(",", [new Term("=", [new Var("X"),new Var("X_")]),new Term("goal_expansion", [new Var("Y"),new Var("Y_")])])])),
			new Rule(new Term("goal_expansion", [new Term(";", [new Var("X"),new Var("Y")]),new Term(";", [new Var("X_"),new Var("Y_")])]), new Term(";", [new Term(",", [new Term("goal_expansion", [new Var("X"),new Var("X_")]),new Term(";", [new Term("goal_expansion", [new Var("Y"),new Var("Y_")]),new Term("=", [new Var("Y_"),new Var("Y")])])]),new Term(",", [new Term("=", [new Var("X"),new Var("X_")]),new Term("goal_expansion", [new Var("Y"),new Var("Y_")])])])),
			new Rule(new Term("goal_expansion", [new Term("->", [new Var("X"),new Var("Y")]),new Term("->", [new Var("X_"),new Var("Y_")])]), new Term(";", [new Term(",", [new Term("goal_expansion", [new Var("X"),new Var("X_")]),new Term(";", [new Term("goal_expansion", [new Var("Y"),new Var("Y_")]),new Term("=", [new Var("Y_"),new Var("Y")])])]),new Term(",", [new Term("=", [new Var("X"),new Var("X_")]),new Term("goal_expansion", [new Var("Y"),new Var("Y_")])])])),
			new Rule(new Term("goal_expansion", [new Term("catch", [new Var("X"),new Var("Y"),new Var("Z")]),new Term("catch", [new Var("X_"),new Var("Y"),new Var("Z_")])]), new Term(";", [new Term(",", [new Term("goal_expansion", [new Var("X"),new Var("X_")]),new Term(";", [new Term("goal_expansion", [new Var("Z"),new Var("Z_")]),new Term("=", [new Var("Z_"),new Var("Z")])])]),new Term(",", [new Term("=", [new Var("X_"),new Var("X")]),new Term("goal_expansion", [new Var("Z"),new Var("Z_")])])])),
			new Rule(new Term("goal_expansion", [new Term("\\+", [new Var("X")]),new Term("\\+", [new Var("X_")])]), new Term(",", [new Term("nonvar", [new Var("X")]),new Term("goal_expansion", [new Var("X"),new Var("X_")])])),
			new Rule(new Term("goal_expansion", [new Term("once", [new Var("X")]),new Term("once", [new Var("X_")])]), new Term(",", [new Term("nonvar", [new Var("X")]),new Term("goal_expansion", [new Var("X"),new Var("X_")])])),
			new Rule(new Term("goal_expansion", [new Term("findall", [new Var("X"),new Var("Y"),new Var("Z")]),new Term("findall", [new Var("X"),new Var("Y_"),new Var("Z")])]), new Term("goal_expansion", [new Var("Y"),new Var("Y_")])),
			new Rule(new Term("goal_expansion", [new Term("setof", [new Var("X"),new Var("Y"),new Var("Z")]),new Term("findall", [new Var("X"),new Var("Y_"),new Var("Z")])]), new Term("goal_expansion", [new Var("Y"),new Var("Y_")])),
			new Rule(new Term("goal_expansion", [new Term("bagof", [new Var("X"),new Var("Y"),new Var("Z")]),new Term("findall", [new Var("X"),new Var("Y_"),new Var("Z")])]), new Term("goal_expansion", [new Var("Y"),new Var("Y_")])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X")]),new Term("call", [new Var("X_")])]), new Term(",", [new Term("nonvar", [new Var("X")]),new Term("goal_expansion", [new Var("X"),new Var("X_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term("[]", [])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1"),new Var("A2")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term(".", [new Var("A2"),new Term("[]", [])])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1"),new Var("A2"),new Var("A3")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term(".", [new Var("A2"),new Term(".", [new Var("A3"),new Term("[]", [])])])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1"),new Var("A2"),new Var("A3"),new Var("A4")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term(".", [new Var("A2"),new Term(".", [new Var("A3"),new Term(".", [new Var("A4"),new Term("[]", [])])])])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1"),new Var("A2"),new Var("A3"),new Var("A4"),new Var("A5")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term(".", [new Var("A2"),new Term(".", [new Var("A3"),new Term(".", [new Var("A4"),new Term(".", [new Var("A5"),new Term("[]", [])])])])])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1"),new Var("A2"),new Var("A3"),new Var("A4"),new Var("A5"),new Var("A6")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term(".", [new Var("A2"),new Term(".", [new Var("A3"),new Term(".", [new Var("A4"),new Term(".", [new Var("A5"),new Term(".", [new Var("A6"),new Term("[]", [])])])])])])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])])),
			new Rule(new Term("goal_expansion", [new Term("call", [new Var("X"),new Var("A1"),new Var("A2"),new Var("A3"),new Var("A4"),new Var("A5"),new Var("A6"),new Var("A7")]),new Term("call", [new Var("F_")])]), new Term(",", [new Term("=..", [new Var("F"),new Term(".", [new Var("X"),new Term(".", [new Var("A1"),new Term(".", [new Var("A2"),new Term(".", [new Var("A3"),new Term(".", [new Var("A4"),new Term(".", [new Var("A5"),new Term(".", [new Var("A6"),new Term(".", [new Var("A7"),new Term("[]", [])])])])])])])])])]),new Term("goal_expansion", [new Var("F"),new Var("F_")])]))
		],



		// ATTRIBUTED VARIABLES
		
		//put_attr/3
		"put_attr/3": function( thread, point, atom ) {
			var variable = atom.args[0], module = atom.args[1], value = atom.args[2];
			if( !pl.type.is_variable(variable) ) {
				thread.throw_error( pl.error.type( "variable", variable, atom.indicator ) );
			} else if( !pl.type.is_atom(module) ) {
				thread.throw_error( pl.error.type( "atom", module, atom.indicator ) );
			} else {
				var subs = point.substitution.set_attribute( variable.id, module, value );
				thread.prepend( [new State( point.goal.replace(null), subs, point )] );
			}
		},

		// get_attr/3
		"get_attr/3": function( thread, point, atom ) {
			var variable = atom.args[0], module = atom.args[1], value = atom.args[2];
			if( !pl.type.is_variable(variable) ) {
				thread.throw_error( pl.error.type( "variable", variable, atom.indicator ) );
			} else if( !pl.type.is_atom(module) ) {
				thread.throw_error( pl.error.type( "atom", module, atom.indicator ) );
			} else {
				var attr = point.substitution.get_attribute( variable.id, module );
				if( attr ) {
					thread.prepend( [new State(
						point.goal.replace( new Term("=", [value, attr]) ),
						point.substitution,
						point
					)] );
				}
			}
		},


		
		// INPUT AND OUTPUT
		
		// op/3
		"op/3": function( thread, point, atom ) {
			var priority = atom.args[0], type = atom.args[1], operators = atom.args[2];
			if(pl.type.is_atom(operators))
				operators = new Term(".", [operators, new Term("[]")]);
			if( pl.type.is_variable( priority ) || pl.type.is_variable( type ) || pl.type.is_variable( operators ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_integer( priority ) ) {
				thread.throw_error( pl.error.type( "integer", priority, atom.indicator ) );
			} else if( !pl.type.is_atom( type ) ) {
				thread.throw_error( pl.error.type( "atom", type, atom.indicator ) );
			} else if( !pl.type.is_list( operators ) ) {
				thread.throw_error( pl.error.type( "list", operators, atom.indicator ) );
			} else {
				var pointer = operators;
				while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
					var operator = pointer.args[0];
					pointer = pointer.args[1];
					if( pl.type.is_variable( operator ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( !pl.type.is_atom( operator ) ) {
						thread.throw_error( pl.error.type( "atom", operator, atom.indicator ) );
						return;
					} else if( priority.value < 0 || priority.value > 1200 ) {
						thread.throw_error( pl.error.domain( "operator_priority", priority, atom.indicator ) );
						return;
					} else if( operator.id === "," ) {
						thread.throw_error( pl.error.permission( "modify", "operator", operator, atom.indicator ) );
						return;
					} else if( operator.id === "{}" ) {
						thread.throw_error( pl.error.permission( "create", "operator", operator, atom.indicator ) );
						return;
					} else if( operator.id === "|" && priority.value !== 0 && (priority.value < 1001 || type.id.length !== 3 ) ) {
						thread.throw_error( pl.error.permission( "create", "operator", operator, atom.indicator ) );
						return;
					} else if( ["fy", "fx", "yf", "xf", "xfx", "yfx", "xfy"].indexOf( type.id ) === -1 ) {
						thread.throw_error( pl.error.domain( "operator_specifier", type, atom.indicator ) );
						return;
					} else {
						var fix = { prefix: null, infix: null, postfix: null };
						for( var p in thread.session.__operators ) {
							if(!thread.session.__operators.hasOwnProperty(p)) continue;
							var classes = thread.session.__operators[p][operator.id];
							if( classes ) {
								if( indexOf( classes, "fx" ) !== -1 ) { fix.prefix = { priority: p, type: "fx" }; }
								if( indexOf( classes, "fy" ) !== -1 ) { fix.prefix = { priority: p, type: "fy" }; }
								if( indexOf( classes, "xf" ) !== -1 ) { fix.postfix = { priority: p, type: "xf" }; }
								if( indexOf( classes, "yf" ) !== -1 ) { fix.postfix = { priority: p, type: "yf" }; }
								if( indexOf( classes, "xfx" ) !== -1 ) { fix.infix = { priority: p, type: "xfx" }; }
								if( indexOf( classes, "xfy" ) !== -1 ) { fix.infix = { priority: p, type: "xfy" }; }
								if( indexOf( classes, "yfx" ) !== -1 ) { fix.infix = { priority: p, type: "yfx" }; }
							}
						}
						var current_class;
						switch( type.id ) {
							case "fy": case "fx": current_class = "prefix"; break;
							case "yf": case "xf": current_class = "postfix"; break;
							default: current_class = "infix"; break;
						}
						if(fix.infix && current_class === "postfix" || fix.postfix && current_class === "infix") {
							thread.throw_error( pl.error.permission( "create", "operator", operator, atom.indicator ) );
							return;
						} else {
							if( fix[current_class] ) {
								remove( thread.session.__operators[fix[current_class].priority][operator.id], fix[current_class].type );
								if( thread.session.__operators[fix[current_class].priority][operator.id].length === 0 ) {
									delete thread.session.__operators[fix[current_class].priority][operator.id];
								}
							}
							if( priority.value > 0 ) {
								if( !thread.session.__operators[priority.value] ) thread.session.__operators[priority.value.toString()] = {};
								if( !thread.session.__operators[priority.value][operator.id] ) thread.session.__operators[priority.value][operator.id] = [];
								thread.session.__operators[priority.value][operator.id].push( type.id );
							}
						}
					}
				}
				if(pl.type.is_variable(pointer)) {
					thread.throw_error( pl.error.instantiation( atom.indicator ) );
					return;
				} else if(!pl.type.is_term(pointer) || pointer.indicator !== "[]/0") {
					thread.throw_error( pl.error.type( "list", operators, atom.indicator ) );
					return;
				} else {
					thread.success(point);
				}
			}
		},
		
		// current_op/3
		"current_op/3": function( thread, point, atom ) {
			var priority = atom.args[0], specifier = atom.args[1], operator = atom.args[2];
			var points = [];
			if( !pl.type.is_variable( priority ) && !pl.type.is_integer( priority ) ) {
				thread.throw_error( pl.error.type( "integer", priority, atom.indicator ) );
			} else if( pl.type.is_integer( priority ) && ( priority.value < 0 || priority.value > 1200 ) ) {
				thread.throw_error( pl.error.domain( "operator_priority", priority, atom.indicator ) );
			} else if( !pl.type.is_variable( specifier ) && !pl.type.is_atom( specifier ) ) {
				thread.throw_error( pl.error.type( "atom", specifier, atom.indicator ) );
			} else if( pl.type.is_atom( specifier ) && indexOf( ["fy", "fx", "yf", "xf", "xfx", "yfx", "xfy"], specifier.id ) === -1 ) {
				thread.throw_error( pl.error.domain( "operator_specifier", specifier, atom.indicator ) );
			} else if( !pl.type.is_variable( operator ) && !pl.type.is_atom( operator ) ) {
				thread.throw_error( pl.error.type( "atom", operator, atom.indicator ) );
			} else {
				for( var p in thread.session.__operators )
					for( var o in thread.session.__operators[p] )
						for( var i = 0; i < thread.session.__operators[p][o].length; i++ )
							points.push( new State(
								point.goal.replace(
									new Term( ",", [
										new Term( "=", [new Num( p, false ), priority] ),
										new Term( ",", [
											new Term( "=", [new Term( thread.session.__operators[p][o][i], [] ), specifier] ),
											new Term( "=", [new Term( o, [] ), operator] )
										] )
									] )
								),
								point.substitution,
								point
							) );
				thread.prepend( points );
			}
		},
	


		// LOGIC AND CONTROL STRUCTURES
	
		// ;/2 (disjunction)
		";/2": function(thread, point, atom) {
			var left = atom.args[0], right = atom.args[1];
			var context_left = left.args[0];
			var free_left = left.indicator === ":/2" ? left.args[1] : left;
			if(pl.type.is_term( free_left ) && free_left.indicator === "->/2") {
				var cond = left.indicator === ":/2" ? new Term(":", [context_left, new Term("call", [free_left.args[0]])]) : free_left.args[0];
				var then = left.indicator === ":/2" ? new Term(":", [context_left, free_left.args[1]]) : free_left.args[1];
				var otherwise = right;
				var goal_fst = point.goal.replace(new Term( ",", [cond, new Term(",", [new Term("!"), then])] ) );
				var goal_snd = point.goal.replace(new Term( ",", [new Term("!"), otherwise]));
				thread.prepend( [
					new State(goal_fst, point.substitution, point),
					new State(goal_snd, point.substitution, point)
				] );
			} else {
				thread.prepend([
					new State(point.goal.replace(left), point.substitution, point),
					new State(point.goal.replace(right), point.substitution, point)
				]);
			}
		},
		
		// !/0 (cut)
		"!/0": function( thread, point, atom ) {
			var parent_cut, last_cut, states = [];
			parent_cut = point;
			last_cut = null;
			while( parent_cut.parent !== null && parent_cut.parent.goal.search( atom ) ) {
				last_cut = parent_cut;
				parent_cut = parent_cut.parent;
				if(parent_cut.goal !== null) {
					var selected = parent_cut.goal.select();
					if(selected && selected.indicator === ":/2")
						selected = selected.args[1];
					if( selected && selected.id === "call" && selected.search(atom) ) {
						parent_cut = last_cut;
						break;
					}
				}
			}
			var setup_call_cleanup = null;
			for( var i = thread.points.length-1; i >= 0; i-- ) {
				var state = thread.points[i];
				var node = state.parent;
				while( node !== null && node !== parent_cut.parent ) {
					node = node.parent;
				}
				if( node === null && node !== parent_cut.parent )
					states.push( state );
				else if(state.setup_call_cleanup_goal)
					setup_call_cleanup = state.setup_call_cleanup_goal;
			}
			thread.points = states.reverse();
			thread.prepend([new State(
				point.goal.replace(setup_call_cleanup),
				point.substitution,
				point
			)]);
		},
		
		// \+ (negation)
		"\\+/1": function( thread, point, atom ) {
			var goal = atom.args[0];
			if( pl.type.is_variable( goal ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_callable( goal ) ) {
				thread.throw_error( pl.error.type( "callable", goal, atom.indicator ) );
			} else {
				// TRANSPARENT VERSION OF THE NEGATION
				/*var neg_thread;
				if(point.negation_thread) {
					neg_thread = point.negation_thread;
				} else {
					neg_thread = new Thread( thread.session );
					neg_thread.add_goal( goal );
					point.negation_thread = neg_thread;
				}
				neg_thread.answer( function( answer ) {
					if(answer === false) {
						thread.success( point );
					} else if(pl.type.is_error( answer )) {
						thread.throw_error( answer.args[0] );
					} else if(answer === null) {
						thread.prepend( [point] );
						thread.current_limit = 0;
					}
					thread.again( answer !== null );
				} );
				return true;*/
				
				// '\+'(X) :- call(X), !, fail.
				// '\+'(_).
				thread.prepend( [
					new State( point.goal.replace( new Term( ",", [new Term( ",", [ new Term( "call", [goal] ), new Term( "!", [] ) ] ), new Term( "fail", [] ) ] ) ), point.substitution, point ),
					new State( point.goal.replace( null ), point.substitution, point )
				] );
			}
		},
		
		// ->/2 (implication)
		"->/2": function( thread, point, atom ) {
			var cond = atom.args[0], then = atom.args[1];
			var goal = point.goal.replace(new Term(",", [
				new Term("call", [cond]),
				new Term(",", [new Term("!"), then])
			]));
			thread.prepend( [new State( goal, point.substitution, point )] );
		},
		
		// fail/0
		"fail/0": function( _1, _2, _3 ) {},
		
		// false/0
		"false/0": function( _1, _2, _3 ) {},
		
		// true/0
		"true/0": function( thread, point, _ ) {
			thread.success( point );
		},
		
		// call/1..8
		"call/1": callN(1),
		"call/2": callN(2),
		"call/3": callN(3),
		"call/4": callN(4),
		"call/5": callN(5),
		"call/6": callN(6),
		"call/7": callN(7),
		"call/8": callN(8),
		
		// once/1
		"once/1": function( thread, point, atom ) {
			var goal = atom.args[0];
			thread.prepend( [new State( point.goal.replace( new Term( ",", [new Term( "call", [goal] ), new Term( "!", [] )] ) ), point.substitution, point )] );
		},
		
		// forall/2
		"forall/2": function( thread, point, atom ) {
			var generate = atom.args[0], test = atom.args[1];
			thread.prepend( [new State( point.goal.replace( new Term( "\\+", [new Term( ",", [new Term( "call", [generate] ), new Term( "\\+", [new Term( "call", [test] )] )] )] ) ), point.substitution, point )] );
		},
		
		// repeat/0
		"repeat/0": function( thread, point, _ ) {
			thread.prepend( [new State( point.goal.replace( null ), point.substitution, point ), point] );
		},

		// EXCEPTIONS
		
		// throw/1
		"throw/1": function( thread, point, atom ) {
			var error = atom.args[0];
			if(pl.type.is_variable(error)) {
				thread.throw_error(pl.error.instantiation(thread.level.indicator));
			} else {
				for(var i = 0; i < thread.points.length; i++) {
					var state = thread.points[i];
					if(state.setup_call_cleanup_catch) {
						thread.points = [new State(
							new Term(",", [
								new Term("catch", [
									state.setup_call_cleanup_catch,
									new Var("_"),
									new Term("throw", [error])
								]),
								new Term("throw", [error])
							]),
							point.substitution,
							point
						)];
						return;
					}
					
				}
				thread.throw_error(error);
			}
		},
		
		// catch/3
		"catch/3": function(thread, point, atom) {
			var goal = atom.args[0], catcher = atom.args[1], recover = atom.args[2];
			var nthread;
			if(!point.catch) {
				nthread = new Thread(thread.session);
				nthread.debugger = thread.debugger;
				nthread.format_success = function(state) { return state.substitution; };
				nthread.format_error = function(state) { return state.goal; };
				nthread.add_goal(goal, true, point);
				point.catch = nthread;
			} else {
				nthread = point.catch;
			}
			var callback = function(answer) {
				if(pl.type.is_error(answer)) {
					var occurs_check = thread.get_flag("occurs_check").indicator === "true/0";
					var state = new State();
					var mgu = pl.unify(answer.args[0], catcher, occurs_check);
					if(mgu !== null) {
						state.substitution = point.substitution.apply(mgu);
						state.goal = point.goal.replace(recover).apply(mgu);
						state.parent = point;
						thread.prepend([state]);
					} else {
						thread.throw_error(answer.args[0]);
					}
				} else if(answer !== false && answer !== null) {
					var state = answer === null ? [] : new State(
						point.goal.apply(answer).replace(null),
						point.substitution.apply(answer),
						point
					);
					thread.prepend([state, point]);
				} else if(answer === null) {
					thread.prepend([point]);
					thread.current_limit = 0;
				}
				thread.again(answer !== null);
			};
			nthread.answer(callback);
			return true;
		},

		// call_cleanup/2
		"call_cleanup/2": function(thread, point, atom) {
			var call = atom.args[0], cleanup = atom.args[1];
			if(pl.type.is_variable(call) || pl.type.is_variable(cleanup)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(call)) {
				thread.throw_error(pl.error.type("callable", call, atom.indicator));
			} else if(!pl.type.is_callable(cleanup)) {
				thread.throw_error(pl.error.type("callable", cleanup, atom.indicator));
			} else {
				var nthread, callback;
				if(point.hasOwnProperty("setup_call_cleanup_thread")) {
					nthread = point.setup_call_cleanup_thread;
					callback = point.setup_call_cleanup_callback;
				} else {
					var goal = new Term("call", [call]);
					nthread = new Thread(thread.session);
					nthread.add_goal(goal, true, point);
					callback = function(answer) {
						if(answer === null) {
							var state = new State(
								point.goal,
								point.substitution,
								point
							);
							state.setup_call_cleanup_thread = nthread;
							state.setup_call_cleanup_callback = callback;
							thread.prepend([state]);
						} else if(answer === false) {
							var cleanup_and_fail = new Term(",", [
								new Term("call", [cleanup]),
								new Term("fail")
							]);
							var state = new State(
								point.goal.replace(cleanup_and_fail),
								point.substitution,
								point
							);
							thread.prepend([state]);
						} else if(pl.type.is_error(answer)) {
							var cleanup_and_throw = new Term(",", [
								new Term("call", [cleanup]),
								answer
							]);
							var state = new State(
								point.goal.replace(cleanup_and_throw),
								point.substitution,
								point
							);
							thread.prepend([state]);
						} else {
							if(nthread.points.length === 0) {
								var state = new State(
									point.goal.replace(
										new Term("call", [cleanup])
									).apply(answer),
									point.substitution.apply(answer),
									point
								);
								thread.prepend([state]);
							} else {
								var state1 = new State(
									point.goal.apply(answer).replace(null),
									point.substitution.apply(answer),
									point
								);
								var state2 = new State(
									point.goal,
									point.substitution,
									point
								);
								state2.setup_call_cleanup_thread = nthread;
								state2.setup_call_cleanup_callback = callback;
								state2.setup_call_cleanup_goal = cleanup.apply(answer);
								state2.setup_call_cleanup_catch = cleanup;
								thread.prepend([state1, state2]);
							}
						}
						thread.again();
					};
				}
				nthread.answer(callback);
				return true;
			}
		},

		// setup_call_cleanup/3
		"setup_call_cleanup/3": function(thread, point, atom) {
			var setup = atom.args[0], call = atom.args[1], cleanup = atom.args[2];
			if(pl.type.is_variable(setup) || pl.type.is_variable(call) || pl.type.is_variable(cleanup)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(setup)) {
				thread.throw_error(pl.error.type("callable", setup, atom.indicator));
			} else if(!pl.type.is_callable(call)) {
				thread.throw_error(pl.error.type("callable", call, atom.indicator));
			} else if(!pl.type.is_callable(cleanup)) {
				thread.throw_error(pl.error.type("callable", cleanup, atom.indicator));
			} else {
				thread.prepend([new State(
					point.goal.replace(new Term(",", [
						new Term("once", [setup]),
						new Term("call_cleanup", [call, cleanup])
					])),
					point.substitution,
					point
				)]);
			}
		},
		
		// UNIFICATION
		
		// =/2 (unification)
		"=/2": function( thread, point, atom ) {
			var occurs_check = thread.get_flag( "occurs_check" ).indicator === "true/0";
			var state = new State();
			var mgu = pl.unify( atom.args[0], atom.args[1], occurs_check );
			if( mgu !== null ) {
				state.goal = point.goal.apply( mgu ).replace( null );
				state.substitution = point.substitution.apply( mgu );
				state.parent = point;
				thread.prepend( [state] );
			}
		},
		
		// unify_with_occurs_check/2
		"unify_with_occurs_check/2": function( thread, point, atom ) {
			var state = new State();
			var mgu = pl.unify( atom.args[0], atom.args[1], true );
			if( mgu !== null ) {
				state.goal = point.goal.apply( mgu ).replace( null );
				state.substitution = point.substitution.apply( mgu );
				state.parent = point;
				thread.prepend( [state] );
			}
		},
		
		// \=/2
		"\\=/2": function( thread, point, atom ) {
			var occurs_check = thread.get_flag( "occurs_check" ).indicator === "true/0";
			var mgu = pl.unify( atom.args[0], atom.args[1], occurs_check );
			if( mgu === null ) {
				thread.success( point );
			}
		},
		
		// subsumes_term/2
		/*
		subsumes_term(General, Specific) :-
			\+ \+ (
			term_variables(Specific, Vars1),
			unify_with_occurs_check(General, Specific),
			term_variables(Vars1, Vars2),
			Vars1 == Vars2
		).
		*/
		"subsumes_term/2": function( thread, point, atom ) {
			var general = atom.args[0], specific = atom.args[1];
			var vars1 = thread.next_free_variable();
			var vars2 = thread.next_free_variable();
			thread.prepend([new State(
				point.goal.replace(new Term("\\+", [
					new Term("\\+", [
						new Term(",", [
							new Term("term_variables", [specific, vars1]),
							new Term(",", [
								new Term("unify_with_occurs_check", [general, specific]),
								new Term(",", [
									new Term("term_variables", [vars1, vars2]),
									new Term("==", [vars1, vars2])
								])
							])
						])
					])
				])),
				point.substitution,
				point
			)]);
		},
		
		// ALL SOLUTIONS

		// findall/3
		"findall/3": function(thread, point, atom) {
			var template = atom.args[0], goal = atom.args[1], instances = atom.args[2];
			var tail = new Term("[]", []);
			thread.prepend([new State(
				point.goal.replace(new Term("findall", [template, goal, instances, tail])),
				point.substitution,
				point
			)]);
		},

		// findall/4
		"findall/4": function(thread, point, atom) {
			var template = atom.args[0], goal = atom.args[1], instances = atom.args[2], tail = atom.args[3];
			if( pl.type.is_variable( goal ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_callable( goal ) ) {
				thread.throw_error( pl.error.type( "callable", goal, atom.indicator ) );
			} else if( !pl.type.is_variable( instances ) && !pl.type.is_list( instances ) ) {
				thread.throw_error( pl.error.type( "list", instances, atom.indicator ) );
			} else {
				if(!pl.type.is_variable(instances)) {
					var pointer = instances;
					while(pl.type.is_term(pointer) && pointer.indicator === "./2")
						pointer = pointer.args[1];
					if(!pl.type.is_variable(pointer) && !pl.type.is_empty_list(pointer)) {
						thread.throw_error(pl.error.type("list", instances, atom.indicator));
						return;
					}
				}
				var variable = thread.next_free_variable();
				var newGoal = new Term( ",", [
					new Term("call", [goal]),
					new Term( "=", [variable, template] )
				]);
				var nthread = new Thread(thread.session);
				nthread.debugger = thread.debugger;
				nthread.format_success = function(state) { return state.substitution; };
				nthread.format_error = function(state) { return state.goal; };
				nthread.add_goal( newGoal, true, point );
				nthread.head_point().parent = point;
				var answers = [];
				var callback = function( answer ) {
					if( answer !== false && answer !== null && !pl.type.is_error( answer ) ) {
						answers.push( answer.links[variable.id] );
						nthread.answer(callback);
					} else {
						var reset_limit = true;
						if( pl.type.is_error( answer ) ) {
							thread.throw_error( answer.args[0] );
						} else if( nthread.current_limit > 0 ) {
							var list = arrayToList(answers, tail);
							thread.prepend( [new State(
								point.goal.replace( new Term( "=", [instances, list] ) ),
								point.substitution,
								point
							)] );
						} else {
							thread.prepend( [point] );
							thread.current_limit = 0;
							reset_limit = false;
						}
						if(reset_limit && nthread.debugger)
							thread.debugger_states = thread.debugger_states.concat(nthread.debugger_states);
						thread.again(reset_limit);
					}
				};
				nthread.answer(callback);
				return true;
			}
		},
		
		// bagof/3
		"bagof/3": function( thread, point, atom ) {
			var template = atom.args[0], goal = atom.args[1], instances = atom.args[2];
			if( pl.type.is_variable( goal ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_callable( goal ) ) {
				thread.throw_error( pl.error.type( "callable", goal, atom.indicator ) );
			} else if( !pl.type.is_variable( instances ) && !pl.type.is_list( instances ) ) {
				thread.throw_error( pl.error.type( "list", instances, atom.indicator ) );
			} else {
				if(!pl.type.is_variable(instances)) {
					var pointer = instances;
					while(pl.type.is_term(pointer) && pointer.indicator === "./2")
						pointer = pointer.args[1];
					if(!pl.type.is_variable(pointer) && !pl.type.is_empty_list(pointer)) {
						thread.throw_error(pl.error.type("list", instances, atom.indicator));
						return;
					}
				}
				var variable = thread.next_free_variable();
				var template_vars = [];
				while( goal.indicator === "^/2" ) {
					template_vars = template_vars.concat(goal.args[0].variables());
					goal = goal.args[1];
				}
				template_vars = template_vars.concat( template.variables() );
				var free_vars = goal.variables().filter( function( v ){
					return indexOf( template_vars, v ) === -1;
				} );
				var list_vars = new Term( "[]" );
				for( var i = free_vars.length - 1; i >= 0; i-- ) {
					list_vars = new Term( ".", [ new Var( free_vars[i] ), list_vars ] );
				}
				var newGoal = new Term( ",", [goal, new Term( "=", [variable, new Term( ",", [list_vars, template] )] )] );
				var nthread = new Thread(thread.session);
				nthread.debugger = thread.debugger;
				nthread.format_success = function(state) { return state.substitution; };
				nthread.format_error = function(state) { return state.goal; };
				nthread.add_goal( newGoal, true, point );
				nthread.head_point().parent = point;
				var answers = [];
				var callback = function( answer ) {
					if( answer !== false && answer !== null && !pl.type.is_error( answer ) ) {
						var match = false;
						var arg_vars = answer.links[variable.id].args[0];
						var arg_template = answer.links[variable.id].args[1];
						var var_template = arg_template.variables();
						var sub_template = new Substitution();
						for(var prop in answer.links) {
							if(!answer.links.hasOwnProperty(prop))
								continue;
							var value = answer.links[prop];
							var index = indexOf(var_template, value.id);
							if(pl.type.is_variable(value) && index !== -1
							&& !sub_template.links.hasOwnProperty(var_template[index])
							&& indexOf(template_vars, prop) === -1
							&& indexOf(free_vars, var_template[index]) === -1) {
								sub_template.add(var_template[index], new Var(prop));
							}
						}
						arg_vars = arg_vars.apply(sub_template);
						arg_template = arg_template.apply(sub_template);
						for( var _elem in answers ) {
							if(!answers.hasOwnProperty(_elem)) continue;
							var elem = answers[_elem];
							if( pl.is_rename(elem.variables, arg_vars) ) {
								elem.answers.push( arg_template );
								match = true;
								break;
							}
						}
						if( !match )
							answers.push( {variables: arg_vars, answers: [arg_template]} );
						nthread.answer(callback);
					} else {
						reset_limit = true;
						if( pl.type.is_error( answer ) ) {
							thread.throw_error( answer.args[0] );
						} else if( thread.current_limit > 0 ) {
							var states = [];
							for( var i = 0; i < answers.length; i++ ) {
								answer = answers[i].answers;
								var list = arrayToList(answer);
								states.push( new State(
									point.goal.replace( new Term( ",", [new Term( "=", [list_vars, answers[i].variables] ), new Term( "=", [instances, list] )] ) ),
									point.substitution,
									point
								) );
							}
							thread.prepend( states );
						} else {
							thread.prepend( [point] );
							thread.current_limit = 0;
							reset_limit = false;
						}
						if(reset_limit && nthread.debugger)
							thread.debugger_states = thread.debugger_states.concat(nthread.debugger_states);
						thread.again(reset_limit);
					}
				};
				nthread.answer(callback);
				return true;
			}
		},

		// setof/3
		"setof/3": function( thread, point, atom ) {
			var template = atom.args[0], goal = atom.args[1], instances = atom.args[2];
			if( pl.type.is_variable( goal ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_callable( goal ) ) {
				thread.throw_error( pl.error.type( "callable", goal, atom.indicator ) );
			} else if( !pl.type.is_variable( instances ) && !pl.type.is_list( instances ) ) {
				thread.throw_error( pl.error.type( "list", instances, atom.indicator ) );
			} else {
				if(!pl.type.is_variable(instances)) {
					var pointer = instances;
					while(pl.type.is_term(pointer) && pointer.indicator === "./2")
						pointer = pointer.args[1];
					if(!pl.type.is_variable(pointer) && !pl.type.is_empty_list(pointer)) {
						thread.throw_error(pl.error.type("list", instances, atom.indicator));
						return;
					}
				}
				var variable = thread.next_free_variable();
				var template_vars = [];
				while( goal.indicator === "^/2" ) {
					template_vars = template_vars.concat(goal.args[0].variables());
					goal = goal.args[1];
				}
				template_vars = template_vars.concat( template.variables() );
				var free_vars = goal.variables().filter( function( v ){
					return indexOf( template_vars, v ) === -1;
				} );
				var list_vars = new Term( "[]" );
				for( var i = free_vars.length - 1; i >= 0; i-- ) {
					list_vars = new Term( ".", [ new Var( free_vars[i] ), list_vars ] );
				}
				var newGoal = new Term( ",", [goal, new Term( "=", [variable, new Term( ",", [list_vars, template] )] )] );
				var nthread = new Thread(thread.session);
				nthread.debugger = thread.debugger;
				nthread.format_success = function(state) { return state.substitution; };
				nthread.format_error = function(state) { return state.goal; };
				nthread.add_goal( newGoal, true, point );
				nthread.head_point().parent = point;
				var answers = [];
				var callback = function( answer ) {
					if( answer !== false && answer !== null && !pl.type.is_error( answer ) ) {
						var match = false;
						var arg_vars = answer.links[variable.id].args[0];
						var arg_template = answer.links[variable.id].args[1];
						var var_template = arg_template.variables();
						var sub_template = new Substitution();
						for(var prop in answer.links) {
							if(!answer.links.hasOwnProperty(prop))
								continue;
							var value = answer.links[prop];
							var index = indexOf(var_template, value.id);
							if(pl.type.is_variable(value) && index !== -1
							&& !sub_template.links.hasOwnProperty(var_template[index])
							&& indexOf(template_vars, prop) === -1
							&& indexOf(free_vars, var_template[index]) === -1) {
								sub_template.add(var_template[index], new Var(prop));
							}
						}
						arg_vars = arg_vars.apply(sub_template);
						arg_template = arg_template.apply(sub_template);
						for( var _elem in answers ) {
							if(!answers.hasOwnProperty(_elem)) continue;
							var elem = answers[_elem];
							if( pl.is_rename(elem.variables, arg_vars) ) {
								elem.answers.push( arg_template );
								match = true;
								break;
							}
						}
						if( !match )
							answers.push( {variables: arg_vars, answers: [arg_template]} );
						nthread.answer(callback);
					} else {
						reset_limit = true;
						if( pl.type.is_error( answer ) ) {
							thread.throw_error( answer.args[0] );
						} else if( thread.current_limit > 0 ) {
							var states = [];
							for( var i = 0; i < answers.length; i++ ) {
								var arr_sorted = answers[i].answers.sort( pl.compare );
								var arr_filter = [];
								var last = null;
								for(var j = 0; j < arr_sorted.length; j++) {
									if(!last || pl.compare(last, arr_sorted[j]) !== 0) {
										last = arr_sorted[j];
										arr_filter.push(last);
									}
								}
								var list = arrayToList(arr_filter);
								states.push( new State(
									point.goal.replace( new Term( ",", [new Term( "=", [list_vars, answers[i].variables] ), new Term( "=", [instances, list] )] ) ),
									point.substitution,
									point
								) );
							}
							thread.prepend( states );
						} else {
							thread.prepend( [point] );
							thread.current_limit = 0;
							reset_limit = false;
						}
						if(reset_limit && nthread.debugger)
							thread.debugger_states = thread.debugger_states.concat(nthread.debugger_states);
						thread.again(reset_limit);
					}
				};
				nthread.answer(callback);
				return true;
			}
		},
		
		// TERM CREATION AND DECOMPOSITION
		
		// functor/3
		"functor/3": function( thread, point, atom ) {
			var term = atom.args[0], name = atom.args[1], arity = atom.args[2];
			if( pl.type.is_variable( term ) && (pl.type.is_variable( name ) || pl.type.is_variable( arity )) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( arity ) && !pl.type.is_integer( arity ) ) {
				thread.throw_error( pl.error.type( "integer", atom.args[2], atom.indicator ) );
			} else if( !pl.type.is_variable( name ) && !pl.type.is_atomic( name ) ) {
				thread.throw_error( pl.error.type( "atomic", atom.args[1], atom.indicator ) );
			} else if( pl.type.is_variable( term ) && !pl.type.is_atom( name ) && pl.type.is_integer( arity ) && arity.value > 0 ) {
				thread.throw_error( pl.error.type( "atom", atom.args[1], atom.indicator ) );
			} else if( pl.type.is_variable( term ) && pl.type.is_integer( arity ) && arity.value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", atom.args[2], atom.indicator ) );
			} else if( pl.type.is_variable( term ) ) {
				if( atom.args[2].value >= 0 ) {
					var args = [];
					for( var i = 0; i < arity.value; i++ )
						args.push( thread.next_free_variable() );
					var functor = pl.type.is_number( name ) ? name : new Term( name.id, args );
					thread.prepend( [new State( point.goal.replace( new Term( "=", [term, functor] ) ), point.substitution, point )] );
				}
			} else {
				var id = pl.type.is_number( term ) ? term : new Term( term.id, [] );
				var length = pl.type.is_number( term ) ? new Num( 0, false ) : new Num( term.args.length, false );
				var goal = new Term( ",", [new Term( "=", [id, name] ), new Term( "=", [length, arity] )] );
				thread.prepend( [new State( point.goal.replace( goal ), point.substitution, point )] );
			}
		},
		
		// arg/3
		"arg/3": function( thread, point, atom ) {
			if( pl.type.is_variable( atom.args[0] ) || pl.type.is_variable( atom.args[1] ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_integer( atom.args[0] ) ) {
				thread.throw_error( pl.error.type( "integer", atom.args[0], atom.indicator ) );
			} else if( atom.args[0].value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", atom.args[0], atom.indicator ) );
			} else if( !pl.type.is_compound( atom.args[1] ) ) {
				thread.throw_error( pl.error.type( "compound", atom.args[1], atom.indicator ) );
			} else {
				var n = atom.args[0].value;
				if( n > 0 && n <= atom.args[1].args.length ) {
					var goal = new Term( "=", [atom.args[1].args[n-1], atom.args[2]] );
					thread.prepend( [new State( point.goal.replace( goal ), point.substitution, point )] );
				}
			}
		},
		
		// =../2 (univ)
		"=../2": function( thread, point, atom ) {
			var list;
			if( pl.type.is_variable( atom.args[0] ) && (pl.type.is_variable( atom.args[1] )
			|| pl.type.is_non_empty_list( atom.args[1] ) && pl.type.is_variable( atom.args[1].args[0] )) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_fully_list( atom.args[1] ) ) {
				thread.throw_error( pl.error.type( "list", atom.args[1], atom.indicator ) );
			} else if( pl.type.is_variable( atom.args[0] ) && pl.type.is_empty_list( atom.args[1] ) ) {
				thread.throw_error( pl.error.domain( "non_empty_list", atom.args[1], atom.indicator ) );
			} else if( !pl.type.is_variable( atom.args[0] ) ) {
				if( pl.type.is_atomic( atom.args[0] ) ) {
					list = new Term( ".", [atom.args[0], new Term( "[]" )] );
				} else {
					list = new Term( "[]" );
					for( var i = atom.args[0].args.length - 1; i >= 0; i-- ) {
						list = new Term( ".", [atom.args[0].args[i], list] );
					}
					list = new Term( ".", [new Term( atom.args[0].id ), list] );
				}
				thread.prepend( [new State( point.goal.replace( new Term( "=", [list, atom.args[1]] ) ), point.substitution, point )] );
			} else if( !pl.type.is_variable( atom.args[1] ) ) {
				var args = [];
				list = atom.args[1].args[1];
				while( list.indicator === "./2" ) {
					args.push( list.args[0] );
					list = list.args[1];
				}
				if( pl.type.is_variable( atom.args[0] ) && pl.type.is_variable( list ) ) {
					thread.throw_error( pl.error.instantiation( atom.indicator ) );
				} else if( args.length === 0 && pl.type.is_compound( atom.args[1].args[0] ) ) {
					thread.throw_error( pl.error.type( "atomic", atom.args[1].args[0], atom.indicator ) );
				} else if( args.length > 0 && (pl.type.is_compound( atom.args[1].args[0] ) || pl.type.is_number( atom.args[1].args[0] )) ) {
					thread.throw_error( pl.error.type( "atom", atom.args[1].args[0], atom.indicator ) );
				} else {
					if( args.length === 0 ) {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [atom.args[1].args[0], atom.args[0]], point ) ), point.substitution, point )] );
					} else {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [new Term( atom.args[1].args[0].id, args ), atom.args[0]] ) ), point.substitution, point )] );
					}
				}
			}
		},
		
		// copy_term/2
		"copy_term/2": function( thread, point, atom ) {
			thread.session.renamed_variables = {};
			var renamed = atom.args[0].rename( thread );
			thread.prepend( [new State( point.goal.replace( new Term( "=", [renamed, atom.args[1]] ) ), point.substitution, point.parent )] );
		},
		
		// term_variables/2
		"term_variables/2": function( thread, point, atom ) {
			var term = atom.args[0], vars = atom.args[1];
			if( !pl.type.is_fully_list( vars ) ) {
				thread.throw_error( pl.error.type( "list", vars, atom.indicator ) );
			} else {
				var list = arrayToList( map( nub( term.variables() ), function(v) {
					return new Var(v);
				} ) );
				thread.prepend( [new State( point.goal.replace( new Term( "=", [vars, list] ) ), point.substitution, point )] );
			}
		},

		// numbervars/3
		"numbervars/3": function(thread, point, atom) {
			var term = atom.args[0], start = atom.args[1], end = atom.args[2];
			if(pl.type.is_variable(start)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_integer(start)) {
				thread.throw_error(pl.error.type("integer", start, atom.indicator));
			} else if(!pl.type.is_variable(end) && !pl.type.is_integer(end)) {
				thread.throw_error(pl.error.type("integer", end, atom.indicator));
			} else {
				var variables = nub(term.variables());
				var value = start.value;
				var unif_body = new Term("true");
				for(var i = 0; i < variables.length; i++) {
					unif_body = new Term(",", [
						new Term("=", [
							new Var(variables[i]),
							new Term("$VAR", [new Num(value, false)])]),
							unif_body]);
					value++;
				}
				var unif_end = new Term("=", [end, new Num(value, false)]);
				if(pl.type.is_variable(end) || end.value === value) {
					thread.prepend([new State(
						point.goal.replace(new Term(",", [unif_body, unif_end])),
						point.substitution,
						point
					)]);
				}
			}
		},
		
		// CLAUSE RETRIEVAL AND INFORMATION
		
		// clause/2
		"clause/2": function(thread, point, atom) {
			var head = atom.args[0], body = atom.args[1];
			var module_id = "user";
			if(pl.type.is_term(head) && head.indicator === ":/2") {
				if(!pl.type.is_atom(head.args[0])) {
					thread.throw_error(pl.error.type("module", head.args[0], atom.indicator));
					return;
				}
				module_id = head.args[0].id;
				head = head.args[1];
			}
			var get_module = thread.session.modules[module_id];
			if(pl.type.is_variable(head)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(head)) {
				thread.throw_error(pl.error.type("callable", head, atom.indicator));
			} else if(!pl.type.is_variable(body) && !pl.type.is_callable(body)) {
				thread.throw_error(pl.error.type("callable", body, atom.indicator));
			} else if(head.indicator === ",/2" || thread.session.modules.system.rules.hasOwnProperty(head.indicator)) {
				thread.throw_error(pl.error.permission("access", "private_procedure", str_indicator(head.indicator), atom.indicator));
			} else if(pl.type.is_module(get_module) && get_module.rules[head.indicator]) {
				if(get_module.is_public_predicate(head.indicator)) {
					var states = [];
					if(typeof get_module.rules[head.indicator] === "function") {
						thread.throw_error(pl.error.permission("modify", "static_procedure", str_indicator(head.indicator), atom.indicator));
						return;
					}
					for(var i = 0; i < get_module.rules[head.indicator].length; i++) {
						var rule = get_module.rules[head.indicator][i];
						thread.session.renamed_variables = {};
						rule = rule.rename(thread);
						if(rule.body === null)
							rule.body = new Term("true");
						var goal = new Term(",", [
							new Term("=", [rule.head, head]),
							new Term("=", [rule.body, body])
						]);
						states.push(new State(point.goal.replace(goal), point.substitution, point));
					}
					thread.prepend(states);
				} else {
					thread.throw_error(pl.error.permission("access", "private_procedure", str_indicator(head.indicator), atom.indicator));
				}
			}
		},
		
		// current_predicate/1
		"current_predicate/1": function(thread, point, atom) {
			var indicator = atom.args[0];
			var module_id;
			if(pl.type.is_term(indicator) && indicator.indicator === ":/2") {
				if(!pl.type.is_atom(indicator.args[0])) {
					thread.throw_error(pl.error.type("module", indicator.args[0], atom.indicator));
					return;
				}
				module_id = indicator.args[0].id;
				indicator = indicator.args[1];
			} else {
				module_id = "user";
			}
			if(!pl.type.is_variable(indicator) && (!pl.type.is_compound(indicator) || indicator.indicator !== "//2")) {
				thread.throw_error(pl.error.type( "predicate_indicator", indicator, atom.indicator));
			} else if(!pl.type.is_variable( indicator ) && !pl.type.is_variable(indicator.args[0]) && !pl.type.is_atom(indicator.args[0])) {
				thread.throw_error(pl.error.type( "atom", indicator.args[0], atom.indicator));
			} else if(!pl.type.is_variable(indicator) && !pl.type.is_variable(indicator.args[1]) && !pl.type.is_integer(indicator.args[1])) {
				thread.throw_error(pl.error.type("integer", indicator.args[1], atom.indicator));
			} else if(!pl.type.is_variable(indicator) && pl.type.is_integer(indicator.args[1]) && indicator.args[1].value < 0) {
				thread.throw_error(pl.error.domain("not_less_than_zero", indicator.args[1], atom.indicator));
			} else {
				var states = [];
				var get_module = thread.session.modules[module_id];
				if(pl.type.is_module(get_module)) {
					for(var prop in get_module.rules) {
						if(!get_module.rules.hasOwnProperty(prop))
							continue;
						var predicate = str_indicator(prop);
						var goal = new Term("=", [predicate, indicator]);
						states.push(new State(point.goal.replace(goal), point.substitution, point));
					}
					thread.prepend(states);
				}
			}
		},

		// current_module/1
		"current_module/1": function(thread, point, atom) {
			var module_id = atom.args[0];
			if(!pl.type.is_variable(module_id) && !pl.type.is_atom(module_id)) {
				thread.throw_error(pl.error.type("atom", module_id, atom.indicator));
			} else {
				if(pl.type.is_variable(module_id)) {
					var states = [];
					for(var prop in thread.session.modules) {
						if(!thread.session.modules.hasOwnProperty(prop))
							continue;
						states.push(new State(
							point.goal.replace(new Term("=", [module_id, new Term(prop)])),
							point.substitution,
							point
						));
					}
					thread.prepend(states);
				} else {
					if(thread.session.modules.hasOwnProperty(module_id.id))
						thread.success(point);
				}
			}
		},

		// predicate_property/2
		"predicate_property/2": function(thread, point, atom) {
			var head = atom.args[0], property = atom.args[1];
			var module_id;
			if(pl.type.is_term(head) && head.indicator === ":/2") {
				if(!pl.type.is_atom(head.args[0])) {
					thread.throw_error(pl.error.type("module", head.args[0], atom.indicator));
					return;
				}
				module_id = head.args[0].id;
				head = head.args[1];
			}
			if(!pl.type.is_variable(head) && !pl.type.is_callable(head)) {
				thread.throw_error(pl.error.type("callable", head, atom.indicator));
			} else if(!pl.type.is_variable(property) && !pl.type.is_predicate_property(property)) {
				thread.throw_error(pl.error.domain("predicate_property", property, atom.indicator));
			} else {
				var get_module = module_id ? thread.session.modules[module_id] : thread.session.modules.user;
				var points = [];
				// all predicates
				if(pl.type.is_variable(head)) {
					// built-in predicates (built_in + static + native_code + meta_predicate?)
					if(!module_id) {
						for(var prop in pl.builtin.rules) {
							if(!pl.builtin.rules.hasOwnProperty(prop))
								continue;
							var indicator = str_indicator(prop);
							var args = [];
							for(var i = 0; i < indicator.args[1].value; i++)
								args.push(thread.next_free_variable());
							var unif_head = new Term(indicator.args[0].id, args);
							var current_properties = [
								new Term("static"),
								new Term("built_in"),
								new Term("native_code")
							];
							if(pl.builtin.meta_predicates.hasOwnProperty(prop))
								current_properties.push(new Term("meta_predicate", [
									pl.builtin.meta_predicates[prop]
								]));
							// all predicates, one property / all properties
							for(var i = 0; i < current_properties.length; i++) {
								if(pl.type.is_variable(property) || current_properties[i].indicator === property.indicator) {
									points.push(new State(
										point.goal.replace(new Term(",", [
											new Term("=", [head, unif_head]),
											new Term("=", [property, current_properties[i]])
										])),
										point.substitution,
										point
									));
								}
							}
						}
					}
					// user-defined predicates
					if(pl.type.is_module(get_module)) {
						for(var prop in get_module.rules) {
							if(!get_module.rules.hasOwnProperty(prop))
								continue;
							var indicator = str_indicator(prop);
							var args = [];
							for(var i = 0; i < indicator.args[1].value; i++)
								args.push(thread.next_free_variable());
							var unif_head = new Term(indicator.args[0].id, args);
							var current_properties = [];
							if(thread.is_public_predicate(prop, module_id))
								current_properties.push(new Term("dynamic"));
							else
								current_properties.push(new Term("static"));
							if(get_module.rules[prop] instanceof Function)
								current_properties.push(new Term("native_code"));
							if(thread.is_multifile_predicate(prop, module_id))
								current_properties.push(new Term("multifile"));
							if(get_module.meta_predicates.hasOwnProperty(prop))
								current_properties.push(new Term("meta_predicate", [
									get_module.meta_predicates[prop]
								]));
							// all predicates, one property / all properties
							for(var i = 0; i < current_properties.length; i++) {
								if(pl.type.is_variable(property) || current_properties[i].indicator === property.indicator) {
									points.push(new State(
										point.goal.replace(new Term(",", [
											new Term("=", [head, unif_head]),
											new Term("=", [property, current_properties[i]])
										])),
										point.substitution,
										point
									));
								}
							}
						}
					}
				// one predicate
				} else {
					var builtin = !module_id && pl.type.is_builtin(head);
					var predicate = builtin ? pl.builtin.rules[head.indicator] : get_module.rules[head.indicator];
					get_module = builtin ? pl.builtin : get_module;
					if(predicate) {
						var current_properties;
						if(builtin) {
							current_properties = [
								new Term("static"),
								new Term("built_in"),
								new Term("native_code")
							];
						} else {
							current_properties = [];
							if(thread.is_public_predicate(head.indicator, module_id))
								current_properties.push(new Term("dynamic"));
							else
								current_properties.push(new Term("static"));
							if(predicate instanceof Function)
								current_properties.push(new Term("native_code"));
							if(thread.is_multifile_predicate(head.indicator, module_id))
								current_properties.push(new Term("multifile"));
						}
						if(get_module.meta_predicates.hasOwnProperty(head.indicator))
							current_properties.push(new Term("meta_predicate", [
								get_module.meta_predicates[head.indicator]
							]));
						var args = [];
						for(var i = 0; i < head.args.length; i++)
							args.push(thread.next_free_variable());
						var unif_head = new Term(head.id, args);
						// one predicate, one property / all properties
						for(var i = 0; i < current_properties.length; i++) {
							if(pl.type.is_variable(property) || current_properties[i].indicator === property.indicator) {
								points.push(new State(
									point.goal.replace(new Term(",", [
										new Term("=", [head, unif_head]),
										new Term("=", [property, current_properties[i]])
									])),
									point.substitution,
									point
								));
							}
						}
					}
				}
				thread.prepend(points);
			}
		},

		// listing/0
		"listing/0": function( thread, point, atom ) {
			var from_module = atom.from_module ? atom.from_module : "user";
			var rules = {};
			if(pl.type.is_module(thread.session.modules[from_module])) {
				rules = thread.session.modules[from_module].rules;
			}
			var str = "";
			for(var indicator in rules) {
				if(!rules.hasOwnProperty(indicator)) continue;
				var predicate = rules[indicator];
				str += "% " + indicator + "\n";
				if(predicate instanceof Array) {
					for(var i = 0; i < predicate.length; i++)
						str += predicate[i].toString( {session: thread.session} ) + "\n";
				} else {
					str += "/*\n" + predicate.toString() + "\n*/";
				}
				str += "\n";
			}
			thread.prepend( [new State(
				point.goal.replace(new Term("write", [new Term(str, [])])),
				point.substitution,
				point
			)] );
		},

		// listing/1
		"listing/1": function( thread, point, atom ) {
			var indicator = atom.args[0];
			if(pl.type.is_variable(indicator)) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if(!pl.type.is_predicate_indicator(indicator)) {
				thread.throw_error( pl.error.type( "predicate_indicator", indicator, atom.indicator ) );
			} else {
				var from_module = atom.from_module ? atom.from_module : "user";
				var rules = {};
				if(pl.type.is_module(thread.session.modules[from_module])) {
					rules = thread.session.modules[from_module].rules;
				}
				var str = "";
				var str_indicator = indicator.args[0].id + "/" + indicator.args[1].value;
				if(rules.hasOwnProperty(str_indicator)) {
					var predicate = rules[str_indicator];
					if(predicate instanceof Array) {
						for(var i = 0; i < predicate.length; i++)
							str += predicate[i].toString( {session: thread.session} ) + "\n";
					} else {
						str += "/*\n" + predicate.toString() + "\n*/";
					}
					str += "\n";
				}
				thread.prepend( [new State(
					point.goal.replace(new Term("write", [new Term(str, [])])),
					point.substitution,
					point
				)] );
			}
		},

		// LIST OPERATIONS

		// sort/2
		"sort/2": function( thread, point, atom ) {
			var list = atom.args[0], expected = atom.args[1];
			if( pl.type.is_variable( list ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( expected ) && !pl.type.is_fully_list( expected ) ) {
				thread.throw_error( pl.error.type( "list", expected, atom.indicator ) );
			} else {
				var arr = [];
				var pointer = list;
				while( pointer.indicator === "./2" ) {
					arr.push( pointer.args[0] );
					pointer = pointer.args[1];
				}
				if( pl.type.is_variable( pointer ) ) {
					thread.throw_error( pl.error.instantiation( atom.indicator ) );
				} else if( !pl.type.is_empty_list( pointer ) ) {
					thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
				} else {
					var sorted_arr = arr.sort( pl.compare );
					for( var i = sorted_arr.length-1; i > 0; i-- ) {
						if( sorted_arr[i].equals(sorted_arr[i-1]) )
							sorted_arr.splice(i,1);
					}
					var sorted_list = new Term( "[]" );
					for( var i = sorted_arr.length-1; i >= 0; i-- ) {
						sorted_list = new Term( ".", [sorted_arr[i], sorted_list] );
					}
					thread.prepend( [new State( point.goal.replace( new Term( "=", [sorted_list, expected] ) ), point.substitution, point )] );
				}
			}
		},

		// keysort/2
		"keysort/2": function( thread, point, atom ) {
			var list = atom.args[0], expected = atom.args[1];
			if( pl.type.is_variable( list ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( expected ) && !pl.type.is_fully_list( expected ) ) {
				thread.throw_error( pl.error.type( "list", expected, atom.indicator ) );
			} else {
				var arr = [];
				var elem;
				var pointer = list;
				while( pointer.indicator === "./2" ) {
					elem = pointer.args[0];
					if( pl.type.is_variable( elem ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( !pl.type.is_term( elem ) || elem.indicator !== "-/2" ) {
						thread.throw_error( pl.error.type( "pair", elem, atom.indicator ) );
						return;
					}
					elem.args[0].pair = elem.args[1];
					arr.push( elem.args[0] );
					pointer = pointer.args[1];
				}
				if( pl.type.is_variable( pointer ) ) {
					thread.throw_error( pl.error.instantiation( atom.indicator ) );
				} else if( !pl.type.is_empty_list( pointer ) ) {
					thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
				} else {
					if(!pl.type.is_variable(expected)) {
						var pointer = expected;
						while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
							var head = pointer.args[0];
							if(!pl.type.is_variable(head) && (!pl.type.is_term(head) || head.indicator !== "-/2")) {
								thread.throw_error( pl.error.type( "pair", head, atom.indicator ) );
								return;
							}
							pointer = pointer.args[1];
						}
						if(!pl.type.is_variable(pointer) && !pl.type.is_empty_list(pointer)) {
							thread.throw_error( pl.error.type( "list", expected, atom.indicator ) );
							return;
						}
					}
					var sorted_arr = arr.sort( pl.compare );
					var sorted_list = new pl.type.Term( "[]" );
					for( var i = sorted_arr.length - 1; i >= 0; i-- ) {
						sorted_list = new pl.type.Term( ".", [new pl.type.Term( "-", [sorted_arr[i], sorted_arr[i].pair] ), sorted_list] );
						delete sorted_arr[i].pair;
					}
					thread.prepend( [new pl.type.State( point.goal.replace( new pl.type.Term( "=", [sorted_list, expected] ) ), point.substitution, point )] );
				}
			}
		},
		
		// CLAUSE CREATION AND DESTRUCTION
		
		// asserta/1
		"asserta/1": function(thread, point, atom) {
			var clause = atom.args[0];
			var module_id = "user";
			if(pl.type.is_term(clause) && clause.indicator === ":/2") {
				module_id = clause.args[0].id;
				clause = clause.args[1];
			}
			if(pl.type.is_variable(clause)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(clause)) {
				thread.throw_error(pl.error.type("callable", clause, atom.indicator));
			} else {
				var head, body, get_module;
				if(clause.indicator === ":-/2") {
					head = clause.args[0];
					body = body_conversion(clause.args[1]);
				} else {
					head = clause;
					body = null;
				}
				if(pl.type.is_variable(head)) {
					thread.throw_error(pl.error.instantiation(atom.indicator));
				} else if(!pl.type.is_callable(head)) {
					thread.throw_error(pl.error.type("callable", head, atom.indicator));
				} else if(body !== null && !pl.type.is_callable(body)) {
					thread.throw_error( pl.error.type("callable", body, atom.indicator));
				} else if((!pl.type.is_module(thread.session.modules[module_id])
				|| thread.is_public_predicate(head.indicator, module_id))
				&& head.indicator !== ",/2"
				&& !thread.session.modules.system.rules.hasOwnProperty(head.indicator)) {
					if(!pl.type.is_module(thread.session.modules[module_id])) {
						get_module = new Module(module_id, {}, "all", {session: thread.session});
						thread.session.modules[module_id] = get_module;
					} else {
						get_module = thread.session.modules[module_id];
					}
					if(get_module.rules[head.indicator] === undefined)
						get_module.rules[head.indicator] = [];
					get_module.public_predicates[head.indicator] = true;
					get_module.rules[head.indicator] = [new Rule(head, body, true)].concat(get_module.rules[head.indicator]);
					thread.success(point);
				} else {
					thread.throw_error(pl.error.permission("modify", "static_procedure", str_indicator(head.indicator), atom.indicator));
				}
			}
		},
		
		// assertz/1
		"assertz/1": function(thread, point, atom) {
			var clause = atom.args[0];
			var module_id = "user";
			if(pl.type.is_term(clause) && clause.indicator === ":/2") {
				module_id = clause.args[0].id;
				clause = clause.args[1];
			}
			if(pl.type.is_variable(clause)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(clause)) {
				thread.throw_error(pl.error.type("callable", clause, atom.indicator));
			} else {
				var head, body, get_module;
				if(clause.indicator === ":-/2") {
					head = clause.args[0];
					body = body_conversion(clause.args[1]);
				} else {
					head = clause;
					body = null;
				}
				if(pl.type.is_variable(head)) {
					thread.throw_error(pl.error.instantiation(atom.indicator));
				} else if(!pl.type.is_callable(head)) {
					thread.throw_error(pl.error.type("callable", head, atom.indicator));
				} else if(body !== null && !pl.type.is_callable(body)) {
					thread.throw_error( pl.error.type("callable", body, atom.indicator));
				} else if((!pl.type.is_module(thread.session.modules[module_id])
				|| thread.is_public_predicate(head.indicator, module_id))
				&& head.indicator !== ",/2"
				&& !thread.session.modules.system.rules.hasOwnProperty(head.indicator)) {
					if(!pl.type.is_module(thread.session.modules[module_id])) {
						get_module = new Module(module_id, {}, "all", {session: thread.session});
						thread.session.modules[module_id] = get_module;
					} else {
						get_module = thread.session.modules[module_id];
					}
					if(get_module.rules[head.indicator] === undefined)
						get_module.rules[head.indicator] = [];
					get_module.public_predicates[head.indicator] = true;
					get_module.rules[head.indicator].push(new Rule(head, body, true));
					thread.success(point);
				} else {
					thread.throw_error(pl.error.permission("modify", "static_procedure", str_indicator(head.indicator), atom.indicator));
				}
			}
		},
		
		// retract/1
		"retract/1": function(thread, point, atom) {
			var clause = atom.args[0];
			if(pl.type.is_variable(clause)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(clause)) {
				thread.throw_error(pl.error.type("callable", clause, atom.indicator));
			} else {
				var head, body, module_atom, module_id;
				if(clause.indicator === ":/2") {
					module_atom = clause.args[0];
					clause = clause.args[1];
					if(!pl.type.is_atom(module_atom)) {
						thread.throw_error(pl.error.type("module", module_atom, atom.indicator));
						return;
					}
				} else {
					module_atom = new Term("user");
				}
				if(clause.indicator === ":-/2") {
					head = clause.args[0];
					body = clause.args[1];
				} else {
					head = clause;
					body = new Term("true");
				}
				if(pl.type.is_variable(head)) {
					thread.throw_error(pl.error.instantiation(atom.indicator));
					return;
				} else if(!pl.type.is_callable(head)) {
					thread.throw_error(pl.error.type("callable", head, atom.indicator));
					return;
				}
				module_id = module_atom.id;
				var get_module = thread.session.modules[module_id];
				if(!pl.type.is_module(get_module))
					return;
				if(!point.retract) {
					if(thread.is_public_predicate(head.indicator, module_id)
					&& head.indicator !== ",/2"
					&& !thread.session.modules.system.rules.hasOwnProperty(head.indicator)) {
						if(get_module.rules[head.indicator] !== undefined) {
							var states = [];
							if(typeof get_module.rules[head.indicator] === "function") {
								thread.throw_error(pl.error.permission("modify", "static_procedure", str_indicator(head.indicator), atom.indicator));
								return;
							}
							for(var i = 0; i < get_module.rules[head.indicator].length; i++) {
								thread.session.renamed_variables = {};
								var orule = get_module.rules[head.indicator][i];
								var rule = orule.rename(thread);
								if(rule.body === null)
									rule.body = new Term("true", []);
								var occurs_check = thread.get_flag("occurs_check").indicator === "true/0";
								var mgu = pl.unify(new Term(",", [head, body]), new Term(",", [rule.head, rule.body]), occurs_check);
								if(mgu !== null) {
									var state = new State(
										point.goal.replace(new Term(",", [
											new Term(":", [
												module_atom,
												new Term("retract", [new Term(":-", [head, body])]),
											]),
											new Term(",", [
												new Term("=", [head, rule.head]),
												new Term("=", [body, rule.body])
											])
										])), point.substitution, point);
									state.retract = orule;
									states.push(state);
								}
							}
							thread.prepend(states);
						}
					} else {
						thread.throw_error(pl.error.permission("modify", "static_procedure", str_indicator(head.indicator), atom.indicator));
					}
				} else {
					retract(thread, point, head.indicator, point.retract, get_module);
				}
			}
		},
		
		// retractall/1
		"retractall/1": function(thread, point, atom) {
			var head = atom.args[0];
			var context_module = "user";
			if(pl.type.is_term(head) && head.indicator === ":/2") {
				context_module = head.args[0].id;
				head = head.args[1];
			}
			if(pl.type.is_variable(head)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_callable(head)) {
				thread.throw_error(pl.error.type("callable", head, atom.indicator));
			} else if(!thread.is_public_predicate(head.indicator, context_module)
			|| head.indicator === ",/2"
			|| thread.session.modules.system.rules.hasOwnProperty(head.indicator)) {
				thread.throw_error(pl.error.permission("modify", "static_procedure", str_indicator(head.indicator), atom.indicator));
			} else {
				thread.prepend([
					new State(point.goal.replace(new Term(",", [
						new Term(":", [
							new Term(context_module),
							new Term("retract", [new pl.type.Term(":-", [head, new Var("_")])])
						]),
						new Term("fail", [])
					])), point.substitution, point),
					new State(point.goal.replace(null), point.substitution, point)
				]);
			}
		},

		// abolish/1
		"abolish/1": function(thread, point, atom) {
			var predicate = atom.args[0];
			var module_id;
			if(pl.type.is_term(predicate) && predicate.indicator === ":/2") {
				if(!pl.type.is_atom(predicate.args[0])) {
					thread.throw_error(pl.error.type("module", predicate.args[0], atom.indicator));
					return;
				}
				module_id = predicate.args[0].id;
				predicate = predicate.args[1];
			} else {
				module_id = "user";
			}
			if(pl.type.is_variable(predicate) || pl.type.is_term(predicate) && predicate.indicator === "//2"
			&& (pl.type.is_variable(predicate.args[0]) || pl.type.is_variable(predicate.args[1]))) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_term(predicate) || predicate.indicator !== "//2") {
				thread.throw_error(pl.error.type("predicate_indicator", predicate, atom.indicator));
			} else if(!pl.type.is_atom(predicate.args[0])) {
				thread.throw_error(pl.error.type("atom", predicate.args[0], atom.indicator));
			} else if(!pl.type.is_integer(predicate.args[1])) {
				thread.throw_error(pl.error.type("integer", predicate.args[1], atom.indicator));
			} else if(predicate.args[1].value < 0) {
				thread.throw_error(pl.error.domain("not_less_than_zero", predicate.args[1], atom.indicator));
			} else if(pl.type.is_number(thread.get_flag("max_arity")) && predicate.args[1].value > thread.get_flag("max_arity").value) {
				thread.throw_error(pl.error.representation("max_arity", atom.indicator));
			} else {
				var get_module = thread.session.modules[module_id];
				if(pl.type.is_module(get_module)) {
					var indicator = predicate.args[0].id + "/" + predicate.args[1].value;
					if(thread.is_public_predicate(indicator, module_id)
					&& indicator !== ",/2"
					&& !thread.session.modules.system.rules.hasOwnProperty(indicator)) {
						delete get_module.rules[indicator];
						delete get_module.public_predicates[indicator];
						delete get_module.multifile_predicates[indicator];
						thread.success(point);
					} else {
						thread.throw_error(pl.error.permission("modify", "static_procedure", atom.args[0], atom.indicator));
					}
				} else {
					thread.success(point);
				}
			}
		},
		
		// ATOM PROCESSING
		
		// atom_length/2
		"atom_length/2": function( thread, point, atom ) {
			if( pl.type.is_variable( atom.args[0] ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_atom( atom.args[0] ) ) {
				thread.throw_error( pl.error.type( "atom", atom.args[0], atom.indicator ) );
			} else if( !pl.type.is_variable( atom.args[1] ) && !pl.type.is_integer( atom.args[1] ) ) {
				thread.throw_error( pl.error.type( "integer", atom.args[1], atom.indicator ) );
			} else if( pl.type.is_integer( atom.args[1] ) && atom.args[1].value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", atom.args[1], atom.indicator ) );
			} else {
				var length = new Num( stringLength(atom.args[0].id), false );
				thread.prepend( [new State( point.goal.replace( new Term( "=", [length, atom.args[1]] ) ), point.substitution, point )] );
			}
		},
		
		// atom_concat/3
		"atom_concat/3": function( thread, point, atom ) {
			var str, goal, start = atom.args[0], end = atom.args[1], whole = atom.args[2];
			if( pl.type.is_variable( whole ) && (pl.type.is_variable( start ) || pl.type.is_variable( end )) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( start ) && !pl.type.is_atom( start ) ) {
				thread.throw_error( pl.error.type( "atom", start, atom.indicator ) );
			} else if( !pl.type.is_variable( end ) && !pl.type.is_atom( end ) ) {
				thread.throw_error( pl.error.type( "atom", end, atom.indicator ) );
			} else if( !pl.type.is_variable( whole ) && !pl.type.is_atom( whole ) ) {
				thread.throw_error( pl.error.type( "atom", whole, atom.indicator ) );
			} else {
				var v1 = pl.type.is_variable( start );
				var v2 = pl.type.is_variable( end );
				//var v3 = pl.type.is_variable( whole );
				if( !v1 && !v2 ) {
					goal = new Term( "=", [whole, new Term( start.id + end.id )] );
					thread.prepend( [new State( point.goal.replace( goal ), point.substitution, point )] );
				} else if( v1 && !v2 ) {
					str = whole.id.substr( 0, whole.id.length - end.id.length );
					if( str + end.id === whole.id ) {
						goal = new Term( "=", [start, new Term( str )] );
						thread.prepend( [new State( point.goal.replace( goal ), point.substitution, point )] );
					}
				} else if( v2 && !v1 ) {
					str = whole.id.substr( start.id.length );
					if( start.id + str === whole.id ) {
						goal = new Term( "=", [end, new Term( str )] );
						thread.prepend( [new State( point.goal.replace( goal ), point.substitution, point )] );
					}
				} else {
					var states = [];
					for( var i = 0; i <= whole.id.length; i++ ) {
						var atom1 = new Term( whole.id.substr( 0, i ) );
						var atom2 = new Term( whole.id.substr( i ) );
						goal = new Term( ",", [new Term( "=", [atom1, start] ), new Term( "=", [atom2, end] )] );
						states.push( new State( point.goal.replace( goal ), point.substitution, point ) );
					}
					thread.prepend( states );
				}
			}
		},
		
		// sub_atom/5
		"sub_atom/5": function( thread, point, atom ) {
			var i, atom1 = atom.args[0], before = atom.args[1], length = atom.args[2], after = atom.args[3], subatom = atom.args[4];
			if( pl.type.is_variable( atom1 ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_atom( atom1 ) ) {
				thread.throw_error( pl.error.type( "atom", atom1, atom.indicator ) );
			} else if( !pl.type.is_variable( before ) && !pl.type.is_integer( before ) ) {
				thread.throw_error( pl.error.type( "integer", before, atom.indicator ) );
			} else if( !pl.type.is_variable( length ) && !pl.type.is_integer( length ) ) {
				thread.throw_error( pl.error.type( "integer", length, atom.indicator ) );
			} else if( !pl.type.is_variable( after ) && !pl.type.is_integer( after ) ) {
				thread.throw_error( pl.error.type( "integer", after, atom.indicator ) );
			} else if( pl.type.is_integer( before ) && before.value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", before, atom.indicator ) );
			} else if( pl.type.is_integer( length ) && length.value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", length, atom.indicator ) );
			} else if( pl.type.is_integer( after ) && after.value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", after, atom.indicator ) );
			} else if( !pl.type.is_variable( subatom ) && !pl.type.is_atom( subatom ) ) {
				thread.throw_error( pl.error.type( "atom", subatom, atom.indicator ) );
			} else {
				var bs = [], ls = [], as = [];
				if( pl.type.is_variable( before ) ) {
					for( i = 0; i <= atom1.id.length; i++ ) {
						bs.push( i );
					}
				} else {
					bs.push( before.value );
				}
				if( pl.type.is_variable( length ) ) {
					for( i = 0; i <= atom1.id.length; i++ ) {
						ls.push( i );
					}
				} else {
					ls.push( length.value );
				}
				if( pl.type.is_variable( after ) ) {
					for( i = 0; i <= atom1.id.length; i++ ) {
						as.push( i );
					}
				} else {
					as.push( after.value );
				}
				var states = [];
				for( var _i in bs ) {
					if(!bs.hasOwnProperty(_i)) continue;
					i = bs[_i];
					for( var _j in ls ) {
						if(!ls.hasOwnProperty(_j)) continue;
						var j = ls[_j];
						var k = atom1.id.length - i - j;
						if( indexOf( as, k ) !== -1 ) {
						if( i+j+k === atom1.id.length ) {
								var str = atom1.id.substr( i, j );
								if( atom1.id === atom1.id.substr( 0, i ) + str + atom1.id.substr( i+j, k ) ) {
									var pl1 = new Term( "=", [new Term( str ), subatom] );
									var pl2 = new Term( "=", [before, new Num( i )] );
									var pl3 = new Term( "=", [length, new Num( j )] );
									var pl4 = new Term( "=", [after, new Num( k )] );
									var goal = new Term( ",", [ new Term( ",", [ new Term( ",", [pl2, pl3] ), pl4] ), pl1] );
									states.push( new State( point.goal.replace( goal ), point.substitution, point ) );
								}
							}
						}
					}
				}
				thread.prepend( states );
			}
		},
		
		// atom_chars/2
		"atom_chars/2": function( thread, point, atom ) {
			var atom1 = atom.args[0], list = atom.args[1];
			if( pl.type.is_variable( atom1 ) && pl.type.is_variable( list ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( atom1 ) && !pl.type.is_atom( atom1 ) ) {
				thread.throw_error( pl.error.type( "atom", atom1, atom.indicator ) );
			} else {
				if( !pl.type.is_variable( atom1 ) ) {
					if(!pl.type.is_variable(list)) {
						var pointer = list;
						while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
							if(!pl.type.is_character( pointer.args[0])) {
								thread.throw_error(pl.error.type("character", pointer.args[0], atom.indicator));
								return;
							}
							pointer = pointer.args[1];
						}
					}
					var list1 = new Term( "[]" );
					var unilen = stringLength(atom1.id);
					for( var i = unilen-1; i >= 0; i-- ) {
						list1 = new Term( ".", [new Term( atom1.id.charAt( i ) ), list1] );
					}
					thread.prepend( [new State( point.goal.replace( new Term( "=", [list, list1] ) ), point.substitution, point )] );
				} else {			
					var pointer = list;
					var v = pl.type.is_variable( atom1 );
					var str = "";
					while( pointer.indicator === "./2" ) {
						if( !pl.type.is_character( pointer.args[0] ) ) {
							if( pl.type.is_variable( pointer.args[0] ) && v ) {
								thread.throw_error( pl.error.instantiation( atom.indicator ) );
								return;
							} else if( !pl.type.is_variable( pointer.args[0] ) ) {
								thread.throw_error( pl.error.type( "character", pointer.args[0], atom.indicator ) );
								return;
							}
						} else {
							str += pointer.args[0].id;
						}
						pointer = pointer.args[1];
					}
					if( pl.type.is_variable( pointer ) && v ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					} else if( !pl.type.is_empty_list( pointer ) && !pl.type.is_variable( pointer ) ) {
						thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
					} else {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [new Term( str ), atom1] ) ), point.substitution, point )] );
					}
				}
			}
		},
		
		// atom_codes/2
		"atom_codes/2": function( thread, point, atom ) {
			var atom1 = atom.args[0], list = atom.args[1];
			if( pl.type.is_variable( atom1 ) && pl.type.is_variable( list ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( atom1 ) && !pl.type.is_atom( atom1 ) ) {
				thread.throw_error( pl.error.type( "atom", atom1, atom.indicator ) );
			} else {
				if( !pl.type.is_variable( atom1 ) ) {
					if(!pl.type.is_variable(list)) {
						var pointer = list;
						while(pl.type.is_term(pointer) && pointer.indicator === "./2") {
							if(!pl.type.is_character_code( pointer.args[0])) {
								thread.throw_error(pl.error.type("integer", pointer.args[0], atom.indicator));
								return;
							}
							pointer = pointer.args[1];
						}
					}
					var list1 = new Term( "[]" );
					var unilen = stringLength(atom1.id);
					for( var i = unilen-1; i >= 0; i-- ) {
						list1 = new Term( ".", [new Num( codePointAt(atom1.id,i), false ), list1] );
					}
					thread.prepend( [new State( point.goal.replace( new Term( "=", [list, list1] ) ), point.substitution, point )] );
				} else {			
					var pointer = list;
					var v = pl.type.is_variable( atom1 );
					var str = "";
					while( pointer.indicator === "./2" ) {
						if( !pl.type.is_character_code( pointer.args[0] ) ) {
							if( pl.type.is_variable( pointer.args[0] ) && v ) {
								thread.throw_error( pl.error.instantiation( atom.indicator ) );
								return;
							} else if( !pl.type.is_variable( pointer.args[0] ) ) {
								thread.throw_error( pl.error.representation( "character_code", atom.indicator ) );
								return;
							}
						} else {
							str += fromCodePoint( pointer.args[0].value );
						}
						pointer = pointer.args[1];
					}
					if( pl.type.is_variable( pointer ) && v ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					} else if( !pl.type.is_empty_list( pointer ) && !pl.type.is_variable( pointer ) ) {
						thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
					} else {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [new Term( str ), atom1] ) ), point.substitution, point )] );
					}
				}
			}
		},
		
		// char_code/2
		"char_code/2": function( thread, point, atom ) {
			var char = atom.args[0], code = atom.args[1];
			if( pl.type.is_variable( char ) && pl.type.is_variable( code ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( char ) && !pl.type.is_character( char ) ) {
				thread.throw_error( pl.error.type( "character", char, atom.indicator ) );
			} else if( !pl.type.is_variable( code ) && !pl.type.is_integer( code ) ) {
				thread.throw_error( pl.error.type( "integer", code, atom.indicator ) );
			} else if( !pl.type.is_variable( code ) && !pl.type.is_character_code( code ) ) {
				thread.throw_error( pl.error.representation( "character_code", atom.indicator ) );
			} else {
				if( pl.type.is_variable( code ) ) {
					var code1 = new Num( codePointAt(char.id,0 ), false );
					thread.prepend( [new State( point.goal.replace( new Term( "=", [code1, code] ) ), point.substitution, point )] );
				} else {
					var char1 = new Term( fromCodePoint( code.value ) );
					thread.prepend( [new State( point.goal.replace( new Term( "=", [char1, char] ) ), point.substitution, point )] );
				}
			}
		},
		
		// number_chars/2
		"number_chars/2": function( thread, point, atom ) {
			var str, num = atom.args[0], list = atom.args[1];
			if( pl.type.is_variable( num ) && pl.type.is_variable( list ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( num ) && !pl.type.is_number( num ) ) {
				thread.throw_error( pl.error.type( "number", num, atom.indicator ) );
			} else if( !pl.type.is_variable( list ) && !pl.type.is_list( list ) ) {
				thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
			} else {
				var isvar = pl.type.is_variable( num );
				if( !pl.type.is_variable( list ) ) {	
					var pointer = list;
					var total = true;
					str = "";
					while( pointer.indicator === "./2" ) {
						if( !pl.type.is_character( pointer.args[0] ) ) {
							if( pl.type.is_variable( pointer.args[0] ) ) {
								total = false;
							} else if( !pl.type.is_variable( pointer.args[0] ) ) {
								thread.throw_error( pl.error.type( "character", pointer.args[0], atom.indicator ) );
								return;
							}
						} else {
							str += pointer.args[0].id;
						}
						pointer = pointer.args[1];
					}
					total = total && pl.type.is_empty_list( pointer );
					if( !pl.type.is_empty_list( pointer ) && !pl.type.is_variable( pointer ) ) {
						thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
						return;
					}
					if( !total && isvar ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( total ) {
						if( pl.type.is_variable( pointer ) && isvar ) {
							thread.throw_error( pl.error.instantiation( atom.indicator ) );
							return;
						} else {
							var expr = thread.parse( str );
							var num2 = expr.value;
							if( !pl.type.is_number( num2 ) || expr.tokens[expr.tokens.length-1].space ) {
								thread.throw_error( pl.error.syntax_by_predicate( "parseable_number", atom.indicator ) );
							} else {
								thread.prepend( [new State( point.goal.replace( new Term( "=", [num, num2] ) ), point.substitution, point )] );
							}
							return;
						}
					}
				}
				if( !isvar ) {
					str = num.toString();
					var list2 = new Term( "[]" );
					for( var i = str.length - 1; i >= 0; i-- ) {
						list2 = new Term( ".", [ new Term( str.charAt( i ) ), list2 ] );
					}
					thread.prepend( [new State( point.goal.replace( new Term( "=", [list, list2] ) ), point.substitution, point )] );
				}
			}
		},
		
		// number_codes/2
		"number_codes/2": function( thread, point, atom ) {
			var str, num = atom.args[0], list = atom.args[1];
			if( pl.type.is_variable( num ) && pl.type.is_variable( list ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( num ) && !pl.type.is_number( num ) ) {
				thread.throw_error( pl.error.type( "number", num, atom.indicator ) );
			} else if( !pl.type.is_variable( list ) && !pl.type.is_list( list ) ) {
				thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
			} else {
				var isvar = pl.type.is_variable( num );
				if( !pl.type.is_variable( list ) ) {	
					var pointer = list;
					var total = true;
					str = "";
					while( pointer.indicator === "./2" ) {
						if( !pl.type.is_character_code( pointer.args[0] ) ) {
							if( pl.type.is_variable( pointer.args[0] ) ) {
								total = false;
							} else if( !pl.type.is_variable( pointer.args[0] ) ) {
								thread.throw_error( pl.error.representation( "character_code", atom.indicator ) );
								return;
							}
						} else {
							str += fromCodePoint( pointer.args[0].value );
						}
						pointer = pointer.args[1];
					}
					total = total && pl.type.is_empty_list( pointer );
					if( !pl.type.is_empty_list( pointer ) && !pl.type.is_variable( pointer ) ) {
						thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
						return;
					}
					if( !total && isvar ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( total ) {
						if( pl.type.is_variable( pointer ) && isvar ) {
							thread.throw_error( pl.error.instantiation( atom.indicator ) );
							return;
						} else {
							var expr = thread.parse( str );
							var num2 = expr.value;
							if( !pl.type.is_number( num2 ) || expr.tokens[expr.tokens.length-1].space ) {
								thread.throw_error( pl.error.syntax_by_predicate( "parseable_number", atom.indicator ) );
							} else {
								thread.prepend( [new State( point.goal.replace( new Term( "=", [num, num2] ) ), point.substitution, point )] );
							}
							return;
						}
					}
				}
				if( !isvar ) {
					str = num.toString();
					var list2 = new Term( "[]" );
					for( var i = str.length - 1; i >= 0; i-- ) {
						list2 = new Term( ".", [ new Num( codePointAt(str,i), false ), list2 ] );
					}
					thread.prepend( [new State( point.goal.replace( new Term( "=", [list, list2] ) ), point.substitution, point )] );
				}
			}
		},
		
		// upcase_atom/2
		"upcase_atom/2": function( thread, point, atom ) {
			var original = atom.args[0], upcase = atom.args[1];
			if( pl.type.is_variable( original ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_atom( original ) ) {
				thread.throw_error( pl.error.type( "atom", original, atom.indicator ) );
			} else if( !pl.type.is_variable( upcase ) && !pl.type.is_atom( upcase ) ) {
				thread.throw_error( pl.error.type( "atom", upcase, atom.indicator ) );
			} else {
				thread.prepend( [new State( point.goal.replace( new Term( "=", [upcase, new Term( original.id.toUpperCase(), [] )] ) ), point.substitution, point )] );
			}
		},
		
		// downcase_atom/2
		"downcase_atom/2": function( thread, point, atom ) {
			var original = atom.args[0], downcase = atom.args[1];
			if( pl.type.is_variable( original ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_atom( original ) ) {
				thread.throw_error( pl.error.type( "atom", original, atom.indicator ) );
			} else if( !pl.type.is_variable( downcase ) && !pl.type.is_atom( downcase ) ) {
				thread.throw_error( pl.error.type( "atom", downcase, atom.indicator ) );
			} else {
				thread.prepend( [new State( point.goal.replace( new Term( "=", [downcase, new Term( original.id.toLowerCase(), [] )] ) ), point.substitution, point )] );
			}
		},
		
		// atomic_list_concat/2
		"atomic_list_concat/2": function( thread, point, atom ) {
			var list = atom.args[0], concat = atom.args[1];
			thread.prepend( [new State( point.goal.replace( new Term( "atomic_list_concat", [list, new Term( "", [] ), concat] ) ), point.substitution, point )] );
		},
		
		// atomic_list_concat/3
		"atomic_list_concat/3": function( thread, point, atom ) {
			var list = atom.args[0], separator = atom.args[1], concat = atom.args[2];
			if( pl.type.is_variable( separator ) || pl.type.is_variable( list ) && pl.type.is_variable( concat ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( list ) && !pl.type.is_list( list ) ) {
				thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
			} else if( !pl.type.is_variable( concat ) && !pl.type.is_atom( concat ) ) {
				thread.throw_error( pl.error.type( "atom", concat, atom.indicator ) );
			} else {
				if( !pl.type.is_variable( concat ) ) {
					var atomic = arrayToList( map(
						concat.id.split( separator.id ),
						function( id ) {
							return new Term( id, [] );
						}
					) );
					thread.prepend( [new State( point.goal.replace( new Term( "=", [atomic, list] ) ), point.substitution, point )] );
				} else {
					var id = "";
					var pointer = list;
					while( pl.type.is_term( pointer ) && pointer.indicator === "./2" ) {
						if( !pl.type.is_atom( pointer.args[0] ) && !pl.type.is_number( pointer.args[0] ) ) {
							thread.throw_error( pl.error.type( "atomic", pointer.args[0], atom.indicator ) );
							return;
						}
						if( id !== "" )
							id += separator.id;
						if( pl.type.is_atom( pointer.args[0] ) )
							id += pointer.args[0].id;
						else
							id += "" + pointer.args[0].value;
						pointer = pointer.args[1];
					}
					id = new Term( id, [] );
					if( pl.type.is_variable( pointer ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					} else if( !pl.type.is_term( pointer ) || pointer.indicator !== "[]/0" ) {
						thread.throw_error( pl.error.type( "list", list, atom.indicator ) );
					} else {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [id, concat] ) ), point.substitution, point )] );
					}
				}
			}
		},
		
		// TERM COMPARISON
		
		"@=</2": function( thread, point, atom ) {
			if( pl.compare( atom.args[0], atom.args[1] ) <= 0 ) {
				thread.success( point );
			}
		},
		
		"==/2": function( thread, point, atom ) {
			if( pl.compare( atom.args[0], atom.args[1] ) === 0 ) {
				thread.success( point );
			}
		},
		
		"\\==/2": function( thread, point, atom ) {
			if( pl.compare( atom.args[0], atom.args[1] ) !== 0 ) {
				thread.success( point );
			}
		},
		
		"@</2": function( thread, point, atom ) {
			if( pl.compare( atom.args[0], atom.args[1] ) < 0 ) {
				thread.success( point );
			}
		},
		
		"@>/2": function( thread, point, atom ) {
			if( pl.compare( atom.args[0], atom.args[1] ) > 0 ) {
				thread.success( point );
			}
		},
		
		"@>=/2": function( thread, point, atom ) {
			if( pl.compare( atom.args[0], atom.args[1] ) >= 0 ) {
				thread.success( point );
			}
		},
		
		"compare/3": function( thread, point, atom ) {
			var order = atom.args[0], left = atom.args[1], right = atom.args[2];
			if( !pl.type.is_variable( order ) && !pl.type.is_atom( order ) ) {
				thread.throw_error( pl.error.type( "atom", order, atom.indicator ) );
			} else if( pl.type.is_atom( order ) && ["<", ">", "="].indexOf( order.id ) === -1 ) {
				thread.throw_error( pl.error.domain( "order", order, atom.indicator ) );
			} else {
				var compare = pl.compare( left, right );
				compare = compare === 0 ? "=" : (compare === -1 ? "<" : ">");
				thread.prepend( [new State( point.goal.replace( new Term( "=", [order, new Term( compare, [] )] ) ), point.substitution, point )] );
			}
		},
		
		// EVALUATION
		
		// is/2
		"is/2": function( thread, point, atom ) {
			var op = atom.args[1].interpret( thread );
			if( !pl.type.is_number( op ) ) {
				thread.throw_error( op );
			} else {
				thread.prepend( [new State( point.goal.replace( new Term( "=", [atom.args[0], op], atom.indicator ) ), point.substitution, point )] );
			}
		},
		
		// between/3
		"between/3": function( thread, point, atom ) {
			var lower = atom.args[0], upper = atom.args[1], bet = atom.args[2];
			if( pl.type.is_variable( lower ) || pl.type.is_variable( upper ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_integer( lower ) ) {
				thread.throw_error( pl.error.type( "integer", lower, atom.indicator ) );
			} else if( !pl.type.is_integer( upper ) ) {
				thread.throw_error( pl.error.type( "integer", upper, atom.indicator ) );
			} else if( !pl.type.is_variable( bet ) && !pl.type.is_integer( bet ) ) {
				thread.throw_error( pl.error.type( "integer", bet, atom.indicator ) );
			} else {
				if( pl.type.is_variable( bet ) ) {
					if( lower.value <= upper.value ) {
						var states = [new State( point.goal.replace( new Term( "=", [bet, lower] ) ), point.substitution, point )];
						states.push( new State( point.goal.replace( new Term( "between", [new Num( lower.value+1, false ), upper, bet] ) ), point.substitution, point ) );
						thread.prepend( states );
					}
				} else if( lower.value <= bet.value && upper.value >= bet.value ) {
					thread.success( point );
				}
			}
		},
		
		// succ/2
		"succ/2": function( thread, point, atom ) {
			var n = atom.args[0], m = atom.args[1];
			if( pl.type.is_variable( n ) && pl.type.is_variable( m ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( n ) && !pl.type.is_integer( n ) ) {
				thread.throw_error( pl.error.type( "integer", n, atom.indicator ) );
			} else if( !pl.type.is_variable( m ) && !pl.type.is_integer( m ) ) {
				thread.throw_error( pl.error.type( "integer", m, atom.indicator ) );
			} else if( !pl.type.is_variable( n ) && n.value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", n, atom.indicator ) );
			} else if( !pl.type.is_variable( m ) && m.value < 0 ) {
				thread.throw_error( pl.error.domain( "not_less_than_zero", m, atom.indicator ) );
			} else {
				if( pl.type.is_variable( m ) || m.value > 0 ) {
					if( pl.type.is_variable( n ) ) {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [n, new Num( m.value-1, false )] ) ), point.substitution, point )] );
					} else {
						thread.prepend( [new State( point.goal.replace( new Term( "=", [m, new Num( n.value+1, false )] ) ), point.substitution, point )] );
					}
				}
			}
		},
		
		// =:=/2
		"=:=/2": function( thread, point, atom ) {
			var cmp = pl.arithmetic_compare( thread, atom.args[0], atom.args[1] );
			if( pl.type.is_term( cmp ) ) {
				thread.throw_error( cmp );
			} else if( cmp === 0 ) {
				thread.success( point );
			}
		},
		
		// =\=/2
		"=\\=/2": function( thread, point, atom ) {
			var cmp = pl.arithmetic_compare( thread, atom.args[0], atom.args[1] );
			if( pl.type.is_term( cmp ) ) {
				thread.throw_error( cmp );
			} else if( cmp !== 0 ) {
				thread.success( point );
			}
		},
		
		// </2
		"</2": function( thread, point, atom ) {
			var cmp = pl.arithmetic_compare( thread, atom.args[0], atom.args[1] );
			if( pl.type.is_term( cmp ) ) {
				thread.throw_error( cmp );
			} else if( cmp < 0 ) {
				thread.success( point );
			}
		},
		
		// =</2
		"=</2": function( thread, point, atom ) {
			var cmp = pl.arithmetic_compare( thread, atom.args[0], atom.args[1] );
			if( pl.type.is_term( cmp ) ) {
				thread.throw_error( cmp );
			} else if( cmp <= 0 ) {
				thread.success( point );
			}
		},
		
		// >/2
		">/2": function( thread, point, atom ) {
			var cmp = pl.arithmetic_compare( thread, atom.args[0], atom.args[1] );
			if( pl.type.is_term( cmp ) ) {
				thread.throw_error( cmp );
			} else if( cmp > 0 ) {
				thread.success( point );
			}
		},
		
		// >=/2
		">=/2": function( thread, point, atom ) {
			var cmp = pl.arithmetic_compare( thread, atom.args[0], atom.args[1] );
			if( pl.type.is_term( cmp ) ) {
				thread.throw_error( cmp );
			} else if( cmp >= 0 ) {
				thread.success( point );
			}
		},
		
		// TYPE TEST
		
		// var/1
		"var/1": function( thread, point, atom ) {
			if( pl.type.is_variable( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// atom/1
		"atom/1": function( thread, point, atom ) {
			if( pl.type.is_atom( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// atomic/1
		"atomic/1": function( thread, point, atom ) {
			if( pl.type.is_atomic( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// compound/1
		"compound/1": function( thread, point, atom ) {
			if( pl.type.is_compound( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// integer/1
		"integer/1": function( thread, point, atom ) {
			if( pl.type.is_integer( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// float/1
		"float/1": function( thread, point, atom ) {
			if( pl.type.is_float( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// number/1
		"number/1": function( thread, point, atom ) {
			if( pl.type.is_number( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// nonvar/1
		"nonvar/1": function( thread, point, atom ) {
			if( !pl.type.is_variable( atom.args[0] ) ) {
				thread.success( point );
			}
		},
		
		// ground/1
		"ground/1": function( thread, point, atom ) {
			if( atom.variables().length === 0 ) {
				thread.success( point );
			}
		},
		
		// acyclic_term/1
		"acyclic_term/1": function( thread, point, atom ) {
			var test = point.substitution.apply( point.substitution );
			var variables = atom.args[0].variables();
			for( var i = 0; i < variables.length; i++ )
				if( point.substitution.links[variables[i]] !== undefined && !point.substitution.links[variables[i]].equals( test.links[variables[i]] ) )
					return;
			thread.success( point );
		},
		
		// callable/1
		"callable/1": function( thread, point, atom ) {
			var callable = atom.args[0];
			if(pl.type.is_term(callable)) {
				thread.success( point );
			}
		},

		// is_list/1
		"is_list/1": function( thread, point, atom ) {
			var list = atom.args[0];
			while( pl.type.is_term( list ) && list.indicator === "./2" )
				list = list.args[1];
			if( pl.type.is_term( list ) && list.indicator === "[]/0" )
				thread.success( point );
		},



		// STREAM SELECTION AND CONTROL

		// current_input/1
		"current_input/1": function( thread, point, atom ) {
			var stream = atom.args[0];
			if(!pl.type.is_variable(stream)
			&& (!pl.type.is_stream(stream) || !thread.get_stream_by_alias(stream.alias)
			                               && !thread.get_stream_by_alias(stream.id))
			&& (!pl.type.is_atom(stream) || !thread.get_stream_by_alias(stream.id))) {
				thread.throw_error( pl.error.domain("stream", stream, atom.indicator) );
			} else {
				if(pl.type.is_atom(stream))
					stream = thread.get_stream_by_alias(stream.id);
				thread.prepend( [new State(
					point.goal.replace(new Term("=", [stream, thread.get_current_input()])),
					point.substitution,
					point)
				] );
			}
		},

		// current_output/1
		"current_output/1": function( thread, point, atom ) {
			var stream = atom.args[0];
			if(!pl.type.is_variable(stream)
			&& (!pl.type.is_stream(stream) || !thread.get_stream_by_alias(stream.alias)
			                               && !thread.get_stream_by_alias(stream.id))
			&& (!pl.type.is_atom(stream) || !thread.get_stream_by_alias(stream.id))) {
				thread.throw_error( pl.error.domain("stream", stream, atom.indicator) );
			} else {
				if(pl.type.is_atom(stream))
					stream = thread.get_stream_by_alias( stream.id );
				thread.prepend( [new State(
					point.goal.replace(new Term("=", [stream, thread.get_current_output()])),
					point.substitution,
					point)
				] );
			}
		},

		// set_input/1
		"set_input/1": function( thread, point, atom ) {
			var input = atom.args[0];
			var stream = pl.type.is_stream( input ) ? input : thread.get_stream_by_alias( input.id );
			if( pl.type.is_variable( input ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_stream( input ) && !pl.type.is_atom( input ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", input, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) || !thread.get_stream_by_alias(input.alias)
			                                        && !thread.get_stream_by_alias(input.id) ) {
				thread.throw_error( pl.error.existence( "stream", input, atom.indicator ) );
			} else if( stream.output === true ) {
				thread.throw_error( pl.error.permission( "input", "stream", input, atom.indicator ) );
			} else {
				thread.set_current_input( stream );
				thread.success( point );
			}
		},

		// set_output/1
		"set_output/1": function( thread, point, atom ) {
			var output = atom.args[0];
			var stream = pl.type.is_stream( output ) ? output : thread.get_stream_by_alias( output.id );
			if( pl.type.is_variable( output ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_stream( output ) && !pl.type.is_atom( output ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", output, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) || !thread.get_stream_by_alias(output.alias)
			                                        && !thread.get_stream_by_alias(output.id) ) {
				thread.throw_error( pl.error.existence( "stream", output, atom.indicator ) );
			} else if( stream.input === true ) {
				thread.throw_error( pl.error.permission( "output", "stream", output, atom.indicator ) );
			} else {
				thread.set_current_output( stream );
				thread.success( point );
			}
		},

		// open/3
		"open/3": function( thread, point, atom ) {
			var dest = atom.args[0], mode = atom.args[1], stream = atom.args[2];
			thread.prepend( [new State(
				point.goal.replace(new Term("open", [dest, mode, stream, new Term("[]", [])])),
				point.substitution,
				point
			)] );
		},

		// open/4
		"open/4": function( thread, point, atom ) {
			var dest = atom.args[0], mode = atom.args[1], stream = atom.args[2], options = atom.args[3];
			if( pl.type.is_variable( dest ) || pl.type.is_variable( mode ) || pl.type.is_variable( options ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( mode ) && !pl.type.is_atom( mode ) ) {
				thread.throw_error( pl.error.type( "atom", mode, atom.indicator ) );
			} else if( !pl.type.is_list( options ) ) {
				thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.uninstantiation( stream, atom.indicator ) );
			} else if( !pl.type.is_atom( dest ) && !pl.type.is_streamable( dest ) ) {
				thread.throw_error( pl.error.domain( "source_sink", dest, atom.indicator ) );
			} else if( !pl.type.is_io_mode( mode ) ) {
				thread.throw_error( pl.error.domain( "io_mode", mode, atom.indicator ) );
			} else {
				var obj_options = {};
				var pointer = options;
				var property;
				while( pl.type.is_term(pointer) && pointer.indicator === "./2" ) {
					property = pointer.args[0];
					if( pl.type.is_variable( property ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( !pl.type.is_stream_option( property ) ) {
						thread.throw_error( pl.error.domain( "stream_option", property, atom.indicator ) );
						return;
					}
					obj_options[property.id] = property.args[0].id;
					pointer = pointer.args[1];
				}
				if( pointer.indicator !== "[]/0" ) {
					if( pl.type.is_variable( pointer ) )
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					else
						thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
					return;
				} else {
					var alias = obj_options["alias"];
					if( alias && thread.get_stream_by_alias(alias) ) {
						thread.throw_error( pl.error.permission( "open", "source_sink", new Term("alias", [new Term(alias, [])]), atom.indicator ) );
						return;
					}
					if( !obj_options["type"] )
						obj_options["type"] = "text";
					var file;
					if( pl.type.is_atom( dest ) )
						file = thread.file_system_open( dest.id, obj_options["type"], mode.id );
					else
						file = dest.stream( obj_options["type"], mode.id );
					if( file === false ) {
						thread.throw_error( pl.error.permission( "open", "source_sink", dest, atom.indicator ) );
						return;
					} else if( file === null ) {
						thread.throw_error( pl.error.existence( "source_sink", dest, atom.indicator ) );
						return;
					}
					var newstream = new Stream(
						file, mode.id,
						obj_options["alias"],
						obj_options["type"],
						obj_options["reposition"] === "true",
						obj_options["eof_action"] );
					if( alias )
						thread.session.streams[alias] = newstream;
					else
						thread.session.streams[newstream.id] = newstream;
					thread.prepend( [new State(
						point.goal.replace( new Term( "=", [stream, newstream] ) ),
						point.substitution,
						point
					)] );
				}
			}
		},

		// close/1
		"close/1": function( thread, point, atom ) {
			var stream = atom.args[0];
			thread.prepend( [new State(
				point.goal.replace(new Term("close", [stream, new Term("[]", [])])),
				point.substitution,
				point
			)] );
		},

		// close/2
		"close/2": function( thread, point, atom ) {
			var stream = atom.args[0], options = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( options ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_list( options ) ) {
				thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else {
				// Get options
				var obj_options = {};
				var pointer = options;
				var property;
				while( pl.type.is_term(pointer) && pointer.indicator === "./2" ) {
					property = pointer.args[0];
					if( pl.type.is_variable( property ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( !pl.type.is_close_option( property ) ) {
						thread.throw_error( pl.error.domain( "close_option", property, atom.indicator ) );
						return;
					}
					obj_options[property.id] = property.args[0].id === "true";
					pointer = pointer.args[1];
				}
				if( pointer.indicator !== "[]/0" ) {
					if( pl.type.is_variable( pointer ) )
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					else
						thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
					return;
				} else {
					if(stream2 === thread.session.standard_input || stream2 === thread.session.standard_output || stream2 === thread.session.standard_error) {
						thread.success( point );
						return;
					} else if( stream2 === thread.session.current_input ) {
						thread.session.current_input = thread.session.standard_input;
					} else if( stream2 === thread.session.current_output ) {
						thread.session.current_output = thread.session.standard_output;
					}
					if( stream2.alias !== null && stream2.alias !== undefined )
						delete thread.session.streams[stream2.alias];
					else
						delete thread.session.streams[stream2.id];
					if( stream2.output )
						stream2.stream.flush();
					var closed = stream2.stream.close();
					stream2.stream = null;
					if( obj_options.force === true || closed === true ) {
						thread.success( point );
					}
				}
			}
		},

		// flush_output/0
		"flush_output/0": [
			new Rule(new Term("flush_output", []), new Term(",", [new Term("current_output", [new Var("S")]),new Term("flush_output", [new Var("S")])]))
		],

		// flush_output/1
		"flush_output/1": function( thread, point, atom ) {
			var stream = atom.args[0];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.input === true ) {
				thread.throw_error( pl.error.permission( "output", "stream", stream, atom.indicator ) );
			} else {
				stream2.stream.flush();
				thread.success( point );
			}
		},

		// stream_property/2
		"stream_property/2": function( thread, point, atom ) {
			var stream = atom.args[0], property = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( !pl.type.is_variable( stream ) && !pl.type.is_stream( stream ) ) {
				thread.throw_error( pl.error.domain( "stream", stream, atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) && (!pl.type.is_stream( stream2 ) || stream2.stream === null) ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( !pl.type.is_variable( property ) && !pl.type.is_stream_property( property ) ) {
				thread.throw_error( pl.error.domain( "stream_property", property, atom.indicator ) );
			} else {
				var streams = [];
				var states = [];
				var propvar = pl.type.is_variable(property);
				if( !pl.type.is_variable( stream ) )
					streams.push( stream2 );
				else
					for( var key in thread.session.streams )
						streams.push( thread.session.streams[key] );
				for( var i = 0; i < streams.length; i++ ) {
					var properties = [];
					// file_name/1
					if( (propvar || property.indicator === "file_name/1") && streams[i].filename )
						properties.push( new Term( "file_name", [new Term(streams[i].file_name, [])] ) );
					// mode/1
					if(propvar || property.indicator === "mode/1")
						properties.push( new Term( "mode", [new Term(streams[i].mode, [])] ) );
					// input/0 or output/0
					if(propvar || property.indicator === "input/0" || property.indicator === "output/0")
						properties.push( new Term( streams[i].input ? "input" : "output", [] ) );
					// alias/1
					if( (propvar || property.indicator === "alias/1") && streams[i].alias )
						properties.push( new Term( "alias", [new Term(streams[i].alias, [])] ) );
					// position/1
					if(propvar || property.indicator === "position/1")
						properties.push( new Term( "position", [
							new Term("position", [
								new Num(streams[i].char_count, false),
								new Num(streams[i].line_count, false),
								new Num(streams[i].line_position, false)
							])
						] ) );
					// end_of_stream/1
					if(propvar || property.indicator === "end_of_stream/1")
						properties.push( new Term( "end_of_stream", [new Term(
							streams[i].position === "end_of_stream" || streams[i].stream.eof && streams[i].stream.eof(streams[i].position) ? "at" :
							streams[i].position === "past_end_of_stream" ? "past" :
							"not", [])] ) );
					// eof_action/1
					if(propvar || property.indicator === "eof_action/1")	
						properties.push( new Term( "eof_action", [new Term(streams[i].eof_action, [])] ) );
					// reposition/1
					if(propvar || property.indicator === "reposition/1")
						properties.push( new Term( "reposition", [new Term(streams[i].reposition ? "true" : "false", [])] ) );
					// type/1
					if(propvar || property.indicator === "type/1")
						properties.push( new Term( "type", [new Term(streams[i].type, [])] ) );
					for( var j = 0; j < properties.length; j++ ) {
						states.push( new State(
							point.goal.replace( new Term( ",", [
								new Term("=", [pl.type.is_variable( stream ) ? stream : stream2, streams[i]]),
								new Term("=", [property, properties[j]])]) ),
							point.substitution,
							point
						) );
					}
				}
				thread.prepend( states );
			}
		},

		// stream_position_data
		"stream_position_data/3": function(thread, point, atom) {
			var field = atom.args[0], position = atom.args[1], value = atom.args[2];
			if(pl.type.is_variable(position)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_term(position) || position.indicator !== "position/3") {
				thread.throw_error(pl.error.domain("stream_position", position, atom.indicator));
			} else if(!pl.type.is_variable(field) && !pl.type.is_atom(field)) {
				thread.throw_error(pl.error.type("atom", field, atom.indicator));
			} else if(!pl.type.is_variable(value) && !pl.type.is_integer(value)) {
				thread.throw_error(pl.error.type("integer", value, atom.indicator));
			} else {
				var fields = ["char_count", "line_count", "line_position"];
				var states = [];
				var data_pos = {char_count: 0, line_count: 1, line_position: 2};
				if(pl.type.is_variable(field)) {
					for(var i = 0; i < fields.length; i++) {
						states.push(new State(point.goal.replace(
							new Term(",", [
								new Term("=", [new Term(fields[i]), field]),
								new Term("=", [value, position.args[data_pos[fields[i]]]])
							])
						), point.substitution, point));
					}
				} else if(data_pos.hasOwnProperty(field.id)) {
					states.push(new State(point.goal.replace(
						new Term("=", [value, position.args[data_pos[field.id]]])
					), point.substitution, point));
				}
				thread.prepend(states);
			}
		},

		// at_end_of_stream/0
		"at_end_of_stream/0": [
			new Rule(new Term("at_end_of_stream", []), new pl.type.Term(",", [new Term("current_input", [new Var("S")]),new Term(",", [new Term("stream_property", [new Var("S"),new Term("end_of_stream", [new Var("E")])]),new Term(",", [new Term("!", []),new Term(";", [new Term("=", [new Var("E"),new Term("at", [])]),new Term("=", [new Var("E"),new Term("past", [])])])])])]))
		],

		// at_end_of_stream/1
		"at_end_of_stream/1": function( thread, point, atom ) {
			var stream = atom.args[0];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else {
				var e = thread.next_free_variable();
				thread.prepend( [new State(
					point.goal.replace(
						new Term(",", [new Term("stream_property", [stream2,new Term("end_of_stream", [e])]),
						new Term(",", [new Term("!", []),new Term(";", [new Term("=", [e,new Term("at", [])]),
						new Term("=", [e,new Term("past", [])])])])])
					),
					point.substitution,
					point
				)] );
			}
		},

		// set_stream_position/2
		"set_stream_position/2": function( thread, point, atom ) {
			var stream = atom.args[0], position = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( position ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( !pl.type.is_stream_position( position ) ) {
				thread.throw_error( pl.error.domain( "stream_position", position, atom.indicator ) );
			} else if( stream2.reposition === false ) {
				thread.throw_error( pl.error.permission( "reposition", "stream", stream, atom.indicator ) );
			} else {
				if( position.indicator === "position/3" ) {
					stream2.position = position.args[0].value;
					stream2.char_count = position.args[0].value;
					stream2.line_count = position.args[1].value;
					stream2.line_position = position.args[2].value;
				} else {
					stream2.position = position.id;
				}
				thread.success( point );
			}
		},



		//  CHARACTER INPUT OUTPUT
		
		// get_char/1
		"get_char/1": [
			new Rule(new Term("get_char", [new Var("C")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("get_char", [new Var("S"),new Var("C")])]))
		],

		// get_char/2
		"get_char/2": function( thread, point, atom ) {
			var stream = atom.args[0], char = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( char ) && !pl.type.is_in_character( char ) ) {
				thread.throw_error( pl.error.type( "in_character", char, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "input", "binary_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				var stream_char;
				if( stream2.position === "end_of_stream" ) {
					stream_char = "end_of_file";
					stream2.position = "past_end_of_stream";
				} else {
					stream_char = stream2.stream.get( 1, stream2.position );
					if( stream_char === null ) {
						thread.throw_error( pl.error.representation( "character", atom.indicator ) );
						return;
					} else if(stream_char === "end_of_stream") {
						stream_char = "end_of_file";
						stream2.position = "past_end_of_stream";
					} else {
						stream2.position++;
						stream2.char_count++;
						stream2.line_position++;
						if(stream_char === "\n") {
							stream2.line_count++;
							stream2.line_position = 0;
						}
					}
				}
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [new Term(stream_char,[]), char] ) ),
					point.substitution,
					point
				)] );
			}
		},

		// get_code/1
		"get_code/1": [
			new Rule(new Term("get_code", [new Var("C")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("get_code", [new Var("S"),new Var("C")])]))
		],

		// get_code/2
		"get_code/2": function( thread, point, atom ) {
			var stream = atom.args[0], code = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( code ) && !pl.type.is_integer( code ) ) {
				thread.throw_error( pl.error.type( "integer", code, atom.indicator ) );
			} else if( pl.type.is_integer( code ) && !pl.type.is_in_character_code( code ) ) {
				thread.throw_error( pl.error.representation( "in_character_code", atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) && !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "input", "binary_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				var stream_code;
				if( stream2.position === "end_of_stream" ) {
					stream_code = -1;
					stream2.position = "past_end_of_stream";
				} else {
					stream_code = stream2.stream.get( 1, stream2.position );
					if( stream_code === null ) {
						thread.throw_error( pl.error.representation( "character", atom.indicator ) );
						return;
					} else if(stream_code === "end_of_stream") {
						stream_code = -1;
						stream2.position = "past_end_of_stream";
					} else {
						stream_code = codePointAt( stream_code, 0 );
						stream2.position++;
						stream2.char_count++;
						stream2.line_position++;
						if(stream_code === 10) {
							stream2.line_count++;
							stream2.line_position = 0;
						}
					}
				}
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [new Num(stream_code, false), code] ) ),
					point.substitution,
					point
				)] );
			}
		},

		// peek_char/1
		"peek_char/1": [
			new Rule(new Term("peek_char", [new Var("C")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("peek_char", [new Var("S"),new Var("C")])]))
		],

		// peek_char/2
		"peek_char/2": function( thread, point, atom ) {
			var stream = atom.args[0], char = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( char ) && !pl.type.is_in_character( char ) ) {
				thread.throw_error( pl.error.type( "in_character", char, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "input", "binary_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				var stream_char;
				if( stream2.position === "end_of_stream" ) {
					stream_char = "end_of_file";
					stream2.position = "past_end_of_stream";
				} else {
					stream_char = stream2.stream.get( 1, stream2.position );
					if( stream_char === null ) {
						thread.throw_error( pl.error.representation( "character", atom.indicator ) );
						return;
					} else if(stream_char === "end_of_stream") {
						stream_char = "end_of_file";
					}
				}
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [new Term(stream_char,[]), char] ) ),
					point.substitution,
					point
				)] );
			}
		},

		// peek_code/1
		"peek_code/1": [
			new Rule(new Term("peek_code", [new Var("C")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("peek_code", [new Var("S"),new Var("C")])]))
		],

		// peek_code/2
		"peek_code/2": function( thread, point, atom ) {
			var stream = atom.args[0], code = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( code ) && !pl.type.is_integer( code ) ) {
				thread.throw_error( pl.error.type( "integer", code, atom.indicator ) );
			} else if( pl.type.is_integer( code ) && !pl.type.is_in_character_code( code ) ) {
				thread.throw_error( pl.error.representation( "in_character_code", atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) && !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "input", "binary_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				var stream_code;
				if( stream2.position === "end_of_stream" ) {
					stream_code = -1;
					stream2.position = "past_end_of_stream";
				} else {
					stream_code = stream2.stream.get( 1, stream2.position );
					if( stream_code === null ) {
						thread.throw_error( pl.error.representation( "character", atom.indicator ) );
						return;
					} else if(stream_code === "end_of_stream") {
						stream_code = -1;
					} else {
						stream_code = codePointAt( stream_code, 0 );
					}
				}
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [new Num(stream_code, false), code] ) ),
					point.substitution,
					point
				)] );
			}
		},

		// put_char/1
		"put_char/1": [
			new Rule(new Term("put_char", [new Var("C")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("put_char", [new Var("S"),new Var("C")])]))
		],

		// put_char/2
		"put_char/2": function( thread, point, atom ) {
			var stream = atom.args[0], char = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( char ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_character( char ) ) {
				thread.throw_error( pl.error.type( "character", char, atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) && !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.input ) {
				thread.throw_error( pl.error.permission( "output", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "output", "binary_stream", stream, atom.indicator ) );
			} else {
				if( stream2.stream.put( char.id, stream2.position ) ) {
					if(typeof stream2.position === "number")
						stream2.position++;
					stream2.char_count++;
					stream2.line_position++;
					if(char.id === "\n") {
						stream2.line_count++;
						stream2.line_position = 0;
					}
					thread.success( point );
				}
			}
		},

		// put_code/1
		"put_code/1": [
			new Rule(new Term("put_code", [new Var("C")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("put_code", [new Var("S"),new Var("C")])]))
		],

		// put_code/2
		"put_code/2": function( thread, point, atom ) {
			var stream = atom.args[0], code = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( code ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_integer( code ) ) {
				thread.throw_error( pl.error.type( "integer", code, atom.indicator ) );
			} else if( !pl.type.is_character_code( code ) ) {
				thread.throw_error( pl.error.representation( "character_code", atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) && !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.input ) {
				thread.throw_error( pl.error.permission( "output", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "output", "binary_stream", stream, atom.indicator ) );
			} else {
				if( stream2.stream.put( fromCodePoint( code.value ), stream2.position ) ) {
					if(typeof stream2.position === "number")
						stream2.position++;
					stream2.char_count++;
					stream2.line_position++;
					if(code.value === 10) {
						stream2.line_count++;
						stream2.line_position = 0;
					}
					thread.success( point );
				}
			}
		},

		// nl/0
		"nl/0": [
			new Rule(new Term("nl"), new Term(",", [new Term("current_output", [new Var("S")]),new Term("put_char", [new Var("S"),new Term("\n")])]))
		],

		// nl/1
		"nl/1": function( thread, point, atom ) {
			var stream = atom.args[0];
			thread.prepend( [new State( 
				point.goal.replace( new Term("put_char", [stream, new Term("\n", [])]) ),
				point.substitution,
				point
			)] );
		},



		// BYTE INPUT/OUTPUT

		// get_byte/1
		"get_byte/1": [
			new Rule(new Term("get_byte", [new Var("B")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("get_byte", [new Var("S"),new Var("B")])]))
		],

		// get_byte/2
		"get_byte/2": function( thread, point, atom ) {
			var stream = atom.args[0], byte = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( byte ) && !pl.type.is_in_byte( byte ) ) {
				thread.throw_error( pl.error.type( "in_byte", byte, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "text" ) {
				thread.throw_error( pl.error.permission( "input", "text_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				var stream_byte;
				if( stream2.position === "end_of_stream" ) {
					stream_byte = -1;
					stream2.position = "past_end_of_stream";
				} else {
					stream_byte = stream2.stream.get_byte( stream2.position );
					if( stream_byte === null ) {
						thread.throw_error( pl.error.representation( "byte", atom.indicator ) );
						return;
					} else if(stream_byte === "end_of_stream") {
						stream_byte = -1;
						stream2.position = "past_end_of_stream";
					} else {
						stream2.position++;
						stream2.char_count++;
						stream2.line_position++;
					}
				}
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [new Num(stream_byte,false), byte] ) ),
					point.substitution,
					point
				)] );
			}
		},
		
		// peek_byte/1
		"peek_byte/1": [
			new Rule(new Term("peek_byte", [new Var("B")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("peek_byte", [new Var("S"),new Var("B")])]))
		],

		// peek_byte/2
		"peek_byte/2": function( thread, point, atom ) {
			var stream = atom.args[0], byte = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_variable( byte ) && !pl.type.is_in_byte( byte ) ) {
				thread.throw_error( pl.error.type( "in_byte", byte, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "text" ) {
				thread.throw_error( pl.error.permission( "input", "text_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				var stream_byte;
				if( stream2.position === "end_of_stream" ) {
					stream_byte = -1;
					stream2.position = "past_end_of_stream";
				} else {
					stream_byte = stream2.stream.get_byte( stream2.position );
					if( stream_byte === null ) {
						thread.throw_error( pl.error.representation( "byte", atom.indicator ) );
						return;
					} else if(stream_byte === "end_of_stream") {
						stream_byte = -1;
					}
				}
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [new Num(stream_byte,false), byte] ) ),
					point.substitution,
					point
				)] );
			}
		},

		// put_byte/1
		"put_byte/1": [
			new Rule(new Term("put_byte", [new Var("B")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("put_byte", [new Var("S"),new Var("B")])]))
		],

		// put_byte/2
		"put_byte/2": function( thread, point, atom ) {
			var stream = atom.args[0], byte = atom.args[1];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( byte ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_byte( byte ) ) {
				thread.throw_error( pl.error.type( "byte", byte, atom.indicator ) );
			} else if( !pl.type.is_variable( stream ) && !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.input ) {
				thread.throw_error( pl.error.permission( "output", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "text" ) {
				thread.throw_error( pl.error.permission( "output", "text_stream", stream, atom.indicator ) );
			} else {
				if( stream2.stream.put_byte( byte.value, stream2.position ) ) {
					if(typeof stream2.position === "number")
						stream2.position++;
					stream2.char_count++;
					stream2.line_position++;
					thread.success( point );
				}
			}
		},



		// TERM INPUT/OUTPUT

		// read/1
		"read/1": [
			new Rule(new Term("read", [new Var("T")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("read_term", [new Var("S"),new Var("T"),new Term("[]")])]))
		],

		// read/2
		"read/2": [
			new Rule(new Term("read", [new Var("S"), new Var("T")]), new Term("read_term", [new Var("S"),new Var("T"),new Term("[]")]))
		],

		// read_term/2
		"read_term/2": [
			new Rule(new Term("read_term", [new Var("T"),new Var("O")]), new Term(",", [new Term("current_input", [new Var("S")]),new Term("read_term", [new Var("S"),new Var("T"),new Var("O")])]))
		],

		// read_term/3
		"read_term/3": function( thread, point, atom ) {
			var stream = atom.args[0], term = atom.args[1], options = atom.args[2];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( options ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_list( options ) ) {
				thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.output ) {
				thread.throw_error( pl.error.permission( "input", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "input", "binary_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "input", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				// Get options
				var obj_options = {};
				var pointer = options;
				var property;
				while( pl.type.is_term(pointer) && pointer.indicator === "./2" ) {
					property = pointer.args[0];
					if( pl.type.is_variable( property ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( !pl.type.is_read_option( property ) ) {
						thread.throw_error( pl.error.domain( "read_option", property, atom.indicator ) );
						return;
					}
					obj_options[property.id] = property.args[0];
					pointer = pointer.args[1];
				}
				if( pointer.indicator !== "[]/0" ) {
					if( pl.type.is_variable( pointer ) )
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					else
						thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
					return;
				} else {
					var char, tokenizer, expr;
					var text = "";
					var tokens = [];
					var last_token = null;
					var lexical_error = false;
					// Get term
					while( last_token === null || lexical_error || last_token.name !== "atom" || last_token.value !== "." || tokens.length > 0 && expr.type === ERROR ) {
						char = stream2.stream.get( 1, stream2.position );
						while(char !== null && char !== "." && char !== "end_of_stream" && char !== "past_end_of_stream") {
							stream2.position++;
							text += char;
							char = stream2.stream.get( 1, stream2.position );
						}
						if( char === null ) {
							thread.throw_error( pl.error.representation( "character", atom.indicator ) );
							return;
						} else if( char === "end_of_stream" || char === "past_end_of_stream" ) {
							if(tokens === null || tokens.length === 0) {
								stream2.position = "past_end_of_stream";
								expr = {
									value: new Term("end_of_file", []),
									type: SUCCESS,
									len: -1
								};
								break;
							} else if(expr) {
								thread.throw_error( pl.error.syntax( last_token, "unexpected end of file", false ) );
								return;
							} else {
								thread.throw_error( pl.error.syntax( last_token, "token not found", true ) );
								return;
							}
						} else if(char === ".") {
							stream2.position++;
							text += char;
						}
						tokenizer = new Tokenizer( thread );
						tokenizer.new_text( text );
						tokens = tokenizer.get_tokens();
						num_token = tokens !== null && tokens.length > 1 ? tokens[tokens.length-2] : null;
						last_token = tokens !== null && tokens.length > 0 ? tokens[tokens.length-1] : null;
						if(tokens === null)
							continue;
						lexical_error = false;
						for(var i = 0; i < tokens.length && !lexical_error; i++)
							lexical_error = tokens[i].name === "lexical";
						if(lexical_error)
							continue;
						expr = parseExpr(thread, tokens, 0, thread.__get_max_priority(), false);
						if(num_token && num_token.name === "number" && !num_token.float && !num_token.blank && last_token.value === ".") {
							var next_char = stream2.stream.get(1, stream2.position);
							if(next_char >= '0' && next_char <= '9') {
								stream2.position++;
								text += next_char;
								last_token = null;
								continue;
							}
						}
					}
					if(last_token) {
						if(last_token.line_position === last_token.len)
							stream2.line_position += last_token.line_position;
						else
							stream2.line_position = last_token.line_position;
						stream2.line_count += last_token.line_count;
						stream2.char_count += last_token.len;
					}
					// Succeed analyzing term
					if( expr.type === SUCCESS && (expr.len === -1 || expr.len === tokens.length-1 && last_token.value === "." )) {
						thread.session.renamed_variables = {};
						expr = expr.value.rename( thread );
						var eq = new Term( "=", [term, expr] );
						// Variables
						if( obj_options.variables ) {
							var vars = arrayToList( map( nub( expr.variables() ), function(v) { return new Var(v); } ) );
							eq = new Term( ",", [eq, new Term( "=", [obj_options.variables, vars] )] );
						}
						// Variable names
						if( obj_options.variable_names ) {
							var vars = nub(expr.variables());
							var plvars = [];
							for(var i = 0; i < vars.length; i++) {
								var v = vars[i];
								for( var prop in thread.session.renamed_variables ) {
									if( thread.session.renamed_variables.hasOwnProperty( prop ) ) {
										if( thread.session.renamed_variables[ prop ] === v ) {
											plvars.push(new Term( "=", [new Term( prop, []), new Var(v)] ));
											break;
										}
									}
								}
							}
							plvars = arrayToList(plvars);
							eq = new Term( ",", [eq, new Term( "=", [obj_options.variable_names, plvars] )] );
						}
						// Singletons
						if( obj_options.singletons ) {
							var vars = nub(new Rule(expr, null).singleton_variables(true));
							var plvars = [];
							for(var i = 0; i < vars.length; i++) {
								var v = vars[i];
								for( var prop in thread.session.renamed_variables ) {
									if( thread.session.renamed_variables.hasOwnProperty( prop ) ) {
										if( thread.session.renamed_variables[ prop ] === v ) {
											plvars.push(new Term( "=", [new Term( prop, []), new Var(v)] ));
											break;
										}
									}
								}
							}
							plvars = arrayToList(plvars);
							eq = new Term( ",", [eq, new Term( "=", [obj_options.singletons, plvars] )] );
						}
						thread.prepend( [new State( point.goal.replace( eq ), point.substitution, point )] );
					// Failed analyzing term
					} else {
						if( expr.type === SUCCESS )
							thread.throw_error( pl.error.syntax( tokens[expr.len], "unexpected token", false ) );
						else
							thread.throw_error( expr.value );
					}
				}
			}
		},

		// write/1
		"write/1": [
			new Rule(new Term("write", [new Var("T")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("write", [new Var("S"),new Var("T")])]))
		],
		
		// write/2
		"write/2": function( thread, point, atom ) {
			var stream = atom.args[0], term = atom.args[1];
			thread.prepend( [new State( 
				point.goal.replace( new Term("write_term", [stream, term,
					new Term(".", [new Term("quoted", [new Term("false", [])]),
						new Term(".", [new Term("ignore_ops", [new Term("false")]),
							new Term(".", [new Term("numbervars", [new Term("true")]), new Term("[]",[])])])])]) ),
				point.substitution,
				point
			)] );
		},
		
		// writeq/1
		"writeq/1": [
			new Rule(new Term("writeq", [new Var("T")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("writeq", [new Var("S"),new Var("T")])]))
		],
		
		// writeq/2
		"writeq/2": function( thread, point, atom ) {
			var stream = atom.args[0], term = atom.args[1];
			thread.prepend( [new State( 
				point.goal.replace( new Term("write_term", [stream, term,
					new Term(".", [new Term("quoted", [new Term("true", [])]),
						new Term(".", [new Term("ignore_ops", [new Term("false")]),
							new Term(".", [new Term("numbervars", [new Term("true")]), new Term("[]",[])])])])]) ),
				point.substitution,
				point
			)] );
		},
		
		// write_canonical/1
		"write_canonical/1": [
			new Rule(new Term("write_canonical", [new Var("T")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("write_canonical", [new Var("S"),new Var("T")])]))
		],
		
		// write_canonical/2
		"write_canonical/2": function( thread, point, atom ) {
			var stream = atom.args[0], term = atom.args[1];
			thread.prepend( [new State( 
				point.goal.replace( new Term("write_term", [stream, term,
					new Term(".", [new Term("quoted", [new Term("true", [])]),
						new Term(".", [new Term("ignore_ops", [new Term("true")]),
							new Term(".", [new Term("numbervars", [new Term("false")]), new Term("[]",[])])])])]) ),
				point.substitution,
				point
			)] );
		},

		// write_term/2
		"write_term/2": [
			new Rule(new Term("write_term", [new Var("T"),new Var("O")]), new Term(",", [new Term("current_output", [new Var("S")]),new Term("write_term", [new Var("S"),new Var("T"),new Var("O")])]))
		],
		
		// write_term/3
		"write_term/3": function( thread, point, atom ) {
			var stream = atom.args[0], term = atom.args[1], options = atom.args[2];
			var stream2 = pl.type.is_stream( stream ) ? stream : thread.get_stream_by_alias( stream.id );
			if( pl.type.is_variable( stream ) || pl.type.is_variable( options ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_list( options ) ) {
				thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
			} else if( !pl.type.is_stream( stream ) && !pl.type.is_atom( stream ) ) {
				thread.throw_error( pl.error.domain( "stream_or_alias", stream, atom.indicator ) );
			} else if( !pl.type.is_stream( stream2 ) || stream2.stream === null ) {
				thread.throw_error( pl.error.existence( "stream", stream, atom.indicator ) );
			} else if( stream2.input ) {
				thread.throw_error( pl.error.permission( "output", "stream", stream, atom.indicator ) );
			} else if( stream2.type === "binary" ) {
				thread.throw_error( pl.error.permission( "output", "binary_stream", stream, atom.indicator ) );
			} else if( stream2.position === "past_end_of_stream" && stream2.eof_action === "error" ) {
				thread.throw_error( pl.error.permission( "output", "past_end_of_stream", stream, atom.indicator ) );
			} else {
				// Get options
				var obj_options = {};
				var pointer = options;
				var property;
				while( pl.type.is_term(pointer) && pointer.indicator === "./2" ) {
					property = pointer.args[0];
					if( pl.type.is_variable( property ) ) {
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
						return;
					} else if( !pl.type.is_write_option( property ) ) {
						thread.throw_error( pl.error.domain( "write_option", property, atom.indicator ) );
						return;
					}
					obj_options[property.id] = property.args[0].id === "true";
					pointer = pointer.args[1];
				}
				if( pointer.indicator !== "[]/0" ) {
					if( pl.type.is_variable( pointer ) )
						thread.throw_error( pl.error.instantiation( atom.indicator ) );
					else
						thread.throw_error( pl.error.type( "list", options, atom.indicator ) );
					return;
				} else {
					obj_options.session = thread.session;
					var text = term.toString( obj_options );
					stream2.stream.put( text, stream2.position );
					if( typeof stream2.position === "number" )
						stream2.position += text.length;
					var nl = (text.match(/\n/g) || []).length;
					stream2.line_count += nl;
					if(nl > 0)
						stream2.line_position = text.length - text.lastIndexOf("\n") - 1;
					else
						stream2.line_position += text.length;
					stream2.char_count += text.length;
					thread.success( point );
				}
			}
		},
		
		// IMPLEMENTATION DEFINED HOOKS
		
		// halt/0
		"halt/0": function( thread, point, _ ) {
			if( thread.get_flag("nodejs").indicator === "true/0" )
				process.exit();
			thread.points = [];
		},
		
		// halt/1
		"halt/1": function( thread, point, atom ) {
			var int = atom.args[0];
			if( pl.type.is_variable( int ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_integer( int ) ) {
				thread.throw_error( pl.error.type( "integer", int, atom.indicator ) );
			} else {
				if( thread.get_flag("nodejs").indicator === "true/0" )
					process.exit(int.value);
				thread.points = [];
			}
		},
		
		// current_prolog_flag/2
		"current_prolog_flag/2": function( thread, point, atom ) {
			var flag = atom.args[0], value = atom.args[1];
			if( !pl.type.is_variable( flag ) && !pl.type.is_atom( flag ) ) {
				thread.throw_error( pl.error.type( "atom", flag, atom.indicator ) );
			} else if( !pl.type.is_variable( flag ) && !pl.type.is_flag( flag ) ) {
				thread.throw_error( pl.error.domain( "prolog_flag", flag, atom.indicator ) );
			} else {
				var states = [];
				for( var name in pl.flag ) {
					if(!pl.flag.hasOwnProperty(name)) continue;
					var goal = new Term( ",", [new Term( "=", [new Term( name ), flag] ), new Term( "=", [thread.get_flag(name), value] )] );
					states.push( new State( point.goal.replace( goal ), point.substitution, point ) );
				}
				thread.prepend( states );
			}
		},
		
		// set_prolog_flag/2
		"set_prolog_flag/2": function( thread, point, atom ) {
			var flag = atom.args[0], value = atom.args[1];
			if( pl.type.is_variable( flag ) || pl.type.is_variable( value ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_atom( flag ) ) {
				thread.throw_error( pl.error.type( "atom", flag, atom.indicator ) );
			} else if( !pl.type.is_flag( flag ) ) {
				thread.throw_error( pl.error.domain( "prolog_flag", flag, atom.indicator ) );
			} else if( !pl.type.is_modifiable_flag( flag ) ) {
				thread.throw_error( pl.error.permission( "modify", "flag", flag, atom.indicator ) );
			} else if( !pl.type.is_value_flag( flag, value ) ) {
				thread.throw_error( pl.error.domain( "flag_value", new Term( "+", [flag, value] ), atom.indicator ) );
			} else {
				thread.session.flag[flag.id] = value;
				thread.success( point );
			}
		},



		// LOAD PROLOG SOURCE FILES

		// consult/1
		"consult/1": function(thread, point, atom) {
			var src = atom.args[0];
			var context_module = "user";
			if(src.indicator === ":/2") {
				context_module = src.args[0].id;
				src = src.args[1];
			}
			if(pl.type.is_variable(src)) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if(!pl.type.is_atom(src)) {
				thread.throw_error( pl.error.type( "atom", src, atom.indicator ) );
			} else {
				if(thread.consult(src.id, {
					context_module: context_module,
					text: false,
					html: false,
					success: function() {
						thread.success(point);
						thread.again();
					},
					error: function(err) {
						thread.throw_error(err);
						thread.again();
					}
				}));
				return true;
			}
		},



		// TIME AND DATES

		// get_time/1
		"get_time/1": function( thread, point, atom ) {
			var time = atom.args[0];
			if(!pl.type.is_variable(time) && !pl.type.is_number(time)) {
				thread.throw_error( pl.error.type( "number", time, atom.indicator ) );
			} else {
				var current = new Num(Date.now(), true);
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [time, current] ) ), 
					point.substitution,
					point
				)] );
			}
		},

		// time_property
		"time_property/2": function(thread, point, atom) {
			var time = atom.args[0], property = atom.args[1];
			if(pl.type.is_variable(time)) {
				thread.throw_error(pl.error.instantiation(atom.indicator));
			} else if(!pl.type.is_variable(time) && !pl.type.is_number(time)) {
				thread.throw_error(pl.error.type("number", time, atom.indicator));
			} else if(!pl.type.is_variable(property) && !pl.type.is_time_property(property)) {
				thread.throw_error(pl.error.domain("time_property", property, atom.indicator));
			} else {
				var props;
				if(pl.type.is_variable(property)) {
					props = ["year", "month", "day", "hours", "minutes", "seconds", "milliseconds", "weekday"];
				} else {
					props = [property.id];
				}
				var date = new Date(time.value);
				var value;
				var states = [];
				for(var i = 0; i < props.length; i++) {
					switch(props[i]) {
						case "year":
							value = new Term("year", [new Num(date.getFullYear(), false)]);
							break;
						case "month":
							value = new Term("month", [new Num(date.getMonth(), false)]);
							break;
						case "day":
							value = new Term("day", [new Num(date.getDate(), false)]);
							break;
						case "hours":
							value = new Term("hours", [new Num(date.getHours(), false)]);
							break;
						case "minutes":
							value = new Term("minutes", [new Num(date.getMinutes(), false)]);
							break;
						case "seconds":
							value = new Term("seconds", [new Num(date.getSeconds(), false)]);
							break;
						case "milliseconds":
							value = new Term("milliseconds", [new Num(date.getMilliseconds(), false)]);
							break;
						case "weekday":
							value = new Term("weekday", [new Num(date.getDay(), false)]);
							break;
					}
					states.push(new State(
						point.goal.replace( new Term( "=", [property, value] ) ), 
						point.substitution,
						point
					));
				}
				thread.prepend(states);
			}
		},

		// time_year/2
		"time_year/2": function( thread, point, atom ) {
			var time = atom.args[0], year = atom.args[1];
			if(pl.type.is_variable(time)) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if(!pl.type.is_number(time)) {
				thread.throw_error( pl.error.type( "number", time, atom.indicator ) );
			} else if(!pl.type.is_variable(year) && !pl.type.is_integer(year)) {
				thread.throw_error( pl.error.type( "integer", year, atom.indicator ) );
			} else {
				var value = new Num(new Date(time.value).getFullYear(), false);
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [year, value] ) ), 
					point.substitution,
					point
				)] );
			}
		},

		// time_month/2
		"time_month/2": function( thread, point, atom ) {
			var time = atom.args[0], month = atom.args[1];
			if(pl.type.is_variable(time)) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if(!pl.type.is_number(time)) {
				thread.throw_error( pl.error.type( "number", time, atom.indicator ) );
			} else if(!pl.type.is_variable(month) && !pl.type.is_integer(month)) {
				thread.throw_error( pl.error.type( "integer", month, atom.indicator ) );
			} else {
				var value = new Num(new Date(time.value).getMonth(), false);
				thread.prepend( [new State(
					point.goal.replace( new Term( "=", [month, value] ) ), 
					point.substitution,
					point
				)] );
			}
		},



		// GRAMMARS

		// phrase/3
		"phrase/3": function( thread, point, atom ) {
			var grbody = atom.args[0], s0 = atom.args[1], s = atom.args[2];
			var context_module = "user";
			if(grbody.indicator === ":/2") {
				context_module = grbody.args[0].id;
				grbody = grbody.args[1];
			}
			if( pl.type.is_variable( grbody ) ) {
				thread.throw_error( pl.error.instantiation( atom.indicator ) );
			} else if( !pl.type.is_callable( grbody ) ) {
				thread.throw_error( pl.error.type( "callable", grbody, atom.indicator ) );
			} else {
				var goal = body_to_dcg( grbody.clone(), s0, thread );
				goal.value = new Term(":", [new Term(context_module), new Term("call", [goal.value])]);
				if(goal !== null) {
					thread.prepend( [new State(
						point.goal.replace( new Term( ",", [goal.value, new Term("=", [goal.variable, s])] ) ), 
						point.substitution,
						point
					)] );
				}
			}
		},

		// phrase/2
		"phrase/2": function( thread, point, atom ) {
			var grbody = atom.args[0], s0 = atom.args[1];
			thread.prepend( [new State(
				point.goal.replace( new Term( "phrase", [grbody, s0, new Term("[]", [])] ) ), 
				point.substitution,
				point
			)] );
		},



		// TAU PROLOG INFORMATION

		// version/0
		"version/0": function( thread, point, atom ) {
			var msg = "Welcome to Tau Prolog version " + version.major + "." + version.minor + "." + version.patch + "\n";
			msg += "Tau Prolog comes with ABSOLUTELY NO WARRANTY. This is free software.\n";
			msg += "Please run ?- license. for legal details.\n";
			msg += "For online help and background, visit http:/tau-prolog.org";
			thread.prepend( [new State(
				point.goal.replace( new Term( "write", [new Term( msg, [] )] ) ), 
				point.substitution,
				point
			)] );
		},

		// license/0
		"license/0": function( thread, point, atom ) {
			var msg = "Tau Prolog. A Prolog interpreter in JavaScript.\n";
			msg += "Copyright (C) 2017 - 2020 José Antonio Riaza Valverde\n\n";
			msg += "Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n";
			msg += "1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n";
			msg += "2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n";
			msg += "3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\n";
			msg += "THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n\n";
			msg += "You should have received a copy of the BSD 3-Clause License along with this program. If not, see https://opensource.org/licenses/BSD-3-Clause";
			thread.prepend( [new State(
				point.goal.replace( new Term( "write", [new Term( msg, [] )] ) ), 
				point.substitution,
				point
			)] );
		}

	}, "all", {
		meta_predicates: {
			// (0;0)
			";/2": new Term(";", [new Num(0, false), new Num(0, false)]),
			// (0->0)
			"->/2": new Term("->", [new Num(0, false), new Num(0, false)]),
			// (\+0)
			"\\+/1": new Term("\\+", [new Num(0, false)]),
			// abolish(:)
			"abolish/1": new Term("abolish", [new Term(":")]),
			// asserta(:)
			"asserta/1": new Term("asserta", [new Term(":")]),
			// assertz(:)
			"assertz/1": new Term("assertz", [new Term(":")]),
			// bagof(?, ^, -)
			"bagof/3": new Term("bagof", [new Term("?"), new Term("^"), new Term("-")]),
			// call(0)
			"call/1": new Term("call", [new Num(0, false)]),
			// call(1, ?)
			"call/2": new Term("call", [new Num(1, false), new Term("?")]),
			// call(2, ?, ?)
			"call/3": new Term("call", [new Num(2, false), new Term("?"), new Term("?")]),
			// call(3, ?, ?, ?)
			"call/4": new Term("call", [new Num(3, false), new Term("?"), new Term("?"), new Term("?")]),
			// call(4, ?, ?, ?, ?)
			"call/5": new Term("call", [new Num(4, false), new Term("?"), new Term("?"), new Term("?"), new Term("?")]),
			// call(5, ?, ?, ?, ?, ?)
			"call/6": new Term("call", [new Num(5, false), new Term("?"), new Term("?"), new Term("?"), new Term("?"), new Term("?")]),
			// call(6, ?, ?, ?, ?, ?, ?)
			"call/7": new Term("call", [new Num(6, false), new Term("?"), new Term("?"), new Term("?"), new Term("?"), new Term("?"), new Term("?")]),
			// call(7, ?, ?, ?, ?, ?, ?, ?)
			"call/8": new Term("call", [new Num(6, false), new Term("?"), new Term("?"), new Term("?"), new Term("?"), new Term("?"), new Term("?"), new Term("?")]),
			// call_cleanup(0, 0)
			"call_cleanup/2": new Term("call_cleanup", [new Num(0, false), new Num(0, false)]),
			// catch(0, ?, 0)
			"catch/3": new Term("catch", [new Num(0, false), new Term("?"), new Num(0, false)]),
			// consult(:)
			"consult/1": new Term("consult", [new Term(":")]),
			// clause(:, ?)
			"clause/2": new Term("clause", [new Term(":"), new Term("?")]),
			// current_predicate(?, :)
			"current_predicate/2": new Term("current_predicate", [new Term("?"), new Term(":")]),
			// findall(?, 0, -)
			"findall/3": new Term("findall", [new Term("?"), new Num(0, false), new Term("-")]),
			// findall(?, 0, -, ?)
			"findall/4": new Term("findall", [new Term("?"), new Num(0, false), new Term("-"), new Term("?")]),
			// forall(0, 0)
			"forall/2": new Term("forall", [new Num(0, false), new Num(0, false)]),
			// once(0)
			"once/1": new Term("once", [new Num(0, false)]),
			// phrase(:, ?)
			"phrase/2": new Term("phrase", [new Term(":"),new Term("?")]),
			// phrase(:, ?, ?)
			"phrase/3": new Term("phrase", [new Term(":"),new Term("?"), new Term("?")]),
			// retract(:)
			"retract/1": new Term("retract", [new Term(":")]),
			// retractall(:)
			"retractall/1": new Term("retractall", [new Term(":")]),
			// setup_call_cleanup(0, 0, 0)
			"setup_call_cleanup/3": new Term("setup_call_cleanup", [new Num(0, false), new Num(0, false), new Num(0, false)]),
			// setof(?, ^, -)
			"setof/3": new Term("setof", [new Term("?"), new Term("^"), new Term("-")])
		}
	});

	{
		module.exports = pl;
	}
	
})();
});

export { core as __moduleExports };
