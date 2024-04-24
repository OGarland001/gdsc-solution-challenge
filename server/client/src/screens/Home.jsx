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
const SCOPE = "https://www.googleapis.com/auth/calendar";

const Home = () => {
  const [isShown, setIsShown] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokenClient, setTokenClient] = useState({});
  const [googleCalendarToken, setCalendarToken] = useState({});
  const [isPromptShown, setIsPromptShown] = useState(false);
  const fileInputRef = useRef(null);
  const [formValue, setFormValue] = useState({ radio: "Ask" }); // Updated formValue state with radio property
  const [predictionValue, setPrediction] = useState([]);
  const [user, setUser] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [isDragging] = useState(false); // State variable to track dragging
  const [UserEmail, setUserEmail] = useState("");
  const [isAuthorizedWithCalendar, setIsAuthorized] = useState(false);

  useEffect(() => {
    const google = window.google;

    function handleCallbackResponse(response) {
      console.log("Encoded JWT ID token " + response.credential);
      var userObject = jwtDecode(response.credential);

      console.log(userObject);

      setUser(userObject);

      setUserEmail(userObject.email);

      setTokenClient(
        google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_CLIENT_ID,
          scope: SCOPE,
          callback: (tokenResponse) => {
            console.log(tokenResponse);
            var startDate = new Date();

            var endDate = new Date();

            endDate.setDate(endDate.getDate() + 14);

            startDate = startDate.toISOString();
            endDate = endDate.toISOString();

            if (tokenResponse && tokenResponse.access_token) {
              fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${userObject.email}/events?timeMin=${startDate}&timeMax=${endDate}`,
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
                  console.log(data);
                  setEvents(data.items);
                  setCalendarToken(tokenResponse.access_token);
                  setIsAuthorized(!isAuthorizedWithCalendar);
                });
            }
          },
        })
      );

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
  }, [UserEmail, googleCalendarToken, isAuthorizedWithCalendar]);

  const toggle = () => {
    setIsShown((isShown) => !isShown);
  };

  const getCalendarEvents = () => {
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

      const response = await fetch("/palmrequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Context: JSON.stringify(eventDataToSend),
          Prompt: formValue.prompt,
          CurrentDateTime: currentDateTimeString,
          Timezone: userTimezone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Received data: ", data);
        setPrediction(data.prediction);
      } else {
        throw new Error("Failed to fetch predictions");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleChange = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setIsLoading(true); // Set isLoading to true while waiting for response
    try {
      const response = await fetch("/process-document", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("In front end:" + data.message);
      setFormValue({ documentContent: data.message }); // Set the documentContent in formValue
      setIsLoading(false); // Set isLoading to false after getting response

      //make call to the palmAI and then console log the events pulled from the data.
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
        const data = await palmResponse.json();
        var dataStr = data.prediction.replace("```", "");
        var newdataStr = dataStr.replace("```", "");
        newdataStr = newdataStr.slice(5);
        console.log("STR data: ", newdataStr);
        console.log("Received data: ", JSON.parse(newdataStr));
        setPrompts(JSON.parse(newdataStr));
        getPromptEvents();
      } else {
        throw new Error("Failed to fetch predictions");
      }
    } catch (error) {
      console.error("Error processing document:", error);
      setIsLoading(false); // Set isLoading to false in case of error
    }
  };

  const getPromptEvents = (data) => {
    setIsPromptShown((isPromptShown) => !isPromptShown);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const logout = () => {
    localStorage.removeItem("user");
    toggle();
    document.getElementById("signInDiv").hidden = false;
    window.location = "/";
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleChange({ target: { files } }); // Pass a fake event object containing the dropped files to handleChange
  };

  const handleFileInputChange = (e) => {
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

  const [isMoonShowing, setIsMoonShowing] = useState(false);

  const handleChangeLightDarkMode = () => {
    setIsMoonShowing(!isMoonShowing);
    // Toggle background color based on the state of isMoonShowing
    document.body.style.backgroundColor = isMoonShowing ? "white" : "#222222";
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "1rem",
          width: "100%",
          display: "flex",
          alignItems: "center", // Align items vertically
          justifyContent: "space-between", // Distribute space between elements
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={logo}
            alt="DateMinder Logo"
            style={{ marginRight: "1rem", height: "100px" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "fit-content",
            transform: "scale(0.5)",
          }}
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
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={user.picture}
                  alt="google user img"
                  className="justify-center"
                  style={{
                    height: "100px",
                    width: "100px",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <Button
                className="btn bg-gradient-to-bl shadowBtn"
                onClick={logout}
                style={{
                  width: 200,
                  height: 45,
                  marginLeft: 10,
                  marginTop: 50,
                }}
              >
                Logout {user.name}
              </Button>
            </div>

            {/* Prompt Wizzard */}
            <div
              className="container"
              style={{ marginTop: 15, marginBottom: 15 }}
            >
              <div className="blue-box">
                <img
                  src={promptWizard}
                  alt="PromptWizard"
                  style={{ height: "200px", alignSelf: "center" }}
                />

                <label htmlFor="prompt">Prompt Wizzard</label>
                {user && isShown && !isAuthorizedWithCalendar && (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Button
                      className="shadow__btn"
                      onClick={getCalendarEvents}
                      style={{
                        width: 200,
                        height: 65,
                        marginRight: 10,
                        marginTop: 50,
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

                    {formValue.radio === "Ask" && (
                      <div>
                        {/* Render buttons and text for "Ask" option */}
                        <p>Ask your assistant about your calendar</p>
                        <form
                          onSubmit={handleInputSubmit}
                          style={{
                            textAlign: "center",
                            marginTop: 10,
                            marginBottom: 20,
                          }}
                        >
                          <textarea
                            placeholder="Ask your calendar..."
                            class="input"
                            name="text"
                            type="text"
                            id="prompt"
                            value={formValue.prompt}
                            onChange={handleInputFieldChange}
                          ></textarea>
                          <br />
                          <Button className="shadow__btn" type="submit">
                            Ask
                          </Button>
                        </form>
                        <div style={{ textAlign: "center", top: 10 }}>
                          <h2>AI Response:</h2>
                          <div
                            style={{
                              paddingBottom: 20,
                              position: "relative",
                              marginTop: 10,
                            }}
                          >
                            <textarea
                              class="textFeildResponse"
                              name="text"
                              type="text"
                              value={predictionValue}
                              onChange={(e) =>
                                setFormValue({
                                  ...formValue,
                                  documentContent: e.target.value,
                                })
                              }
                              disabled
                            />
                            {isLoading && ( // Show loading spinner while isLoading is true
                              <div
                                className="loader"
                                style={{
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
                          </div>
                        </div>
                      </div>
                    )}
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
                          Upload images or documents with events or duedates
                        </p>
                        <p>smart AI will help you add them to your calender</p>
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
                            style={{ height: "100px", marginBottom: 10 }} // Keep existing styles
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

                        <h2>Document Reading Result:</h2>
                        <div
                          style={{ paddingBottom: 20, position: "relative" }}
                        >
                          <textarea
                            class="textFeild"
                            name="text"
                            type="text"
                            value={formValue.documentContent}
                            onChange={(e) =>
                              setFormValue({
                                ...formValue,
                                documentContent: e.target.value,
                              })
                            }
                          />
                          {isLoading && ( // Show loading spinner while isLoading is true
                            <div
                              className="loader"
                              style={{
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
                        </div>
                      </div>
                    )}
                    {formValue.radio === "Update" && (
                      <div>
                        {/* Render buttons and text for "Update" option */}
                        <button>Update Button</button>
                        <p>Update Text</p>
                      </div>
                    )}
                    {formValue.radio === "Create" && (
                      <div>
                        {/* Render buttons and text for "Create" option */}
                        <button>Create Button</button>
                        <p>Create Text</p>

                        <Button
                          className="btn bg-gradient-to-bl"
                          onClick={() => getPromptEvents(data)}
                        >
                          Prompt Load
                        </Button>

                        {isPromptShown && (
                          <Prompt
                            eventList={prompts.events}
                            token={googleCalendarToken}
                            email={UserEmail}
                          ></Prompt>
                        )}
                        <ul style={{ textAlign: "left" }}>
                          {events?.map((event) => (
                            <li key={event.id}>
                              <Event description={event.summary} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

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
