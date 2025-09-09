import PptxGenJS from 'pptxgenjs';

export const createTemplate = async () => {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  
  // Set slide background
  slide.background = { fill: 'FFFFFF' };
  
  // Add title placeholder
  slide.addText('{{BOARD_NAME}}', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: '2C3E50',
    align: 'center',
    fontFace: 'Calibri'
  });
  
  // Add subtitle placeholder
  slide.addText('{{CARD_COUNT}} cards • {{COLUMN_COUNT}} columns', {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: '7F8C8D',
    align: 'center',
    fontFace: 'Calibri'
  });
  
  // Add logo/branding area (placeholder)
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.5,
    y: 0.3,
    w: 1,
    h: 0.6,
    fill: { color: 'E8F4FD' },
    line: { color: '3498DB', width: 1 }
  });
  
  slide.addText('LOGO', {
    x: 8.5,
    y: 0.45,
    w: 1,
    h: 0.3,
    fontSize: 10,
    color: '3498DB',
    align: 'center',
    fontFace: 'Calibri'
  });
  
  // Add header for table section
  slide.addText('Project Status Overview', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: '2C3E50',
    fontFace: 'Calibri'
  });
  
  // Add table placeholder with all columns matching the app's table view
  const tableData: any[][] = [
    [
      { text: 'Card', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Last Activity', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Backlog', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Data Curation', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Ready for Build', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Ingested', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Relevancy', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Testing', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } },
      { text: 'Done 🎉', options: { bold: true, fill: '3498DB', color: 'FFFFFF', fontFace: 'Calibri' } }
    ],
    [
      { text: 'TDA GenAI\nValue of data, Pre/post curation', options: { fontFace: 'Calibri' } },
      { text: '9/9/2025', options: { fontFace: 'Calibri' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '●', options: { fontFace: 'Calibri', fill: 'F39C12', color: 'FFFFFF' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } }
    ],
    [
      { text: 'Beauty\nContext, Value of data', options: { fontFace: 'Calibri' } },
      { text: '9/9/2025', options: { fontFace: 'Calibri' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '●', options: { fontFace: 'Calibri', fill: 'F39C12', color: 'FFFFFF' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } },
      { text: '○', options: { fontFace: 'Calibri', fill: 'ECF0F1', color: '7F8C8D' } }
    ],
    [
      { text: 'POP ESF', options: { fontFace: 'Calibri' } },
      { text: '9/9/2025', options: { fontFace: 'Calibri' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '✓', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } },
      { text: '●', options: { fontFace: 'Calibri', fill: '27AE60', color: 'FFFFFF' } }
    ]
  ];
  
  slide.addTable(tableData, {
    x: 0.5,
    y: 2.5,
    w: 9,
    fontSize: 10,
    border: { pt: 1, color: 'BDC3C7' },
    rowH: 0.6,
    margin: 0.05,
    colW: [1.8, 1.0, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7]
  });
  
  // Add footer area
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 6.8,
    w: 9,
    h: 0.7,
    fill: { color: 'F8F9FA' },
    line: { color: 'E9ECEF', width: 1 }
  });
  
  slide.addText('Exported on {{EXPORT_DATE}}', {
    x: 1,
    y: 7,
    w: 4,
    h: 0.3,
    fontSize: 10,
    color: '6C757D',
    fontFace: 'Calibri'
  });
  
  slide.addText('Generated by Trello Swimlane Viewer', {
    x: 5.5,
    y: 7,
    w: 3.5,
    h: 0.3,
    fontSize: 10,
    color: '6C757D',
    align: 'right',
    fontFace: 'Calibri'
  });
  
  // Save template
  await pptx.writeFile({ fileName: 'swimlane_template.pptx' });
  console.log('Template created successfully');
};

// Call this function to generate the template file
// You can run this in the browser console: 
// import('./utils/createTemplate').then(m => m.createTemplate())