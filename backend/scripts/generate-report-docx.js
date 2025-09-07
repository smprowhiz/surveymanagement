#!/usr/bin/env node
// Generate a professional 360-degree feedback report using actual survey data
// Follows standard 360° report structure with individual and mean scores
// Usage: node scripts/generate-report-docx.js [--survey <id>]

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } = require('docx');

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

function getScaleDescription() {
  return `This report uses a 5-point scale where:
• 5 = Exceptional/Outstanding
• 4 = Strong/Highly Effective  
• 3 = Good/Effective
• 2 = Developing/Needs Improvement
• 1 = Significant Development Needed`;
}

function getScoreColor(score) {
  if (score >= 4.5) return "2E7D32"; // Dark green
  if (score >= 4.0) return "4CAF50"; // Green  
  if (score >= 3.5) return "8BC34A"; // Light green
  if (score >= 3.0) return "CDDC39"; // Yellow-green
  if (score >= 2.5) return "FFEB3B"; // Yellow
  return "FF9800"; // Orange
}

function createVisualScale(score, maxScale = 5) {
  // Create a visual representation of the score using blocks
  const blocks = [];
  for (let i = 1; i <= maxScale; i++) {
    if (i <= Math.floor(score)) {
      blocks.push('█'); // Full block for complete points
    } else if (i === Math.ceil(score) && score % 1 !== 0) {
      blocks.push('▌'); // Half block for partial points
    } else {
      blocks.push('░'); // Light block for empty points
    }
  }
  return blocks.join(' ');
}

function createScoreTable(questionText, scoreData, maxWidth = 100) {
  // Create a professional score visualization table
  const rows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            text: questionText, 
            style: "Normal",
            spacing: { after: 100 }
          })],
          width: { size: 60, type: WidthType.PERCENTAGE },
          margins: { top: 200, bottom: 200, left: 200, right: 200 }
        }),
        new TableCell({
          children: [
            new Paragraph({ 
              children: [
                new TextRun({ text: "Score", bold: true, size: 20 }),
                new TextRun({ text: " | ", size: 20 }),
                new TextRun({ text: "Visual Scale (1-5)", bold: true, size: 20 })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 }
            })
          ],
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, fill: "F5F5F5" },
          margins: { top: 200, bottom: 200, left: 200, right: 200 }
        })
      ]
    })
  ];

  // Add score rows for each feedback type
  scoreData.forEach(data => {
    const visualScale = createVisualScale(data.score);
    const scoreColor = getScoreColor(data.score);
    
    rows.push(new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            text: `${data.type} (${data.count} responses)`,
            spacing: { after: 50 }
          })],
          margins: { top: 150, bottom: 150, left: 200, right: 200 }
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: data.score.toFixed(2), 
                  bold: true, 
                  size: 24,
                  color: scoreColor
                }),
                new TextRun({ text: "  ", size: 20 }),
                new TextRun({ 
                  text: visualScale, 
                  font: "Consolas",
                  size: 16,
                  color: scoreColor
                }),
                new TextRun({ text: `  (${data.individual || 'N/A'})`, size: 16, italics: true })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 }
            })
          ],
          margins: { top: 150, bottom: 150, left: 200, right: 200 }
        })
      ]
    }));
  });

  return new Table({
    rows,
    width: { size: maxWidth, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" }
    }
  });
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

  // Get the subject being evaluated (first self-assessment participant)
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

  // Get all questions with their categories
  const questions = await queryAll(db, `
    SELECT DISTINCT q.category_name, q.question_text, q.question_type, q.position
    FROM survey_questions q
    WHERE q.survey_id = ?
    ORDER BY q.category_name, q.position
  `, [surveyId]);

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
    questions,
    participantStats,
    questionScores,
    categoryAverages,
    verbatims,
    reportDate: new Date()
  };
}

