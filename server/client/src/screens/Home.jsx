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

  const handleChangeLightDarkMode = () => {
    setIsMoonShowing(!isMoonShowing);
    // Toggle background color based on the state of isMoonShowing
    document.body.style.backgroundColor = isMoonShowing ? "white" : "#222222";
  };


  const setCookie = (name, value, days) => {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  };
  
  const handleTokenClientResponse = (tokenResponse, user) => {
    console.log("Handle token client response:", tokenResponse);
    console.log("User object:", user);
    var startDate = new Date();
    var endDate = new Date();
  
    endDate.setDate(endDate.getDate() + 14);
  
    startDate = startDate.toISOString();
    endDate = endDate.toISOString();
  
    if (tokenResponse && tokenResponse.access_token) {
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${user.email}/events?timeMin=${startDate}&timeMax=${endDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Calendar events data:", data);
          setEvents(data.items);
          setCalendarToken(tokenResponse.access_token);
          setIsAuthorized(true);
          setIsShown(true);
          setCookie(
            "DateMinderTokens",
            JSON.stringify({
              calendarToken: tokenResponse.access_token,
              authToken: tokenResponse,
              user: user,
            }),
            30
          );
        })
        .catch((error) => {
          console.error("Error fetching calendar events:", error);
        });
    }
  };
  
  useEffect(() => {
    const google = window.google;
    const cookieValues = getCookie();
    
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
      if (typeof userObject === 'object') {
        for (let key in userObject) {
          const email = findEmail(userObject[key]);
          if (email) return email;
        }
      }
      // Email not found
      return null;
    };
  
    if (cookieValues) {
      console.log("Existing cookie values:", cookieValues);
  
      setUser(cookieValues.user);
  
      const userEmail = findEmail(cookieValues.user);
  
      if (userEmail) {
        setUserEmail(userEmail);
      }
  
      setCalendarToken(cookieValues.calendarToken);
      const response = cookieValues.authToken

      var startDate = new Date();
      var endDate = new Date();
  
      endDate.setDate(endDate.getDate() + 14);
  
      startDate = startDate.toISOString();
      endDate = endDate.toISOString();
  
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events?timeMin=${startDate}&timeMax=${endDate}`,
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
          setEvents(data.items);
        })
        .catch((error) => {
          console.error("Error fetching calendar events:", error);
        });

      setIsAuthorized(true);

      toggle();

      console.log("user: ", user);
      console.log("is shown ", isShown);
      console.log("is authorized with calendar", isAuthorizedWithCalendar)
    


    } else {
      setIsAuthorized(false);
      function handleCallbackResponse(response) {
        console.log("Encoded JWT ID token " + response.credential);
        var userObject = jwtDecode(response.credential);
  
        console.log("Decoded user object:", userObject);
  
        setUser(userObject);
        setUserEmail(userObject.email);
  
        setTokenClient(google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_CLIENT_ID,
          scope: SCOPE,
          callback: (tokenResponse) => handleTokenClientResponse(tokenResponse, userObject),
        }));
  
        toggle();
        document.getElementById("signInDiv").hidden = true;
      }
  
      google.accounts.id.initialize({
        client_id: process.env.REACT_APP_CLIENT_ID,
        callback: handleCallbackResponse,
      });
  
      google.accounts.id.renderButton(document.getElementById("signInDiv"), {
        theme: "outline",
        size: "large",
      });
    }
  }, []);
  
  const toggle = () => {
    setIsShown((isShown) => !isShown);
  };
  

  const getCookie = () => {
    let name = "DateMinderTokens" + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');
  
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        let cookieValue = cookie.substring(name.length, cookie.length);
        // Parse the serialized values back into their original format
        let parsedValues = JSON.parse(cookieValue);
        return {
          calendarToken: parsedValues.calendarToken,
          authToken: parsedValues.authToken,
          user: parsedValues.user 
        };
      }
    }
    return null;
  };



  const deleteCookie = () => {
    document.cookie = "DateMinderTokens" + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentDateTimeString = new Date().toLocaleString();
      console.log("Current Date and Time (String):", currentDateTimeString);

      setIsLoading(true);
      setAiResponse("");

      const response = await fetch("/palmrequest", {
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

  const handleChange = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setFormValue({ ...formValue, radio: "Create" });
    setIsLoadingFile(true); // Set isLoading to true while waiting for response
    try {
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
  
      // Make call to the palmAI and then console log the events pulled from the data.
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentDateTimeString = new Date().toLocaleString();
      const palmResponse = await fetch("/palmrequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Context: "",
          Prompt: data.message,
          CurrentDateTime: currentDateTimeString,
          Timezone: userTimezone,
          State: "document",
        }),
      });
  
      if (palmResponse.ok) {
        const palmData = await palmResponse.json();
        var dataStr = palmData.prediction.replace("```", "");
        var newdataStr = dataStr.replace("```", "");
        newdataStr = newdataStr.slice(5);
        console.log("STR data: ", newdataStr);
        console.log("Received data: ", JSON.parse(newdataStr));
        setPrompts(JSON.parse(newdataStr));
        setIsLoadingFile(false);
        getPromptEvents();
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
    setIsPromptShown((isPromptShown) => !isPromptShown);
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

  // const setCookie = (calendarToken, authToken) => {
  //   const date = new Date();
  //   const numberofDays = 14;
  //   const cookieName = "DateMinderTokens";
  //   date.setTime(date.getTime() + (numberofDays*24*60*60*1000));
  //   let expires = "expires="+ date.toUTCString();
  //   let serializedValues = JSON.stringify({ calendarToken: calendarToken, authToken: authToken });
  //   document.cookie = cookieName + "=" + serializedValues + ";" + expires + ";path=/";
  // };

  // const getCookie = () => {
  //   let name = "DateMinderTokens" + "=";
  //   let decodedCookie = decodeURIComponent(document.cookie);
  //   let cookieArray = decodedCookie.split(';');
  
  //   for (let i = 0; i < cookieArray.length; i++) {
  //     let cookie = cookieArray[i].trim();
  //     if (cookie.indexOf(name) === 0) {
  //       let cookieValue = cookie.substring(name.length, cookie.length);
  //       // Parse the serialized values back into their original format
  //       let parsedValues = JSON.parse(cookieValue);
  //       return {
  //         calendarToken: parsedValues.calendarToken,
  //         authToken: parsedValues.authToken
  //       };
  //     }
  //   }
  //   return null;
  // };

  // const checkCookie = () => {
  //   const cookieValues = getCookie("DateMinderTokens");
  //   if (cookieValues !== null) {
  //     console.log("Cookie exists");
  //     console.log("Calendar Token:", cookieValues.calendarToken);
  //     console.log("Auth Token:", cookieValues.authToken);
  //   } else {
  //     console.log("Cookie does not exist");
  //   }
  // };

  // const deleteCookie = () => {
  //   document.cookie = "DateMinderTokens" + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // };

  return (
    <div style={{ textAlign: "center" }}> 
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
                        onClick={getCalendarEvents}
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
                  <div class="scroll-content">
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
                          <p>Upload images or documents with events or duedates</p>
                          <p>smart AI will help you add them to your calendar</p>
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
                          <p>Drag and drop a file here or click here to process it</p>
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
                          <p>
                            Heres some of your upcomming events:
                          </p>
                          <ul style={{ textAlign: "left" }}>
                            {events?.map((event) => (
                              <li key={event.id}>
                                <Event eventObj={event} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {formValue.radio === "Create" && (
                        <div>
                          {/* Render buttons and text for "Create" option */}
                          <p>Review the events to add to the calendar here</p>

                          {isLoadingFile && (
                              <div
                                className="loader"
                                style={{
                                  marginTop: "25px",
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              >
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                              </div>
                          )}

                          {!isLoadingFile && isPromptShown && (
                            <Prompt
                              eventList={prompts.events}
                              token={googleCalendarToken}
                              email={UserEmail}
                            ></Prompt>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div
                  class="row"
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
                    class="switch-container"
                    style={{ transform: "scale(0.4)", position: "relative" }}
                  >
                    <label class="theme-switch">
                      <input
                        type="checkbox"
                        class="theme-switch__checkbox"
                        onChange={handleChangeLightDarkMode}
                      />
                      <div class="theme-switch__container">
                        <div class="theme-switch__clouds"></div>
                        <div class="theme-switch__stars-container">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 144 55"
                            fill="none"
                          ></svg>
                        </div>
                        <div class="theme-switch__circle-container">
                          <div class="theme-switch__sun-moon-container">
                            <div
                              class={`theme-switch__moon${
                                isMoonShowing ? " visible" : ""
                              }`}
                            >
                              <div class="theme-switch__spot"></div>
                              <div class="theme-switch__spot"></div>
                              <div class="theme-switch__spot"></div>
                            </div>
                            <div
                              class={`theme-switch__sun${
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
