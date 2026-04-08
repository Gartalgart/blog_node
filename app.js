// Import des modules nécessaires
import express from "express"
import pool from "./db.js"

// Création de l'application Express
const app = express()

// Configuration du moteur de templates EJS
app.set("view engine", "ejs")
app.set("views", "./views")

// Permet de servir les fichiers statiques (CSS, images...)
app.use(express.static("public"))
// Permet de lire les données envoyées par les formulaires (POST)
app.use(express.urlencoded({ extended: true }))

// =============================================
// Page d'accueil : liste de tous les articles
// =============================================
app.get("/", async function (req, res) {
    // Jointure pour récupérer l'auteur et la catégorie de chaque article
    const sql = `
        SELECT article.*, autor.first_name, autor.last_name, category.name AS category_name
        FROM article
        JOIN autor ON article.id_autor = autor.id
        JOIN category ON article.id_category = category.id
        WHERE article.statut = 'publié'
        ORDER BY article.created_at DESC
    `
    const [articles] = await pool.query(sql)
    res.render("index", { articles: articles, titre: "Les articles" })
})

// =============================================
// Filtre par catégorie
// =============================================
app.get("/category/:id", async function (req, res) {
    // On vérifie que la catégorie existe
    const [categories] = await pool.query("SELECT * FROM category WHERE id = ?", [req.params.id])

    if (categories.length === 0) {
        res.redirect("/")
        return
    }

    // Même requête que l'accueil mais filtrée par catégorie
    const sql = `
        SELECT article.*, autor.first_name, autor.last_name, category.name AS category_name
        FROM article
        JOIN autor ON article.id_autor = autor.id
        JOIN category ON article.id_category = category.id
        WHERE article.id_category = ? AND article.statut = 'publié'
        ORDER BY article.created_at DESC
    `
    const [articles] = await pool.query(sql, [req.params.id])
    res.render("index", { articles: articles, titre: "Catégorie : " + categories[0].name })
})

// =============================================
// Filtre par tag
// =============================================
app.get("/tag/:id", async function (req, res) {
    // On vérifie que le tag existe
    const [tagRows] = await pool.query("SELECT * FROM tag WHERE id = ?", [req.params.id])

    if (tagRows.length === 0) {
        res.redirect("/")
        return
    }

    // Jointure supplémentaire sur la table de jointure article_tag (relation N,N)
    const sql = `
        SELECT article.*, autor.first_name, autor.last_name, category.name AS category_name
        FROM article
        JOIN autor ON article.id_autor = autor.id
        JOIN category ON article.id_category = category.id
        JOIN article_tag ON article.id = article_tag.id_article
        WHERE article_tag.id_tag = ? AND article.statut = 'publié'
        ORDER BY article.created_at DESC
    `
    const [articles] = await pool.query(sql, [req.params.id])
    res.render("index", { articles: articles, titre: "Tag : " + tagRows[0].name })
})

// =============================================
// Page de détail d'un article
// =============================================
app.get("/article/:id", async function (req, res) {
    // Récupère l'article avec son auteur et sa catégorie
    const sqlArticle = `
        SELECT article.*, autor.first_name, autor.last_name, category.name AS category_name
        FROM article
        JOIN autor ON article.id_autor = autor.id
        JOIN category ON article.id_category = category.id
        WHERE article.id = ?
    `
    const [articles] = await pool.query(sqlArticle, [req.params.id])

    // Si l'article n'existe pas, on redirige vers l'accueil
    if (articles.length === 0) {
        res.redirect("/")
        return
    }

    // Récupère les tags de l'article via la table de jointure
    const sqlTags = `
        SELECT tag.id, tag.name
        FROM tag
        JOIN article_tag ON tag.id = article_tag.id_tag
        WHERE article_tag.id_article = ?
    `
    const [tags] = await pool.query(sqlTags, [req.params.id])

    // Récupère les commentaires de l'article
    const [commentaries] = await pool.query(
        "SELECT * FROM commentary WHERE id_article = ? ORDER BY created_at DESC",
        [req.params.id]
    )

    // Envoie toutes les données à la vue
    res.render("article", {
        article: articles[0],
        tags: tags,
        commentaries: commentaries
    })
})

// =============================================
// Formulaire de création d'article (GET = afficher)
// =============================================
app.get("/new", async function (req, res) {
    // On charge les auteurs, catégories et tags pour remplir les listes du formulaire
    const [autors] = await pool.query("SELECT * FROM autor")
    const [categories] = await pool.query("SELECT * FROM category")
    const [tags] = await pool.query("SELECT * FROM tag")
    res.render("new_article", { autors: autors, categories: categories, tags: tags, error: null })
})

