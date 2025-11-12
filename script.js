// =======================
//  UKSS Voting Functions
// =======================

// ✅ Fungua ukurasa wa voting
async function openVoting() {
  const f = document.getElementById("firstName").value.trim();
  const m = document.getElementById("middleName").value.trim();
  const l = document.getElementById("lastName").value.trim();
  const c = document.getElementById("classSelect").value;
  const g = document.getElementById("gender").value;

  if (!f || !l || !c || !g) {
    alert("⚠️ Please fill your details completely!");
    return;
  }

  // Unique voter ID
  const voterID = `${f}_${m}_${l}_${c}`.replace(/\s+/g, "_").toLowerCase();

  // Check if voter already exists in Firebase
  const { getDatabase, ref, get, child, set } = window.firebaseDatabase;
  const db = getDatabase();
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `voters/${voterID}`));

  if (snapshot.exists() && snapshot.val().hasVoted) {
    alert("⚠️ You have already voted. Each student can only vote once!");
    return;
  }

  // Save voter info locally
  localStorage.setItem("voterID", voterID);
  localStorage.setItem("firstName", f);
  localStorage.setItem("middleName", m);
  localStorage.setItem("lastName", l);
  localStorage.setItem("classSelect", c);
  localStorage.setItem("gender", g);

  // Save in Firebase voter record (for reference)
  await set(ref(db, "voters/" + voterID), {
    firstName: f,
    middleName: m,
    lastName: l,
    class: c,
    gender: g,
    hasVoted: false,
    createdAt: new Date().toISOString()
  });

  // Hide login section and show voting page
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("votingSection").style.display = "block";
}

// ✅ Kusubmit kura
async function submitVote() {
  const f = localStorage.getItem("firstName");
  const m = localStorage.getItem("middleName");
  const l = localStorage.getItem("lastName");
  const c = localStorage.getItem("classSelect");
  const g = localStorage.getItem("gender");
  const voterID = localStorage.getItem("voterID");

  const { getDatabase, ref, push, update, get, child, set } = window.firebaseDatabase;
  const db = getDatabase();
  const dbRef = ref(db);

  // Angalia kama voter ameisha piga
  const snapshot = await get(child(dbRef, `voters/${voterID}`));
  if (snapshot.exists() && snapshot.val().hasVoted) {
    alert("⚠️ You have already voted!");
    return;
  }

  // Votes
  const headBoyVote = document.querySelector('input[name="headBoyCandidates"]:checked');
  const genSecVote = document.querySelector('input[name="generalSecretaryCandidates"]:checked');

  if (!headBoyVote || !genSecVote) {
    alert("⚠️ Please vote for all positions!");
    return;
  }

  const date = new Date();
  const timestamp = date.toLocaleString("en-GB", { hour12: false });

  const voteData = {
    voter: { firstName: f, middleName: m, lastName: l, class: c, gender: g },
    votes: {
      headBoy: headBoyVote.value,
      generalSecretary: genSecVote.value
    },
    timestamp
  };

  // Save to Firebase
  await push(ref(db, "votes"), voteData);
  await update(ref(db, "voters/" + voterID), { hasVoted: true, votedAt: timestamp });

  // Success message
  const title = g === "Male" ? "MR" : "MRS";
  alert(`✅ ${title} ${f.toUpperCase()} (${c}) — your vote was recorded successfully on ${timestamp}.`);

  // Clear section and thank user
  document.getElementById("votingSection").innerHTML = "<h2>✅ Thank you for voting!</h2>";
}

// ✅ Admin login
function adminLogin() {
  const password = prompt("Enter Admin Password:");
  if (password === "ukss2025") {
    window.location.href = "admin.html";
  } else if (password) {
    alert("❌ Incorrect password!");
  }
}

// ✅ Connect Firebase (utility reference)
window.firebaseDatabase = {
  getDatabase: firebase.database,
  ref: firebase.database().ref,
  get: firebase.database().get,
  set: firebase.database().set,
  push: firebase.database().push,
  child: firebase.database().child,
  update: firebase.database().update
};
