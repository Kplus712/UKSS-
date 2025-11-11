let candidatesData = {};
let votes = JSON.parse(localStorage.getItem("votes")) || [];
let votedUsers = JSON.parse(localStorage.getItem("votedUsers")) || [];

// Load candidates.json dynamically
fetch("candidates.json")
  .then(res => res.json())
  .then(data => {
    candidatesData = data;
  })
  .catch(err => alert("Error loading candidates.json: " + err));

function startVoting(){
  const firstName = document.getElementById("firstName").value.trim();
  const middleName = document.getElementById("middleName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const userClass = document.getElementById("classSelect").value;

  if(!firstName || !lastName || !userClass){
    alert("Please fill all required fields!");
    return;
  }

  const voterID = `${firstName}_${middleName}_${lastName}_${userClass}`;
  if(votedUsers.includes(voterID)){
    alert("You have already voted!");
    return;
  }

  window.currentVoter = {firstName, middleName, lastName, class: userClass, id: voterID};
  document.getElementById("loginPage").style.display="none";
  document.getElementById("votingPage").style.display="block";

  renderCandidates("headBoyCandidates", candidatesData.headBoy);
  renderCandidates("generalSecretaryCandidates", candidatesData.generalSecretary);
}

function renderCandidates(containerId, candidates){
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  candidates.forEach(c=>{
    container.innerHTML += `
      <div class="candidate">
        <div style="display:flex; align-items:center;">
          <img src="${c.img}" alt="${c.name}">
          <span>${c.name}</span>
        </div>
        <input type="radio" name="${containerId}" value="${c.name}">
      </div>
    `;
  });
}

function submitVote(){
  const headBoyVote = document.querySelector('input[name="headBoyCandidates"]:checked');
  const generalSecretaryVote = document.querySelector('input[name="generalSecretaryCandidates"]:checked');

  if(!headBoyVote || !generalSecretaryVote){
    alert("Please vote for all positions!");
    return;
  }

  votes.push({
    voter: window.currentVoter,
    votes: {
      headBoy: headBoyVote.value,
      generalSecretary: generalSecretaryVote.value
    }
  });

  votedUsers.push(window.currentVoter.id);

  localStorage.setItem("votes", JSON.stringify(votes));
  localStorage.setItem("votedUsers", JSON.stringify(votedUsers));

  showResults();
}

function showResults(){
  document.getElementById("votingPage").style.display="none";
  document.getElementById("resultsPage").style.display="block";

  const container = document.getElementById("results");
  container.innerHTML = "";

  const allCandidates = [...candidatesData.headBoy, ...candidatesData.generalSecretary];
  const resultsData = {};
  allCandidates.forEach(c => resultsData[c.name] = {count:0, voters:[]});

  votes.forEach(v=>{
    resultsData[v.votes.headBoy].count +=1;
    resultsData[v.votes.headBoy].voters.push(v.voter);

    resultsData[v.votes.generalSecretary].count +=1;
    resultsData[v.votes.generalSecretary].voters.push(v.voter);
  });

  for(const [candidate, data] of Object.entries(resultsData)){
    let voterDetails = data.voters.map(v=>`${v.firstName} ${v.middleName} ${v.lastName} (${v.class})`).join(", ");
    container.innerHTML += `
      <p><strong>${candidate}</strong> - ${data.count} votes<br>
      Voters: ${voterDetails || "None"}</p><hr>
    `;
  }
}
