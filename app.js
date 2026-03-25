import express from "express"
import pool from "./db.js"

const app = express()

app.set("view engine", "ejs")
app.set("views", "./views")

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// Page d'accueil — liste des articles publiés avec auteur et catégorie
app.get("/", async (req, res) => {
    const [articles] = await pool.query(`
        SELECT article.*, autor.first_name, autor.last_name, category.name AS category_name
        FROM article
        JOIN autor ON article.id_autor = autor.id
        JOIN category ON article.id_category = category.id
        WHERE article.statut = 'publié'
        ORDER BY article.created_at DESC
    `)
    res.render("index", { articles })
})

// Détail d'un article avec ses tags et commentaires
app.get("/article/:id", async (req, res) => {
    const [rows] = await pool.query(`
        SELECT article.*, autor.first_name, autor.last_name, category.name AS category_name
        FROM article
        JOIN autor ON article.id_autor = autor.id
        JOIN category ON article.id_category = category.id
        WHERE article.id = ?
    `, [req.params.id])

    if (rows.length === 0) return res.status(404).send("Article non trouvé")

    const [tags] = await pool.query(`
        SELECT tag.name, tag.slug
        FROM tag
        JOIN article_tag ON tag.id = article_tag.id_tag
        WHERE article_tag.id_article = ?
    `, [req.params.id])

    const [commentaries] = await pool.query(`
        SELECT * FROM commentary
        WHERE id_article = ?
        ORDER BY created_at DESC
    `, [req.params.id])

    res.render("article", { article: rows[0], tags, commentaries })
})

// Formulaire de création d'article
app.get("/new", async (req, res) => {
    const [autors] = await pool.query("SELECT * FROM autor")
    const [categories] = await pool.query("SELECT * FROM category")
    const [tags] = await pool.query("SELECT * FROM tag")
    res.render("new_article", { autors, categories, tags })
})

// Enregistrement d'un nouvel article
app.post("/new", async (req, res) => {
    const { title, content, id_autor, id_category, tags } = req.body

    const [result] = await pool.query(
        "INSERT INTO article (title, content, id_autor, id_category) VALUES (?, ?, ?, ?)",
        [title, content, id_autor, id_category]
    )

    if (tags) {
        const articleId = result.insertId
        const tagArray = Array.isArray(tags) ? tags : [tags]
        for (const tagId of tagArray) {
            await pool.query("INSERT INTO article_tag (id_article, id_tag) VALUES (?, ?)", [articleId, tagId])
        }
    }

    res.redirect("/")
})

// Ajout d'un commentaire
app.post("/article/:id/comment", async (req, res) => {
    const { autor_com, email_autor_com, content } = req.body
    await pool.query(
        "INSERT INTO commentary (content, autor_com, email_autor_com, id_article) VALUES (?, ?, ?, ?)",
        [content, autor_com, email_autor_com, req.params.id]
    )
    res.redirect(`/article/${req.params.id}`)
})

app.listen(3000, () => {
    console.log("Serveur is ready")
})
