#!/usr/bin/env node
// Analyze survey data structure for report generation

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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
    const survey = await queryGet(db, 'SELECT * FROM surveys ORDER BY id DESC LIMIT 1');
    if (!survey) {
      console.log('No surveys found');
      return;
    }
    
    console.log(`Survey: ${survey.title} (ID: ${survey.id})`);
    console.log(`Company: ${survey.company_id}, Status: ${survey.status}`);
    console.log(`Period: ${survey.start_date} to ${survey.end_date}\n`);
    
    // Get participants by type
    const participants = await queryAll(db, `
      SELECT sp.feedback_type, COUNT(*) as count, 
             GROUP_CONCAT(e.name, ', ') as names
      FROM survey_participants sp 
      JOIN employees e ON sp.employee_id = e.id 
      WHERE sp.survey_id = ? 
      GROUP BY sp.feedback_type
    `, [survey.id]);
    
    console.log('=== PARTICIPANTS ===');
    participants.forEach(p => {
      console.log(`${p.feedback_type}: ${p.count} (${p.names})`);
    });
    
    // Get response counts
    const responses = await queryAll(db, `
      SELECT feedback_type, COUNT(DISTINCT employee_email) as respondents,
             COUNT(*) as total_responses
      FROM survey_responses 
      WHERE survey_id = ? 
      GROUP BY feedback_type
    `, [survey.id]);
    
    console.log('\n=== RESPONSES ===');
    responses.forEach(r => {
      console.log(`${r.feedback_type}: ${r.respondents} respondents, ${r.total_responses} total responses`);
    });
    
    // Get MCQ scores
    const mcqScores = await queryAll(db, `
      SELECT q.feedback_type, q.category_name, q.position, q.question_text,
             AVG(CAST(o.position AS REAL)) as mean_score,
             COUNT(*) as response_count
      FROM survey_responses r
      JOIN survey_questions q ON q.id = r.question_id 
      JOIN survey_question_options o ON o.survey_question_id = q.id AND o.option_text = r.response_text
      WHERE r.survey_id = ? AND q.question_type = 'mcq'
      GROUP BY q.id
      ORDER BY q.feedback_type, q.category_name, q.position
    `, [survey.id]);
    
    console.log('\n=== MCQ SCORES ===');
    let currentType = '';
    mcqScores.forEach(score => {
      if (score.feedback_type !== currentType) {
        currentType = score.feedback_type;
        console.log(`\n[${currentType.toUpperCase()}]`);
      }
      console.log(`  ${score.category_name} Q${score.position}: ${score.mean_score.toFixed(2)} (${score.response_count} responses)`);
      console.log(`    "${score.question_text.substring(0, 80)}..."`);
    });
    
    // Get text responses
    const textResponses = await queryAll(db, `
      SELECT q.feedback_type, q.category_name, q.question_text, 
             r.response_text, r.employee_email
      FROM survey_responses r
      JOIN survey_questions q ON q.id = r.question_id 
      WHERE r.survey_id = ? AND q.question_type = 'text'
      ORDER BY q.feedback_type, q.category_name
    `, [survey.id]);
    
    console.log('\n=== TEXT RESPONSES ===');
    currentType = '';
    let currentCat = '';
    textResponses.forEach(text => {
      if (text.feedback_type !== currentType) {
        currentType = text.feedback_type;
        console.log(`\n[${currentType.toUpperCase()}]`);
        currentCat = '';
      }
      if (text.category_name !== currentCat) {
        currentCat = text.category_name;
        console.log(`  ${currentCat}:`);
      }
      console.log(`    • ${text.response_text}`);
    });
    
    // Calculate category averages
    console.log('\n=== CATEGORY AVERAGES ===');
    const categoryAvgs = {};
    mcqScores.forEach(score => {
      const cat = score.category_name || 'Uncategorized';
      const type = score.feedback_type;
      
      if (!categoryAvgs[cat]) categoryAvgs[cat] = {};
      if (!categoryAvgs[cat][type]) categoryAvgs[cat][type] = { sum: 0, count: 0 };
      
      categoryAvgs[cat][type].sum += score.mean_score;
      categoryAvgs[cat][type].count += 1;
    });
    
    Object.entries(categoryAvgs).forEach(([cat, types]) => {
      console.log(`\n${cat}:`);
      Object.entries(types).forEach(([type, data]) => {
        const avg = data.sum / data.count;
        console.log(`  ${type}: ${avg.toFixed(2)}`);
      });
      
      // Overall category average
      const overallSum = Object.values(types).reduce((sum, data) => sum + data.sum, 0);
      const overallCount = Object.values(types).reduce((sum, data) => sum + data.count, 0);
      console.log(`  Overall: ${(overallSum / overallCount).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  } finally {
    db.close();
  }
})();
