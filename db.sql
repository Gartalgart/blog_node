-- ============================================================
-- Script MySQL — Base de données Blog
-- Corrigé, amélioré et enrichi avec données de test
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS article_tag, commentary, tague, article, category, tag, autor;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- STRUCTURE
-- ============================================================

-- ----------------------------
-- Table: autor
-- ----------------------------
CREATE TABLE autor (
  id          INT           NOT NULL AUTO_INCREMENT,
  last_name   VARCHAR(100)  NOT NULL,
  first_name  VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL COMMENT 'Stocker un hash bcrypt, jamais en clair',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT autor_PK PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: category
-- ----------------------------
CREATE TABLE category (
  id          INT           NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL UNIQUE,
  description TEXT,
  CONSTRAINT category_PK PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: tag
-- ----------------------------
CREATE TABLE tag (
  id    INT          NOT NULL AUTO_INCREMENT,
  name  VARCHAR(100) NOT NULL UNIQUE,
  slug  VARCHAR(100) NOT NULL UNIQUE,
  CONSTRAINT tag_PK PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: article
-- Clés étrangères : id_autor, id_category (côté N)
-- ----------------------------
CREATE TABLE article (
  id          INT           NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255)  NOT NULL,
  content     TEXT          NOT NULL,
  statut      ENUM('brouillon','publié','archivé') NOT NULL DEFAULT 'brouillon',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  id_autor    INT           NOT NULL,
  id_category INT           NOT NULL,
  CONSTRAINT article_PK            PRIMARY KEY (id),
  CONSTRAINT article_autor_FK      FOREIGN KEY (id_autor)    REFERENCES autor    (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT article_category_FK   FOREIGN KEY (id_category) REFERENCES category (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: commentary
-- Clé étrangère : id_article (côté N)
-- ----------------------------
CREATE TABLE commentary (
  id              INT          NOT NULL AUTO_INCREMENT,
  content         TEXT         NOT NULL,
  autor_com       VARCHAR(100) NOT NULL,
  email_autor_com VARCHAR(255) NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_article      INT          NOT NULL,
  CONSTRAINT commentary_PK         PRIMARY KEY (id),
  CONSTRAINT commentary_article_FK FOREIGN KEY (id_article) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: article_tag  (jointure N,N)
-- Clé primaire composite : id_article + id_tag
-- ----------------------------
CREATE TABLE article_tag (
  id_article  INT NOT NULL,
  id_tag      INT NOT NULL,
  CONSTRAINT article_tag_PK         PRIMARY KEY (id_article, id_tag),
  CONSTRAINT article_tag_article_FK FOREIGN KEY (id_article) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT article_tag_tag_FK     FOREIGN KEY (id_tag)     REFERENCES tag     (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- DONNÉES DE TEST
-- ============================================================

-- ----------------------------
-- Auteurs
-- ----------------------------
INSERT INTO autor (last_name, first_name, email, password) VALUES
  ('Dupont',   'Marie',   'marie.dupont@blog.fr',   '$2y$10$hashedpassword1'),
  ('Martin',   'Lucas',   'lucas.martin@blog.fr',   '$2y$10$hashedpassword2'),
  ('Bernard',  'Sophie',  'sophie.bernard@blog.fr', '$2y$10$hashedpassword3');

-- ----------------------------
-- Catégories
-- ----------------------------
INSERT INTO category (name, description) VALUES
  ('Technologie', 'Articles sur le développement web, l\'IA et les nouvelles technologies'),
  ('Voyage',      'Découvertes, conseils et carnets de route autour du monde'),
  ('Cuisine',     'Recettes, astuces et tendances culinaires'),
  ('Science',     'Actualités scientifiques et vulgarisation'),
  ('Lifestyle',   'Mode de vie, bien-être et développement personnel');

-- ----------------------------
-- Tags
-- ----------------------------
INSERT INTO tag (name, slug) VALUES
  ('MySQL',        'mysql'),
  ('PHP',          'php'),
  ('JavaScript',   'javascript'),
  ('Asie',         'asie'),
  ('Recette',      'recette'),
  ('Intelligence Artificielle', 'intelligence-artificielle'),
  ('Débutant',     'debutant'),
  ('Tutorial',     'tutorial');

-- ----------------------------
-- Articles
-- ----------------------------
INSERT INTO article (title, content, statut, id_autor, id_category) VALUES
  (
    'Introduction à MySQL : les bases',
    'MySQL est un système de gestion de base de données relationnelle open-source. Dans cet article, nous allons découvrir les commandes fondamentales : SELECT, INSERT, UPDATE et DELETE. Nous verrons aussi comment créer des tables et définir des clés étrangères pour structurer nos données efficacement.',
    'publié', 1, 1
  ),
  (
    '10 jours au Japon : itinéraire complet',
    'Le Japon est une destination fascinante qui mêle tradition et modernité. De Tokyo à Kyoto en passant par Osaka, voici un itinéraire optimisé pour découvrir l\'essentiel du pays en 10 jours. Budget, transports, hébergements : tout est détaillé.',
    'publié', 2, 2
  ),
  (
    'Ramen maison : la vraie recette japonaise',
    'Préparer un ramen authentique demande du temps mais le résultat est incomparable. Le secret réside dans le bouillon : il doit mijoter au moins 6 heures. Voici notre recette étape par étape pour un tonkotsu ramen digne des meilleures cantines de Tokyo.',
    'publié', 3, 3
  ),
  (
    'L\'IA générative en 2025 : où en sommes-nous ?',
    'Les modèles de langage ont considérablement évolué ces dernières années. Entre GPT, Claude et Gemini, le paysage de l\'intelligence artificielle générative se structure autour de quelques acteurs majeurs. Analyse des tendances et perspectives pour les prochains mois.',
    'publié', 1, 4
  ),
  (
    'Créer une API REST avec PHP et MySQL',
    'Dans ce tutorial complet, nous allons construire une API REST from scratch avec PHP natif et une base de données MySQL. Authentification JWT, gestion des erreurs, pagination : les bonnes pratiques sont au rendez-vous.',
    'brouillon', 2, 1
  );

-- ----------------------------
-- Commentaires
-- ----------------------------
INSERT INTO commentary (content, autor_com, email_autor_com, id_article) VALUES
  ('Super article, très clair pour les débutants ! Merci Marie.', 'Jean Leroy',     'jean.leroy@mail.fr',    1),
  ('Est-ce que tu peux faire un article sur les index MySQL ?',   'Camille Morel',  'camille.morel@mail.fr', 1),
  ('J\'ai suivi cet itinéraire l\'an dernier, parfait !',         'Thomas Petit',   'thomas.petit@mail.fr',  2),
  ('Attention, le JR Pass a changé de prix en 2024.',             'Lucie Roux',     'lucie.roux@mail.fr',    2),
  ('J\'ai essayé la recette ce weekend, un délice !',             'Emma Blanc',     'emma.blanc@mail.fr',    3),
  ('Très bon article sur l\'IA, bien documenté.',                 'Nicolas Faure',  'nicolas.faure@mail.fr', 4),
  ('Claude est vraiment impressionnant pour la génération de texte.', 'Alice Garnier', 'alice.garnier@mail.fr', 4);

-- ----------------------------
-- Association articles ↔ tags
-- ----------------------------
INSERT INTO article_tag (id_article, id_tag) VALUES
  (1, 1), -- Introduction MySQL → tag MySQL
  (1, 7), -- Introduction MySQL → tag Débutant
  (2, 4), -- Japon → tag Asie
  (3, 4), -- Ramen → tag Asie
  (3, 5), -- Ramen → tag Recette
  (4, 6), -- IA → tag Intelligence Artificielle
  (5, 1), -- API REST → tag MySQL
  (5, 2), -- API REST → tag PHP
  (5, 8); -- API REST → tag Tutorial