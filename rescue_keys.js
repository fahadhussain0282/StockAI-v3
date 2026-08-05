const crypto = require('crypto');

const keys = [
  "enc:0ae333d72b4dee9bd7ef923b7993f51e:aba26eee1092dbd6c1e57acebcabf6ae:a16aae2018d4abeeadbd0f71d57f1f8a1491b3a0408f40f17f4bea5ac17289b92925f8d49bc8caf64cd3b775787a51a96cd030cece13755c889ba77a2b4557e54053a4fcd6a24248a590323837c3d6de9786d5cd295c5f5e3cd5b8b9a70bc20b153bf7e0f7f6c1a07009f121401f62b314146d8bca4c96651c7647b91019942f7f55161e66a432418afa27dabde94d2cd08c27a37b49b8a6eb9fec733ea9a60aa558c16c",
  "enc:27cd94751ab6560a09d77d3b8caed237:f09ba5fa31785f5b1753b9d563f48944:c79841f15d4cf84e471a21976f45d9b001510fd8cc4fb32ef2df2238e2d90a381841054b6754c45a1cb664b5780536c132775ed31a572f1ba8a8614b1e90fa57753870551060809c94769896896e183ef0c012a7d48ae81f3fa5203cb0faae4c290ad69fce6fc481922123546d8d9b622a3339da00b784e8adc8be3d3a77c5010e68c1b9a946e73ae8e7b05d56148e869ee69f632eb2ceb4851b10773041967abf4397aa"
];

function decryptKey(stored, secret) {
  try {
    const parts = stored.split(':');
    const [, ivHex, tagHex, encHex] = parts;
    const keyBuf = crypto.scryptSync(secret.trim(), 'stockai-salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (err) {
    return 'FAILED: ' + err.message;
  }
}

function encryptKey(plaintext, secret) {
  const keyBuf = crypto.scryptSync(secret.trim(), 'stockai-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

const SECRET_OLD = "";
const SECRET_NEW = "my_local_dev_encryption_secret_123!";

for (let i = 0; i < keys.length; i++) {
  const decrypted = decryptKey(keys[i], SECRET_OLD);
  console.log('Key ' + i + ' decrypted length:', decrypted.length);
  if (!decrypted.startsWith('FAILED')) {
    const newEncrypted = encryptKey(decrypted, SECRET_NEW);
    console.log('Key ' + i + ' new encrypted:\n' + newEncrypted);
  }
}
