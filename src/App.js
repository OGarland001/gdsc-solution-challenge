import { useEffect, useState } from "react";
import "./index.css";
import { jwtDecode } from "jwt-decode";

function App() {
  const [user, setUser] = useState({});
  const [isShown, setIsShown] = useState(false);

  function toggle() {
    setIsShown((isShown) => !isShown);
  }

  function handleCallbackResponse(response) {
    console.log("Encoded JWT ID token " + response.credential);
    var userObject = jwtDecode(response.credential);

    console.log(userObject);

    setUser(userObject);
    toggle();
    document.getElementById("signInDiv").hidden = true;
  }

  function handleSignOut(event) {
    setUser({});
    toggle();
    document.getElementById("signInDiv").hidden = false;
  }
  useEffect(() => {
    /*global google */
    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_CLIENT_ID,
      callback: handleCallbackResponse,
    });

    google.accounts.id.renderButton(document.getElementById("signInDiv"), {
      theme: "outline",
      size: "large",
    });
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
        </div>
      )}
    </div>
  );
}

export default App;
