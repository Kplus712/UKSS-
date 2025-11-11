// ---------- UNIVERSAL FIREBASE INITIALIZATION ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAIabK86PrfHfzNVciI2K7aRjb8VoWyA7A",
  authDomain: "ukss-voting-system.firebaseapp.com",
  databaseURL: "https://ukss-voting-system-default-rtdb.firebaseio.com",
  projectId: "ukss-voting-system",
  storageBucket: "ukss-voting-system.firebasestorage.app",
  messagingSenderId: "525528255065",
  appId: "1:525528255065:web:97c4e55d2984acc718bf48",
  measurementId: "G-14ZV9E3X7C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --------------------------------------------------------
// LOGIN PAGE (index.html)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const middleName = document.getElementById("middleName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const studentClass = document.getElementById("class").value;
    const gender = document.getElementById("gender").value;

    if (!firstName || !lastName || !studentClass || !gender) {
      alert("Please fill all required fields!");
      return;
    }

    localStorage.setItem("firstName", firstName);
    localStorage.setItem("middleName", middleName);
    localStorage.setItem("lastName", lastName);
    localStorage.setItem("studentClass", studentClass);
    localStorage.setItem("gender", gender);

    window.location.href = "voting.html";
  });
}

// --------------------------------------------------------
// VOTING PAGE (voting.html)
const voteForm = document.getElementById("voteForm");
if (voteForm) {
  voteForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const firstName = localStorage.getItem("firstName");
    const middleName = localStorage.getItem("middleName");
    const lastName = localStorage.getItem("lastName");
    const studentClass = localStorage.getItem("studentClass");
    const gender = localStorage.getItem("gender");

    const fullName = `${firstName} ${middleName} ${lastName}`.trim();

    // Collect votes
    const voteData = {
      voterName: fullName,
      class: studentClass,
      gender: gender,
      headBoy: document.querySelector('input[name="headBoy"]:checked').value,
      headGirl: document.querySelector('input[name="headGirl"]:checked').value,
      generalSec: document.querySelector('input[name="generalSec"]:checked').value,
      discipline: document.querySelector('input[name="discipline"]:checked').value,
      sports: document.querySelector('input[name="sports"]:checked').value,
      academic: document.querySelector('input[name="academic"]:checked').value,
      environment: document.querySelector('input[name="environment"]:checked').value,
      food: document.querySelector('input[name="food"]:checked').value,
      timestamp: new Date().toLocaleString(),
    };

    // Save vote
    push(ref(db, "votes/"), voteData)
      .then(() => {
        const title = gender === "Male" ? "MR" : "MRS";
        alert(`${title} ${firstName.toUpperCase()} voted successfully!`);
        window.location.href = "index.html";
      })
      .catch((err) => {
        alert("Error submitting vote: " + err.message);
      });
  });
}

// --------------------------------------------------------
// ADMIN PAGE (admin.html)
const resultsContainer = document.getElementById("resultsContainer");
if (resultsContainer) {
  const votesRef = ref(db, "votes/");

  onValue(votesRef, (snapshot) => {
    const data = snapshot.val();
    resultsContainer.innerHTML = "";

    if (!data) {
      resultsContainer.innerHTML = "<p>No votes yet.</p>";
      return;
    }

    // Aggregate vote counts
    const counts = {};

    Object.values(data).forEach((vote) => {
      for (let [key, value] of Object.entries(vote)) {
        if (
          ["headBoy", "headGirl", "generalSec", "discipline", "sports", "academic", "environment", "food"].includes(key)
        ) {
          counts[value] = (counts[value] || 0) + 1;
        }
      }
    });

    // Display total results
    const summaryDiv = document.createElement("div");
    summaryDiv.innerHTML = "<h2>📊 Vote Totals</h2>";
    for (let [candidate, total] of Object.entries(counts)) {
      summaryDiv.innerHTML += `<p><strong>${candidate}:</strong> ${total} votes</p>`;
    }
    resultsContainer.appendChild(summaryDiv);

    // Full detailed voter list
    const detailDiv = document.createElement("div");
    detailDiv.innerHTML = "<h2>🧾 Detailed Votes</h2>";
    Object.values(data).forEach((vote) => {
      detailDiv.innerHTML += `
        <div class="voteDetail">
          <p><strong>${vote.voterName}</strong> (${vote.class}, ${vote.gender})</p>
          <ul>
            <li>Head Boy: ${vote.headBoy}</li>
            <li>Head Girl: ${vote.headGirl}</li>
            <li>General Sec: ${vote.generalSec}</li>
            <li>Discipline: ${vote.discipline}</li>
            <li>Sports: ${vote.sports}</li>
            <li>Academic: ${vote.academic}</li>
            <li>Environment: ${vote.environment}</li>
            <li>Food & Health: ${vote.food}</li>
            <li><em>${vote.timestamp}</em></li>
          </ul>
        </div>
        <hr>
      `;
    });
    resultsContainer.appendChild(detailDiv);
  });

  // Download results as CSV
  document.getElementById("downloadCSV").addEventListener("click", () => {
    const votesRef = ref(db, "votes/");
    onValue(votesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        alert("No votes to download!");
        return;
      }
      let csv = "Name,Class,Gender,Head Boy,Head Girl,General Sec,Discipline,Sports,Academic,Environment,Food,Timestamp\n";
      Object.values(data).forEach((v) => {
        csv += `"${v.voterName}","${v.class}","${v.gender}","${v.headBoy}","${v.headGirl}","${v.generalSec}","${v.discipline}","${v.sports}","${v.academic}","${v.environment}","${v.food}","${v.timestamp}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "UKSS_Voting_Results.csv";
      a.click();
    });
  });

  // Delete all votes
  document.getElementById("deleteVotes").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all votes?")) {
      remove(ref(db, "votes/"))
        .then(() => alert("All votes deleted successfully!"))
        .catch((err) => alert("Error deleting votes: " + err.message));
    }
  });
}
