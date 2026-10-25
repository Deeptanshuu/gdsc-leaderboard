const crypto = require('crypto');

function signPayload(rawBody, secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

// Verifies GitHub's X-Hub-Signature-256 header against the raw request body.
function verifyGithubSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !rawBody) return false;
  const expected = Buffer.from(signPayload(rawBody, secret));
  const received = Buffer.from(signatureHeader);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = { signPayload, verifyGithubSignature };
