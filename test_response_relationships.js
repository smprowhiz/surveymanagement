const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

console.log('Testing enhanced response viewing with employee relationships...\n');

// Test query for manager and peer feedback
const query = `
SELECT 
  sr.feedback_type,
  rater.name as rater_name, 
  rater.role as rater_role,
  subject.name as subject_name, 
  subject.role as subject_role,
  SUBSTR(sr.response_text, 1, 50) as response_preview
FROM survey_responses sr 
LEFT JOIN employees rater ON sr.employee_email = rater.email 
LEFT JOIN employees subject ON sr.subject_employee_id = subject.id 
WHERE sr.survey_id = 1 
  AND sr.feedback_type IN ('manager', 'peer')
LIMIT 10
`;

db.all(query, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Cross-employee feedback relationships:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.feedback_type.toUpperCase()} FEEDBACK:`);
      console.log(`   Rater: ${row.rater_name} (${row.rater_role})`);
      console.log(`   Subject: ${row.subject_name} (${row.subject_role})`);
      console.log(`   Response: ${row.response_preview}...`);
      console.log('');
    });
  }
  
  console.log('\nTesting API endpoint format...');
  
  // Test the exact query format used by the API
  const apiQuery = `
  SELECT 
    sr.*,
    rater.name as rater_name,
    rater.role as rater_role,
    subject.name as subject_name,
    subject.role as subject_role
  FROM survey_responses sr
  LEFT JOIN employees rater ON sr.employee_email = rater.email 
  LEFT JOIN employees subject ON sr.subject_employee_id = subject.id 
  WHERE sr.survey_id = 1
  LIMIT 3
  `;
  
  db.all(apiQuery, (err2, apiRows) => {
    if (err2) {
      console.error('API Query Error:', err2);
    } else {
      console.log('API-formatted response data:');
      console.log(JSON.stringify(apiRows, null, 2));
    }
    db.close();
  });
});
