const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

console.log('=== TESTING ENHANCED RESPONSE VIEWING ===\n');

// Test the exact query used by the API endpoint
const query = `
SELECT 
  sr.id as response_id,
  sr.employee_email,
  sr.feedback_type,
  sr.question_id,
  sr.subject_employee_id,
  q.question_text,
  q.question_type,
  c.name as category_name,
  q.position,
  sr.response_text,
  sr.submitted_at,
  rater.name as rater_name,
  rater.role as rater_role,
  subject.name as subject_name,
  subject.email as subject_email,
  subject.role as subject_role
FROM survey_responses sr
LEFT JOIN questions q ON sr.question_id = q.id
LEFT JOIN categories c ON q.category_id = c.id
LEFT JOIN employees rater ON sr.employee_email = rater.email 
LEFT JOIN employees subject ON sr.subject_employee_id = subject.id 
WHERE sr.survey_id = 1
  AND sr.feedback_type IN ('manager', 'reportee')
ORDER BY sr.submitted_at, sr.employee_email, q.position
LIMIT 10
`;

db.all(query, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Enhanced Response Data for Frontend:');
    console.log('=====================================');
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.feedback_type.toUpperCase()} FEEDBACK:`);
      
      // Display rater info
      const raterInfo = row.rater_name ? `${row.rater_name} (${row.rater_role})` : row.employee_email;
      console.log(`   Rater: ${raterInfo}`);
      
      // Display subject info
      const subjectInfo = row.subject_name && row.subject_name !== row.rater_name 
        ? `${row.subject_name} (${row.subject_role})` 
        : 'Self';
      console.log(`   Subject: ${subjectInfo}`);
      
      console.log(`   Question: ${row.question_text}`);
      console.log(`   Response: ${row.response_text}`);
      console.log(`   Submitted: ${new Date(row.submitted_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log('Frontend Enhancement Check:');
    console.log('==========================');
    console.log('✓ rater_name field available:', rows.every(r => r.rater_name));
    console.log('✓ rater_role field available:', rows.every(r => r.rater_role));
    console.log('✓ subject_name field available:', rows.every(r => r.subject_name));
    console.log('✓ subject_role field available:', rows.every(r => r.subject_role));
    console.log('✓ subject_employee_id linked:', rows.every(r => r.subject_employee_id));
  }
  
  db.close();
});
