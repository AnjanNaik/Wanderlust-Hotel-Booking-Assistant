const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post("/generate-listing", isLoggedIn, async (req, res) => {
    const { location, category, vibePrompt } = req.body;
    
    // Check if API key exists, otherwise use a stunning mock logic for instant demo value
    if (!process.env.GEMINI_API_KEY) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI thinking time
        
        let titleFallback = `Stunning ${category || 'Luxury'} Retreat in ${location || 'the Heart of the City'}`;
        let descFallback = `Welcome to our absolutely breathtaking property in ${location || 'this iconic destination'}. Perfect for travelers seeking an unforgettable ${category ? category.toLowerCase() : 'luxury'} experience. \n\nImagine waking up to panoramic views, surrounded by serene ambiance and world-class amenities. Every corner of this property has been painstakingly curated with premium furnishings, bespoke art, and a layout designed for maximum relaxation.\n\nWhether you're looking for an intimate getaway or a peaceful workspace, our property offers the definitive standard for modern luxury. Book now to secure an unforgettable stay!`;

        if (vibePrompt && vibePrompt.toLowerCase().includes("romantic")) {
            titleFallback = `Romantic ${category || 'Getaway'} in ${location || 'Paradise'}`;
            descFallback = `Ignite the spark at our secluded and utterly romantic ${category || 'property'} located right in ${location || 'the absolute best area'}. \n\nPerfectly designed for couples, this beautiful sanctuary features warm ambient lighting, complete privacy, and luxuriously soft bedding...`;
        }

        return res.json({
            title: titleFallback,
            description: descFallback
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a real estate and luxury travel copywriting expert. Create a captivating Airbnb listing based on the following details:
        Location: ${location || 'Not specified'}
        Property Category/Theme: ${category || 'Not specified'}
        Extra details from the host: ${vibePrompt || 'Make it sound luxurious and appealing'}
        
        Respond ONLY with a JSON object in this exact format:
        {
          "title": "A stunning, SEO-optimized listing title (max 50 chars)",
          "description": "A beautiful, rich 3-paragraph description of the vibe, the scenery, and why it's perfect for luxury luxury travelers. Do not echo the prompt."
        }`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Safely extract the JSON in case the model wraps it in markdown blocks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response format");
        
        const aiData = JSON.parse(jsonMatch[0]);
        res.json(aiData);
    } catch (err) {
        console.error("AI Generation Error:", err);
        res.status(500).json({ error: "Failed to generate AI content" });
    }
});

module.exports = router;
