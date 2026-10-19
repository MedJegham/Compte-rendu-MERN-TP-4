const Article = require('../models/articleModel');
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
        gererErreur(err, res); // CastError -> 400
    }
};

// GET /api/articles/my-articles (Exercice 2, protégé : articles de l'utilisateur connecté)
const getMyArticles = async (req, res) => {
    try {
        const articles = await Article.find({ author: req.user._id }).populate('author', 'name email');
        res.status(200).json(articles);
    } catch (err) {
        gererErreur(err, res);
    }
};

// 3. Créer un article (POST /api/articles, protégé)
const createArticle = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Titre et contenu obligatoires' });
        }

        // L'auteur est extrait du token vérifié : usurpation impossible !
        const newArticle = await Article.create({
            title,
            content,
            author: req.user._id
        });

        const populated = await newArticle.populate('author', 'name email role');
        res.status(201).json(populated);
    } catch (err) {
        gererErreur(err, res);
    }
};

// Vérification des droits de propriété : auteur de l'article ou admin
const peutModifier = (article, user) =>
    article.author.toString() === user._id.toString() || user.role === 'admin';

// 4. Mettre à jour un article (PUT /api/articles/:id, protégé : auteur ou admin)
const updateArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        if (!peutModifier(article, req.user)) {
            return res.status(403).json({
                message: "Action interdite : vous n'êtes pas l'auteur de cet article"
            });
        }

        article.title = req.body.title || article.title;
        article.content = req.body.content || article.content;
        const updated = await article.save();
        const populated = await updated.populate('author', 'name email role');

        res.status(200).json(populated);
    } catch (err) {
        gererErreur(err, res);
    }
};

// 5. Supprimer un article (DELETE /api/articles/:id, protégé : auteur ou admin)
const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        if (!peutModifier(article, req.user)) {
            return res.status(403).json({
                message: "Action interdite : vous n'êtes pas l'auteur de cet article"
            });
        }

        await Article.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Article supprimé avec succès', id: req.params.id });
    } catch (err) {
        gererErreur(err, res);
    }
};

module.exports = {
    getAllArticles,
    getArticleById,
    getMyArticles,
    createArticle,
    updateArticle,
    deleteArticle
};
