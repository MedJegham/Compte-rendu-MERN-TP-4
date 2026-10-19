const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Article = require('../models/articleModel');
const gererErreur = require('../utils/gererErreur');

// Utilitaire de génération de Token JWT (valide 1 jour)
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '10s'
    });
};

// POST /api/users/register (Inscription)
const registerUser = async (req, res) => {
    try {
        // Exercice 2 : le champ role du body est ignoré (pas d'escalade de privilèges)
        const { name, email, password, age } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
        }

        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }

        // Le minlength du schéma s'appliquerait au hash (60 caractères) : on le vérifie avant hachage
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Le mot de passe doit comporter au moins 6 caractères'
            });
        }

        // Hachage sécurisé avec sel (Salt factor = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            age,
            role: 'user' // Inscription publique : toujours 'user'
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (err) {
        gererErreur(err, res); // ValidationError -> 400, doublon -> 409
    }
};

// POST /api/users/login (Connexion)
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        // Comparaison sécurisée en temps constant
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (err) {
        gererErreur(err, res);
    }
};

// GET /api/users/profile (Profil protégé : req.user est injecté par protect)
const getUserProfile = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (err) {
        gererErreur(err, res);
    }
};

// PUT /api/users/update-password (Exercice 1, protégé)
const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'oldPassword et newPassword sont requis' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Le nouveau mot de passe doit comporter au moins 6 caractères'
            });
        }

        // req.user a été chargé sans le mot de passe : on recharge le hash
        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        gererErreur(err, res);
    }
};

// PUT /api/users/:id/role (Exercice 2, admin uniquement)
const updateUserRole = async (req, res) => {
    try {
        const { role = 'admin' } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Le rôle doit être 'user' ou 'admin'" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ message: `Rôle mis à jour : ${user.role}`, user });
    } catch (err) {
        gererErreur(err, res); // CastError -> 400
    }
};

// GET /api/users (Admin uniquement, filtre optionnel ?role=...)
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const users = await User.find(role ? { role } : {}).select('-password');
        res.status(200).json(users);
    } catch (err) {
        gererErreur(err, res);
    }
};

// GET /api/users/:id (Admin uniquement)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
    } catch (err) {
        gererErreur(err, res); // CastError -> 400
    }
};

// DELETE /api/users/:id (Admin uniquement)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable pour la suppression' });
        }

        // Intégrité référentielle : interdit si l'utilisateur a au moins un article
        const article = await Article.findOne({ author: req.params.id });
        if (article) {
            return res.status(400).json({
                message: 'Impossible de supprimer un utilisateur ayant des articles publies'
            });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Utilisateur supprimé avec succès', id: req.params.id });
    } catch (err) {
        gererErreur(err, res);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updatePassword,
    updateUserRole,
    getAllUsers,
    getUserById,
    deleteUser
};
