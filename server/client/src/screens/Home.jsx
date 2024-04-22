import "../App.css";
import { data } from "../data";
import { Button } from "@material-tailwind/react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState, useRef } from "react";
import React from "react";
import Event from "../components/Event";
import Prompt from "../components/Prompt";
import logo from "./images/logo.png";
import promptWizard from "./images/PromptWizard.png";
const SCOPE = "https://www.googleapis.com/auth/calendar";

const Home = () => {
  const [isShown, setIsShown] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokenClient, setTokenClient] = useState({});
  const [isPromptShown, setIsPromptShown] = useState(false);
  const fileInputRef = useRef(null);
  const [formValue, setFormValue] = useState({});
  const [predictionValue, setPrediction] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state

  useEffect(() => {
    const google = window.google;

    function handleCallbackResponse(response) {
      console.log("Encoded JWT ID token " + response.credential);
      var userObject = jwtDecode(response.credential);

      console.log(userObject);

      setUser(userObject);

      const userEmail = userObject.email;

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
                `https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events?timeMin=${startDate}&timeMax=${endDate}`,
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
  }, []);

  const toggle = () => {
    setIsShown((isShown) => !isShown);
  };

  const getCalendarEvents = () => {
    tokenClient.requestAccessToken();
  };

  const handleInputFieldChange = (e) => {
    setFormValue({ prompt: e.target.value });
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

      const response = await fetch("/palmrequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Context: JSON.stringify(eventDataToSend),
          Prompt: formValue.prompt,
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

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "1rem",
          width: "100%",
          top: 0,
          left: 0,
        }}
      >
        <img
          src={logo}
          alt="DateMinder Logo"
          style={{ marginRight: "1rem", height: "100px" }}
        />
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
          <div id="UserDataDiv" style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "center",
                paddingTop: 15,
                margin: "auto",
                paddingBottom: 15,
              }}
            >
              <img
                src={user.picture}
                alt="google user img"
                className="justify-center"
                style={{
                  marginRight: "0.5rem",
                  height: "80px",
                  width: "80px",
                  borderRadius: "50%",
                }}
              />
              <button
                onClick={logout}
                style={{
                  color: "white",
                  backgroundColor: "black",
                  cursor: "pointer",
                  padding: 15,
                  borderRadius: "8px",
                  height: "40px",
                  marginTop: "18px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} // Lighter color on hover
                onMouseOut={(e) => (e.target.style.backgroundColor = "black")} // Restore original
              >
                Logout {user.name}
              </button>
            </div>


            <Button
              className="btn bg-gradient-to-bl"
              onClick={getCalendarEvents}
            >
              Authorize Google Calendar
            </Button>
            <Button
              className="btn bg-gradient-to-bl"
              onClick={() => getPromptEvents(data)}
            >
              Prompt Load
            </Button>
            <Button className="btn bg-gradient-to-bl" onClick={handleClick}>
              Process Document
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleChange}
            />
            {isPromptShown && <Prompt eventList={data}></Prompt>}
            <ul style={{ textAlign: "left" }}>
              {events?.map((event) => (
                <li key={event.id}>
                  <Event description={event.summary} />
                </li>
              ))}
            </ul>
            <h2>Document Reading Result:</h2>
            <div style={{ paddingBottom: 20, position: "relative" }}>
              <textarea
                value={formValue.documentContent}
                onChange={(e) =>
                  setFormValue({ documentContent: e.target.value })
                }
                style={{
                  textAlign: "center",
                  width: "600px",
                  height: "200px", // Adjust the height as needed
                  resize: "both", // Allow the user to resize the textarea
                  overflowWrap: "break-word", // Wrap text to next line
                  borderBlockColor: "black",
                  borderWidth: "1px",
                }}
              />
              {isLoading && ( // Show loading spinner while isLoading is true
                <div className="loader" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </div>
              )}
            </div>
            <div className="container">
              {/* Blue Box with Image and Text Fields */}
              <div className="blue-box">
                <img
                  src={promptWizard}
                  alt="PromptWizard"
                  style={{ height: "200px", alignSelf: "center"}}
                />
                <form onSubmit={handleInputSubmit} style={{ textAlign: "center" }}>
                  <div className="input-group">
                    <label htmlFor="prompt">Enter your prompt</label>
                    <br />
                    <textarea
                      style={{
                        boxSizing: "border-box",
                        border: "2px solid blue",
                        width: "50%",
                        resize: "both",
                      }}
                      id="prompt"
                      value={formValue.prompt}
                      onChange={handleInputFieldChange}
                    />
                  </div>
                  <br />
                  <Button className="shadow__btn" type="submit">
                    Ask
                  </Button>
                </form>
                <div style={{ textAlign: "center" }}>
                  <h2>Prediction Result:</h2>
                  <p>{predictionValue}</p>
                </div>
                {/* Bubbles */}
                <div className="bubble bubble1"></div>
                <div className="bubble bubble2"></div>
                <div className="bubble bubble3"></div>
                <div className="bubble bubble4"></div>
                <div className="bubble bubble5"></div>
                <div className="bubble bubble6"></div>
                <div className="bubble bubble7"></div>
                <div className="bubble bubble8"></div>
                <div className="bubble bubble9"></div>
                {/* Add more bubble divs and adjust positions as needed */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
