// @ts-nocheck
/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log("Script started successfully");

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit()
  .then(() => {
    console.log("Scripting API ready");
    WA.player.state.role = [];

    // WA.chat.sendChatMessage('Hello world', 'Mr Robot');

    WA.room.area.onEnter("clock").subscribe(() => {
      const today = new Date();
      const time = today.getHours() + ":" + today.getMinutes();
      currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    });

    // Vérifiez si l'utilisateur a un tag spécifique et agissez en conséquence
    console.log(
      "##################################################################"
    );
    console.log("my data:", WA.state.loadVariable("toto"));
    console.log("my data:", WA.state.loadVariable("iframe"));

    // WA.player.state.profession = WA.player.tags;
    // WA.player.state.profession = "cardiologue";

    //calendar
    let mycalendar;

    //############################################################ Watcher de variable ############################################################

    WA.state.onVariableChange("toto").subscribe((newEventData) => {
      console.log("Updated calendar event data:", newEventData);
    });

    WA.state.onVariableChange("iframe").subscribe((newEventData) => {
      console.log("Updated iframe event data:", newEventData);
      if (!newEventData) {
        closeIframe();
        WA.state.saveVariable("iframe", true);
      }
    });

 WA.state.onVariableChange("deletingevent").subscribe((newEventData) => {

    let data = JSON.parse(newEventData);
      if (newEventData) {
        let tab = WA.player.state.role;
        let index = tab.indexOf(data.salle);
        if (index > -1) {
            tab.splice(index, 1); // Supprime le tag
            WA.player.state.role = tab;
          WA.chat.sendChatMessage(
            "Inscription terminée pour " +
              data.title +
              " dans la salle: " +
              data.salle,
            "info"
          );
          console.log("player role updated",tab);
        }
      }
    });

    WA.state.onVariableChange("delayinfo").subscribe((delayInfoJson) => {
      let delayInfo = JSON.parse(delayInfoJson);
      setTimeout(() => {
        let tab = WA.player.state.role;
        let index =tab.indexOf(delayInfo.salle);
        if (index > -1) {
            tab.splice(index, 1); // Supprime le tag
            WA.player.state.role = tab;
          WA.chat.sendChatMessage(
            "Inscription terminée pour " +
              delayInfo.title +
              " dans la salle: " +
              delayInfo.salle,
            "info"
          );
          console.log("player role updated",tab);
        }
      }, delayInfo.delay);
    });

    //############################################################ Calendar ############################################################

    function openCalendar() {
      WA.ui.website
        .open({
          url: "./src/calendar/calendar.html",
          position: {
            vertical: "middle",
            horizontal: "middle",
          },
          size: {
            width: "90%",
            height: "90%",
          },
          visible: true,
          allowApi: true,
          allowPolicy:
            "allow-same-origin allow-scripts allow-popups allow-forms", // Ajoutez allow-same-origin ici
        })
        .then((website) => {
          console.log("Calendrier ouvert avec succès");
          mycalendar = website;
        })
        .catch((err) => {
          console.error("Erreur lors de l'ouverture du calendrier", err);
        });
    }

    WA.room.onEnterLayer("calendar").subscribe(() => {
      openCalendar();
    });

    WA.room.onLeaveLayer("calendar").subscribe(() => {
      closeIframe();
    });

    function closeIframe() {
      if (mycalendar) {
        mycalendar
          .close()
          .then(() => {
            console.log("Calendrier fermé avec succès");
            mycalendar = null;
          })
          .catch((err) => {
            console.error("Erreur lors de la fermeture du calendrier", err);
          });
      }
    }

    WA.room.area.onLeave("clock").subscribe(closePopup);

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra()
      .then(() => {
        console.log("Scripting API Extra ready");
      })
      .catch((e) => console.error(e));
  })
  .catch((e) => console.error(e));

function closePopup() {
  if (currentPopup !== undefined) {
    currentPopup.close();
    currentPopup = undefined;
  }
}

export {};

// let intervalId; //pour le localStorage

// //function customs
// function checkLocalStorage() {
//     const data = localStorage.getItem('iframeData');
//     if (data) {
//         const parsedData = JSON.parse(data);
//         console.log("Data from iframe:", parsedData);
//         // Faire quelque chose avec les données

//         // Nettoyer après la lecture
//         localStorage.removeItem('iframeData');

//         // Arrêter de vérifier le localStorage
//         clearInterval(intervalId);
//     }
// }
