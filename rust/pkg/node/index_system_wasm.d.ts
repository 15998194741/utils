/* tslint:disable */
/* eslint-disable */

/**
 * Computes the MD5 digest of a string.
 *
 * The input is encoded as UTF-8, and the result is 32 lowercase
 * hexadecimal characters, which is the same shape as the JavaScript
 * implementation in the package entry.
 *
 * MD5 is a fast checksum, not a cryptographic hash. Use it for file
 * fingerprints, cache keys, and change detection, never for password
 * storage, signatures, or anything that needs collision resistance.
 */
export function md5(input: string): string;