// =============================================
// Création d'article (POST = enregistrer)
// =============================================
app.post("/new", async function (req, res) {
    // Récupère les données du formulaire
    const title = req.body.title
    const content = req.body.content
    const id_autor = req.body.id_autor
    const id_category = req.body.id_category
    const tags = req.body.tags

    // Validation : titre et contenu obligatoires
    if (!title || !content) {
        const [autors] = await pool.query("SELECT * FROM autor")
        const [categories] = await pool.query("SELECT * FROM category")
        const [allTags] = await pool.query("SELECT * FROM tag")
        res.render("new_article", {
            autors: autors,
            categories: categories,
            tags: allTags,
            error: "Le titre et le contenu sont obligatoires."
        })
        return
    }

    // Insère l'article dans la base de données
    const [result] = await pool.query(
        "INSERT INTO article (title, content, id_autor, id_category) VALUES (?, ?, ?, ?)",
        [title.trim(), content.trim(), id_autor, id_category]
    )

    // Insère les tags dans la table de jointure article_tag
    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags]
        for (const i = 0; i < tagArray.length; i++) {
            await pool.query(
                "INSERT INTO article_tag (id_article, id_tag) VALUES (?, ?)",
                [result.insertId, tagArray[i]]
            )
        }
    }

    res.redirect("/")
})

// =============================================
// Formulaire de modification d'article (GET = afficher)
// =============================================
app.get("/article/:id/edit", async function (req, res) {
    const [articles] = await pool.query("SELECT * FROM article WHERE id = ?", [req.params.id])

    if (articles.length === 0) {
        res.redirect("/")
        return
    }

    // On charge tout ce qu'il faut pour préremplir le formulaire
    const [autors] = await pool.query("SELECT * FROM autor")
    const [categories] = await pool.query("SELECT * FROM category")
    const [tags] = await pool.query("SELECT * FROM tag")
    const [articleTags] = await pool.query("SELECT id_tag FROM article_tag WHERE id_article = ?", [req.params.id])

    // On récupère les IDs des tags déjà cochés
    const selectedTags = []
    for (const i = 0; i < articleTags.length; i++) {
        selectedTags.push(articleTags[i].id_tag)
    }

    res.render("edit_article", {
        article: articles[0],
        autors: autors,
        categories: categories,
        tags: tags,
        selectedTags: selectedTags,
        error: null
    })
})

// =============================================
// Modification d'article (POST = enregistrer)
// =============================================
app.post("/article/:id/edit", async function (req, res) {
    const title = req.body.title
    const content = req.body.content
    const id_autor = req.body.id_autor
    const id_category = req.body.id_category
    const tags = req.body.tags

    // Validation : titre et contenu obligatoires
    if (!title || !content) {
        const [articles] = await pool.query("SELECT * FROM article WHERE id = ?", [req.params.id])
        const [autors] = await pool.query("SELECT * FROM autor")
        const [categories] = await pool.query("SELECT * FROM category")
        const [allTags] = await pool.query("SELECT * FROM tag")
        const [articleTags] = await pool.query("SELECT id_tag FROM article_tag WHERE id_article = ?", [req.params.id])

        const selectedTags = []
        for (const i = 0; i < articleTags.length; i++) {
            selectedTags.push(articleTags[i].id_tag)
        }

        res.render("edit_article", {
            article: articles[0],
            autors: autors,
            categories: categories,
            tags: allTags,
            selectedTags: selectedTags,
            error: "Le titre et le contenu sont obligatoires."
        })
        return
    }

    // Met à jour l'article dans la base
    await pool.query(
        "UPDATE article SET title = ?, content = ?, id_autor = ?, id_category = ? WHERE id = ?",
        [title.trim(), content.trim(), id_autor, id_category, req.params.id]
    )

    // Supprime les anciens tags puis réinsère les nouveaux
    await pool.query("DELETE FROM article_tag WHERE id_article = ?", [req.params.id])

    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags]
        for (const i = 0; i < tagArray.length; i++) {
            await pool.query(
                "INSERT INTO article_tag (id_article, id_tag) VALUES (?, ?)",
                [req.params.id, tagArray[i]]
            )
        }
    }

    res.redirect("/article/" + req.params.id)
})

// =============================================
// Suppression d'un article
// =============================================
app.post("/article/:id/delete", async function (req, res) {
    // On supprime d'abord les données liées (tags et commentaires) puis l'article
    await pool.query("DELETE FROM article_tag WHERE id_article = ?", [req.params.id])
    await pool.query("DELETE FROM commentary WHERE id_article = ?", [req.params.id])
    await pool.query("DELETE FROM article WHERE id = ?", [req.params.id])
    res.redirect("/")
})

// =============================================
// Ajout d'un commentaire sur un article
// =============================================
app.post("/article/:id/comment", async function (req, res) {
    const autor_com = req.body.autor_com
    const email_autor_com = req.body.email_autor_com
    const content = req.body.content

    if (content && content.trim()) {
        await pool.query(
            "INSERT INTO commentary (content, autor_com, email_autor_com, id_article) VALUES (?, ?, ?, ?)",
            [content.trim(), autor_com, email_autor_com, req.params.id]
        )
    }

    res.redirect("/article/" + req.params.id)
})

// =============================================
// Lancement du serveur sur le port 3000
// =============================================
app.listen(3000, function () {
    console.log("Serveur is ready")
})
