const Article = require('../models/articleModel');
const User = require('../models/userModel');
const gererErreur = require('../utils/gererErreur');

// 1. Récupérer tous les articles avec les données de l'auteur (filtre optionnel ?author=<id>)
const getAllArticles = async (req, res) => {
    try {
        const { author } = req.query;
        const articles = await Article.find(author ? { author } : {}).populate('author', 'name email');
        res.status(200).json(articles);
    } catch (err) {
        gererErreur(err, res);
    }
};

// 2. Récupérer un article unique par son ID (GET /api/articles/:id)
const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).populate('author', 'name email');
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.status(200).json(article);
    } catch (err) {
        gererErreur(err, res); // CastError -> 400 (Exercice 2)
    }
};

// 3. Créer un nouvel article lié à un auteur (POST /api/articles)
const createArticle = async (req, res) => {
    try {
        const { title, content, authorId } = req.body;
        if (!title || !content || !authorId) {
            return res.status(400).json({ message: 'title, content et authorId sont obligatoires' });
        }

        // Vérifier l'existence réelle de l'auteur dans la collection 'users'
        const author = await User.findById(authorId);
        if (!author) {
            return res.status(404).json({ message: 'Auteur non trouvé (identifiant authorId invalide)' });
        }

        const newArticle = await Article.create({ title, content, author: authorId });
        const populatedArticle = await newArticle.populate('author', 'name email');
        res.status(201).json(populatedArticle);
    } catch (err) {
        gererErreur(err, res);
    }
};

// 4. Mettre à jour un article (PUT /api/articles/:id)
const updateArticle = async (req, res) => {
    try {
        const { title, content } = req.body;
        const article = await Article.findByIdAndUpdate(
            req.params.id,
            { title, content },
            // returnDocument: 'after' remplace { new: true } (déprécié dans Mongoose 9)
            { returnDocument: 'after', runValidators: true }
        );
        if (!article) {
            return res.status(404).json({ message: 'Article introuvable pour la mise à jour' });
        }
        const populated = await article.populate('author', 'name email');
        res.status(200).json(populated);
    } catch (err) {
        gererErreur(err, res);
    }
};

// 5. Supprimer un article (DELETE /api/articles/:id)
const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article introuvable pour la suppression' });
        }
        res.status(200).json({ message: 'Article supprimé avec succès', id: req.params.id });
    } catch (err) {
        gererErreur(err, res);
    }
};

module.exports = {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle
};
