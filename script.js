// Load candidates dynamically
async function loadCandidates() {
  const response = await fetch("candidates.json");
  const data = await response.json();

  renderCandidates("headBoySection", data.headBoy);
  renderCandidates("generalSecretarySection", data.generalSecretary);
  renderOtherPositions(data.otherPositions);
}

function renderCandidates(containerId, candidates) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  candidates.forEach((c, i) => {
    container.innerHTML += `
      <div class="candidate">
        <img src="${c.image}" alt="${c.name}">
        <p><strong>${c.name}</strong></p>
        <input type="radio" name="${containerId}" value="${c.name}">
      </div>
    `;
  });
}

function renderOtherPositions(positions) {
  const container = document.getElementById("otherPositionsSection");
  container.innerHTML = "";
  positions.forEach((pos) => {
    let html = `<h3>${pos.position}</h3><div class="candidate-section">`;
    pos.candidates.forEach((c) => {
      html += `
        <div class="candidate">
          <img src="${c.image}" alt="${c.name}">
          <p><strong>${c.name}</strong></p>
          <input type="radio" name="${pos.position}" value="${c.name}">
        </div>`;
    });
    html += `</div>`;
    container.innerHTML += html;
  });
}

function startVoting() {
  const f = document.getElementById("firstName").value;
  const m = document.getElementById("middleName").value;
  const l = document.getElementById("lastName").value;
  const c = document.getElementById("classSelect").value;

  if (!f || !l || !c) return alert("Please fill all required fields!");

  window.currentVoter = { firstName: f, middleName: m, lastName: l, class: c };
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("votingPage").style.display = "block";
  loadCandidates();
}

function submitVote() {
  const headBoyVote = document.querySelector('input[name="headBoySection"]:checked');
  const generalSecretaryVote = document.querySelector('input[name="generalSecretarySection"]:checked');
  if (!headBoyVote || !generalSecretaryVote) return alert("Vote for all positions!");

  const votes = {
    headBoy: headBoyVote.value,
    generalSecretary: generalSecretaryVote.value,
  };

  const otherPositions = document.querySelectorAll('#otherPositionsSection h3');
  otherPositions.forEach((pos) => {
    const vote = document.querySelector(`input[name="${pos.textContent}"]:checked`);
    if (vote) votes[pos.textContent] = vote.value;
  });

  const voteData = {
    voter: window.currentVoter,
    votes,
    time: new Date().toISOString()
  };

  const votesRef = window.ref(window.db, "votes");
  window.push(votesRef, voteData).then(() => {
    alert("Vote submitted successfully!");
    document.getElementById("votingPage").style.display = "none";
    document.getElementById("resultsPage").style.display = "block";
    showResults();
  });
}

function showResults() {
  const resultsDiv = document.getElementById("results");
  const votesRef = window.ref(window.db, "votes");
  window.onValue(votesRef, (snapshot) => {
    const data = snapshot.val();
    resultsDiv.innerHTML = "";
    if (!data) return resultsDiv.innerHTML = "<p>No votes yet.</p>";

    Object.values(data).forEach((v) => {
      resultsDiv.innerHTML += `
        <p><strong>${v.voter.firstName} ${v.voter.lastName}</strong> (${v.voter.class}) voted:</p>
        <ul>${Object.entries(v.votes).map(([k, val]) => `<li>${k}: ${val}</li>`).join("")}</ul>
        <hr>
      `;
    });
  });
}
