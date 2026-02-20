import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("tutor.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    words_learned INTEGER DEFAULT 0,
    last_session TEXT,
    completed BOOLEAN DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS learned_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE,
    meaning TEXT,
    pronunciation TEXT,
    example TEXT,
    theme TEXT,
    mastery_level INTEGER DEFAULT 0,
    last_reviewed TEXT
  );
`);

// Seeding function
async function seedDatabase() {
  const count = db.prepare("SELECT COUNT(*) as count FROM learned_words").get() as { count: number };
  if (count.count === 0) {
    console.log("Seeding database with initial words...");
    try {
      const fs = await import("fs");
      const dataPath = path.join(process.cwd(), "src/data/words.json");
      if (fs.existsSync(dataPath)) {
        const wordsData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        const insert = db.prepare("INSERT OR IGNORE INTO learned_words (word, theme, example, meaning) VALUES (?, ?, ?, ?)");
        const insertMany = db.transaction((words) => {
          for (const w of words) {
            insert.run(w.Word, w.Theme, w.Example, w.Meaning || "");
          }
        });
        insertMany(wordsData);
        console.log(`Seeded ${wordsData.length} words.`);
      }
    } catch (err) {
      console.error("Failed to seed database:", err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Seed data before starting
  await seedDatabase();

  // API Routes
  app.get("/api/progress", (req, res) => {
    const progress = db.prepare("SELECT * FROM progress").all();
    res.json(progress);
  });

  app.post("/api/progress", (req, res) => {
    const { topic, words_learned } = req.body;
    const existing = db.prepare("SELECT id FROM progress WHERE topic = ?").get(topic) as { id: number } | undefined;
    
    if (existing) {
      db.prepare("UPDATE progress SET words_learned = words_learned + ?, last_session = CURRENT_TIMESTAMP WHERE id = ?")
        .run(words_learned, existing.id);
    } else {
      db.prepare("INSERT INTO progress (topic, words_learned, last_session) VALUES (?, ?, CURRENT_TIMESTAMP)")
        .run(topic, words_learned);
    }
    res.json({ success: true });
  });

  app.get("/api/words", (req, res) => {
    const words = db.prepare("SELECT * FROM learned_words ORDER BY last_reviewed DESC").all();
    res.json(words);
  });

  app.get("/api/words/topic/:topic", (req, res) => {
    const { topic } = req.params;
    // Try to match theme or topic name
    const words = db.prepare("SELECT * FROM learned_words WHERE theme LIKE ? OR ? LIKE '%' || theme || '%' LIMIT 10").all(`%${topic}%`, topic);
    
    // If no words found for specific topic, get some general ones
    if (words.length === 0) {
      const generalWords = db.prepare("SELECT * FROM learned_words ORDER BY RANDOM() LIMIT 10").all();
      return res.json(generalWords);
    }
    
    res.json(words);
  });

  app.post("/api/words", (req, res) => {
    const { word, meaning, pronunciation, example } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO learned_words (word, meaning, pronunciation, example, last_reviewed) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)")
        .run(word, meaning, pronunciation, example);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save word" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
