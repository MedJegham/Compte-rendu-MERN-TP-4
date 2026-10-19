const express = require("express");
const app = express();
const dotenv = require('dotenv');

// Chargement des variables d’environnement (.env) avant toute lecture de process.env
dotenv.config();

const connectDB = require('./config/db');
const PORT = process.env.PORT || 3000;
const articleRoutes = require ('./routes/articleRoutes') ;
const userRoutes = require('./routes/userRoutes');

// Middleware pour parser le corps des requetes en JSON
app.use(express.json());

app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Bonjour, je suis l'API du blog - Serveur Modulaire Opérationnel (SoC)"
    });
});




app.get("/about", (req, res) => {
    res.json({
        application: "API du blog",
        nom: "Mohamed Jegham",
        version: "1.0.0"
    });
});

app.post("/contact", (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({
            error: "L'email et le message sont obligatoires"
        });
    }

    res.status(200).json({
        message: "Merci, votre message a bien été reçu"
    });
});

(async () => {
    try {
        // 1. Établissement de la connexion distante
        await connectDB(process.env.MONGODB_URI);

        // 2. Démarrage de l'écoute du serveur HTTP
        app.listen(PORT, () => {
            console.log(`Serveur MERN en écoute sur http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error(
            'Erreur critique de démarrage du serveur :',
            err.message
        );

        process.exit(1);
    }
})();
