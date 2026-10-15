// AI Studio Full-Stack Server
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  generateBudgetJourneyServer,
  optimizeBudgetServer,
  travelAssistantServer,
  moderateUserContentServer,
} from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON request parser
  app.use(express.json({ limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'RoamLite India',
      timestamp: new Date().toISOString(),
    });
  });

  // 1. generateBudgetJourney API
  app.post('/api/gemini/generate-budget-journey', async (req, res) => {
    try {
      const { origin, destination, budget, numberOfDays, travelStyle, places, hitchhikingSpots } = req.body;
      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required.' });
      }

      const result = await generateBudgetJourneyServer({
        origin: String(origin),
        destination: String(destination),
        budget: Number(budget) || 2000,
        numberOfDays: Number(numberOfDays) || 3,
        travelStyle: travelStyle || 'Cheapest',
        places,
        hitchhikingSpots,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/gemini/generate-budget-journey:', err);
      res.status(500).json({ error: err?.message || 'Failed to generate budget journey' });
    }
  });

  // 2. optimizeBudget API
  app.post('/api/gemini/optimize-budget', async (req, res) => {
    try {
      const { journey, targetBudget, places, hitchhikingSpots } = req.body;
      if (!journey || typeof targetBudget !== 'number') {
        return res.status(400).json({ error: 'Journey and targetBudget are required.' });
      }

      const result = await optimizeBudgetServer({
        journey,
        targetBudget,
        places,
        hitchhikingSpots,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/gemini/optimize-budget:', err);
      res.status(500).json({ error: err?.message || 'Failed to optimize budget' });
    }
  });

  // 3. travelAssistant API
  app.post('/api/gemini/travel-assistant', async (req, res) => {
    try {
      const { query, history, places, hitchhikingSpots } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required.' });
      }

      const result = await travelAssistantServer({
        query: String(query),
        history,
        places,
        hitchhikingSpots,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/gemini/travel-assistant:', err);
      res.status(500).json({ error: err?.message || 'Failed to process travel assistant query' });
    }
  });

  // 4. moderateUserContent API
  app.post('/api/gemini/moderate-user-content', async (req, res) => {
    try {
      const { text, type } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text to moderate is required.' });
      }

      const result = await moderateUserContentServer({
        text: String(text),
        type,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/gemini/moderate-user-content:', err);
      res.status(500).json({ error: err?.message || 'Failed to moderate content' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RoamLite Server] Server running on http://0.0.0.0:${PORT} (Node ${process.version})`);
  });
}

startServer().catch((err) => {
  console.error('[RoamLite Server] Failed to start:', err);
  process.exit(1);
});
