// Traduit les erreurs Mongoose en réponses HTTP propres (utilisé dans les catch des contrôleurs)
const gererErreur = (err, res) => {
    // Exercice 2 : identifiant mal formé (ex. GET /api/articles/abc)
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Identifiant de ressource invalide (format ObjectId attendu)'
        });
    }

    // Contrainte du schéma non respectée (required, match, min, enum, maxlength...)
    if (err.name === 'ValidationError') {
        const erreurs = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: 'Données invalides', erreurs });
    }

    // Index unique violé (ex. email déjà utilisé)
    if (err.code === 11000) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    res.status(500).json({ message: err.message });
};

module.exports = gererErreur;
