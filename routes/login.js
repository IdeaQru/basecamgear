const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const router = express.Router();

// Load users dari environment variables
const users = [
  {
    id: 1,
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    name: process.env.ADMIN_NAME,
    role: 'admin'
  },
  {
    id: 2,
    email: process.env.OPERATOR_EMAIL,
    passwordHash: process.env.OPERATOR_PASSWORD_HASH,
    name: process.env.OPERATOR_NAME,
    role: 'operator'
  }
].filter(u => u.email && u.passwordHash); // Filter yang valid

router.get('/', (req, res) => {
  // Jika sudah login, redirect ke dashboard
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

router.post('/auth', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email dan password wajib diisi' 
    });
  }
  
  try {
    // Cari user berdasarkan email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    // Verify password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    // Regenerate session untuk keamanan
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Terjadi kesalahan sistem' 
        });
      }
      
      // Simpan data user ke session (jangan simpan password)
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      
      // Save session
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan sistem' 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Login berhasil!',
          redirectUrl: '/dashboard'
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan sistem' 
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.clearCookie('sessionId');
    res.redirect('/');
  });
});

module.exports = router;
