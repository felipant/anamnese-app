PRAGMA foreign_keys = ON;

--DROP TABLE IF EXISTS medicamentos;
--DROP TABLE IF EXISTS exames;
CREATE TABLE IF NOT EXISTS exames (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	material TEXT NOT NULL,
	nome TEXT NOT NULL,
	pacote TEXT,
	unidade_medida TEXT,
	valores_referencia TEXT,
	significado TEXT
);

CREATE TABLE IF NOT EXISTS cid_capitulos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	cap TEXT NOT NULL UNIQUE,
	cap_desc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cid_categorias (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	cat TEXT NOT NULL UNIQUE,
	cat_desc TEXT NOT NULL,
	capitulo_id INTEGER NOT NULL,
	FOREIGN KEY (capitulo_id) REFERENCES cid_capitulos (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS cid_doencas (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	subcat TEXT NOT NULL UNIQUE,
	subcat_desc TEXT NOT NULL,
	grupo TEXT,
	categoria_id INTEGER NOT NULL,
	FOREIGN KEY (categoria_id) REFERENCES cid_categorias (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS medicamentos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	principio_ativo TEXT NOT NULL,
	concentracao TEXT,
	forma_farmaceutica TEXT,
	unidade_fornecimento TEXT,
	fornecimento_sus TEXT,
	classe TEXT
);

CREATE TABLE IF NOT EXISTS procedimentos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	descricao TEXT NOT NULL,
	valor REAL
);

CREATE TABLE IF NOT EXISTS guias_consulta (
	secao TEXT PRIMARY KEY,
	conteudo TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exames_nome ON exames (nome);
CREATE INDEX IF NOT EXISTS idx_exames_pacote ON exames (pacote);
CREATE INDEX IF NOT EXISTS idx_cid_capitulos_cap ON cid_capitulos (cap);
CREATE INDEX IF NOT EXISTS idx_cid_categorias_cat ON cid_categorias (cat);
CREATE INDEX IF NOT EXISTS idx_cid_doencas_subcat ON cid_doencas (subcat);
CREATE INDEX IF NOT EXISTS idx_cid_doencas_subcat_desc ON cid_doencas (subcat_desc);
CREATE INDEX IF NOT EXISTS idx_medicamentos_principio_ativo ON medicamentos (principio_ativo);
CREATE INDEX IF NOT EXISTS idx_procedimentos_descricao ON procedimentos (descricao);

CREATE TABLE IF NOT EXISTS areas_clinicas (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS calculadoras_risco (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	area_id INTEGER NOT NULL,
	nome TEXT NOT NULL,
	descricao TEXT,
	link TEXT NOT NULL,
	FOREIGN KEY (area_id) REFERENCES areas_clinicas (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calculadoras_risco_area_id ON calculadoras_risco (area_id);
