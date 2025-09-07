#!/usr/bin/env node
// Print mean scores for each MCQ survey question.
// Usage: node scripts/print-question-means.js [--survey <id>]

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
}

function queryAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function queryGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
  });
}

(async () => {
  const backendDir = path.resolve(__dirname, '..');
  const dbPath = path.join(backendDir, 'survey.db');
  const db = new sqlite3.Database(dbPath);
  try {
    const providedId = parseInt(arg('survey', ''), 10);
    const latest = await queryGet(db, 'SELECT id FROM surveys ORDER BY id DESC LIMIT 1');
    const surveyId = providedId || (latest && latest.id);
    if (!surveyId) {
      console.error('No survey found. Use --survey <id>.');
      process.exit(1);
    }

    const rows = await queryAll(db, `
      SELECT q.id AS survey_question_id,
             q.feedback_type,
             q.category_name,
             q.position,
             q.question_text,
             ROUND(AVG(o.position), 2) AS mean_score
      FROM survey_responses r
      JOIN survey_questions q
        ON q.id = r.question_id AND q.survey_id = r.survey_id
      JOIN survey_question_options o
        ON o.survey_question_id = q.id AND o.option_text = r.response_text
      WHERE r.survey_id = ? AND q.question_type = 'mcq'
      GROUP BY q.id
      ORDER BY q.feedback_type, q.position
    `, [surveyId]);

    if (!rows.length) {
      console.log(`No MCQ means found for survey ${surveyId}.`);
      process.exit(0);
    }

    let currentType = '';
    for (const r of rows) {
      if (r.feedback_type !== currentType) {
        currentType = r.feedback_type;
        console.log(`\n[${currentType}]`);
      }
      const cat = r.category_name || 'Uncategorized';
      console.log(`Q${r.position} (${cat}) – ${r.question_text}`);
      console.log(`  • Mean score: ${r.mean_score}`);
    }
  } catch (e) {
    console.error('Failed to compute means:', e.message);
    process.exit(1);
  } finally {
    db.close();
  }
})();
