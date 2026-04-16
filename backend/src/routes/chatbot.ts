import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

const SYSTEM_PROMPT = `You are Caargo, a friendly logistics assistant for Sri Caargo. 
You help users with billing portal questions AND shipment tracking.

Your personality: warm, clear, and concise. 
If someone asks for shipment status, use the provided Shipment Data (if any).
If no shipment data is provided but they asked for status, ask them for the HAWB number.

You can help with:
- Shipment tracking and status updates
- Invoice downloads and billing history
- Payment methods
- Shipment billing breakdowns (weight, zone, GST)

Always end complex answers with: "Would you like me to help with anything else?"`;

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as {
      message: string;
      history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    // Attempt to find shipment context
    let shipmentContext = "";
    const hawbMatch = message.match(/(HAW|SC)\d+/i);
    if (hawbMatch) {
      try {
        const { Shipment } = await import('../models');
        const shipment = await Shipment.findOne({ hawb: hawbMatch[0].toUpperCase() }).populate('shipper_id consignee_id').lean();
        if (shipment) {
          shipmentContext = `\n[Shipment Data Found: HAWB: ${shipment.hawb}, Status: ${shipment.status.toUpperCase()}, Consignee: ${(shipment.consignee_id as any)?.name || 'N/A'}, Destination: ${shipment.destination_city}, Items: ${shipment.total_cartons} pcs]`;
        }
      } catch (e) {
        console.error('Shipment lookup error:', e);
      }
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, error: 'AI service not configured' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash'];
    let reply = "I'm having trouble connecting right now. Please try again in a moment.";
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT + shipmentContext,
        });

        const chat = model.startChat({
          history: history || [],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        });

        const result = await chat.sendMessage(message);
        reply = result.response.text();
        success = true;
        break; // Success, break out of loop
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err?.message || String(err));
        // Continue to the next model in the loop
      }
    }

    if (!success) {
      throw new Error('All fallback models failed to generate content');
    }

    res.json({ success: true, reply });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const errStatus = error?.status || error?.statusCode || '';
    console.error('Chatbot error:', errStatus, errMsg);
    res.status(500).json({
      success: false,
      error: errMsg,
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
    });
  }
});

export default router;
