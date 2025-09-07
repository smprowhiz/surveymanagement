#!/usr/bin/env node
// Export all seeded/dummy data from SQLite (survey.db) into an Excel workbook
// Sheets: companies, employees, categories, questions, options, surveys, survey_feedback_types,
// survey_questions, survey_question_options, survey_participants, survey_responses, survey_subjects, survey_rater_assignments

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const ExcelJS = require('exceljs');

async function main() {
  const backendDir = __dirname ? path.resolve(__dirname, '..') : process.cwd();
  const dbPath = path.join(backendDir, 'survey.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`SQLite DB not found at ${dbPath}. Start the backend once to initialize or adjust path.`);
    process.exit(1);
  }

  const now = new Date();
  const dateTag = now.toISOString().slice(0,10).replace(/-/g,'');
  const outPath = path.resolve(backendDir, `..`, `DummyData-360-feedback-${dateTag}.xlsx`);

  const db = new sqlite3.Database(dbPath);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Export Script';
  workbook.created = now;

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

  for (const t of tables) {
    try {
      const rows = await allAsync(t.sql);
      const sheetName = t.name.slice(0, 31); // Excel sheet name limit
      const ws = workbook.addWorksheet(sheetName);
      if (rows.length === 0) {
        ws.addRow([`(no rows)`]);
        continue;
      }
      const headers = Object.keys(rows[0]);
      ws.addRow(headers);
      ws.getRow(1).font = { bold: true };
      rows.forEach(r => {
        const vals = headers.map(h => r[h]);
        ws.addRow(vals);
      });
      ws.columns.forEach(col => { col.width = Math.min(40, Math.max(10, (col.header || '').toString().length + 2)); });
      ws.autoFilter = { from: { row:1, column:1 }, to: { row:1, column: headers.length } };
    } catch (e) {
      const ws = workbook.addWorksheet(t.name.slice(0,31));
      ws.addRow(['Error fetching table:', t.name, e.message]);
    }
  }

  await workbook.xlsx.writeFile(outPath);
  db.close();
  console.log(`Exported dummy data to ${outPath}`);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
