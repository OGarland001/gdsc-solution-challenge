const express = require("express");
const app = express();
const path = require("path");
require("dotenv/config");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const multer = require("multer"); // Require multer for handling file uploads
const upload = multer({ dest: "uploads/" }); // Destination folder for uploaded files
const quickstart = require("./DocumentAI");
const { JWT } = require("google-auth-library");
const aiplatform = require("@google-cloud/aiplatform");
const { PredictionServiceClient } = aiplatform.v1;
const { helpers } = aiplatform;

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: "GET,POST,PUT,DELETE,OPTIONS",
  })
);
app.use(express.json());

app.use(express.static(path.join(__dirname, "server/client/build")));

let DB = [];

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    return { payload: ticket.getPayload() };
  } catch (error) {
    return { error: "Invalid user detected. Please try again" };
  }
}

// app.post("/signup", async (req, res) => {
//   try {
//     if (req.body.credential) {
//       const verificationResponse = await verifyGoogleToken(req.body.credential);

//       if (verificationResponse.error) {
//         return res.status(400).json({
//           message: verificationResponse.error,
//         });
//       }

//       const profile = verificationResponse?.payload;

//       DB.push(profile);

//       res.status(201).json({
//         message: "Signup was successful",
//         user: {
//           firstName: profile?.given_name,
//           lastName: profile?.family_name,
//           picture: profile?.picture,
//           email: profile?.email,
//           token: jwt.sign({ email: profile?.email }, "myScret", {
//             expiresIn: "1d",
//           }),
//         },
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: "An error occurred. Registration failed.",
//     });
//   }
// });

// app.post("/login", async (req, res) => {
//   try {
//     if (req.body.credential) {
//       const verificationResponse = await verifyGoogleToken(req.body.credential);
//       if (verificationResponse.error) {
//         return res.status(400).json({
//           message: verificationResponse.error,
//         });
//       }

//       const profile = verificationResponse?.payload;

//       const existsInDB = DB.find((person) => person?.email === profile?.email);

//       if (!existsInDB) {
//         return res.status(400).json({
//           message: "You are not registered. Please sign up",
//         });
//       }

//       res.status(201).json({
//         message: "Login was successful",
//         user: {
//           firstName: profile?.given_name,
//           lastName: profile?.family_name,
//           picture: profile?.picture,
//           email: profile?.email,
//           token: jwt.sign({ email: profile?.email }, process.env.JWT_SECRET, {
//             expiresIn: "1d",
//           }),
//         },
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: error?.message || error,
//     });
//   }
// });

// Route to handle file upload and invoke the quickstart function
app.post("/process-document", upload.single("file"), async (req, res) => {
  try {
    // Check if file was provided in the request
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Now you can access the uploaded file using req.file
    const filePath = req.file.path;

    // Call quickstart function with the file path
    await quickstart(filePath);

    res
      .status(200)
      .json({ message: "Document processing completed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing document: " + error.message });
  }
});

const chatBisonString = 'chat-bison@001';
const textBisonString = 'text-bison@002';
const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";
const URL = `https://${API_ENDPOINT}/v1/projects/${process.env.PROJECT_ID}/locations/us-central1/publishers/google/models/${textBisonString}:predict`;


const getIdToken = async () => {
  const client = new JWT({
    keyFile: "date-minder-9f50d-c151ed5195bd.json",
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const idToken = await client.authorize();
  return idToken.access_token;
};


function parseEventData(jsonString) {
  try {
      const events = JSON.parse(jsonString);
      return events.map(event => {
          const startDateTime = new Date(event.start.dateTime).toLocaleString('en-US', { timeZone: event.start.timeZone });
          const endDateTime = new Date(event.end.dateTime).toLocaleString('en-US', { timeZone: event.end.timeZone });

          return `${event.summary} starts on ${startDateTime} (TimeZone: ${event.start.timeZone}) and ends on ${endDateTime} (TimeZone: ${event.end.timeZone})`;
      }).join(', ');
  } catch (error) {
      console.error("Error parsing event data:", error.message);
      throw new Error("Failed to parse event data");
  }
}


const fetch = require("node-fetch");

app.post("/palmrequest", async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${await getIdToken()}`,
      "Content-Type": "application/json",
    };

    const palmContext = parseEventData(req.body.Context);

    const data = {
      instances: [
        {
          prompt: req.body.Prompt + ' here is the list of my calendar events ' + palmContext
        },
      ],
      parameters: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40,
      },
    };

    const response = await fetch(URL, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(response.statusText);
      throw new Error("Request failed " + response.statusText);
    }

    const result = await response.json();
    if (
      !result ||
      !result.predictions ||
      !result.predictions[0].content
    ) {
      throw new Error("Invalid response format or missing data in predictions");
    }

    const prediction = result.predictions[0].content;

    console.log("Response from Vertex AI: ", prediction);

    res.status(200).json({ prediction });
  } catch (error) {
    console.error("Error in palmrequest:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//Route for chat bison model 

// app.post("/palmrequest", async (req, res) => {
//     try {
//         const headers = {
//             Authorization: `Bearer ${await getIdToken()}`,
//             "Content-Type": "application/json",
//         };

//         const palmContext = parseEventData(req.body.Context);

//         console.log(palmContext);

//         const data = {
//             instances: [
//                 {
//                     context: palmContext,
//                     examples: [],
//                     messages: [
//                         {
//                             author: "user",
//                             content: req.body.Prompt,
//                         },
//                     ],
//                 },
//             ],
//             parameters: {
//                 temperature: 0.9,
//                 maxOutputTokens: 1024,
//                 topP: 0.8,
//                 topK: 40,
//             },
//         };

//         //console.log("Recieved data: ", req.body.Context);

//     const response = await fetch(URL, {
//       method: "POST",
//       headers,
//       body: JSON.stringify(data),
//     });

//     if (!response.ok) {
//       console.error(response.statusText);
//       throw new Error("Request failed " + response.statusText);
//     }

//     const result = await response.json();
//     if (
//       !result ||
//       !result.predictions ||
//       !result.predictions[0].candidates ||
//       result.predictions[0].candidates.length === 0
//     ) {
//       throw new Error("Invalid response format or missing data in predictions");
//     }

//     const prediction = result.predictions[0].candidates[0].content;

//     console.log("Response from Vertex AI: ", prediction);

//     res.status(200).json({ prediction });
//   } catch (error) {
//     console.error("Error in palmrequest:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "server/client/build", "index.html"));
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "server/client/build", "index.html"));
});

app.listen("5152", () => console.log("Server running on port 5152"));
