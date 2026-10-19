const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { protect } = require('../middlewares/authMiddleware');

// Consultation publique
router.get('/', articleController.getAllArticles);

// Exercice 2 : déclarée avant '/:id', sinon "my-articles" serait pris pour un id
router.get('/my-articles', protect, articleController.getMyArticles);

router.get('/:id', articleController.getArticleById);

// Opérations d'écriture protégées par authentification JWT
router.post('/', protect, articleController.createArticle);
router.put('/:id', protect, articleController.updateArticle);
router.delete('/:id', protect, articleController.deleteArticle);

module.exports = router;
