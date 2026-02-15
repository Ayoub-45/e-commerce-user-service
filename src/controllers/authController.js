const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Helper
const generateToken = (payload, secret, expiresIn) => {
    // expiresIn should be string or number
    if (!expiresIn) expiresIn = '1h';
    return jwt.sign(payload, secret, { expiresIn });
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;

        await user.save();

        const verificationURL =
            `${process.env.BACKEND_URL}/auth/verify-email?token=${verificationToken}&id=${user._id}`;

        await sendEmail({
            to: user.email,
            subject: 'Email Verification',
            html: `<h3>Click to verify your email:</h3>
                   <a href="${verificationURL}">Verify Email</a>`
        });

        res.status(201).json({
            message: 'Registration successful! Please verify your email.'
        });
        

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
/* ================= REFRESH TOKEN ================= */
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token)
            return res.status(401).json({ message: 'No refresh token provided' });

        // Check if token exists in database
        const savedToken = await Token.findOne({ token });
        if (!savedToken)
            return res.status(403).json({ message: 'Invalid refresh token' });

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Optional but good practice: check expiration in DB
        if (savedToken.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Refresh token expired' });
        }

        // Issue new access token
        const newAccessToken = generateToken(
            { id: decoded.id },
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN
        );

        res.json({ accessToken: newAccessToken });

    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};


/* ================= LOGIN ================= */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified)
            return res.status(401).json({ message: 'Please verify your email' });

        const accessToken = generateToken(
            { id: user._id, roles: user.roles },
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN
        );

        const refreshToken = generateToken(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            process.env.REFRESH_TOKEN_EXPIRES_IN
        );

        await new Token({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }).save();

        res.json({ accessToken, refreshToken });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= VERIFY EMAIL ================= */
/* ================= VERIFY EMAIL ================= */
exports.verifyEmail = async (req, res) => {
    try {
        const { token, id } = req.query;

        const user = await User.findById(id);

        if (!user || user.verificationToken !== token) {
            return res.send(`
                <h1>Invalid Link ❌</h1>
                <p>This verification link is invalid. Please register again.</p>
            `);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Send a simple HTML page confirming verification
        res.send(`
            <h1>Email Verified ✅</h1>
            <p>Your account has been successfully verified. You can now login (when you build the login page).</p>
        `);

    } catch (err) {
        console.error(err);
        res.send(`
            <h1>Error ❌</h1>
            <p>Something went wrong. Please try again later.</p>
        `);
    }
};


/* ================= REQUEST PASSWORD RESET ================= */
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000;

        await user.save();

        const resetURL =
            `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset',
            html: `<h3>Reset your password:</h3>
                   <a href="${resetURL}">Reset Password</a>`
        });

        res.json({ message: 'Password reset email sent!' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
    try {
        const { token, id, password } = req.body;

        const user = await User.findOne({
            _id: id,
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() }
        });

        if (!user)
            return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = await bcrypt.hash(password, 10);
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;

        await user.save();

        res.json({ message: 'Password reset successfully!' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
