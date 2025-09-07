#!/usr/bin/env node
// Export all seeded/dummy data from SQLite (survey.db) into a single JSON file
// The JSON contains a top-level object with a key per table.

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

async function main() {
  const backendDir = __dirname ? path.resolve(__dirname, '..') : process.cwd();
  const dbPath = path.join(backendDir, 'survey.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`SQLite DB not found at ${dbPath}. Start the backend once to initialize or adjust path.`);
    process.exit(1);
  }

  const now = new Date();
  const dateTag = now.toISOString().slice(0,10).replace(/-/g,'');
  const outPath = path.resolve(backendDir, `..`, `DummyData-360-feedback-${dateTag}.json`);

  const db = new sqlite3.Database(dbPath);

  const tables = [
    { name: 'companies', sql: 'SELECT * FROM companies ORDER BY id' },
    { name: 'employees', sql: 'SELECT * FROM employees ORDER BY id' },
    { name: 'categories', sql: 'SELECT * FROM categories ORDER BY id' },
    { name: 'questions', sql: 'SELECT * FROM questions ORDER BY id' },
    { name: 'options', sql: 'SELECT * FROM options ORDER BY id' },
    { name: 'surveys', sql: 'SELECT * FROM surveys ORDER BY id' },
    { name: 'survey_feedback_types', sql: 'SELECT * FROM survey_feedback_types ORDER BY id' },
    { name: 'survey_questions', sql: 'SELECT * FROM survey_questions ORDER BY id' },
    { name: 'survey_question_options', sql: 'SELECT * FROM survey_question_options ORDER BY id' },
    { name: 'survey_participants', sql: 'SELECT * FROM survey_participants ORDER BY id' },
    { name: 'survey_responses', sql: 'SELECT * FROM survey_responses ORDER BY id' },
    { name: 'survey_subjects', sql: 'SELECT * FROM survey_subjects ORDER BY id' },
    { name: 'survey_rater_assignments', sql: 'SELECT * FROM survey_rater_assignments ORDER BY id' }
  ];

  function allAsync(sql, params=[]) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });
  }

  const output = { exported_at: now.toISOString() };
  for (const t of tables) {
    try {
      output[t.name] = await allAsync(t.sql);
    } catch (e) {
      output[t.name] = { error: e.message };
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  db.close();
  console.log(`Exported dummy data to ${outPath}`);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
