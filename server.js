const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const validUrl = require("valid-url");
const cors = require("cors");
require("dotenv").config();

const app = express();

// MongoDB connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the URL schema
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
});

const Url = mongoose.model("Url", urlSchema);

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// Route to shorten a URL
app.post("/api/shorten", async (req, res) => {
  const { originalUrl } = req.body;

  // Validate the URL
  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    // Check if the URL already exists in the database
    const existingUrl = await Url.findOne({ originalUrl });

    if (existingUrl) {
      return res.json(existingUrl);
    }

    // Create a short URL
    const shortUrl = shortid.generate();
    const newUrl = new Url({
      originalUrl,
      shortUrl,
    });

    // Save to the database
    await newUrl.save();

    res.json(newUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Route to redirect to the original URL
app.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ shortUrl });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.redirect(url.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
