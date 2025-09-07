#!/usr/bin/env node
// Generate a professional 360-degree feedback report using HTML with rich styling
// Converts to DOCX for professional output similar to reference template
// Usage: node scripts/generate-report-html.js [--survey <id>]

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const puppeteer = require('puppeteer');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
}

async function queryAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

async function queryGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function getScoreInterpretation(score) {
  if (score >= 4.5) return "Exceptional Performance";
  if (score >= 4.0) return "Strong Performance";
  if (score >= 3.5) return "Good Performance";
  if (score >= 3.0) return "Developing Area";
  if (score >= 2.5) return "Needs Attention";
  return "Priority Development Area";
}

function getScoreColor(score) {
  if (score >= 4.5) return "#2E7D32"; // Dark green
  if (score >= 4.0) return "#4CAF50"; // Green  
  if (score >= 3.5) return "#8BC34A"; // Light green
  if (score >= 3.0) return "#CDDC39"; // Yellow-green
  if (score >= 2.5) return "#FFEB3B"; // Yellow
  return "#FF9800"; // Orange
}

function createScoreBar(score, maxScale = 5) {
  const percentage = (score / maxScale) * 100;
  const segments = [];
  
  for (let i = 1; i <= maxScale; i++) {
    const segmentStart = ((i - 1) / maxScale) * 100;
    const segmentEnd = (i / maxScale) * 100;
    
    let color = "#E0E0E0"; // Default light gray
    let opacity = 0.3;
    
    if (percentage >= segmentStart) {
      if (i <= 2) {
        color = "#FF5722"; // Red for low scores
      } else if (i <= 3) {
        color = "#FFEB3B"; // Yellow for medium scores
      } else {
        color = "#4CAF50"; // Green for high scores
      }
      opacity = percentage >= segmentEnd ? 1.0 : 0.7;
    }
    
    segments.push(`
      <div class="score-segment" style="
        background-color: ${color}; 
        opacity: ${opacity};
        width: 20%;
        height: 100%;
        display: inline-block;
        margin: 0 1px;
        border-radius: 2px;
      "></div>
    `);
  }
  
  return `
    <div class="score-bar" style="
      display: inline-block; 
      width: 120px; 
      height: 20px; 
      background-color: #F5F5F5; 
      border-radius: 4px; 
      padding: 2px;
      margin: 0 10px;
      vertical-align: middle;
    ">
      ${segments.join('')}
    </div>
  `;
}

