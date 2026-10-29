import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Helper to initialize GoogleGenAI with required User-Agent
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Vector Generation & Editing with gemini-4-argon & ThinkingLevel.HIGH
app.post('/api/gemini/generate-vector', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentSvg, action = 'create' } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const ai = getGenAI();

    const systemInstruction = `You are a world-class SVG vector artist, mathematician, and motion graphics engineer.
Your task is to produce high-precision, production-grade SVG artwork based on user specifications.

Guidelines:
1. Return ONLY clean SVG markup enclosed within \`\`\`xml ... \`\`\` or \`\`\`svg ... \`\`\` code fence, followed optionally by a 1-sentence note of what was created or transformed.
2. Ensure the root element is <svg viewBox="0 0 800 600" width="800" height="600" xmlns="http://www.w3.org/2000/svg"> (or appropriate dimensions).
3. Use precise path coordinates, cubic beziers ('C', 'S'), quadratic beziers ('Q'), arcs ('A'), and smooth geometry.
4. Utilize rich modern styling: gradients (<defs><linearGradient> or <radialGradient>), clean stroke caps, stroke-linejoin, and proper grouping (<g id="...">).
5. Ensure every major group or path has an id and descriptive title/class for easy layer management in Vectura Studio.
6. If the user asked to animate or keyframe, include SVG <animate> or <animateTransform> elements or CSS keyframes within a <style> tag.
7. Avoid markdown headers, explanation essays, or code comments. Focus on producing pristine, valid SVG code.`;

    let userContent = `User Request: ${prompt}`;
    if (currentSvg && (action === 'modify' || action === 'enhance')) {
      userContent += `\n\nExisting Canvas SVG context to modify/enhance:\n${currentSvg}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContent,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const responseText = response.text || '';
    
    // Extract SVG from response
    let extractedSvg = '';
    const xmlMatch = responseText.match(/```(?:xml|svg)?\s*([\s\S]*?)```/i);
    if (xmlMatch && xmlMatch[1].includes('<svg')) {
      extractedSvg = xmlMatch[1].trim();
    } else {
      const rawSvgMatch = responseText.match(/<svg[\s\S]*?<\/svg>/i);
      if (rawSvgMatch) {
        extractedSvg = rawSvgMatch[0].trim();
      }
    }

    res.json({
      success: true,
      rawOutput: responseText,
      svg: extractedSvg,
    });
  } catch (error: any) {
    console.error('Error generating vector artwork:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate vector artwork',
    });
  }
});

// SVG Optimization & Path Clean-Up
app.post('/api/gemini/optimize-svg', async (req: Request, res: Response): Promise<void> => {
  try {
    const { svgCode } = req.body;
    if (!svgCode) {
      res.status(400).json({ error: 'svgCode is required' });
      return;
    }

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Clean, optimize, and mathematically simplify the following SVG while preserving visual fidelity. Remove redundant nested <g> tags, normalize decimal precisions to 2 decimal places, simplify path strings, and ensure valid well-formed XML:\n\n${svgCode}`,
      config: {
        systemInstruction: 'You are an SVG optimization engine. Output ONLY the cleaned SVG inside an ```xml code block.',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const responseText = response.text || '';
    const xmlMatch = responseText.match(/```(?:xml|svg)?\s*([\s\S]*?)```/i);
    const cleanedSvg = xmlMatch ? xmlMatch[1].trim() : responseText.match(/<svg[\s\S]*?<\/svg>/i)?.[0] || svgCode;

    res.json({
      success: true,
      svg: cleanedSvg,
    });
  } catch (error: any) {
    console.error('Error optimizing SVG:', error);
    res.status(500).json({
      error: error.message || 'Failed to optimize SVG',
    });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Vectura Studio API' });
});

import fs from 'fs';

app.use('/downloads', express.static(path.resolve(__dirname, 'public', 'downloads')));
app.get('/api/download/android-apk', (_req: Request, res: Response) => {
  const apkPath = path.resolve(__dirname, 'public', 'downloads', 'vector_studio.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'vector_studio.apk');
  } else {
    res.status(404).json({ error: 'Android APK not found' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Vectura Studio running at http://0.0.0.0:${port}`);
  });
}

startServer();
