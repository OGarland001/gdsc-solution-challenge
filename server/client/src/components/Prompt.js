import { Button } from "@material-tailwind/react";
import React, {
  useState,
  useLayoutEffect,
  useRef,
  useEffect,
  useCallback,
} from "react";
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
  const [eventsAdded, setEventsAdded] = useState(false);
  const [isTextResized, setIsTextResized] = useState(false);
  const [isMessageShowing, setIsMessageShowing] = useState(false);
  const [message, setMessage] = useState("");

  const titleRefs = useRef({});
  const descRefs = useRef({});

  const handleResize = useCallback((ref) => {
    console.log("handle Resize function");

    if (eventList && eventList.length > 0 && ref) {
      // Check eventList and ref.current
      console.log("resized!");
      setTimeout(() => {
        ref.style.height = "auto";
        ref.style.height = ref.scrollHeight + "px";
      }, 10); // Adjust delay as needed (in milliseconds)
    }
  });

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

  useLayoutEffect(() => {
    const initialStartTimes = {};
    const initialEndTimes = {};
    const initialTitles = {};
    const initialDescriptions = {};

    eventList.forEach((item) => {
      let startTime = formatDate(item.startTime);
      let endTime = formatDate(item.endTime);
      const currentDate = new Date();

      if (
        isNaN(startTime.getTime()) ||
        startTime < currentDate ||
        item.startTime === "N/A"
      ) {
        startTime = new Date();
      }

      if (
        isNaN(endTime.getTime()) ||
        endTime < currentDate ||
        item.endTime === "N/A"
      ) {
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

    // Restore state from localStorage
    try {
      const storedRevertIdList = localStorage.getItem("revertIdList");
      const storedEventsAdded = localStorage.getItem("eventsAdded");

      if (storedRevertIdList) {
        setRevertIdList(JSON.parse(storedRevertIdList));
      }
      if (storedEventsAdded) {
        setEventsAdded(JSON.parse(storedEventsAdded));
      }
    } catch {}
  }, [eventList]);

  useEffect(() => {
    if (!isTextResized && eventList.length > 0) {
      console.log("resize useeffect");
      eventList.forEach((item) => {
        handleResize(titleRefs.current[item.id]);
        handleResize(descRefs.current[item.id]);
      });
      setIsTextResized(true);
    }
  }, [eventList, eventList.length, handleResize, isTextResized]);

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
    handleResize(titleRefs.current[itemId]); // Resize the textarea after setting the value
    setIsTextResized(false);
  };

  const handleDescChange = (itemId, value) => {
    setEventDescriptions((prevEventDescriptions) => ({
      ...prevEventDescriptions,
      [itemId]: value,
    }));
    handleResize(descRefs.current[itemId]); // Resize the textarea after setting the value
    setIsTextResized(false);
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
        title: EventTitles[event.id],
        description: EventDescriptions[event.id],
        startTime: startTime,
        endTime: endTime,
      };
    });
    console.log("Selected Events:", selectedEventDetails);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newRevertIdList = [];
    let allEventsValid = true;

    selectedEventDetails.forEach((event) => {
      if (new Date(event.endTime) <= new Date(event.startTime)) {
        allEventsValid = false;
        console.error("Event end time must be after start time:", event);
        setMessage(`Invalid event: End time must be after start time`);
        setIsMessageShowing(true);
        return;
      }

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
    if (selectedEvents.length === 0) {
      setMessage("No events selected");
    } else if (selectedEventDetails.length > 0 && allEventsValid) {
      setMessage(`${selectedEvents.length} Events Added`);
      setEventsAdded(true);
    }
    setIsMessageShowing(true);
    setRevertIdList(newRevertIdList);
    localStorage.setItem("revertIdList", JSON.stringify(newRevertIdList));
    localStorage.setItem("eventsAdded", JSON.stringify(true));
  };

  const revertEvents = () => {
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
    setEventsAdded(false);
    setIsMessageShowing(true);
  };

  return (
    <div>
      {EventTitles &&
        EventDescriptions &&
        eventList.map((item) => (
          <div key={item.id} className="eventBox">
            <div className="flex-grow">
              <div className="flex items-center">
                <label className="checkbox-container">
                  <input
                    className="custom-checkbox"
                    checked={selectedEvents.includes(item.id)}
                    onChange={() => toggleEventSelection(item.id)}
                    id={`event-checkbox-${item.id}`}
                    type="checkbox"
                  />
                  <span className="checkmark"></span>
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
              <textarea
                ref={(el) => (titleRefs.current[item.id] = el)}
                className="mb-2 w-full border border-gray-300 p-2 rounded-md text-black"
                value={EventTitles[item.id] || ""}
                onChange={(e) => handleTitleChange(item.id, e.target.value)}
                rows={1}
                style={{ overflow: "hidden", resize: "none" }}
              />
              <label className="block mb-2 text-sm font-medium text-white">
                Description
              </label>
              <textarea
                ref={(el) => (descRefs.current[item.id] = el)}
                className="mb-2 w-full border border-gray-300 p-2 rounded-md text-black"
                value={EventDescriptions[item.id] || ""}
                onChange={(e) => handleDescChange(item.id, e.target.value)}
                rows={1}
                style={{ overflow: "hidden", resize: "none" }}
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
          </div>
        ))}
      <div>
        {eventList.length > 0 && (
          <div>
            <Button
              onClick={handleAddToCalendar}
              className="text-white bg-[#008cff] hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Add to Calendar
            </Button>
            {eventsAdded ? (
              <Button
                onClick={revertEvents}
                className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
              >
                Revert Changes
              </Button>
            ) : (
              <Button
                className="text-gray-500 bg-gray-200 cursor-not-allowed focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-gray-600 dark:text-gray-400"
                disabled
              >
                Revert Changes
              </Button>
            )}
          </div>
        )}
        {isMessageShowing && <p>{message}</p>}
      </div>
    </div>
  );
}

export default Prompt;
