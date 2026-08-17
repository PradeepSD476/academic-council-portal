import jwt from 'jsonwebtoken';

const adminId = '6a5f97c21f9f77b1e076a015';
const token = jwt.sign(
  { id: adminId, role: 'ADMIN' },
  'your_secure_jwt_secret_key',
  { expiresIn: '30d' }
);

const response = await fetch('http://localhost:3001/api/v1/admin/users?page=1&search=', {
  headers: {
    cookie: `jwt=${token}`,
  },
});

const body = await response.text();
console.log(JSON.stringify({ status: response.status, body: body.slice(0, 2000) }, null, 2));
