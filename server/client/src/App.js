// // import { gapi } from "gapi-script";
// import { useEffect, useState } from "react";
// import "./App.css";
// import { data } from "./data";
// import { jwtDecode } from "jwt-decode";
// import Event from "./components/Event";
// import Prompt from "./components/Prompt";
// import { Button } from "@material-tailwind/react";
// const SCOPE = "https://www.googleapis.com/auth/calendar";

// function App() {
//   const [user, setUser] = useState({});
//   const [isShown, setIsShown] = useState(false);
//   const [events, setEvents] = useState([]);
//   const [tokenClient, setTokenClient] = useState({});
//   const [isPromptShown, setIsPromptShown] = useState(false);
//   // const apiKey = process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY;

//   const script = document.createElement("script");

//   script.src = "https://accounts.google.com/gsi/client";
//   script.async = true;
//   script.defer = true;

//   document.head.appendChild(script);

//   function toggle() {
//     setIsShown((isShown) => !isShown);
//   }

//   function handleSignOut(event) {
//     setUser({});
//     toggle();
//     document.getElementById("signInDiv").hidden = false;
//   }
//   function getCalendarEvents() {
//     tokenClient.requestAccessToken();
//   }

//   function getPromptEvents(data) {
//     setIsPromptShown((isPromptShown) => !isPromptShown);
//   }
//   useEffect(() => {
//     const google = window.google;

//     function handleCallbackResponse(response) {
//       console.log("Encoded JWT ID token " + response.credential);
//       var userObject = jwtDecode(response.credential);

//       console.log(userObject);

//       setUser(userObject);
//       const userEmail = userObject.email;

//       setTokenClient(
//         google.accounts.oauth2.initTokenClient({
//           client_id: process.env.REACT_APP_CLIENT_ID,
//           scope: SCOPE,
//           callback: (tokenResponse) => {
//             console.log(tokenResponse);
//             var startDate = new Date();

//             var endDate = new Date();

//             endDate.setDate(endDate.getDate() + 14);

//             startDate = startDate.toISOString();
//             endDate = endDate.toISOString();

//             //we now have access to a live token to use for any google API.
//             if (tokenResponse && tokenResponse.access_token) {
//               fetch(
//                 `https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events?timeMin=${startDate}&timeMax=${endDate}`,
//                 {
//                   method: "GET",
//                   headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${tokenResponse.access_token}`,
//                   },
//                 }
//               )
//                 .then((response) => response.json())
//                 .then((data) => {
//                   console.log(data);
//                   setEvents(data.items);
//                 });
//             }
//           },
//         })
//       );

//       toggle();

//       document.getElementById("signInDiv").hidden = true;
//     }
//     google.accounts.id.initialize({
//       client_id: process.env.REACT_APP_CLIENT_ID,
//       callback: handleCallbackResponse,
//     });

//     google.accounts.id.renderButton(document.getElementById("signInDiv"), {
//       theme: "outline",
//       size: "large",
//     });

//     //Access tokens
//     //pull a users google calendar data.

//     //tokenClient.requestAccessToken();
//   }, []);
//   //if we have no user: signin button
//   // if we have a user:show the logout button
//   return (
//     <div className="container justify-center">
//       <div id="signInDiv"></div>
//       {user && isShown && (
//         <div id="UserDataDiv">
//           <img src={user.picture} alt="google user img"></img>
//           <br></br>
//           <h3>{user.name}</h3>
//           <Button
//             className="btn bg-gradient-to-bl"
//             onClick={(e) => handleSignOut(e)}
//           >
//             Sign Out
//           </Button>
//           <Button
//             className="btn bg-gradient-to-bl"
//             type="submit"
//             onClick={getCalendarEvents}
//           >
//             Load Events
//           </Button>
//           <Button
//             className="btn bg-gradient-to-bl"
//             onClick={() => getPromptEvents(data)}
//           >
//             Prompt Load
//           </Button>
//           {isPromptShown && <Prompt eventList={data}></Prompt>}

//           <ul>
//             {events?.map((event) => (
//               <li key={event.id} className="flex">
//                 <Event description={event.summary} />
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

import React, { useEffect } from "react";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Home, Landing, Login, Signup } from "./screens";

const App = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const theUser = localStorage.getItem("user");

    if (theUser && !theUser.includes("undefined")) {
      setUser(JSON.parse(theUser));
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user?.email ? <Navigate to="/home" /> : <Landing />}
        />
        <Route
          path="/signup"
          element={user?.email ? <Navigate to="/home" /> : <Signup />}
        />
        <Route
          path="/login"
          element={user?.email ? <Navigate to="/home" /> : <Login />}
        />
        <Route
          path="/home"
          element={user?.email ? <Home user={user} /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
