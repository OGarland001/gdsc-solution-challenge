import { useEffect, useState, useRef } from "react";
import React from "react";
import "../App.css";
import { data } from "../data";
import { jwtDecode } from "jwt-decode";
import Event from "../components/Event";
import Prompt from "../components/Prompt";
import { Button } from "@material-tailwind/react";

const SCOPE = "https://www.googleapis.com/auth/calendar";
// Pass User
const Home = ({ user }) => {
  const [isShown, setIsShown] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokenClient, setTokenClient] = useState({});
  const [isPromptShown, setIsPromptShown] = useState(false);
  const fileInputRef = useRef(null); // Initialize fileInputRef
  const [formValue, setFormValue] = useState({});

  const script = document.createElement("script");

  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;

  document.head.appendChild(script);

  function toggle() {
    setIsShown((isShown) => !isShown);
  }
  function getCalendarEvents() {
    tokenClient.requestAccessToken();
  }

  const handleInputFieldChange = (e) => {
    setFormValue({ prompt: e.target.value });
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault()
    try {

      const eventDataToSend = events.map(event => {
        const eventData = {
            summary: event.summary,
            start: event.start
        };
        // Check if end property exists before including it
        if (event.end) {
            eventData.end = event.end;
        }
        return eventData;
      })

      const response = await fetch('/palmrequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({
          Context: JSON.stringify(eventDataToSend),
          Prompt: formValue.prompt,
        }),

      });
     
      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else {
        throw new Error('Failed to fetch predictions');
      }
    } catch (error) {
      console.log('Error:', error);
      console.log(events, formValue.prompt)

      // Handle error state
    }
  };

  const handleChange = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/process-document", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error processing document:", error);
    }
  };

  function getPromptEvents(data) {
    setIsPromptShown((isPromptShown) => !isPromptShown);
  }
  useEffect(() => {
    const google = window.google;

    function handleCallbackResponse(response) {
      console.log("Encoded JWT ID token " + response.credential);
      var userObject = jwtDecode(response.credential);

      console.log(userObject);

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

            //we now have access to a live token to use for any google API.
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

    //Access tokens
    //pull a users google calendar data.

    //tokenClient.requestAccessToken();
  }, []);

  const processDocument = async () => {
    try {
      const response = await fetch("/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(/* any data you want to send with the request */),
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error processing document:", error);
    }
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
    <div style={{ textAlign: "center", margin: "3rem" }}>
      <h1>Dear {user?.email}</h1>
      <p>You are viewing this page because you are logged in or you just signed up</p>
      <div>
        <button
          onClick={logout}
          style={{
            color: "red",
            border: "1px solid gray",
            backgroundColor: "white",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
      <div className="container justify-center">
        <div id="signInDiv"></div>
        {user && isShown && (
          <div id="UserDataDiv">
            <img src={user.picture} alt="google user img"></img>
            <br></br>
            <h3>{user.name}</h3>
            <Button className="btn bg-gradient-to-bl" onClick={getCalendarEvents}>
              Load Events
            </Button>
            <Button className="btn bg-gradient-to-bl" onClick={() => getPromptEvents(data)}>
              Prompt Load
            </Button>
            {isPromptShown && <Prompt eventList={data}></Prompt>}
            <Button className="btn bg-gradient-to-bl" onClick={handleClick}>
              Process Document
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleChange}
            />
            <ul>
              {events?.map((event) => (
                <li key={event.id} className="flex">
                  <Event description={event.summary} />
                </li>
              ))}
            </ul>

            <br></br>
            <form onSubmit={handleInputSubmit}>
              <div className="input-group">
                <label htmlFor="prompt">Enter your prompt</label>
                <br></br>
                <input
                  style={{
                    boxSizing: 'border-box',
                    border: '2px solid blue',
                  }}
                  box-sizing = 'border-box'
                  type="text"
                  id="prompt"
                  value={formValue.prompt}
                  onChange={handleInputFieldChange}
                />
              </div>
              <br></br>
              <Button className="btn bg-gradient-to-bl" type="submit">
                Ask
              </Button>
            </form>

          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
