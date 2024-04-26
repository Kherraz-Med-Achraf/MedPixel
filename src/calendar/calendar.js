// @ts-nocheck
var calendar;
document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "fr",
    buttonText: {
      today: "aujourd'hui",
      month: "mois",
      week: "semaine",
      day: "jour",
      list: "liste",
    },
    dateClick: function (info) {
      var clickedDate = info.date;
      var formattedDate = formatDateAndTime(clickedDate);
      document.getElementById("eventStart").value = formattedDate;
      document.getElementById("eventInputForm").style.display = "block";
    },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    eventContent: function (arg) {
      let startTime = formatTime(new Date(arg.event.start));
      let endTime = formatTime(new Date(arg.event.end));
      let salle = arg.event.extendedProps.salle;
      let color = roomColor(arg.event.extendedProps.salle); // Assurez-vous que cette fonction retourne la couleur correcte

      let node = document.createElement("div");
      node.style.padding = "5px";
      node.style.backgroundColor = color; // Appliquez directement la couleur de fond
      node.style.borderColor = color; // Appliquez directement la couleur de bordure
      node.style.color = "white"; // Texte en blanc pour la visibilité
      node.innerHTML = `<b>${arg.event.title}</b><br>${startTime} - ${endTime}<br>Salle: ${salle}`;

      return { domNodes: [node] };
    },
    eventClick: function (info) {
      showModal(info.event);
    },
  });
  calendar.render();
  loadEvents(); // Chargez les événements après avoir rendu le calendrier
  checkPlayer();
});

function addEvent() {
  var title = document.getElementById("eventName").value;
  var start = document.getElementById("eventStart").value;
  var duration = parseInt(document.getElementById("eventDuration").value, 10);
  var room = document.getElementById("roomSelect").value;

  if (title && start && duration && room) {
    var end = new Date(start);
    end.setHours(end.getHours() + duration);

    console.log(roomColor(room));

    calendar.addEvent({
      title: title,
      start: start,
      end: end.toISOString(),
      color: roomColor(room), // Associer une couleur à la salle
      backgroundColor: roomColor(room), // Force la couleur de fond
      borderColor: roomColor(room), // Assurez-vous que les bordures sont de la même couleur
      textColor: "white",
      extendedProps: {
        salle: room,
      },
    });
    saveEvents();

    closeForm();
  } else {
    alert("Veuillez remplir tous les champs");
  }
}

function roomColor(room) {
  switch (room) {
    case "salleA":
      return "#00b4d8";
    case "salleB":
      return "#ffd6a5";
    case "salleC":
      return "#fdffb6";
    default:
      return "#cccccc";
  }
}

function closeForm() {
  document.getElementById("eventInputForm").style.display = "none";
}

function showModal(eventObj) {
  document.getElementById("modalTitle").textContent = eventObj.title;
  document.getElementById("modalTime").textContent =
    formatTime(new Date(eventObj.start)) +
    " - " +
    formatTime(new Date(eventObj.end));
  document.getElementById("modalSalle").textContent =
    eventObj.extendedProps.salle;
  document.getElementById("eventModal").style.display = "block";

  // Modification du bouton en fonction du rôle
  const typeBtn = document.getElementById("type-btn");

  var playerRole = WA.player.tags;
  var isUserAdmin = playerRole.includes("admin"); //admin
  if (isUserAdmin) {
    typeBtn.textContent = "Supprimer";
    typeBtn.onclick = function () {
      deleteEvent(eventObj);
    }; // Assurez-vous que cette fonction est correctement définie pour supprimer l'événement
  } else {
    typeBtn.textContent = "S'inscrire";
    typeBtn.onclick = function () {
      let tab = WA.player.state.role;
      tab.push(eventObj.extendedProps.salle);
      WA.player.state.role = tab;
      WA.chat.sendChatMessage(
        "Je suis inscrit à " +
          eventObj.title +
          " dans la salle: " +
          eventObj.extendedProps.salle
      );
      console.log("player role", WA.player.state.role);

      // Calculer le délai jusqu'à la fin de l'événement
      let delay = getDelayUntilEventEnds(eventObj.end);
      let delayInfo = {
        delay: delay,
        salle: eventObj.extendedProps.salle,
        title: eventObj.title,
      };
      WA.state.saveVariable("delayinfo", JSON.stringify(delayInfo));
    
    };
  }

  window.currentEvent = eventObj; // Stocker l'événement actuel pour l'utiliser dans les fonctions deleteEvent ou d'inscription
}

function deleteEvent(eventObj) {
  
  let data = {
    salle: eventObj.extendedProps.salle,
    title: eventObj.title,
  };

  WA.state.saveVariable("deletingevent", JSON.stringify(data));

  if (eventObj) {
    eventObj.remove();
    saveEvents();
    closeModal();
  }
}

function closeModal() {
  document.getElementById("eventModal").style.display = "none";
}

//gestion du temps
function formatTime(date) {
  let hours = date.getHours().toString().padStart(2, "0");
  let minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDate(date) {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateAndTime(date) {
  let formattedDate = formatDate(date);
  let formattedTime = formatTime(date);
  return `${formattedDate}T${formattedTime}`;
}

// saving data to the state

function saveEvents() {
  var events = calendar.getEvents();
  var eventData = events.map((event) => ({
    title: event.title,
    start: event.start.toISOString(),
    end: event.end ? event.end.toISOString() : null,
    extendedProps: {
      salle: event.extendedProps.salle,
    },
    color: event.backgroundColor, // Assurez-vous d'enregistrer la couleur si nécessaire
  }));

  var eventsJson = JSON.stringify(eventData);
  WA.state.saveVariable("toto", eventsJson); // Enregistrez les événements dans le state
}

//loading data from the state

function loadEvents() {
  var storedEvents = WA.state.loadVariable("toto");

  if (storedEvents) {
    var events = JSON.parse(storedEvents);
    events.forEach((event) => {
      calendar.addEvent({
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: {
          salle: event.extendedProps.salle,
        },
        color: event.color, // Assurez-vous de restituer la couleur
      });
    });
  }
}

function closeIfram() {
  WA.state.saveVariable("iframe", false);
}

WA.onInit().then(() => {
  var playerRole = WA.player.tags;
  console.log("player role", playerRole);
});

function getDelayUntilEventEnds(endTime) {
  let now = new Date();
  let end = new Date(endTime);
  return end.getTime() - now.getTime();
}
