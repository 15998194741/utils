use md5::{Digest, Md5};
use wasm_bindgen::prelude::*;

/// Computes the MD5 digest of a string.
///
/// The input is encoded as UTF-8, and the result is 32 lowercase
/// hexadecimal characters, which is the same shape as the JavaScript
/// implementation in the package entry.
///
/// MD5 is a fast checksum, not a cryptographic hash. Use it for file
/// fingerprints, cache keys, and change detection, never for password
/// storage, signatures, or anything that needs collision resistance.
#[wasm_bindgen]
pub fn md5(input: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_like_the_javascript_implementation() {
        assert_eq!(md5(""), "d41d8cd98f00b204e9800998ecf8427e");
        assert_eq!(md5("hello"), "5d41402abc4b2a76b9719d911017c592");
        assert_eq!(md5("hello world"), "5eb63bbbe01eeed093cb22bb8f5acdc3");
        // Non-ASCII input is encoded as UTF-8.
        assert_eq!(md5("中文测试"), "089b4943ea034acfa445d050c7913e55");
        // A character outside the Basic Multilingual Plane takes four bytes.
        assert_eq!(md5("🎉emoji"), "a0f263caee344911f0a9a01e933e026e");
        // Line endings are hashed as they are.
        assert_eq!(md5("a\r\nb"), "65d5f03c46e62e3f2babbe712d2ce464");
    }
}
