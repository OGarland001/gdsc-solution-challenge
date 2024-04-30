import { Button } from "@material-tailwind/react";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import "./promptStyle.css";

function Prompt({ eventList, token, email }) {
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [startTimes, setStartTimes] = useState({});
  const [endTimes, setEndTimes] = useState({});
  const [EventTitles, setEventTitles] = useState({});
  const [EventDescriptions, setEventDescriptions] = useState({});
  const [revertIdList, setRevertIdList] = useState([]);
  const [eventsAdded, setEventsAdded] = useState(false); // New state to track if events are added
  const [isMessageShowing, setIsMessageShowing] = useState(false);
  const [message, setMessage] = useState("");

  function generateUniqueEventId() {
    const uuid = uuidv4().replace(/-/g, ""); // Generate a UUID and remove dashes
    let randomString = "";

    // Generate a random string containing only lowercase letters between 'a' and 'v'
    for (let i = 0; i < 6; i++) {
      randomString += String.fromCharCode(Math.floor(Math.random() * 22) + 97); // ASCII code for 'a' is 97
    }

    const eventId = uuid.slice(0, 20) + randomString; // Combine UUID and random string

    // Ensure eventId length is between 5 and 1024 characters
    return eventId.substring(0, Math.min(1024, Math.max(5, eventId.length)));
  }

  useEffect(() => {
    const initialStartTimes = {};
    const initialEndTimes = {};
    const initialTitles = {};
    const initialDescriptions = {};

    // Initialize startTimes and endTimes with data from eventList
    eventList.forEach((item) => {
      let startTime = formatDate(item.startTime);
      let endTime = formatDate(item.endTime);
      let currentDate = new Date();

      // Check if start time is invalid, if so, set it to current time
      if (isNaN(startTime.getTime()) || startTime < currentDate) {
        startTime = new Date();
      }

      // Check if end time is invalid, if so, set it to current time
      if (isNaN(endTime.getTime()) || endTime < currentDate) {
        endTime = new Date();
      }

      initialStartTimes[item.id] = startTime;
      initialEndTimes[item.id] = endTime;
      initialTitles[item.id] = item.summary;
      initialDescriptions[item.id] = item.description;
    });

    setStartTimes(initialStartTimes);
    setEndTimes(initialEndTimes);
    setEventTitles(initialTitles);
    setEventDescriptions(initialDescriptions);
  }, [eventList]);

  const toggleEventSelection = (eventId) => {
    setSelectedEvents((prevSelectedEvents) => {
      if (prevSelectedEvents.includes(eventId)) {
        return prevSelectedEvents.filter((id) => id !== eventId);
      } else {
        return [...prevSelectedEvents, eventId];
      }
    });
  };

  const handleStartTimeChange = (eventId, date) => {
    setStartTimes((prevStartTimes) => ({
      ...prevStartTimes,
      [eventId]: date,
    }));
  };

  const handleEndTimeChange = (eventId, date) => {
    setEndTimes((prevEndTimes) => ({
      ...prevEndTimes,
      [eventId]: date,
    }));
  };

  const handleTitleChange = (itemId, value) => {
    setEventTitles((prevEventTitles) => ({
      ...prevEventTitles,
      [itemId]: value,
    }));
  };

  const handleDescChange = (itemId, value) => {
    setEventDescriptions((prevEventTitles) => ({
      ...prevEventTitles,
      [itemId]: value,
    }));
  };

  const formatDate = (dateTimeString) => {
    return new Date(dateTimeString);
  };

  const handleAddToCalendar = () => {
    const selectedEventDetails = selectedEvents.map((eventId) => {
      const event = eventList.find((item) => item.id === eventId);
      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      const startTime = formatDateTime(startTimes[event.id]);
      const endTime = formatDateTime(endTimes[event.id]);
      return {
        id: event.id,
        title: EventTitles[event.id], // Use updated title from state
        description: EventDescriptions[event.id], // Use updated description from state
        startTime: startTime,
        endTime: endTime,
      };
    });
    console.log("Selected Events:", selectedEventDetails);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newRevertIdList = [];
    selectedEventDetails.forEach((event) => {
      var eventId = generateUniqueEventId();
      newRevertIdList.push(eventId);
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${email}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: eventId,
            start: { dateTime: event.startTime, timeZone: timeZone },
            end: { dateTime: event.endTime, timeZone: timeZone },
            description: event.description,
            summary: event.title,
          }),
        }
      )
        .then((response) => {
          // Check for successful response
          if (response.ok) {
            console.log("Event created successfully");
          } else {
            console.error("Failed to create event:", response.statusText);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
    if(selectedEvents.length == 0){
      setMessage("No events selected");
    }
    else{
      setMessage(`${selectedEvents.length} Events Added`);
    }
    setIsMessageShowing(true);
    setRevertIdList(newRevertIdList);
  };

  // Function to revert events
  const revertEvents = () => {
    // Implement event reverting logic here
    console.log("Reverting events...");

    revertIdList.forEach((id) => {
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${email}/events/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
        .then((response) => {
          // Check for successful response
          if (response.ok) {
            console.log("Event Deleted successfully");
          } else {
            console.error("Failed to Delete event:", response.statusText);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });

    console.log(revertIdList);
    setMessage("Events Removed");
    setIsMessageShowing(true);
  };
  return (
    <div>
      {EventTitles &&
        EventDescriptions &&
        eventList.map((item) => (
          <div
            key={item.id}
            // className="border p-4 mb-4 flex flex-wrap items-start"
            className="eventBox"
          >
            <div className="flex-grow">
              <div class="flex items-center">
                <label class="checkbox-container">
                  <input
                    class="custom-checkbox"
                    checked={selectedEvents.includes(item.id)}
                    onChange={() => toggleEventSelection(item.id)}
                    id={`event-checkbox-${item.id}`}
                    type="checkbox"
                  />
                  <span class="checkmark"></span>
                </label>
                <div style={{ marginLeft: "5px" }}>
                  <label htmlFor={`event-checkbox-${item.id}`} className="ml-2">
                    Keep
                  </label>
                </div>
              </div>
              <label className="block mb-2 text-sm font-medium text-white">
                Title
              </label>
              <input
                type="text"
                className="mb-2 w-full border border-gray-300 p-2 rounded-md text-black"
                value={EventTitles[item.id] || ""}
                onChange={(e) => handleTitleChange(item.id, e.target.value)}
              />
              <label className="block mb-2 text-sm font-medium text-white">
                Description
              </label>
              <input
                type="text"
                className="mb-2 w-full border border-gray-300 p-2 rounded-md text-black"
                value={EventDescriptions[item.id] || ""}
                onChange={(e) => handleDescChange(item.id, e.target.value)}
              />
              <label className="block mb-2 text-sm font-medium text-white">
                Start Time
              </label>
              <DatePicker
                selected={startTimes[item.id]}
                onChange={(date) => handleStartTimeChange(item.id, date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                className="mb-2 w-full border border-gray-300 p-2 rounded-md text-black"
              />
              <label className="block mb-2 text-sm font-medium text-white">
                End Time
              </label>
              <DatePicker
                selected={endTimes[item.id]}
                onChange={(date) => handleEndTimeChange(item.id, date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                className="mb-2 w-full border border-gray-300 p-2 rounded-md text-black"
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "3px",
              }}
            ></div>
          </div>
        ))
      }
      <div>
        {/* Your existing event list rendering */}
        <div>
          <Button
            onClick={handleAddToCalendar}
            className="text-white bg-[#008cff] hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Add to Calendar
          </Button>
          <Button
            onClick={revertEvents}
            className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
          >
            Revert Changes
          </Button>
        </div>
        { isMessageShowing &&(
          <p>{message}</p>
        )}
      </div>
    </div>
  );
}

export default Prompt;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////