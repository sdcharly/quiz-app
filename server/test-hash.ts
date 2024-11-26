import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test admin password
console.log('Testing admin password (admin123):');
console.log(hashPassword('admin123'));

// Test student password
console.log('\nTesting student password (student123):');
console.log(hashPassword('student123'));
