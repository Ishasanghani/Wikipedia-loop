// server.js

var express = require("express");
var axios = require("axios");
var cors = require("cors");
var { JSDOM } = require("jsdom");

// Create an Express application
var app = express();
var PORT = process.env.PORT || 8081;

// Enable CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

// Define a route to handle the POST request for getting the Philosophy count
app.post("/api/getPhilosophyCount", async (req, res) => {
  try {
    // Get the entered URL from the request body
    var { url } = req.body;
    // Declare an array to store visited pages
    var visitedPages = [];

    // Check if the entered URL is the Philosophy page
    while (url !== "https://en.wikipedia.org/wiki/Philosophy") {
      // Check for a loop in visited pages
      if (visitedPages.includes(url)) {
        var errorMessage = "Loop detected. Unable to reach Philosophy page.";
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Add the current URL to the visited pages array
      visitedPages.push(url);

      // Make a GET request to the current URL
      var response = await axios.get(url);

      // Parse the HTML of the page to get the next page URL
      var nextPageUrl = parseNextPageUrl(response.data);

      // Check if a valid next page URL is found
      if (!nextPageUrl) {
        var errorMessage = `Dead-end page. No valid links found on ${url}.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      url = nextPageUrl;
    }

    // Send the response with success, count, and visited pages
    res.json({
      success: true,
      count: visitedPages.length,
      visitedPages,
    });
  } catch (error) {
    // Send an error response with the error message
    res.status(500).json({ success: false, error: error.message });
  }
});
// Function to parse the next page URL from the HTML content
var parseNextPageUrl = (html) => {
  try {
    // Create a DOM object from the HTML content
    var dom = new JSDOM(html);
    var body = dom.window.document.body;

    // Find the first link within the body text
    var firstLink = body.querySelector("#mw-content-text p a");
    if (firstLink) {
      // Extract the href attribute of the first link
      var nextPageUrl = firstLink.getAttribute("href");
      console.log("nextPageUrl ", nextPageUrl);

      // Convert the relative URL to an absolute URL
      var absoluteUrl = new URL(nextPageUrl, "https://en.wikipedia.org");

      return absoluteUrl.href;
    }

    // If no link is found, return null
    return null;
  } catch (error) {
    console.error("Error parsing HTML:", error);
    return null;
  }
};

// Start the server and listen on the specified port

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
