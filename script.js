/* ------------------------------------------------------
   script.js
   Integrated functionality:
   - EVENT_CODE is defined here (change as needed)
   - Pulls team and match data from TBA using the provided API key
   - Free–form interactive field: stores (x,y) coordinates, then converts them to a grid cell number (12x6) for output
   - Auto–fill of team number based on match number, match type, and robot
   - Reset form auto–increments match number
   - Builds output data as short–code key=value; string (including Coral L4 fields)
------------------------------------------------------ */

/* ===== TBA Interface Functions ===== */
var teams = null;
var schedule = null;
var authKey = "2XACou7MLBnRarV4LPD69OOTMzSccjEfedI2diYMvzuxbD6d2E9U9PEiPppOPjsE";
const EVENT_CODE = "2024cthar";  // Set your event code here

function getTeams(eventCode) {
  if (authKey) {
    var xmlhttp = new XMLHttpRequest();
    var url = "https://www.thebluealliance.com/api/v3/event/" + eventCode + "/teams/simple";
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("X-TBA-Auth-Key", authKey);
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        teams = JSON.parse(this.responseText);
      }
    };
    xmlhttp.send();
  }
}

function getSchedule(eventCode) {
  if (authKey) {
    var xmlhttp = new XMLHttpRequest();
    var url = "https://www.thebluealliance.com/api/v3/event/" + eventCode + "/matches/simple";
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("X-TBA-Auth-Key", authKey);
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        schedule = JSON.parse(this.responseText);
      }
    };
    xmlhttp.send();
  }
}

/* ===== Timer Functions ===== */
let timerInterval = null;
let elapsedTime = 0;
let isRunning = false;
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const fraction = Math.floor((ms % 1000) / 100);
  return String(minutes).padStart(2, '0') + ':' +
         String(seconds).padStart(2, '0') + '.' + fraction;
}
function updateTimerDisplay() {
  document.getElementById('timeToScoreCoralDisplay').textContent = formatTime(elapsedTime);
}
function startStopTimer() {
  if (!isRunning) {
    isRunning = true;
    const startTime = Date.now() - elapsedTime;
    document.getElementById('startStopTimerBtn').textContent = 'Stop';
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      updateTimerDisplay();
    }, 100);
  } else {
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('startStopTimerBtn').textContent = 'Start';
    document.getElementById('timeToScoreCoral').value = (elapsedTime / 1000).toFixed(2);
  }
}
function lapTimer() {
  document.getElementById('timeToScoreCoral').value = (elapsedTime / 1000).toFixed(2);
  alert('Lap recorded: ' + document.getElementById('timeToScoreCoral').value + 's');
}
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  elapsedTime = 0;
  document.getElementById('startStopTimerBtn').textContent = 'Start';
  updateTimerDisplay();
  document.getElementById('timeToScoreCoral').value = '0.00';
}

/* ===== Increment/Decrement for Counters ===== */
function increment(id) {
  const el = document.getElementById(id);
  let val = parseInt(el.value, 10);
  if (isNaN(val)) val = 0;
  el.value = val + 1;
}
function decrement(id) {
  const el = document.getElementById(id);
  let val = parseInt(el.value, 10);
  if (isNaN(val)) val = 0;
  if (val > 0) el.value = val - 1;
}

/* ===== Slider Updates ===== */
function updateOffenseSkillDisplay() {
  document.getElementById('offenseSkillValue').textContent = document.getElementById('offenseSkill').value;
}
function updateDefenseSkillDisplay() {
  document.getElementById('defenseSkillValue').textContent = document.getElementById('defenseSkill').value;
}

/* ===== Interactive Field (Free Selection) ===== */
/* When the user clicks on the field image, store the actual (x,y) coordinate */
function onFieldClick(event) {
  const map = document.getElementById('fieldMap');
  const rect = map.getBoundingClientRect();
  // Use event.offsetX/Y to get the click position relative to the image
  const x = event.offsetX;
  const y = event.offsetY;
  // Store the coordinate as a JSON array (e.g., ["123,45"])
  const coordsArray = [x + "," + y];
  document.getElementById('startingPosition').value = JSON.stringify(coordsArray);
  // Position the red dot at the clicked coordinates
  const dot = document.getElementById('redDot');
  dot.style.left = (x - 7) + "px";
  dot.style.top = (y - 7) + "px";
  dot.style.display = "block";
  checkMandatory();
}

/* ===== Mandatory Fields Check ===== */
function validateMandatoryFields() {
  const scouter = document.getElementById('scouterInitials').value.trim();
  const robot = document.getElementById('robotNumber').value.trim();
  const startPos = document.getElementById('startingPosition').value.trim();
  const comments = document.getElementById('comments').value.trim();
  return scouter && robot && startPos && comments;
}
function checkMandatory() {
  document.getElementById('commitButton').disabled = !validateMandatoryFields();
}

