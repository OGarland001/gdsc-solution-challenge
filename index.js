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
const { v4: uuidv4 } = require("uuid");

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

const oAuth2Client = new OAuth2Client(
  process.env.REACT_APP_CLIENT_ID,
  process.env.REACT_APP_CLIENT_SECRET,
  'postmessage',
  'https://www.googleapis.com/auth/calendar.events'
);

app.post('/auth/google', async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code); 
  //console.log(tokens);
  res.json(tokens);
});

app.post('/auth/google/refresh-token', async (req, res) => {
  const user = new UserRefreshClient(
    clientId,
    clientSecret,
    req.body.refreshToken,
  );
  const { credentials } = await user.refreshAccessToken(); // optain new tokens
  res.json(credentials);
})


// Route to handle file upload and invoke the quickstart function
app.post("/process-document", upload.single("file"), async (req, res) => {
  try {
    // Check if file was provided in the request
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Now you can access the uploaded file using req.file
    const filePath = req.file.path;

    // Determine file type based on file extension
    const fileType = path.extname(req.file.originalname).toLowerCase();

    // Call quickstart function with the file path and file type
    const documentContent = await quickstart(filePath, fileType);

    res.status(200).json({ message: documentContent });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing document: " + error.message });
  }
});

const chatBisonString = "chat-bison@001";
const textBisonString = "text-bison@002";
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
    return events
      .map((event) => {
        const startDateTime = new Date(event.start.dateTime).toLocaleString(
          "en-US",
          { timeZone: event.start.timeZone }
        );
        const endDateTime = new Date(event.end.dateTime).toLocaleString(
          "en-US",
          { timeZone: event.end.timeZone }
        );

        return `${event.summary} starts on ${startDateTime} (TimeZone: ${event.start.timeZone}) and ends on ${endDateTime} (TimeZone: ${event.end.timeZone})`;
      })
      .join(", ");
  } catch (error) {
    console.error("Error parsing event data:", error.message);
    throw new Error("Failed to parse event data");
  }
}

function parseSingleEventData(jsonString) {
  try {
    const event = JSON.parse(jsonString);
    return event;
  } catch (error) {
    console.error("Error parsing event data:", error.message);
    throw new Error("Failed to parse event data");
  }
}

