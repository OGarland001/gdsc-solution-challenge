import { gapi } from "gapi-script";
import { useEffect, useState } from "react";
import "./index.css";
import { jwtDecode } from "jwt-decode";
import Event from "./components/Event";
const SCOPE = "https://www.googleapis.com/auth/calendar";

function App() {
  const [user, setUser] = useState({});
  const [isShown, setIsShown] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokenClient, setTokenClient] = useState({});
  const apiKey = process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY;

  function toggle() {
    setIsShown((isShown) => !isShown);
  }

  // const getEvents = (calendarID, apiKey) => {
  //   function initiate() {
  //     gapi.client
  //       .init({
  //         apiKey: apiKey,
  //       })
  //       .then(function () {
  //         return gapi.client.request({
  //           path: `https://www.googleapis.com/calendar/v3/calendars/awesomecreeper16@gmail.com/events`,
  //         });
  //       })
  //       .then(
  //         (response) => {
  //           let events = response.result.items;
  //           setEvents(events);
  //         },
  //         function (err) {
  //           return [false, err];
  //         }
  //       );
  //   }
  //   gapi.load("client", initiate);
  // };

  function handleCallbackResponse(response) {
    console.log("Encoded JWT ID token " + response.credential);
    var userObject = jwtDecode(response.credential);

    console.log(userObject);

    setUser(userObject);

    // const calendarID = userObject.email;
    // const events = getEvents(calendarID, apiKey);
    // setEvents(events);
    const userEmail = userObject.email;

    setTokenClient(
      google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_CLIENT_ID,
        scope: SCOPE,
        callback: (tokenResponse) => {
          console.log(tokenResponse);

          //we now have access to a live token to use for any google API.
          if (tokenResponse && tokenResponse.access_token) {
            fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events`,
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

  function handleSignOut(event) {
    setUser({});
    toggle();
    document.getElementById("signInDiv").hidden = false;
  }
  function getCalendarEvents() {
    tokenClient.requestAccessToken();
  }
  useEffect(() => {
    /*global google */
    const google = window.google;
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
  //if we have no user: signin button
  // if we have a user:show the logout button
  return (
    <div className="App">
      <div id="signInDiv"></div>
      {user && isShown && (
        <div id="UserDataDiv">
          <img src={user.picture}></img>
          <h3>{user.name}</h3>
          <button onClick={(e) => handleSignOut(e)}>Sign Out</button>
          <input
            type="submit"
            onClick={getCalendarEvents}
            value="load Events"
          />
          <ul>
            {events?.map((event) => (
              <li key={event.id} className="flex justify-center">
                <Event description={event.summary} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
