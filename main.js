// Utility functions
function getID (elementID) {
  return document.getElementById(elementID);
}
function getClass (elementClass) {
  return document.getElementsByClassName(elementClass);
}

var data, started = false, currentVideo = 0;

// Load global configuration file
fetch("config.json").then(function (response) {
  response.json().then(function (json) {

    data = json;
    data.categories.currentID = 0;

  });
});

// Swipes away board items
async function clearBoard () {

  // Push info panel off-screen
  getID("info").style.transform = "translateX(calc(100% + 2.5vw))";
  getID("info").style.opacity = 0;

  // Get current category
  const curr = data.categories[data.config.index[data.categories.currentID]];

  // In co-op, one entry equals two players
  const playercount = curr.players.length / (curr.coop + 1);
  
  // Speed up animation if there are many players
  let delay = 100;
  if (playercount > 5) delay = 50;

  // Fade out entries one after another
  for (let i = 1; i <= playercount; i ++) {
    setTimeout(function() {
      getClass("lb-entry")[playercount - i].style.opacity = 0;
    }, delay * i);
  }

  // Fade out title after leaderboard is clear
  setTimeout(function () {
    getID("lb-title").style.opacity = 0;
  }, delay * playercount + 100);

  // Stall function until everything has been cleared
  await new Promise(function (resolve) {
    setTimeout(resolve, delay * playercount + 600);
  });

}

function setBoard () {

  // Get current category
  const curr = data.categories[data.config.index[data.categories.currentID]];

  // In co-op, one entry equals two players
  const playercount = curr.players.length / (curr.coop + 1);
  const increment = curr.coop + 1;

  let boardHTML = `<h2 id="lb-title">${curr.category}</h2>`;

  // Decide render type based on co-op flag and player count
  let entryClass = "lb-entry";
  if (curr.coop) entryClass += " lb-entry-coop";
  else if (curr.players.length > 5) entryClass += " lb-entry-compact"

  // Build leaderboard entries
  for (let i = 0; i < curr.players.length; i += increment) {
    boardHTML += `
      <div class="${entryClass}" onclick="readyVideo(${i})">
        <h1 class="${curr.coop ? "p1" : "solo"}">${curr.players[i]}</h1>
        ${curr.coop ? `<h1 class="p2">${curr.players[i + 1]}</h1>` : ""}
      </div>
    `;
  }

  getID("leaderboard").innerHTML = boardHTML;

  // Speed up animation if there are many players
  let delay = 100;
  if (playercount > 5) delay = 50;

  // Fade in entries one after another
  for (let i = 0; i < playercount; i++) {
    setTimeout(function () {
      getClass("lb-entry")[i].style.opacity = 1;
    }, delay + delay * i);
  }

  // Fade in title while leaderboard is getting built
  setTimeout(function () {
    getID("lb-title").style.opacity = 1;
  }, 100);

  // Set info panel info
  getClass("info-description")[0].innerHTML = data.config.map;
  getClass("info-description")[1].innerHTML = data.config.style;
  getClass("info-description")[2].innerHTML = curr.times;
  getClass("info-description")[3].innerHTML = curr.variation;

  // Bring up info panel
  setTimeout(function () {
    getID("info").style.transform = "translateX(0)";
    getID("info").style.opacity = 0.8;
  }, 500);

}

document.onkeydown = function(event) {

  const key = event.code;

  let direction = 0;
  if (key === "ArrowLeft") direction = -1;
  if (key === "ArrowRight") direction = 1;

  if (direction && started) {

    clearBoard().then(function() {

      // Wrap around
      data.categories.currentID += direction;
      if (data.categories.currentID < 0) {
        data.categories.currentID = data.config.index.length - 1;
      }
      if (data.categories.currentID > data.config.index.length - 1) {
        data.categories.currentID = 0;
      }

      setTimeout(setBoard, 200);

    });
    
  }

  if (key === "Enter") {

    // Display week number
    getID("week").innerHTML = data.config.week;
    getID("week").style.opacity = 1;

    if (!started) {
      setBoard();
      started = true;
    } else if (currentVideo !== -1) {
      playVideo(currentVideo);
    }

  }

  if (key === "Escape") unplayVideo();

}

function readyVideo (id) {

  currentVideo = id;
  
  getID("title").style.transform = "translateX(-100%)";
  getID("info").style.transform = "translateX(calc(100% + 2.5vw))";
  getID("leaderboard").style.transform = "translateX(calc(-100% - 10vw))";

  // Get current category
  const curr = data.categories[data.config.index[data.categories.currentID]];

  if (curr.coop) getID("runinfo-name").innerHTML = `${curr.players[id * 2]}<br>${curr.players[id * 2 + 1]}`;
  else getID("runinfo-name").innerHTML = curr.players[id];

  getID("runinfo-details").innerHTML = "time: " + curr.time[id];

  setTimeout(function () {
    getID("runinfo-name").style.opacity = 1;
    getID("runinfo-details").style.opacity = 1;
    getID("runinfo-seperator").style.transform = "scaleX(1)";
  }, 800);

}

function playVideo (id) {

  currentVideo = id;

  // Get current category
  const curr = data.categories[data.config.index[data.categories.currentID]];

  // If the id is -1, use background loop instead
  const filename = ( id === -1 ? "bg-loop.mp4" : `videos/${curr.videos[id]}` );

  // Reset volume
  getID("bg-video").volume = 0.22;

  // Fade out background to hide switch
  getID("bg-video").style.opacity = 0;
  // Switch to current video
  setTimeout(function () {
    getID("bg-video").src = filename;
  }, 500);
  // Fade in background after switching
  setTimeout(function () {
    getID("bg-video").style.opacity = 1;
  }, 1000);

  // Disable background overlay used for loop video
  getID("bg-overlay").style.opacity = 0;
  getID("bg-overlay").style.pointerEvents = "none";

  // Switch control to the video player
  getID("content").style.pointerEvents = "none";
  getID("bg-video").controls = "controls";
  getID("bg-video").loop = "";

  // Slide runner name to the top
  setTimeout(function () {

    getID("runinfo-details").style.opacity = 0;
    getID("runinfo-seperator").style.transform = "scaleX(0)";

    setTimeout(function () {
      getID("runinfo").style.transform = "translate(-50%, -50vh)";
    }, 1000);

  }, 500);

}

function unplayVideo () {

  playVideo(-1);

  // Bring back all panels
  getID("title").style.transform = "translateX(0)";
  getID("info").style.transform = "translateX(0)";
  getID("leaderboard").style.transform = "translateX(0)";

  // Clear run information
  getID("runinfo-name").style.opacity = 0;
  getID("runinfo-details").style.opacity = 0;
  getID("runinfo-seperator").style.transform = "scaleX(0)";
  
  // Slide run information panel back down while it's hidden
  setTimeout(function () {
    getID("runinfo").style.transform = "translate(-50%, -50%)";
  }, 500);

  // Re-enable interaction with UI elements
  getID("bg-overlay").style.pointerEvents = "auto";
  getID("content").style.pointerEvents = "auto";

  // Configure background video for seamless looping
  getID("bg-overlay").style.opacity = 0.8;
  getID("bg-video").controls = "";
  getID("bg-video").loop = "loop";

}