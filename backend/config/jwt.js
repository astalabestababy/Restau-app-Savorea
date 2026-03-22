const JWT_SECRET = process.env.JWT_SECRET || 'secret';

if (!process.env.JWT_SECRET) {
    console.warn('[jwt] JWT_SECRET not set. Using insecure default secret.');
}

module.exports = { JWT_SECRET };
