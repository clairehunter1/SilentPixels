const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomBase58(length: number) {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockIPFSUpload(file: File) {
  await wait(400 + Math.random() * 600);
  const hash = `Qm${randomBase58(44)}`;
  return { hash, size: file.size };
}
