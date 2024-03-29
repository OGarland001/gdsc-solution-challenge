const express = require("express");
const app = express();
const path = require("path");
require("dotenv/config");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const multer = require("multer"); // Require multer for handling file uploads
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files
const quickstart = require('./DocumentAI');
const { JWT } = require("google-auth-library");
const aiplatform = require('@google-cloud/aiplatform');
const {PredictionServiceClient} = aiplatform.v1;
const {helpers} = aiplatform;

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

app.post("/signup", async (req, res) => {
  try {
    if (req.body.credential) {
      const verificationResponse = await verifyGoogleToken(req.body.credential);

      if (verificationResponse.error) {
        return res.status(400).json({
          message: verificationResponse.error,
        });
      }

      const profile = verificationResponse?.payload;

      DB.push(profile);

      res.status(201).json({
        message: "Signup was successful",
        user: {
          firstName: profile?.given_name,
          lastName: profile?.family_name,
          picture: profile?.picture,
          email: profile?.email,
          token: jwt.sign({ email: profile?.email }, "myScret", {
            expiresIn: "1d",
          }),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "An error occurred. Registration failed.",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    if (req.body.credential) {
      const verificationResponse = await verifyGoogleToken(req.body.credential);
      if (verificationResponse.error) {
        return res.status(400).json({
          message: verificationResponse.error,
        });
      }

      const profile = verificationResponse?.payload;

      const existsInDB = DB.find((person) => person?.email === profile?.email);

      if (!existsInDB) {
        return res.status(400).json({
          message: "You are not registered. Please sign up",
        });
      }

      res.status(201).json({
        message: "Login was successful",
        user: {
          firstName: profile?.given_name,
          lastName: profile?.family_name,
          picture: profile?.picture,
          email: profile?.email,
          token: jwt.sign({ email: profile?.email }, process.env.JWT_SECRET, {
            expiresIn: "1d",
          }),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error?.message || error,
    });
  }
});

// Route to handle file upload and invoke the quickstart function
app.post("/process-document", upload.single('file'), async (req, res) => {
  try {
    // Check if file was provided in the request
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Now you can access the uploaded file using req.file
    const filePath = req.file.path;

    // Call quickstart function with the file path
    await quickstart(filePath);

    res.status(200).json({ message: "Document processing completed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error processing document: " + error.message });
  }
});

const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";
const URL = `https://${API_ENDPOINT}/v1/projects/${process.env.PROJECT_ID}/locations/us-central1/publishers/google/models/chat-bison@001:predict`;

const getIdToken = async () => {
    const client = new JWT({
        keyFile: "date-minder-9f50d-c151ed5195bd.json",
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const idToken = await client.authorize();
    return idToken.access_token;
};

// const getIdToken = async () => {
//   const client = new JWT({
//       keyFile: "date-minder-9f50d-c151ed5195bd.json",
//       scopes: ["https://www.googleapis.com/auth/cloud-platform"],
//   });
//   const idToken = client.authorize();
//   return idToken.access_token;
// };

const fetch = require('node-fetch');

app.post("/palmrequest", async (req, res) => {
    try {
        const headers = {
            Authorization: `Bearer ${await getIdToken()}`,
            "Content-Type": "application/json",
        };

        const data = {
            instances: [
                {
                    context: req.body.Context,
                    examples: [],
                    messages: [
                        {
                            author: "user",
                            content: req.body.Prompt,
                        },
                    ],
                },
            ],
            parameters: {
                temperature: 0.5,
                maxOutputTokens: 1024,
                topP: 0.8,
                topK: 40,
            },
        };

        console.log("Recieved data: ", req.body.Context);

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
        if (!result || !result.predictions || !result.predictions[0].candidates || result.predictions[0].candidates.length === 0) {
            throw new Error("Invalid response format or missing data in predictions");
        }

        const prediction = result.predictions[0].candidates[0].content;

        console.log("Response from Vertex AI: ", prediction);

        res.status(200).json({ prediction });
    } catch (error) {
        console.error("Error in palmrequest:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// app.post("/palmrequest", async (req, res) => {
//   try {

//     console.log("Made it to the palmrequest route");
//     const userContext = req.body.Context;
//     const userPrompt = req.body.Prompt;

//     console.log(userContext, userPrompt);
    
//     if (!userContext || !userPrompt ) 
//     {
//       console.log("No Context or prompt sent");
//       return res.status(400).send({
//         message:
//           "Context or prompt message wasn't send.",
//       });
//     }

//     const headers = {
//       Authorization: `Bearer ` + (getIdToken()),
//       "Content-Type": "application/json",
//     };


//     const clientOptions = {
//       apiEndpoint: 'us-central1-aiplatform.googleapis.com',
//       Headers: headers
//     };

//     const publisher = 'google';
//     const model = 'chat-bison@001';
//     const location = 'us';
//     const projectID = process.env.GOOGLE_PROJECT_ID; 
    
//     // Instantiates a client
//     const predictionServiceClient = new PredictionServiceClient(clientOptions);
//     console.log("creates prediction service");
  
//     // Configure the parent resource
//     const endpoint = `projects/${projectID}/locations/${location}/publishers/${publisher}/models/${model}`;
  
//     const prompt = {
//       context:
//         userContext,
//       messages: [
//         {
//           author: 'user',
//           content: userPrompt,
//         },
//       ],
//     };

//     console.log("prompt created");

//     const instanceValue = helpers.toValue(prompt);
//     const instances = [instanceValue];
  
//     const parameter = {
//       temperature: 0.2,
//       maxOutputTokens: 256,
//       topP: 0.95,
//       topK: 40,
//     };
//     const parameters = helpers.toValue(parameter);
  
//     console.log("parameters created");

//     const request = {
//       endpoint,
//       instances,
//       parameters,
//     };

//     console.log(request);
//     console.log("Awaiting request");
//     // Predict request
//     const [response] = predictionServiceClient.predict(request);
//     console.log(response);

//     console.log('Get chat prompt response');
//     const predictions = response.predictions;
//     console.log('\tPredictions :');
    
//     for (const prediction of predictions) {
//       console.log(`\t\tPrediction : ${JSON.stringify(prediction)}`);
//     }

//     res.status(200).json({ predictions });
    
//   } catch (error) {
//     res.status(500).json({
//       message: error?.message || error,
//     });
//   }
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "server/client/build", "index.html"));
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "server/client/build", "index.html"));
});

app.listen("5152", () => console.log("Server running on port 5152"));
