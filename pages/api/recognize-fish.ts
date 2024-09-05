import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { IncomingForm, File } from 'formidable';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const form = new IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.status(500).json({ error: 'Error parsing file' });
          return;
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file || !(file as File).filepath) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }

        const fileData = await fs.readFile((file as File).filepath);
        const base64Image = fileData.toString('base64');

        const apiResponse = await recognizeImageWithGemini(base64Image);

        res.status(200).json({ results: apiResponse });
      });
    } catch (error) {
      console.error('Error with Google AI API:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

async function recognizeImageWithGemini(base64Image: string) {
  const API_KEY = process.env.GOOGLE_AI_API_KEY;
  const genAI = new GoogleGenerativeAI(API_KEY!);

  // Update the model name to 'gemini-1.5-flash'
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Identify the animal in this image and provide information about its species, habitat, and interesting facts.";

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image
      }
    }
  ]);

  const response = await result.response;
  const text = response.text();

  return text;
}

export default handler;