// Function to check for event overlap
function checkOpenDate(currentDates, jsonString) {
  const request = parseSingleEventData(jsonString);

  const requiredFields = ["summary", "start", "end"];
  for (const field of requiredFields) {
    if (!request[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (
    !request.start ||
    !request.start.dateTime ||
    !request.end ||
    !request.end.dateTime
  ) {
    throw new Error("Start and end dates with dateTime are required");
  }

  const newSummary = request.summary;
  const newStart = new Date(request.start.dateTime);
  const newEnd = new Date(request.end.dateTime);

  for (const event of currentDates) {
    const existingSummary = event.summary;
    const existingStart = new Date(event.start.dateTime);
    const existingEnd = new Date(event.end.dateTime);

    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return `The new event "${newSummary}" overlaps with your existing event "${existingSummary}"`;
    }
  }
  return null;
}

function buildConferenceString() {
  const requestId = uuidv4();

  const conferenceData = {
    createRequest: {
      requestId: requestId,
      conferenceSolutionKey: {
        type: "hangoutsMeet",
      },
    },
  };

  return conferenceData;
}

function findEmails(givenPrompt) {
  var foundEmails = [];
  var emailRegex =
    /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

  while ((match = emailRegex.exec(searchInThisString))) {
    foundEmails.push(match[0]);

    searchInThisString = searchInThisString.replace(match[0], "");
  }

  var result = foundEmails;
  return result;
}

function checkCurrentDateEvents(data, todaysDate) {
  try {

    const currentDate = new Date(todaysDate.substring(0, todaysDate.indexOf(",")));
    const events = data.split(", ");
    const currentEvents = [];

    for (const event of events) {
     
      const eventInfoMatch = event.match(/(.+) starts on (\d{1,2}\/\d{1,2}\/\d{4})/);
      if (eventInfoMatch) {
        const eventName = eventInfoMatch[1];
        const startDateString = eventInfoMatch[2];
        const startDateTime = new Date(startDateString);

        if (currentDate.toDateString() === startDateTime.toDateString()) {
          currentEvents.push(eventName);
        }
      }
    }

    console.log(currentEvents);
    return currentEvents;
  } catch (error) {
    console.error("Error checking current date events:", error.message);
    throw new Error("Failed to check current date events");
  }
}


const fetch = require("node-fetch");
//Todays date is
const calendarReferenceText =
  " here is the list of my calendar events for reference: ";
const addEventText =
  ' Convert the previous statment into a new format. Use this format (if there is no description leave blank): { "summary": "Event summary", “Description”: “Event Description”, "start": { "dateTime": "2023-04-10T10:00:00-07:00" }, "end": { "dateTime": "2023-04-10T11:00:00-07:00" } } ';

app.post("/palmrequest", async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${await getIdToken()}`,
      "Content-Type": "application/json",
    };

    //console.log(req.body.Context);
    const state = req.body.State;
    var palmContext = req.body.Context;
    const currentDateTime = req.body.CurrentDateTime;
    const TimeZone = req.body.Timezone;

    console.log("time zone:", TimeZone);
    console.log("current time", currentDateTime);

    console.log(palmContext);
    var data = null;

    if (state == "document") {
      documentPromptTxt =
        'Please extract any events and class times mentioned in the document provided. This includes assignments, classes/lectures, project milestones, and other relevant activities. Ensure to include details such as event titles, descriptions, start times, and end times. The extracted information will be used to create new calendar events. Format the output in the JSON format specified below and make sure it is complete and finished must be full json. If no events are found or details are missing, please include "N/A" in the corresponding fields to ensure completeness and flexibility. this json format must be inside a array of events json objects the array must be called "events" that contain this :{id: 1, summary: "testEvent1", description: "testDescription1", endTime: "2024-02-19T09:00:00-05:00", startTime: "2024-02-17T09:00:00-05:00",}';

      data = {
        instances: [
          {
            prompt:
              documentPromptTxt +
              req.body.Prompt +
              calendarReferenceText +
              palmContext +
              " the current date and time is " +
              currentDateTime +
              " in this time zone: " +
              TimeZone,
          },
        ],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40,
        },
      };
    } else if (state == "create") {
      var createPromptTxt =
        'Please extract any events and class times mentioned in the next prompt provided. This includes assignments, classes/lectures, project milestones, and other relevant activities. Ensure to include details such as event titles, descriptions, start times, and end times. The extracted information will be used to create new calendar events. Format the output in the JSON format specified below and make sure it is complete and finished must be full json. If no events are found or details are missing, please include "N/A" in the corresponding fields to ensure completeness and flexibility. json event format:{summary: "testEvent1", description: "testDescription1", endTime: "2024-02-19T09:00:00-05:00", startTime: "2024-02-17T09:00:00-05:00",}';

      const emailList = findEmails(req.body.Prompt);

      if (emailList != null) {
        createPromptTxt = createPromptTxt.substring(
          0,
          createPromptTxt.length - 1
        );

        const attendees = emailList.map((email) => ({ email: email }));
        const attendeesJsonString = JSON.stringify(attendees);

        createPromptTxt += ', "attendees": ' + attendeesJsonString;
      }

      if (req.body.CreateMeeting) {
        const conferenceJsonString = JSON.stringify(buildConferenceString());
        createPromptTxt = createPromptTxt.replace(
          "}",
          ", " + conferenceJsonString.substring(1)
        );
      }

      data = {
        instances: [
          {
            prompt:
              createPromptTxt +
              req.body.Prompt +
              calendarReferenceText +
              palmContext +
              " the current date and time is " +
              currentDateTime +
              " in this time zone: " +
              TimeZone,
          },
        ],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40,
        },
      };
    } else {
      var userEvents = parseEventData(palmContext)
      //console.log(events);
    
      data = {
        instances: [
          {
            prompt:
              req.body.Prompt +
              calendarReferenceText +
              userEvents +
              " the current date and time is " +
              currentDateTime +
              " in this time zone: " +
              TimeZone,
          },
        ],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40,
        },
      };
    }
   
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
    if (!result || !result.predictions || !result.predictions[0].content) {
      throw new Error("Invalid response format or missing data in predictions");
    }

    var prediction = result.predictions[0].content;

    console.log("Response from Vertex AI: ", prediction);

    //Commented out until add event prompt is created
    if (state == "create") {
      const openDateMessage = checkOpenDate(palmContext, prediction);
      if (openDateMessage !== null) {
        prediction = openDateMessage;
      }
    }

    res.status(200).json({ prediction });
  } catch (error) {
    console.error("Error in palmrequest:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/code_callback_endpoint', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      res.status(400).send('Authorization code not provided.');
      return;
    }

    console.log("auth code", code);
    res.send(code);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Error exchanging code for tokens.');
  }
});



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "server/client/build", "index.html"));
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "server/client/build", "index.html"));
});

app.listen("5152", () => console.log("Server running on port 5152"));