function createQuestionScoreRow(question, scoreData) {
  const rows = scoreData.map(data => {
    const scoreBar = createScoreBar(data.score);
    const scoreColor = getScoreColor(data.score);
    
    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E0E0E0; font-size: 14px;">
          ${data.type} (${data.count} responses)
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E0E0E0; text-align: center;">
          <span style="font-size: 18px; font-weight: bold; color: ${scoreColor};">
            ${data.score.toFixed(2)}
          </span>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E0E0E0; text-align: center;">
          ${scoreBar}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E0E0E0; font-size: 12px; color: #666; text-align: center;">
          ${data.individual || 'N/A'}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="margin: 20px 0; page-break-inside: avoid;">
      <div style="background-color: #F8F9FA; padding: 12px; border-left: 4px solid #2196F3; margin-bottom: 8px;">
        <strong style="font-size: 16px; color: #1976D2;">${question}</strong>
      </div>
      <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background-color: #37474F; color: white;">
            <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600;">Feedback Source</th>
            <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600;">Score</th>
            <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600;">Visual Scale (1-5)</th>
            <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600;">Individual Scores</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

async function gatherSurveyData(db, surveyId) {
  // Get survey and subject details
  const survey = await queryGet(db, `
    SELECT s.*, c.name as company_name 
    FROM surveys s 
    LEFT JOIN companies c ON s.company_id = c.id 
    WHERE s.id = ?
  `, [surveyId]);
  
  if (!survey) throw new Error(`Survey ${surveyId} not found`);

  // Get the subject being evaluated
  const subject = await queryGet(db, `
    SELECT e.name, e.email, e.role, c.name as company_name
    FROM survey_participants sp
    JOIN employees e ON sp.employee_id = e.id
    JOIN companies c ON e.company_id = c.id
    WHERE sp.survey_id = ? AND sp.feedback_type = 'self'
    ORDER BY sp.id
    LIMIT 1
  `, [surveyId]) || { 
    name: 'Leadership Development Participant', 
    email: '', 
    role: 'Team Member', 
    company_name: survey.company_name || 'Organization' 
  };

  // Get participant counts by feedback type
  const participantStats = await queryAll(db, `
    SELECT 
      sp.feedback_type,
      COUNT(DISTINCT sp.employee_id) as invited,
      COUNT(DISTINCT sr.employee_email) as responded
    FROM survey_participants sp
    LEFT JOIN survey_responses sr ON sr.survey_id = sp.survey_id 
      AND sr.feedback_type = sp.feedback_type
      AND sr.employee_email IN (
        SELECT e.email FROM employees e WHERE e.id = sp.employee_id
      )
    WHERE sp.survey_id = ?
    GROUP BY sp.feedback_type
    ORDER BY 
      CASE sp.feedback_type 
        WHEN 'self' THEN 1
        WHEN 'manager' THEN 2  
        WHEN 'peer' THEN 3
        WHEN 'reportee' THEN 4
      END
  `, [surveyId]);

  // Get detailed scores for each question by feedback type
  const questionScores = await queryAll(db, `
    SELECT 
      q.category_name,
      q.question_text,
      q.feedback_type,
      q.position,
      AVG(CAST(o.position AS REAL)) as mean_score,
      COUNT(*) as response_count,
      GROUP_CONCAT(CAST(o.position AS TEXT)) as individual_scores
    FROM survey_responses r
    JOIN survey_questions q ON q.id = r.question_id AND q.survey_id = r.survey_id
    JOIN survey_question_options o ON o.survey_question_id = q.id AND o.option_text = r.response_text
    WHERE r.survey_id = ? AND q.question_type = 'mcq'
    GROUP BY q.id, q.feedback_type
    ORDER BY q.category_name, q.position, 
      CASE q.feedback_type 
        WHEN 'self' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'peer' THEN 3  
        WHEN 'reportee' THEN 4
      END
  `, [surveyId]);

  // Calculate category averages
  const categoryAverages = {};
  questionScores.forEach(score => {
    const cat = score.category_name || 'General';
    const type = score.feedback_type;
    
    if (!categoryAverages[cat]) {
      categoryAverages[cat] = { types: {}, overall: 0 };
    }
    if (!categoryAverages[cat].types[type]) {
      categoryAverages[cat].types[type] = { scores: [], total: 0, count: 0 };
    }
    
    categoryAverages[cat].types[type].scores.push(score);
    categoryAverages[cat].types[type].total += score.mean_score;
    categoryAverages[cat].types[type].count += 1;
  });

  // Calculate overall category averages
  Object.keys(categoryAverages).forEach(cat => {
    let totalSum = 0;
    let totalCount = 0;
    
    Object.values(categoryAverages[cat].types).forEach(typeData => {
      totalSum += typeData.total;
      totalCount += typeData.count;
    });
    
    categoryAverages[cat].overall = totalCount > 0 ? totalSum / totalCount : 0;
    
    // Calculate averages for each type
    Object.keys(categoryAverages[cat].types).forEach(type => {
      const typeData = categoryAverages[cat].types[type];
      typeData.average = typeData.count > 0 ? typeData.total / typeData.count : 0;
    });
  });

  // Get verbatim comments
  const verbatimComments = await queryAll(db, `
    SELECT 
      q.category_name,
      q.feedback_type,
      q.question_text,
      r.response_text
    FROM survey_responses r
    JOIN survey_questions q ON q.id = r.question_id AND q.survey_id = r.survey_id
    WHERE r.survey_id = ? AND q.question_type = 'text' 
    AND TRIM(COALESCE(r.response_text, '')) != ''
    ORDER BY q.category_name, q.feedback_type
  `, [surveyId]);

  // Organize verbatims by category and type
  const verbatims = {};
  verbatimComments.forEach(comment => {
    const cat = comment.category_name || 'General Feedback';
    const type = comment.feedback_type;
    
    if (!verbatims[cat]) verbatims[cat] = {};
    if (!verbatims[cat][type]) verbatims[cat][type] = [];
    
    verbatims[cat][type].push({
      question: comment.question_text,
      response: comment.response_text
    });
  });

  return {
    survey,
    subject,
    participantStats,
    questionScores,
    categoryAverages,
    verbatims,
    reportDate: new Date()
  };
}

function generateHTML(data) {
  const overallSummaryRows = Object.entries(data.categoryAverages).map(([category, scores]) => {
    const scoreBar = createScoreBar(scores.overall);
    const scoreColor = getScoreColor(scores.overall);
    
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-weight: 600;">${category}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; text-align: center;">
          <span style="font-size: 20px; font-weight: bold; color: ${scoreColor};">
            ${scores.overall.toFixed(2)}
          </span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; text-align: center;">
          ${scoreBar}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-size: 14px;">
          ${getScoreInterpretation(scores.overall)}
        </td>
      </tr>
    `;
  }).join('');

  const participationRows = data.participantStats.map(stat => {
    const responseRate = Math.round((stat.responded/stat.invited)*100);
    const rateColor = responseRate >= 80 ? "#2E7D32" : responseRate >= 60 ? "#FF9800" : "#D32F2F";
    
    return `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E0E0E0; font-weight: 600;">
          ${stat.feedback_type.charAt(0).toUpperCase() + stat.feedback_type.slice(1)}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E0E0E0; text-align: center; font-size: 16px;">
          ${stat.invited}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E0E0E0; text-align: center; font-size: 16px; font-weight: bold;">
          ${stat.responded}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E0E0E0; text-align: center;">
          <span style="font-size: 16px; font-weight: bold; color: ${rateColor};">
            ${responseRate}%
          </span>
        </td>
      </tr>
    `;
  }).join('');

  // Generate question-level results
  const questionResults = [];
  Object.entries(data.categoryAverages).forEach(([categoryName, categoryData]) => {
    questionResults.push(`
      <div style="page-break-before: always;">
        <h2 style="color: #1976D2; border-bottom: 3px solid #1976D2; padding-bottom: 10px; margin: 30px 0 20px 0;">
          ${categoryName} - Detailed Question Results
        </h2>
        <div style="background-color: #E3F2FD; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
          <strong style="color: #1976D2;">Overall Category Score: ${categoryData.overall.toFixed(2)} - ${getScoreInterpretation(categoryData.overall)}</strong>
        </div>
    `);

    // Group questions by question text
    const categoryQuestions = data.questionScores.filter(q => q.category_name === categoryName);
    const questionGroups = {};
    categoryQuestions.forEach(q => {
      if (!questionGroups[q.question_text]) {
        questionGroups[q.question_text] = [];
      }
      questionGroups[q.question_text].push(q);
    });

    Object.entries(questionGroups).forEach(([questionText, questionData]) => {
      const scoreData = questionData.map(qData => ({
        type: qData.feedback_type.charAt(0).toUpperCase() + qData.feedback_type.slice(1),
        score: qData.mean_score,
        count: qData.response_count,
        individual: qData.individual_scores
      }));

      questionResults.push(createQuestionScoreRow(questionText, scoreData));
    });

    questionResults.push('</div>');
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>360° Leadership Feedback Report</title>
      <style>
        @page {
          size: A4;
          margin: 0.75in;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #1976D2;
          padding-bottom: 20px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1976D2;
          margin-bottom: 20px;
        }
        .subtitle {
          font-size: 18px;
          color: #666;
          margin: 5px 0;
        }
        .section {
          margin: 30px 0;
        }
        .section-header {
          font-size: 22px;
          font-weight: bold;
          color: #1976D2;
          border-bottom: 2px solid #1976D2;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        th {
          background-color: #1976D2;
          color: white;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #E0E0E0;
        }
        tr:nth-child(even) {
          background-color: #F8F9FA;
        }
        .confidential {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background-color: #FFF3E0;
          border: 2px solid #FF9800;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">360° LEADERSHIP FEEDBACK REPORT</div>
        <div class="subtitle"><strong>Participant:</strong> ${data.subject.name}</div>
        <div class="subtitle"><strong>Position:</strong> ${data.subject.role}</div>
        <div class="subtitle"><strong>Organization:</strong> ${data.subject.company_name}</div>
        <div class="subtitle"><strong>Assessment Period:</strong> ${formatDate(data.survey.start_date)} - ${formatDate(data.survey.end_date)}</div>
        <div class="subtitle"><strong>Report Generated:</strong> ${formatDate(data.reportDate.toISOString())}</div>
      </div>

      <div class="section">
        <div class="section-header">Participation Summary</div>
        <table>
          <thead>
            <tr>
              <th>Feedback Source</th>
              <th style="text-align: center;">Invited</th>
              <th style="text-align: center;">Responded</th>
              <th style="text-align: center;">Response Rate</th>
            </tr>
          </thead>
          <tbody>
            ${participationRows}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-header">Overall Results Summary</div>
        <table>
          <thead>
            <tr>
              <th>Leadership Area</th>
              <th style="text-align: center;">Overall Score</th>
              <th style="text-align: center;">Visual Scale (1-5)</th>
              <th>Performance Level</th>
            </tr>
          </thead>
          <tbody>
            ${overallSummaryRows}
          </tbody>
        </table>
      </div>

      ${questionResults.join('')}

      <div class="confidential">
        <strong>CONFIDENTIAL</strong><br>
        This report contains confidential feedback for development purposes only.
      </div>
    </body>
    </html>
  `;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function ymdHM(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

(async () => {
  try {
    const backendDir = path.resolve(__dirname, '..');
    const dbPath = path.join(backendDir, 'survey.db');
    if (!fs.existsSync(dbPath)) {
      throw new Error(`DB not found at ${dbPath}. Start backend to initialize.`);
    }
    
    const db = new sqlite3.Database(dbPath);
    const surveyId = parseInt(arg('survey', ''), 10) || (await queryGet(db, 'SELECT id FROM surveys ORDER BY id DESC LIMIT 1'))?.id;
    if (!surveyId) throw new Error('No survey id provided and none found. Use --survey <id>.');

    console.log(`Generating 360° HTML report for survey ${surveyId}...`);
    
    const data = await gatherSurveyData(db, surveyId);
    const htmlContent = generateHTML(data);
    
    const reportsDir = path.resolve(backendDir, '..', 'reports', String(surveyId));
    ensureDir(reportsDir);
    const ts = ymdHM();
    
    // Save HTML version
    const htmlPath = path.join(reportsDir, `360-feedback-report-${ts}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`Professional 360° Feedback Report generated:`);
    console.log(`  HTML: ${htmlPath}`);
    console.log(`  Preview in browser for rich visual formatting`);
    
    db.close();
    
  } catch (e) {
    console.error('Report generation failed:', e.message);
    process.exit(1);
  }
})();
