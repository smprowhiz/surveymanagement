const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('survey-dev.db');

console.log('=== INVESTIGATING RATER/SUBJECT DATA PATTERNS ===\n');

// Test the API query to see inconsistencies
const query = `
SELECT 
  sr.id as response_id,
  sr.employee_email,
  sr.feedback_type,
  sr.subject_employee_id,
  rater.name as rater_name,
  rater.role as rater_role,
  subject.name as subject_name,
  subject.email as subject_email,
  subject.role as subject_role,
  CASE 
    WHEN subject.name IS NULL THEN 'MISSING SUBJECT'
    WHEN rater.name IS NULL THEN 'MISSING RATER'
    WHEN subject.name = rater.name THEN 'SELF'
    ELSE 'CROSS-EMPLOYEE'
  END as relationship_type
FROM survey_responses sr
LEFT JOIN employees rater ON sr.employee_email = rater.email 
LEFT JOIN employees subject ON sr.subject_employee_id = subject.id 
WHERE sr.survey_id = 1
ORDER BY sr.feedback_type, sr.employee_email
LIMIT 15
`;

db.all(query, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Response Data Analysis:');
    console.log('======================');
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.feedback_type.toUpperCase()} - ${row.relationship_type}`);
      console.log(`   Employee Email: ${row.employee_email}`);
      console.log(`   Rater: ${row.rater_name || 'NULL'} (${row.rater_role || 'NULL'})`);
      console.log(`   Subject: ${row.subject_name || 'NULL'} (${row.subject_role || 'NULL'})`);
      console.log(`   Subject Employee ID: ${row.subject_employee_id || 'NULL'}`);
      console.log('');
    });
    
    console.log('Summary Analysis:');
    console.log('================');
    
    const groupedByType = rows.reduce((acc, row) => {
      if (!acc[row.relationship_type]) acc[row.relationship_type] = 0;
      acc[row.relationship_type]++;
      return acc;
    }, {});
    
    Object.entries(groupedByType).forEach(([type, count]) => {
      console.log(`${type}: ${count} responses`);
    });
    
    // Check specific patterns
    const selfFeedback = rows.filter(r => r.feedback_type === 'self');
    const crossFeedback = rows.filter(r => r.feedback_type !== 'self');
    
    console.log(`\nSelf feedback (should show same person): ${selfFeedback.length}`);
    console.log(`Cross feedback (should show different people): ${crossFeedback.length}`);
  }
  
  db.close();
});
