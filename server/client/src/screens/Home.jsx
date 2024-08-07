import "../App.css";
import { data } from "../data";
import { Button } from "@material-tailwind/react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState, useRef } from "react";
import React from "react";
import Event from "../components/Event";
import Prompt from "../components/Prompt";
import logo from "./images/logo.png";
import upload from "./images/upload.png";
import promptWizard from "./images/PromptWizard.png";
import TypingEffect from "./TypingEffect";
import { GoogleLogin } from "@react-oauth/google";
const SCOPE = "https://www.googleapis.com/auth/calendar";

const Home = () => {
  const [isShown, setIsShown] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokenClient, setTokenClient] = useState({});
  const [googleCalendarToken, setCalendarToken] = useState({});
  const [isPromptShown, setIsPromptShown] = useState(false);
  const fileInputRef = useRef(null);
  const [formValue, setFormValue] = useState({ radio: "Ask" }); // Updated formValue state with radio property
  const [user, setUser] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [isDragging] = useState(false); // State variable to track dragging
  const [UserEmail, setUserEmail] = useState("");
  const [isAuthorizedWithCalendar, setIsAuthorized] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMoonShowing, setIsMoonShowing] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isInvalidFile, setIsInvalidFile] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [weeks, setWeeks] = useState(1);
  const [formData, setFormData] = useState({
    whatToBuild: "",
    deadline: "",
    hoursPerWeek: "",
  });

  const handleFormChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    // try {
    //   const response = await axios.post("/your-backend-endpoint", formData); // Replace with your backend endpoint
    //   console.log(response.data); // Handle successful response
    // } catch (error) {
    //   console.error(error); // Handle error
    // }
  };

  const handleChangeLightDarkMode = () => {
    setIsMoonShowing(!isMoonShowing);
    // Toggle background color based on the state of isMoonShowing
    document.body.style.backgroundColor = isMoonShowing ? "white" : "#222222";
  };

  const handleChangeSlider = (e) => {
    setWeeks(parseInt(e.target.value));
  };

  const setCookie = (name, value, days) => {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie =
      name + "=" + encodeURIComponent(value) + expires + "; path=/";

    //console.log('cookie set');
  };

  const findEmail = (userObject) => {
    // If userObject exists and has an email property, return it
    if (userObject && userObject.email) {
      return userObject.email;
    }
    // If userObject is an array, search within each item
    if (Array.isArray(userObject)) {
      for (let i = 0; i < userObject.length; i++) {
        const email = findEmail(userObject[i]);
        if (email) return email;
      }
    }
    // If userObject is an object, search within its properties
    if (typeof userObject === "object") {
      for (let key in userObject) {
        const email = findEmail(userObject[key]);
        if (email) return email;
      }
    }
    // Email not found
    return null;
  };

  useEffect(() => {
    const cookieValues = getCookie();
    console.log(cookieValues);

    if (cookieValues) {
      setUser(cookieValues.user);
      setUserEmail(cookieValues.user.email);
      toggle();

      setCalendarToken(cookieValues.calendarToken);
      updateCalendarEvents(2);
      setIsAuthorized(true);
      setIsShown(true);

      checkAccessToken();
      toggleHidden();
    }
  }, []);

  useEffect(() => {
    const intervalInMS = 5000;
    const interval = setInterval(() => {
      const cookieValues = getCookie();
      if (cookieValues) {
        checkAccessToken();
      }
      //console.log('checked access token');
    }, intervalInMS);

    return () => clearInterval(interval);
  }, []);

  const toggle = () => {
    setIsShown((isShown) => !isShown);
  };

  const toggleHidden = () => {
    setShowButton(!showButton);
  };

  const google = window.google;

  const updateCalendarEvents = (weeks) => {
    //Function could be updated to pass amount of days ahead to grab
    const cookieValues = getCookie();
    const userEmail = findEmail(cookieValues.user);
    //console.log(cookieValues);

    var contextWindow = weeks * 7;
    //console.log(userEmail);
    //console.log(cookieValues.calendarToken);

    var startDate = new Date();
    var endDate = new Date();
    endDate.setDate(endDate.getDate() + contextWindow);
    startDate = startDate.toISOString();
    endDate = endDate.toISOString();

    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events?timeMin=${startDate}&timeMax=${endDate}&singleEvents=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookieValues.calendarToken}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        //console.log("Calendar events data:", data);
        setEvents(data.items);
      })
      .catch((error) => {
        console.error("Error fetching calendar events:", error);
      });
  };

  async function checkAccessToken() {
    const cookieValues = getCookie();
    const refreshToken = cookieValues.refreshToken;
    const accessTokenExpiresAt = new Date(cookieValues.accessTokenExpiresAt);

    const options = {
      timeZone: "America/Toronto",
      hour12: false,
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };

    const currentDate = new Date();

    if (accessTokenExpiresAt && accessTokenExpiresAt < currentDate) {
      console.log("Token needs refreshing");

      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v4/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: process.env.REACT_APP_CLIENT_ID,
              client_secret: process.env.REACT_APP_CLIENT_SECRET,
              refresh_token: refreshToken,
              grant_type: "refresh_token",
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setCalendarToken(data.access_token);
          const expirationTime = new Date();

          // Add one hour to the current time
          expirationTime.setHours(expirationTime.getHours() + 1);

          const expires = expirationTime.toLocaleString("en-US", {
            timeZone: "America/Toronto",
            hour12: false,
          });

          console.log("new expiration: " + expires);

          const formattedExpirationTime = expirationTime.toLocaleString(
            "en-US",
            options
          );

          setCookie(
            "DateMinderTokens",
            JSON.stringify({
              calendarToken: data.access_token,
              authToken: cookieValues.authToken,
              refreshToken: cookieValues.refreshToken,
              user: cookieValues.user,
              accessTokenExpiresAt: expires,
            }),
            30
          );
        }
      } catch (error) {
        console.error("Error refreshing access token:", error.message);
      }
    }
  }

  const handleGoogleAuth = () => {
    const client = google.accounts.oauth2.initCodeClient({
      client_id: process.env.REACT_APP_CLIENT_ID,
      scope: SCOPE,
      ux_mode: "popup",
      callback: async (response) => {
        try {
          // Exchange authorization code for tokens
          const tokens = await exchangeCodeForTokens(response.code);
          //console.log(tokens);
          // Use the access token to access user's information
          const userInfo = await getUserInfo(tokens.access_token);

          //console.log(userInfo);
          //console.log(tokens);

          if (userInfo != null && tokens != null) {
            setUser(userInfo);
            setUserEmail(userInfo.email);
            toggle();

            setTokenClient(tokens);
            setCalendarToken(tokens.access_token);

            //console.log(tokens.expiry_date);
            //must be in timezone toronto
            const expirationDate = new Date(tokens.expiry_date);
            const expires = expirationDate.toLocaleString("en-US", {
              timeZone: "America/Toronto",
              hour12: false,
            });

            console.log("expires at: " + expires);

            setCookie(
              "DateMinderTokens",
              JSON.stringify({
                calendarToken: tokens.access_token,
                authToken: tokens,
                refreshToken: tokens.refresh_token,
                user: userInfo,
                accessTokenExpiresAt: expires,
              }),
              30
            );

            updateCalendarEvents(2);
            setIsAuthorized(true);
            setIsShown(true);

            toggleHidden();
          }
        } catch (error) {
          console.error("Error handling Google authentication:", error);
        }
      },
    });

    // Trigger the OAuth Code Flow
    client.requestCode();
  };

  async function exchangeCodeForTokens(code) {
    // Make a POST request to your server to exchange the authorization code for tokens
    const response = await fetch("http://localhost:5152/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange authorization code for tokens");
    }

    return await response.json();
  }

  async function getUserInfo(accessToken) {
    // Make a GET request to the Google API to fetch user's information
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user information");
    }

    return await response.json();
  }

  const getCookie = () => {
    let name = "DateMinderTokens" + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(";");

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        let cookieValue = cookie.substring(name.length, cookie.length);
        // Parse the serialized values back into their original format
        let parsedValues = JSON.parse(decodeURIComponent(cookieValue));
        return {
          calendarToken: parsedValues.calendarToken,
          authToken: parsedValues.authToken,
          user: parsedValues.user,
          refreshToken: parsedValues.refreshToken,
          accessTokenExpiresAt: parsedValues.accessTokenExpiresAt,
        };
      }
    }
    return null;
  };

  const deleteCookie = () => {
    document.cookie =
      "DateMinderTokens" + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const getCalendarEvents = () => {
    console.log("token client", tokenClient);
    tokenClient.requestAccessToken();
  };

  const handleInputFieldChange = (e) => {
    setFormValue({ ...formValue, prompt: e.target.value }); // Update formValue with prompt property
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    try {
      //Events call.
      //EVENTSBALLS
      console.log("number of weeks" + weeks);

      updateCalendarEvents(weeks);
      const eventDataToSend = events.map((event) => {
        const eventData = {
          summary: event.summary,
          start: event.start,
        };
        if (event.end) {
          eventData.end = event.end;
        }
        return eventData;
      });
      console.log("event data by week");
      console.log(eventDataToSend);

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentDateTimeString = new Date().toLocaleString();
      console.log("Current Date and Time (String):", currentDateTimeString);

      setIsLoading(true);
      setAiResponse("");

      

      const response = await fetch("/geminiRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Context: JSON.stringify(eventDataToSend),
          Prompt: typedText,
          CurrentDateTime: currentDateTimeString,
          Timezone: userTimezone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Received data: ", data);
        simulateTyping(data.prediction);
      } else {
        throw new Error("Failed to fetch predictions");
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  function ensureValidJSON(jsonString) {
    jsonString = jsonString.trim();

    var tempJsonString = jsonString.replace(/\n/g, " ");
    tempJsonString = tempJsonString.replace(/\s+/g, " ").trim();
    console.log(tempJsonString);
    if (tempJsonString.endsWith("} ] }")) {
      console.log(jsonString);
      return tempJsonString;
    }

    let lastBracketIndex = jsonString.lastIndexOf("}");
    if (lastBracketIndex !== -1) {
      let remainingChars = jsonString.slice(lastBracketIndex + 1).trim();
      if (remainingChars.length > 0 && !remainingChars.startsWith("}")) {
        jsonString = jsonString.slice(0, lastBracketIndex + 1);
      }
    }

    let incompleteKeyRegex = /("[^"]+"\s*:\s*}),?/g;
    jsonString = jsonString.replace(incompleteKeyRegex, "");

    if (!jsonString.endsWith("} ] }")) {
      jsonString += "] }";
    }

    return jsonString;
  }

  const allowedFileTypes = [
    "application/pdf",
    "image/tiff",
    "image/tif",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/bmp",
  ];

  const handleChange = async (event) => {
    const file = event.target.files[0];
    setIsInvalidFile(false);

    // Check if the file type is valid
    if (!allowedFileTypes.includes(file.type)) {
      setIsInvalidFile(true);
      setIsLoadingFile(false);
      setFormValue({ ...formValue, radio: "Create" });
      setTimeout(() => {
        setIsInvalidFile(false); // Reset invalid file state after 30 seconds
      }, 30000);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setFormValue({ ...formValue, radio: "Create" });
    setIsLoadingFile(true); // Set isLoading to true while waiting for response
    try {
      setPrompts([]);

      const response = await fetch("/process-document", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("In front end:" + data.message);
      setFormValue((prevFormValue) => ({
        ...prevFormValue,
        documentContent: data.message, // Update only the documentContent property
      }));

      var result = data.message;

      result = result.replace(/\n/g, " ");
      result = result.replace(/\s+/g, " ").trim();

      // Make call to the palmAI and then console log the events pulled from the data.
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentDateTimeString = new Date().toLocaleString();
      const palmResponse = await fetch("/geminiRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Context: "",
          Prompt: result,
          CurrentDateTime: currentDateTimeString,
          Timezone: userTimezone,
          State: "document",
        }),
      });
      updateCalendarEvents(2);
      if (palmResponse.ok) {
        const palmData = await palmResponse.json();
        var dataStr = palmData.prediction.replace("```", "");
        var newdataStr = dataStr.replace("```", "");
        newdataStr = newdataStr.slice(5);
        //newdataStr = ensureValidJSON(newdataStr);
        console.log("STR data: ", newdataStr);
        let eventsList = JSON.parse(newdataStr);
        console.log("Received data: ", eventsList);

        // Check if any of the events contain "N/A" or null in the summary or description
        let errorsFound = false;
        eventsList.forEach((event) => {
          if (event.summary === "N/A" || event.summary === null) {
            errorsFound = true;

            event.summary = "!";
            console.error("Error found in event summary: ", event);
          }

          if (event.description === "N/A" || event.description === null) {
            errorsFound = true;

            event.description = "!";
            console.error("Error found in event description: ", event);
          }
        });

        if (errorsFound) {
          alert("Errors have been found in the event data.");
        }
        setPrompts(eventsList);
        setIsLoadingFile(false);
        getPromptEvents();
        try {
          localStorage.removeItem("revertIdList");
          localStorage.removeItem("eventsAdded");
        } catch {}
      } else {
        throw new Error("Failed to fetch predictions");
      }
    } catch (error) {
      console.error("Error processing document:", error);
      setIsLoadingFile(false); // Set isLoading to false in case of error
    }
  };

  const getPromptEvents = (data) => {
    setFormValue({ ...formValue, radio: "Create" });
    setIsPromptShown(true);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const logout = () => {
    localStorage.removeItem("user");
    deleteCookie();
    //localStorage.removeItem("DateMinderTokens");
    toggle();
    document.getElementById("signInDiv").hidden = false;
    window.location = "/";
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsLoadingFile(true);
    const files = e.dataTransfer.files;
    handleChange({ target: { files } }); // Pass a fake event object containing the dropped files to handleChange
  };

  const handleFileInputChange = (e) => {
    setFormValue({ ...formValue, radio: "Create" });
    setIsLoadingFile(true);
    const files = e.target.files;
    handleChange(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    e.currentTarget.classList.add("dragover"); // Add the 'dragover' class to increase opacity
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("dragover"); // Remove the 'dragover' class to revert opacity
  };

  const simulateTyping = (text) => {
    setIsLoading(false); // Stop loading before starting typing

    const typingInterval = 10; // Adjust typing speed as needed
    const predictionText = text.split("");
    let currentIndex = 0;

    const typingTimer = setInterval(() => {
      let response = predictionText[currentIndex];

      // Check if the response includes "undefined" and remove it
      if (response && response.includes("undefined")) {
        response = response.replace("undefined", "");
      }

      setAiResponse((prevTypedText) => prevTypedText + response);
      currentIndex++;

      if (currentIndex === predictionText.length) {
        clearInterval(typingTimer);
        setIsLoading(false); // Stop loading after typing completes
      }
    }, typingInterval);
  };

  return (
    <div style={{ textAlign: "center" }}>
      {showButton && (
        <button
          onClick={handleGoogleAuth}
          type="button"
          className="login-with-google-btn"
        >
          Sign in with Google
        </button>
      )}
      <div
        className="container justify-center"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "3rem",
          margin: "auto",
        }}
      >
        <div id="signInDiv"></div>
        {user && isShown && (
          <div
            id="UserDataDiv"
            style={{ textAlign: "center", marginTop: 15, marginBottom: 15 }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}></div>
  
            <div
              className="white-box"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Row for other elements */}
              <div
                className="row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: "10px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div style={{ marginRight: "1rem" }}>
                  <img
                    src={user.picture}
                    alt="google user img"
                    className="justify-center"
                    referrerPolicy="no-referrer"
                    style={{
                      width: "80%",
                      borderRadius: "50%",
                      zIndex: "2",
                    }}
                  />
                </div>
                <Button
                  className="shadow__btn"
                  onClick={logout}
                  style={{ height: 45 }}
                >
                  Logout {user.name}
                </Button>
              </div>
            </div>
  
            {/* Prompt Wizard */}
            <div
              className="container"
              style={{ marginTop: 0, marginBottom: 15 }}
            >
              <div className="blue-box">
                <img
                  src={promptWizard}
                  alt="PromptWizard"
                  style={{ height: "170px", alignSelf: "center" }}
                />
  
                <div style={{ position: "relative", marginTop: "3%" }}>
                  <label htmlFor="prompt">Prompt Wizard</label>
  
                  {user && isShown && !isAuthorizedWithCalendar && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        className="shadow__btn"
                        onClick={getCalendarEvents()}
                        style={{
                          width: 200,
                          height: 65,
                          marginRight: 10,
                          marginTop: 20,
                          marginBottom: 20,
                        }}
                      >
                        Authorize Google Calendar To Continue...
                      </Button>
                    </div>
                  )}
  
                  {user && isShown && isAuthorizedWithCalendar && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "20px",
                        }}
                      >
                        <div className="radio-inputs">
                          <label className="radio">
                            <input
                              type="radio"
                              name="radio"
                              value="Ask"
                              checked={formValue.radio === "Ask"}
                              onChange={(e) =>
                                setFormValue({
                                  ...formValue,
                                  radio: e.target.value,
                                })
                              }
                            />
                            <span className="name">Ask</span>
                          </label>
                          <label className="radio">
                            <input
                              type="radio"
                              name="radio"
                              value="Upload"
                              checked={formValue.radio === "Upload"}
                              onChange={(e) =>
                                setFormValue({
                                  ...formValue,
                                  radio: e.target.value,
                                })
                              }
                            />
                            <span className="name">Upload</span>
                          </label>
                          <label className="radio">
                            <input
                              type="radio"
                              name="radio"
                              value="Update"
                              checked={formValue.radio === "Update"}
                              onChange={(e) =>
                                setFormValue({
                                  ...formValue,
                                  radio: e.target.value,
                                })
                              }
                            />
                            <span className="name">Update</span>
                          </label>
                          <label className="radio">
                            <input
                              type="radio"
                              name="radio"
                              value="Create"
                              checked={formValue.radio === "Create"}
                              onChange={(e) =>
                                setFormValue({
                                  ...formValue,
                                  radio: e.target.value,
                                })
                              }
                            />
                            <span className="name">Create</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
  
                {user && isShown && isAuthorizedWithCalendar && (
                  <div className="scroll-content">
                    <div>
                      {/* Conditionally render different buttons and text based on the selected radio option */}
                      <div>
                        {/* Your other JSX content */}
                        <TypingEffect
                          formValue={formValue}
                          handleInputSubmit={handleInputSubmit}
                          typedText={typedText}
                          setTypedText={setTypedText}
                          isLoading={isLoading}
                          aiResponse={aiResponse}
                          setAiResponse={setAiResponse}
                          weeks={weeks} // Pass weeks as a prop
                          handleChangeSlider={handleChangeSlider} // Pass handleChangeSlider as a prop
                        />
                      </div>
                      {formValue.radio === "Upload" && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            flexDirection: "column",
                          }}
                        >
                          {/* Render buttons and text for "Upload" option */}
                          <p>
                            Upload images or documents with events or due dates
                          </p>
                          <p>
                            Smart AI will help you add them to your calendar
                          </p>
                          <div
                            className={`dotted-dash-area ${
                              isDragging ? "dragover" : ""
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleFileDrop}
                            style={{
                              marginTop: 10,
                              marginBottom: 10,
                              display: "flex", // Set display to flex
                              flexDirection: "column", // Align children vertically
                              alignItems: "center", // Center items horizontally
                              justifyContent: "center", // Center items vertically
                            }}
                          >
                            <img
                              src={upload}
                              alt="file upload icon"
                              style={{ height: "80px", marginBottom: 10 }} // Keep existing styles
                            />
                            <p>
                              Drag and drop a file here or click here to process
                              it
                            </p>
                            <Button
                              className="shadow__btn"
                              onClick={handleClick}
                              style={{ marginTop: 10, marginBottom: 10 }}
                            >
                              Process Document
                            </Button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              style={{ display: "none" }}
                              onChange={handleFileInputChange}
                            />
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleChange}
                          />
                        </div>
                      )}
                      {formValue.radio === "Update" && (
                        <div>
                          {/* Render buttons and text for "Update" option */}
                          <p>
                            Here your AI assistant can help you update your
                            calendar events
                          </p>
                          <p>Here's some of your upcoming events:</p>
                          <ul style={{ textAlign: "left" }}>
                            {updateCalendarEvents(2)}
                            {events?.map((event) => (
                              <li key={event.id}>
                                <Event eventObj={event} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {formValue.radio === "Create" && (
                        <div
                          style={{
                            position: "relative",
                            padding: "20px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                          }}
                        >
                          {/* Render buttons and text for "Create" option */}
                          <p>Review the events to add to your calendar here</p>
                          <br></br>
                          <form onSubmit={handleFormSubmit}>
                            <label>What do you want to build?</label> <br></br>
                            <input
                              type="text"
                              name="whatToBuild"
                              value={formData.whatToBuild}
                              onChange={handleFormChange}
                            />{" "}
                            <br></br>
                            <label>When do you want to be done?</label> <br></br>
                            <input
                              type="date"
                              name="deadline"
                              value={formData.deadline}
                              onChange={handleFormChange}
                            />{" "}
                            <br></br>
                            <label>
                              {" "}
                              How many hours a week do you want to allocate to
                              this?{" "}
                            </label>{" "}
                            <br></br>
                            <input
                              type="number"
                              name="hoursPerWeek"
                              value={formData.hoursPerWeek}
                              onChange={handleFormChange}
                            />{" "}
                            <br></br>
                            <br></br>
                            <Button type="submit">Create with AI</Button>
                          </form>
                          <Button>Advanced</Button>
                          <br></br>
                        </div>
                      )}
                      {isInvalidFile && (
                        <div
                          style={{
                            color: "#721c24",
                            backgroundColor: "#f8d7da",
                            borderColor: "#f5c6cb",
                            padding: "10px",
                            margin: "10px 0",
                            border: "1px solid transparent",
                            borderRadius: "4px",
                          }}
                        >
                          <p>
                            Invalid file type uploaded. Please upload only PDF,
                            TIFF, JPG, JPEG, PNG, or BMP files.
                          </p>
                        </div>
                      )}
  
                      {isLoadingFile && (
                        <div
                          aria-label="Orange and tan hamster running in a metal wheel"
                          role="img"
                          className="wheel-and-hamster"
                          style={{ paddingTop: "20px" }}
                        >
                          <div className="wheel"></div>
                          <div className="hamster">
                            <div className="hamster__body">
                              <div className="hamster__head">
                                <div className="hamster__ear"></div>
                                <div className="hamster__hat">
                                  {" "}
                                  <div className="circle"></div>
                                </div>
                                <div className="hamster__eye"></div>
                                <div className="hamster__nose"></div>
                              </div>
                              <div className="hamster__limb hamster__limb--fr"></div>
                              <div className="hamster__limb hamster__limb--fl"></div>
                              <div className="hamster__limb hamster__limb--br"></div>
                              <div className="hamster__limb hamster__limb--bl"></div>
                              <div className="hamster__tail"></div>
                            </div>
                          </div>
                          <div className="spoke"></div>
                        </div>
                      )}
  
                      {!isLoadingFile && isPromptShown && (
                        <div
                          style={{ marginLeft: "20px", marginTop: "15px" }}
                        >
                          <Prompt
                            eventList={prompts.events}
                            token={googleCalendarToken}
                            email={UserEmail}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
  
                <div
                  className="row"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div>
                    <img
                      src={logo}
                      alt="DateMinder Logo"
                      style={{
                        width: "100px",
                        marginRight: "120px",
                        marginLeft: "40px",
                      }}
                    />
                  </div>
  
                  <div
                    className="switch-container"
                    style={{ transform: "scale(0.4)", position: "relative" }}
                  >
                    <label className="theme-switch">
                      <input
                        type="checkbox"
                        className="theme-switch__checkbox"
                        onChange={handleChangeLightDarkMode}
                      />
                      <div className="theme-switch__container">
                        <div className="theme-switch__clouds"></div>
                        <div className="theme-switch__stars-container">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 144 55"
                            fill="none"
                          ></svg>
                        </div>
                        <div className="theme-switch__circle-container">
                          <div className="theme-switch__sun-moon-container">
                            <div
                              className={`theme-switch__moon${
                                isMoonShowing ? " visible" : ""
                              }`}
                            >
                              <div className="theme-switch__spot"></div>
                              <div className="theme-switch__spot"></div>
                              <div className="theme-switch__spot"></div>
                            </div>
                            <div
                              className={`theme-switch__sun${
                                isMoonShowing ? "" : " visible"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
  
                <div className="bubble bubble1"></div>
                <div className="bubble bubble2"></div>
                <div className="bubble bubble3"></div>
                <div className="bubble bubble4"></div>
                <div className="bubble bubble5"></div>
                <div className="bubble bubble6"></div>
                <div className="bubble bubble7"></div>
                <div className="bubble bubble8"></div>
                <div className="bubble bubble9"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
  export default Home;
  