function create360Report(data) {
  const sections = [];
  
  // Helper functions
  const addHeading = (text, level = HeadingLevel.HEADING_2, spacing = 300) => {
    sections.push(new Paragraph({ 
      text, 
      heading: level, 
      spacing: { before: spacing, after: 200 },
      pageBreakBefore: level === HeadingLevel.HEADING_1
    }));
  };
  
  const addParagraph = (text, options = {}) => {
    sections.push(new Paragraph({ 
      children: [new TextRun({ text, ...options })], 
      spacing: { after: 150 },
      alignment: options.alignment || AlignmentType.LEFT
    }));
  };
  
  const addSpace = (size = 200) => {
    sections.push(new Paragraph({ text: "", spacing: { after: size } }));
  };

  // === TITLE PAGE ===
  addHeading("360° LEADERSHIP FEEDBACK REPORT", HeadingLevel.HEADING_1, 0);
  addSpace(400);
  
  addParagraph(`Participant: ${data.subject.name}`, { bold: true, size: 28 });
  addParagraph(`Position: ${data.subject.role}`, { size: 24 });
  addParagraph(`Organization: ${data.subject.company_name}`, { size: 24 });
  addSpace(300);
  
  addParagraph(`Survey: ${data.survey.title}`, { size: 22 });
  addParagraph(`Assessment Period: ${formatDate(data.survey.start_date)} - ${formatDate(data.survey.end_date)}`, { size: 22 });
  addParagraph(`Report Generated: ${formatDate(data.reportDate.toISOString())}`, { size: 22 });
  addSpace(400);
  
  addParagraph("CONFIDENTIAL", { bold: true, size: 20, alignment: AlignmentType.CENTER });
  addParagraph("This report contains confidential feedback for development purposes only.", { 
    italics: true, 
    size: 18, 
    alignment: AlignmentType.CENTER 
  });

  // === INTRODUCTION ===
  addHeading("Introduction & Overview", HeadingLevel.HEADING_1);
  
  addParagraph("This 360-degree feedback report presents perspectives from multiple sources to support your leadership development. The feedback comes from colleagues who work with you in different capacities, providing a comprehensive view of your leadership effectiveness.");
  addSpace();
  
  addParagraph("Rating Scale:", { bold: true });
  addParagraph(getScaleDescription());
  addSpace();

  // === PARTICIPATION SUMMARY ===
  addHeading("Participation Summary");
  
  const participationTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph({ text: "Feedback Source", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "1976D2" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Invited", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "1976D2" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Responded", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "1976D2" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Response Rate", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "1976D2" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          })
        ]
      }),
      ...data.participantStats.map(stat => {
        const responseRate = Math.round((stat.responded/stat.invited)*100);
        const rateColor = responseRate >= 80 ? "2E7D32" : responseRate >= 60 ? "FF9800" : "D32F2F";
        
        return new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ 
                text: stat.feedback_type.charAt(0).toUpperCase() + stat.feedback_type.slice(1),
                bold: true
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: stat.invited.toString(), 
                alignment: AlignmentType.CENTER,
                size: 22
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: stat.responded.toString(), 
                alignment: AlignmentType.CENTER,
                size: 22,
                bold: true
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: `${responseRate}%`, 
                alignment: AlignmentType.CENTER,
                color: rateColor,
                bold: true,
                size: 22
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            })
          ]
        });
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "1976D2" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "1976D2" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "1976D2" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "1976D2" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
    }
  });
  
  sections.push(participationTable);
  addSpace();

  // === OVERALL RESULTS SUMMARY ===
  addHeading("Overall Results Summary");
  
  const categoryOverallTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph({ text: "Leadership Area", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "2E7D32" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Overall Score", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "2E7D32" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Visual Scale", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "2E7D32" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Performance Level", bold: true, color: "FFFFFF" })], 
            shading: { type: ShadingType.SOLID, fill: "2E7D32" },
            margins: { top: 300, bottom: 300, left: 300, right: 300 }
          })
        ]
      }),
      ...Object.entries(data.categoryAverages).map(([category, scores]) => {
        const scoreColor = getScoreColor(scores.overall);
        const visualScale = createVisualScale(scores.overall);
        
        return new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ text: category, bold: true })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: scores.overall.toFixed(2), 
                alignment: AlignmentType.CENTER,
                color: scoreColor,
                bold: true,
                size: 24
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: visualScale, 
                alignment: AlignmentType.CENTER,
                font: "Consolas",
                color: scoreColor,
                size: 18
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: getScoreInterpretation(scores.overall), 
                alignment: AlignmentType.CENTER,
                size: 20
              })],
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            })
          ]
        });
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "2E7D32" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "2E7D32" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "2E7D32" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "2E7D32" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
    }
  });
  
  sections.push(categoryOverallTable);
  addSpace();

  // === DETAILED RESULTS BY CATEGORY ===
  addHeading("Detailed Results by Leadership Area", HeadingLevel.HEADING_1);

  Object.entries(data.categoryAverages).forEach(([categoryName, categoryData]) => {
    addHeading(categoryName, HeadingLevel.HEADING_2);
    addParagraph(`Overall Category Score: ${categoryData.overall.toFixed(2)} - ${getScoreInterpretation(categoryData.overall)}`, { bold: true });
    addSpace();

    // Scores by feedback source table
    const categoryTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ text: "Feedback Source", bold: true, color: "FFFFFF" })], 
              shading: { type: ShadingType.SOLID, fill: "424242" },
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ text: "Average Score", bold: true, color: "FFFFFF" })], 
              shading: { type: ShadingType.SOLID, fill: "424242" },
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ text: "Visual Scale", bold: true, color: "FFFFFF" })], 
              shading: { type: ShadingType.SOLID, fill: "424242" },
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            }),
            new TableCell({ 
              children: [new Paragraph({ text: "# Questions", bold: true, color: "FFFFFF" })], 
              shading: { type: ShadingType.SOLID, fill: "424242" },
              margins: { top: 250, bottom: 250, left: 300, right: 300 }
            })
          ]
        }),
        ...Object.entries(categoryData.types).map(([type, typeData]) => {
          const scoreColor = getScoreColor(typeData.average);
          const visualScale = createVisualScale(typeData.average);
          
          return new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph({ 
                  text: type.charAt(0).toUpperCase() + type.slice(1),
                  bold: true
                })],
                margins: { top: 200, bottom: 200, left: 300, right: 300 }
              }),
              new TableCell({ 
                children: [new Paragraph({ 
                  text: typeData.average.toFixed(2), 
                  alignment: AlignmentType.CENTER,
                  color: scoreColor,
                  bold: true,
                  size: 22
                })],
                margins: { top: 200, bottom: 200, left: 300, right: 300 }
              }),
              new TableCell({ 
                children: [new Paragraph({ 
                  text: visualScale, 
                  alignment: AlignmentType.CENTER,
                  font: "Consolas",
                  color: scoreColor,
                  size: 16
                })],
                margins: { top: 200, bottom: 200, left: 300, right: 300 }
              }),
              new TableCell({ 
                children: [new Paragraph({ 
                  text: typeData.count.toString(), 
                  alignment: AlignmentType.CENTER,
                  size: 20
                })],
                margins: { top: 200, bottom: 200, left: 300, right: 300 }
              })
            ]
          });
        })
      ],
      width: { size: 90, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "424242" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "424242" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "424242" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "424242" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
      }
    });
    
    sections.push(categoryTable);
    addSpace();

    // Individual question scores for this category
    const categoryQuestions = data.questionScores.filter(q => q.category_name === categoryName);
    if (categoryQuestions.length > 0) {
      addHeading("Question-Level Results", HeadingLevel.HEADING_3);
      
      // Group by question text to show all feedback types for each question
      const questionGroups = {};
      categoryQuestions.forEach(q => {
        if (!questionGroups[q.question_text]) {
          questionGroups[q.question_text] = [];
        }
        questionGroups[q.question_text].push(q);
      });

      Object.entries(questionGroups).forEach(([questionText, questionData]) => {
        // Create enhanced score visualization for each question
        const scoreData = questionData.map(qData => ({
          type: qData.feedback_type.charAt(0).toUpperCase() + qData.feedback_type.slice(1),
          score: qData.mean_score,
          count: qData.response_count,
          individual: qData.individual_scores
        }));

        const questionScoreTable = createScoreTable(questionText, scoreData);
        sections.push(questionScoreTable);
        addSpace(200);
      });
    }

    // Verbatim comments for this category
    if (data.verbatims[categoryName]) {
      addHeading("Verbatim Comments", HeadingLevel.HEADING_3);
      
      Object.entries(data.verbatims[categoryName]).forEach(([feedbackType, comments]) => {
        if (comments.length > 0) {
          addParagraph(`${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)} Feedback:`, { bold: true });
          comments.forEach(comment => {
            addParagraph(`"${comment.response}"`, { italics: true });
          });
          addSpace();
        }
      });
    }
    
    addSpace(300);
  });

  // === DEVELOPMENT RECOMMENDATIONS ===
  addHeading("Development Recommendations", HeadingLevel.HEADING_1);
  
  const sortedCategories = Object.entries(data.categoryAverages)
    .sort((a, b) => b[1].overall - a[1].overall);
  
  const strengths = sortedCategories.slice(0, Math.ceil(sortedCategories.length / 2));
  const development = sortedCategories.slice(-Math.floor(sortedCategories.length / 2));

  addHeading("Key Strengths", HeadingLevel.HEADING_2);
  addParagraph("Build on these areas of strength:");
  strengths.forEach(([category, data]) => {
    addParagraph(`• ${category}: ${data.overall.toFixed(2)} - ${getScoreInterpretation(data.overall)}`);
  });
  addSpace();

  addHeading("Development Priorities", HeadingLevel.HEADING_2);
  addParagraph("Focus development efforts on these areas:");
  development.forEach(([category, data]) => {
    addParagraph(`• ${category}: ${data.overall.toFixed(2)} - ${getScoreInterpretation(data.overall)}`);
  });
  addSpace();

  addHeading("Next Steps", HeadingLevel.HEADING_2);
  addParagraph("1. Review your detailed results and identify specific behaviors to develop");
  addParagraph("2. Discuss this feedback with your manager or coach");
  addParagraph("3. Create a development plan focusing on 1-2 priority areas");
  addParagraph("4. Seek opportunities to practice new behaviors");
  addParagraph("5. Request ongoing feedback to track your progress");

  return new Document({
    sections: [{
      children: sections,
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      }
    }]
  });
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

    console.log(`Generating 360° report for survey ${surveyId}...`);
    
    const data = await gatherSurveyData(db, surveyId);
    const document = create360Report(data);
    
    const reportsDir = path.resolve(backendDir, '..', 'reports', String(surveyId));
    ensureDir(reportsDir);
    const ts = ymdHM();
    const outPath = path.join(reportsDir, `360-feedback-report-${ts}.docx`);

    const buffer = await Packer.toBuffer(document);
    fs.writeFileSync(outPath, buffer);
    
    console.log(`Professional 360° Feedback Report generated: ${outPath}`);
    db.close();
    
  } catch (e) {
    console.error('Report generation failed:', e.message);
    process.exit(1);
  }
})();