/* ===== Auto-Fill Team Number Based on Match Data ===== */
/* The match key is built using EVENT_CODE, match type, and match number.
   For qualifiers, the key format is: EVENT_CODE + "_qm" + matchNumber
   For playoffs, we'll assume: EVENT_CODE + "_qf" + matchNumber
   For finals: EVENT_CODE + "_f" + matchNumber  */
function getCurrentMatchKey() {
  const matchType = document.getElementById("matchType").value;
  const matchNumber = document.getElementById("matchNumber").value;
  return EVENT_CODE + "_" + matchType + matchNumber;
}
function getMatch(matchKey) {
  if (schedule) {
    let ret = null;
    schedule.forEach(match => {
      if (match.key === matchKey) {
        ret = match;
      }
    });
    return ret;
  }
  return null;
}
function getCurrentMatch() {
  return getMatch(getCurrentMatchKey());
}
function getRobot() {
  let r = document.getElementById("robotNumber").value;
  if (!r) return "";
  return r.toLowerCase().replace("red ", "r").replace("blue ", "b");
}
function getCurrentTeamNumberFromRobot() {
  const robot = getRobot();
  const match = getCurrentMatch();
  if (robot && match) {
    if (robot.charAt(0) === "r") {
      let index = parseInt(robot.charAt(1)) - 1;
      return match.alliances.red.team_keys[index];
    } else if (robot.charAt(0) === "b") {
      let index = parseInt(robot.charAt(1)) - 1;
      return match.alliances.blue.team_keys[index];
    }
  }
  return "";
}
function autoFillTeamNumber() {
  const matchType = document.getElementById("matchType").value;
  const matchNumber = document.getElementById("matchNumber").value;
  const robot = document.getElementById("robotNumber").value;
  if (!matchType || !matchNumber || !robot) return;
  const team = getCurrentTeamNumberFromRobot();
  if (team) {
    document.getElementById("teamNumber").value = team.replace("frc", "");
  }
}

/* ===== Build Short-Code Data String ===== */
function getFormDataString() {
  const fieldsMap = [
    { code: 'si', id: 'scouterInitials' },
    { code: 'mn', id: 'matchNumber' },
    { code: 'mt', id: 'matchType' },
    { code: 'rb', id: 'robotNumber' },
    { code: 'tn', id: 'teamNumber' },
    { code: 'sp', id: 'startingPosition' },
    { code: 'ns', id: 'noShow' },
    { code: 'cp', id: 'cagePosition' },
    
    { code: 'ma', id: 'movedAuto' },
    { code: 'tCor', id: 'timeToScoreCoral' },
    { code: 'c1a', id: 'coralL1Auto' },
    { code: 'c2a', id: 'coralL2Auto' },
    { code: 'c3a', id: 'coralL3Auto' },
    { code: 'c4a', id: 'coralL4Auto' },
    { code: 'baa', id: 'bargeAlgaeAuto' },
    { code: 'paa', id: 'processorAlgaeAuto' },
    { code: 'daa', id: 'dislodgedAlgaeAuto' },
    { code: 'af', id: 'autoFoul' },
    
    { code: 'dat', id: 'dislodgedAlgaeTele' },
    { code: 'pl', id: 'pickupLocation' },
    { code: 'c1t', id: 'coralL1Tele' },
    { code: 'c2t', id: 'coralL2Tele' },
    { code: 'c3t', id: 'coralL3Tele' },
    { code: 'c4t', id: 'coralL4Tele' },
    { code: 'bat', id: 'bargeAlgaeTele' },
    { code: 'pat', id: 'processorAlgaeTele' },
    { code: 'tf', id: 'teleFouls' },
    { code: 'cf', id: 'crossedField' },
    { code: 'tfell', id: 'tippedFell' },
    { code: 'toc', id: 'touchedOpposingCage' },
    { code: 'dep', id: 'depTele' },
    
    { code: 'ep', id: 'endPosition' },
    { code: 'def', id: 'defended' },
    { code: 'trh', id: 'timeRemainingHang' },
    
    { code: 'ofs', id: 'offenseSkill' },
    { code: 'dfs', id: 'defenseSkill' },
    { code: 'yc', id: 'yellowCard' },
    { code: 'cs', id: 'cardStatus' },
    { code: 'cm', id: 'comments' }
  ];
  
  let result = '';
  fieldsMap.forEach(fm => {
    const el = document.getElementById(fm.id);
    let val = '';
    if (!el) {
      val = '';
    } else if (fm.id === "startingPosition") {
      // Convert free selection coordinate (stored as JSON array of "x,y")
      // into a grid cell number using a default 12x6 resolution based on the image dimensions.
      try {
        let coordsArr = JSON.parse(el.value);
        if (coordsArr.length > 0) {
          let parts = coordsArr[0].split(",");
          let x = parseFloat(parts[0]);
          let y = parseFloat(parts[1]);
          // Use the field image dimensions
          let img = document.querySelector("#fieldMap img");
          let rect = img.getBoundingClientRect();
          let cell = Math.ceil(x / (rect.width / 12)) + ((Math.ceil(y / (rect.height / 6)) - 1) * 12);
          val = cell;
        }
      } catch (e) {
        val = "";
      }
    } else if (el.type === 'checkbox') {
      val = el.checked ? 'true' : 'false';
    } else {
      val = el.value;
    }
    result += `${fm.code}=${val};`;
  });
  return result;
}

