const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const ports = ['3001','3002','3003'];



// Connect to SQLite database
const db = new sqlite3.Database(path.resolve(__dirname, 'bible.db')); // Ensure the correct path for SQLite

// Middleware to parse JSON
app.use(express.json());

// Example endpoint to get data
app.get('/versions', (req, res) => {
    db.all('SELECT * FROM Versions order by Version', [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(rows);
    });
});

app.get('/books/:language', (req, res) => {
    const language = req.params.language;
    db.all('SELECT * FROM BookList WHERE Language = ? order by Book', [language], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(rows);
    });
});

app.get('/:version/search', (req, res) => {
    const version = req.params.version.toUpperCase();
    const searchTerm = req.query.term;
    
    // Ensure the version table exists
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [version], (err, tableInfo) => {
        if (err || !tableInfo) {
            res.status(404).send('Version not found');
            return;
        }
        // Determine the language based on the version
        //SPV: samareno, PmPV:Pampango MB, PnPV: Pangasinan MB, BPV: Bicol MB 
        const language = ['ILODS','ILOMB','BUGNA','FSV','SNB','BSP','ABRIOL','BMB',
        'ABAB','DS', 'NPV', 'MB','HILDS','HILMB','CEB',
        'BUGNA','CEB_MB','CEB_BMB','SPV','PMPV','PNPV','BPV'].includes(version) ? '0' : '1';
        const query = `
            SELECT concat(b.BookName, ' ', v.Chapter, ':', v.Verse) as Verse, v.Text, v._id, b.Language
            FROM ${version} AS v
            JOIN BookList AS b ON v.Book = b.Book
            WHERE v.Text LIKE ? AND b.Language=?
            ORDER BY b.Book
        `;
        
        // Execute the query
        db.all(query, [`%${searchTerm}%`, language], (err, rows) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json(rows);
        });

        
    });
});

app.get('/:version/:verse', (req, res) => {
    const version = req.params.version.toUpperCase();
    const verseParam = req.params.verse;

    // Parse the verse parameter into BookName, Chapter, and Verse components
    const [bookName, chapterVerse] = verseParam.split(' ');
    const [chapter, verse] = chapterVerse.split(':');

    // Ensure the version table exists
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [version], (err, tableInfo) => {
        if (err || !tableInfo) {
            res.status(404).send('Version not found');
            return;
        }
        const language = ['ILODS','ILOMB','BUGNA','SNB','FSV','BSP','ABRIOL','BMB',
        'ABAB','DS', 'NPV', 'MB','HILDS','HILMB','CEB',
        'BUGNA','CEB_MB','CEB_BMB','SPV','PMPV','PNPV','BPV'].includes(version) ? '0' : '1';
        const query = `
        SELECT (b.BookName || ' ' || v.Chapter || ':' || v.Verse) as Verse, v.Text, v._id    
        FROM ${version} AS v
        JOIN BookList AS b ON (v.Book = b.Book and b.Language=?)
        WHERE (b.BookName=? AND v.Chapter=? AND v.Verse=?)
      `;

      db.all(query, [language, bookName, chapter, verse], (err, rows) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json(rows);
        });
    });
    
});
//comparing four versions:
app.get('/compare', (req, res) => {
    const bibles = req.query.bibles ? req.query.bibles.split(',').map(v => v.toUpperCase()) : [];
    const verseParam = req.query.verse;

    if (!bibles.length || !verseParam) {
        return res.status(400).json({ error: "Missing bibles or verse parameter" });
    }

    const [bookName, chapterVerse] = verseParam.split(' ');
    if (!bookName || !chapterVerse.includes(':')) {
        return res.status(400).json({ error: "Invalid verse format. Use 'Book Chapter:Verse'" });
    }
    const [chapter, verse] = chapterVerse.split(':');

    let queries = [];
    let params = [];

    bibles.forEach(version => {
        queries.push(`
            SELECT ? AS Version, v.Text
            FROM ${version} v
            JOIN BookList b ON v.Book = b.Book
            WHERE b.BookName = ? AND v.Chapter = ? AND v.Verse = ?
        `);
        params.push(version, bookName, chapter, verse);
    });

    const query = queries.join(" UNION ALL ");

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: "Verse not found in given versions" });
        }
        res.json(rows);
    });
});


app.get('/search', (req, res) => {
    const versions = req.query.versions.split(',').map(v => v.toUpperCase());
    const verseParam = req.query.verse;

    if (!versions || versions.length === 0 || !verseParam) {
        return res.status(400).send("Missing versions or verse parameter");
    }

    const [bookName, chapterVerse] = verseParam.split(' ');
    const [chapter, verse] = chapterVerse.split(':');

    let cteQueries = [];
    let selectQueries = [];

    versions.forEach(version => {
        cteQueries.push(`
            ${version} AS (
                SELECT v.Text, '${version}' as Version
                FROM ${version} v
                JOIN BookList b ON v.Book = b.Book
                WHERE b.BookName = ? AND v.Chapter = ? AND v.Verse = ?
            )
        `);
        selectQueries.push(`SELECT * FROM ${version}`);
    });

    const query = `
        WITH ${cteQueries.join(', ')}
        ${selectQueries.join(' UNION ALL ')}
    `;

    db.all(query, [bookName, chapter, verse], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send(err.message);
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Verse not found in given versions');
            return;
        }
        res.json(rows);
    });
});

// Listen on each port
ports.forEach(port => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});


