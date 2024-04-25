import React from "react";
import "./event.css"; // Import the CSS file

function formatDate(dateTimeString) {
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true // Use 12-hour format
  };
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', options);
}

function Event({ eventObj }) {
  const startTime = formatDate(eventObj.start.dateTime);
  const endTime = formatDate(eventObj.end.dateTime);

  return (
    <div className="event-card">
      <p className="title">{eventObj.summary}</p>
      <p className="time">Start Time: {startTime}</p>
      <p className="time">End Time: {endTime}</p>
      <p className="status">Status: {eventObj.status}</p>
    </div>
  );
}

export default Event;
