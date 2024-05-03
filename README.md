# DateMinder
DateMinder is the first student-oriented AI calendar assistant. It can take images or documents of other calendars, hand-drawn notes, or instruction plans and pull out all events, including their titles, descriptions, start/end times, and the date they occur. In addition, it acts like a personal assistant, automatically implementing everything into your Google calendar for you. Built as a browser extension, it will always be with you at school when you are learning and need to put things into your calendar quickly before you forget or when you are at home and curious about what tests are. It can answer any question about your calendar you may throw at it. 

# Technology Stack
Dateminder is a web API with a React client frontend. Dateminder utilization Google Sign-In for authentication and the Google Calendar API for event management. The Node.js backend integrates with Google Cloud's Document AI for document parsing and PALM 2 for predictive text modeling.

# Features


### PaLM Personal calendar assistant ###
Using the power of Palm2 we can gain insights and prompt our personal calendar assistant based on the context of our calendar and receive responses.

<img width="425" alt="image" src="https://github.com/OGarland001/gdsc-solution-challenge/assets/90644730/d2f5d713-96c1-4f2a-9e0c-9c30a696684d">


### Document AI document and image parsing ###
Utilizing Google's Document Ai model, DateMinder is capable of parsing uploaded images and documents for events.

<img width="207" alt="image" src="https://github.com/OGarland001/gdsc-solution-challenge/assets/90644730/be7a7e4d-1bf9-48b6-ad00-47f566f24c8d">
<img width="218" alt="image" src="https://github.com/OGarland001/gdsc-solution-challenge/assets/90644730/5ed2e082-a34d-4495-8f50-a808d08ab60e">


### Create events from parsed document ###
Through the create tab, the events parsed from the upload will be displayed and can be edited the events. Once the events are marked to keep they will be automatically added to the calendar by pressing the Add to calendar button.

<img width="215" alt="image" src="https://github.com/OGarland001/gdsc-solution-challenge/assets/90644730/cfb0f48e-d2f7-4dd8-904c-5f2ae645b5a5">


### View and edit upcoming events ###
In the update tab upcoming events from your calendar can be viewed and edited.

<img width="224" alt="image" src="https://github.com/OGarland001/gdsc-solution-challenge/assets/90644730/546ba2fb-063e-43fc-9678-4c327e861dbb">


### Revert changes ###
If anything needs to be changed in the calendar DateMinder provides the option to revert and edit the events to fix any issues they find with their calendar. As well as the ability to re-add the events into their calendar.

<img width="202" alt="image" src="https://github.com/OGarland001/gdsc-solution-challenge/assets/90644730/3a625460-51e0-4326-84b9-ecbe4ec1bd9e">


## Steps to Run the Application

Change Directory to the client server first.
```
cd server/client/src
```
Install packages for the client.
```
npm install
```
Save the client application as a production build.
```
npm run build
```
Change directory to the server folder
```
cd ../../
```
Install the packages for the NodeJS Webserver
```
npm install
```
Start the NodeJS Webserver
```
npm start
```

view the application from http://localhost:5152