/* ===== QR Modal Functions ===== */
function showQRModal(dataString) {
  const modal = document.getElementById('qrModal');
  const qrDataP = document.getElementById('qrData');
  const qrCodeContainer = document.getElementById('qrCode');
  qrCodeContainer.innerHTML = '';
  new QRCode(qrCodeContainer, {
    text: dataString,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  qrDataP.textContent = dataString;
  modal.style.display = 'block';
}
function closeQRModal() {
  document.getElementById('qrModal').style.display = 'none';
}

/* ===== Reset Form (Auto-Increment Match Number) ===== */
function resetForm() {
  const matchInput = document.getElementById("matchNumber");
  let currentMatch = parseInt(matchInput.value, 10);
  if (!isNaN(currentMatch)) {
    matchInput.value = currentMatch + 1;
  }
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id === "matchNumber") return;
    if (el.id === "eventCode") return;
    if (el.type === 'checkbox') {
      el.checked = false;
    } else if (el.type === 'number') {
      el.value = 0;
    } else if (el.tagName.toLowerCase() === 'select') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
  });
  resetTimer();
  document.getElementById('redDot').style.display = 'none';
  document.getElementById('commitButton').disabled = true;
}

/* ===== Copy Column Names (Short Codes) ===== */
function copyColumnNames() {
  const columns = [
    'si','mn','rb','tn','sp','ns','cp',
    'ma','tCor','c1a','c2a','c3a','c4a','baa','paa','daa','af',
    'dat','pl','c1t','c2t','c3t','c4t','bat','pat','tf','cf','tfell','toc','dep',
    'ep','def','trh','ofs','dfs','yc','cs','cm'
  ].join(",");
  navigator.clipboard.writeText(columns)
    .then(() => alert('Short-code column names copied!'))
    .catch(err => console.error('Failed to copy column names', err));
}

/* ===== Window Onload: Initialize Everything ===== */
window.onload = () => {
  // Pull teams and schedule from TBA using EVENT_CODE
  getTeams(EVENT_CODE);
  getSchedule(EVENT_CODE);
  
  // Timer events
  document.getElementById('startStopTimerBtn').addEventListener('click', startStopTimer);
  document.getElementById('lapTimerBtn').addEventListener('click', lapTimer);
  document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);
  
  // Field map: free selection
  document.getElementById('fieldMap').addEventListener('click', onFieldClick);
  document.getElementById('flipFieldBtn').addEventListener('click', () => {
    document.getElementById('fieldMap').classList.toggle('flipped');
  });
  document.getElementById('undoPositionBtn').addEventListener('click', () => {
    document.getElementById('redDot').style.display = 'none';
    document.getElementById('startingPosition').value = '';
    checkMandatory();
  });
  
  // When robot, match type, or match number change, auto-fill team number
  document.getElementById('robotNumber').addEventListener('change', () => {
    autoFillTeamNumber();
    checkMandatory();
  });
  document.getElementById('matchType').addEventListener('change', () => {
    autoFillTeamNumber();
  });
  document.getElementById('matchNumber').addEventListener('input', () => {
    autoFillTeamNumber();
  });
  
  // Watch mandatory fields
  document.querySelectorAll('#scouterInitials, #robotNumber, #startingPosition, #comments')
    .forEach(el => el.addEventListener('input', checkMandatory));
  
  // Commit button: validate mandatory fields, build data string, and show QR code
  document.getElementById('commitButton').addEventListener('click', () => {
    if (!validateMandatoryFields()) {
      alert('Please fill out all required fields:\n- Scouter Initials\n- Robot\n- Auto Start Position\n- Comments');
      return;
    }
    const dataStr = getFormDataString();
    showQRModal(dataStr);
  });
  
  // Reset form button
  document.getElementById('resetButton').addEventListener('click', resetForm);
  
  // Copy column names button
  document.getElementById('copyColumnNamesButton').addEventListener('click', copyColumnNames);
  
  // Modal close events
  document.getElementById('closeModal').addEventListener('click', closeQRModal);
  window.addEventListener('click', e => {
    if (e.target === document.getElementById('qrModal')) {
      closeQRModal();
    }
  });
  
  resetForm();
  updateTimerDisplay();
};
