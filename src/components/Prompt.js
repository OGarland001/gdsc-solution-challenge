import { Button } from "@material-tailwind/react";
import React from "react";

function Prompt({ eventList }) {
  return (
    <div>
      <h1>Prompt Results</h1>
      <p>Please review the suggestions before submit.</p>
      <br></br>

      {eventList.map((item) => (
        <div>
          <h1>{item.EventTitle}</h1>
          <p>Start Time : {item.startTime}</p>
          <p>End Time : {item.endTime}</p>

          <Button>✓</Button>
          <Button>X</Button>
        </div>
      ))}

      <div>
        <Button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          Submit
        </Button>
        <Button className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-red-700 dark:focus:ring-red-800">
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default Prompt;
