function openVoting() {
  const f = document.getElementById("firstName").value.trim();
  const l = document.getElementById("lastName").value.trim();
  const c = document.getElementById("classSelect").value;
  if (!f || !l || !c) return alert("Please fill your details completely!");

  document.getElementById("loginSection").style.display = "none";
  document.getElementById("votingSection").style.display = "block";
}

function submitVote() {
  const firstName = document.getElementById("firstName").value;
  const middleName = document.getElementById("middleName").value;
  const lastName = document.getElementById("lastName").value;
  const userClass = document.getElementById("classSelect").value;

  const headBoyVote = document.querySelector('input[name="headBoyCandidates"]:checked');
  const genSecVote = document.querySelector('input[name="generalSecretaryCandidates"]:checked');

  if (!headBoyVote || !genSecVote) {
    alert("Please vote for all positions!");
    return;
  }

  const voteData = {
    voter: { firstName, middleName, lastName, class: userClass },
    votes: {
      headBoy: headBoyVote.value,
      generalSecretary: genSecVote.value
    },
    timestamp: new Date().toISOString()
  };

  const votesRef = window.ref(window.db, "votes");
  window.push(votesRef, voteData)
    .then(() => {
      alert("✅ Vote submitted successfully!");
      document.getElementById("votingSection").innerHTML = "<h2>Thank you for voting!</h2>";
    })
    .catch(err => alert("Error: " + err.message));
}

function adminLogin() {
  const password = prompt("Enter Admin Password:");
  if (password === "ukss2025") {
    window.location.href = "admin.html";
  } else if (password) {
    alert("❌ Incorrect password!");
  }
}
