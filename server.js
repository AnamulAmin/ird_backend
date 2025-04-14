const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const { URL } = require("url");
const path = require("path");

// Use environment variable or fallback to relative path
const DB_PATH =
  process.env.SQLITE_DB_PATH || path.join(__dirname, "dua_main.sqlite");

console.log(`Attempting to open SQLite database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Failed to open SQLite database:", err.message);
  } else {
    console.log("Successfully connected to SQLite database");
  }
});

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === "/categories") {
    db.all("SELECT * FROM category", [], (err, rows) => {
      if (err) {
        console.error("Error fetching categories:", err);
        return sendError(res, err);
      }
      console.log("Categories fetched:", rows);
      res.end(JSON.stringify(rows));
    });
  } else if (pathname === "/subcategories") {
    const cat_id = parsedUrl.searchParams.get("cat_id");
    if (!cat_id) return sendError(res, "Missing cat_id");
    db.all(
      "SELECT * FROM sub_category WHERE cat_id = ?",
      [cat_id],
      (err, rows) => {
        if (err) {
          console.error("Error fetching subcategories:", err);
          return sendError(res, err);
        }
        console.log("Subcategories fetched:", rows);
        res.end(JSON.stringify(rows));
      }
    );
  } else if (pathname === "/duas") {
    const cat_id = parsedUrl.searchParams.get("cat_id");
    const subcat_id = parsedUrl.searchParams.get("subcat_id");
    if (!cat_id || !subcat_id)
      return sendError(res, "Missing cat_id or subcat_id");
    db.all(
      "SELECT * FROM dua WHERE cat_id = ? AND subcat_id = ?",
      [cat_id, subcat_id],
      (err, rows) => {
        if (err) {
          console.error("Error fetching duas:", err);
          return sendError(res, err);
        }
        console.log("Duas fetched:", rows);
        res.end(JSON.stringify(rows));
      }
    );
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Route Not Found" }));
  }
});

function sendError(res, error) {
  res.writeHead(400);
  res.end(JSON.stringify({ error: error.toString() }));
}

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
