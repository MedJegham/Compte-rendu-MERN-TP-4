const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Le préfixe '/api/users' est défini dans server.js : '/' représente donc '/api/users'

// Routes d'authentification publiques
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Route privée protégée par Token JWT (déclarée avant '/:id')
router.get('/profile', protect, userController.getUserProfile);

// Exercice 1 : changement de mot de passe de l'utilisateur connecté
router.put('/update-password', protect, userController.updatePassword);

// Routes réservées aux administrateurs (JWT valide + rôle admin requis)
router.get('/', protect, adminOnly, userController.getAllUsers);
router.put('/:id/role', protect, adminOnly, userController.updateUserRole);
router.get('/:id', protect, adminOnly, userController.getUserById);
router.delete('/:id', protect, adminOnly, userController.deleteUser);

module.exports = router;
