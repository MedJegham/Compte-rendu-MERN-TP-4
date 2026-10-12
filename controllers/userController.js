const User = require('../models/userModel');
const Article = require('../models/articleModel');
const gererErreur = require('../utils/gererErreur');

// 1. Récupérer tous les utilisateurs (GET /api/users, filtre optionnel ?role=...)
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const users = await User.find(role ? { role } : {});
        res.status(200).json(users);
    } catch (err) {
        gererErreur(err, res);
    }
};

// 2. Récupérer un utilisateur par son identifiant (GET /api/users/:id)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
    } catch (err) {
        gererErreur(err, res); // CastError -> 400 (Exercice 2)
    }
};

// 3. Créer un nouvel utilisateur (POST /api/users)
const createUser = async (req, res) => {
    try {
        const { name, email, age, role, bio, phone } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "Le nom et l'email sont requis" });
        }

        // Vérification de doublon d'email
        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }

        const user = await User.create({ name, email, age, role, bio, phone });
        res.status(201).json(user);
    } catch (err) {
        gererErreur(err, res); // ValidationError -> 400
    }
};

// 4. Supprimer un utilisateur (DELETE /api/users/:id) - Exercice 1
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
    getAllUsers,
    getUserById,
    createUser,
    deleteUser
};
