const bcrypt = require('bcrypt');

async function generateHash(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('\nCopy hash ini ke file .env');
}

// Ganti dengan password yang diinginkan
const passwordAdmin = 'admin123';
const passwordOperator = 'operator123';

console.log('=== ADMIN ===');
generateHash(passwordAdmin).then(() => {
  console.log('\n=== OPERATOR ===');
  generateHash(passwordOperator);
});
