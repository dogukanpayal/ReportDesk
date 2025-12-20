import dotenv from 'dotenv';
dotenv.config();

import { triggerAIAnalysis } from '../src/services/aiService.js';

(async () => {
  try {
    const report = {
      id: 90,
      filePath: '1766255678210-603373635-TestDosyasi.pdf',
      originalFileName: 'TestDosyasi.pdf'
    };

    const res = await triggerAIAnalysis(report);
    console.log('triggerAIAnalysis returned:', res);
    process.exit(0);
  } catch (err) {
    console.error('Error running triggerAIAnalysis:', err);
    process.exit(1);
  }
})();
