const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database connection
const dbPath = path.join(__dirname, 'data', 'survey.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing Enhanced Response Endpoint Data...\n');

// First, get survey IDs
db.all("SELECT id, title FROM surveys LIMIT 3", [], (err, surveys) => {
  if (err) {
    console.error('Error getting surveys:', err);
    return;
  }
  
  console.log('Available surveys:');
  surveys.forEach(survey => {
    console.log(`  ID: ${survey.id}, Title: ${survey.title}`);
  });
  
  if (surveys.length > 0) {
    const surveyId = surveys[0].id;
    console.log(`\nTesting responses for survey ID ${surveyId}...\n`);
    
    // This is the same query that the API endpoint uses
    const query = `
      SELECT 
        sr.id as response_id,
        sr.employee_email,
        sr.feedback_type,
        sr.subject_employee_id,
        sq.question_text,
        sr.response_text,
        sr.created_at,
        rater.name as rater_name,
        rater.role as rater_role,
        subject.name as subject_name,
        subject.role as subject_role
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      LEFT JOIN employees rater ON rater.email = sr.employee_email
      LEFT JOIN employees subject ON subject.id = sr.subject_employee_id
      WHERE sr.survey_id = ?
      ORDER BY sr.created_at DESC
      LIMIT 5
    `;
    
    db.all(query, [surveyId], (err, responses) => {
      if (err) {
        console.error('Error getting responses:', err);
        return;
      }
      
      console.log('Enhanced Response Data (as API would return):');
      console.log(JSON.stringify(responses, null, 2));
      
      // Close database
      db.close();
    });
  }
});
