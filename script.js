/* script.js
   Make sure index.html included firebase module and exported:
   window.firebaseDB, window.fbRef, window.fbPush, window.fbSet, window.fbOnValue, window.fbGet, window.fbChild
*/

/* --------------------------
   CANDIDATES (editable area)
   Replace names/images as needed (images should be in /images/ or external URLs)
   -------------------------- */
const CANDIDATES = {
  headBoy: [
    { name: "John Mussa", image: "images/headboy1.jpg", gender: "male" },
    { name: "David Peter", image: "images/headboy2.jpg", gender: "male" }
  ],
  headGirl: [
    { name: "Anna Joseph", image: "images/headgirl1.jpg", gender: "female" },
    { name: "Grace Martin", image: "images/headgirl2.jpg", gender: "female" }
  ],
  generalSecretary: [
    { name: "George Ally", image: "images/sec_boy.jpg" },
    { name: "Mary Kelvin", image: "images/sec_girl.jpg" }
  ],
  otherPositions: [
    { position: "Sports Captain", candidates: [{name:"Elvis David", image:"images/sports1.jpg"},{name:"Anna Grace", image:"images/sports2.jpg"}] },
    { position: "Academic Prefect", candidates: [{name:"Victor John", image:"images/acc1.jpg"},{name:"Mary Thomas", image:"images/acc2.jpg"}] },
    { position: "Discipline Prefect", candidates: [{name:"Peter Frank", image:"images/discip1.jpg"},{name:"Lucy Daniel", image:"images/discip2.jpg"}] },
    { position: "Health & Sanitation Prefect", candidates: [{name:"Joseph Musa", image:"images/health1.jpg"},{name:"Flora John", image:"images/health2.jpg"}] },
    { position: "Entertainment Prefect", candidates: [{name:"Rosy Alan", image:"images/ent1.jpg"},{name:"Sammy Blue", image:"images/ent2.jpg"}] }
  ]
};

/* --------------------------
   Utility functions
   -------------------------- */
function el(id){ return document.getElementById(id); }
function sanitizeId(s){ return s.replace(/\s+/g,"_").replace(/[^A-Za-z0-9_]/g,""); }

/* --------------------------
   Render candidates into DOM
   -------------------------- */
function renderAllCandidates(){
  // head boy list (left)
  const hb = el("headBoyList"); hb.innerHTML = "";
  CANDIDATES.headBoy.forEach((c,i)=>{
    hb.innerHTML += candidateCard("headBoyCandidates", c.name, c.image, {gender: "male"});
  });

  // head girl (right)
  const hg = el("headGirlList"); hg.innerHTML = "";
  CANDIDATES.headGirl.forEach((c,i)=>{
    hg.innerHTML += candidateCard("headGirlCandidates", c.name, c.image, {gender: "female"});
  });

  // general secretary (single)
  const gs = el("generalSecretaryList"); gs.innerHTML = "";
  CANDIDATES.generalSecretary.forEach(c=>{
    gs.innerHTML += candidateCard("generalSecretaryCandidates", c.name, c.image, {});
  });

  // other positions
  const other = el("otherPositionsArea"); other.innerHTML = "";
  CANDIDATES.otherPositions.forEach(pos=>{
    const pid = sanitizeId(pos.position);
    let html = `<div class="pos-block"><h4>${pos.position}</h4><div class="candidates-row">`;
    pos.candidates.forEach(c=>{
      html += candidateCard(pid, c.name, c.image, {});
    });
    html += `</div></div>`;
    other.innerHTML += html;
  });
}

function candidateCard(radioName, name, img, attrs){
  const attrGender = attrs.gender ? `data-gender="${attrs.gender}"` : "";
  // radioName used as name attribute; for others we use sanitized position id
  return `
    <div class="candidate">
      <img src="${img}" alt="${name}" />
      <div class="candidate-info">
        <div class="candidate-name">${name}</div>
        <label class="radio-label">
          <input type="radio" name="${radioName}" value="${name}" ${attrGender}/>
          Select
        </label>
      </div>
    </div>
  `;
}

/* --------------------------
   Voting flow
   -------------------------- */
let currentVoter = null;

async function startVoting(){
  const first = el("firstName").value.trim();
  const middle = el("middleName").value.trim();
  const last = el("lastName").value.trim();
  const klass = el("classSelect").value;
  const gender = el("genderSelect").value;

  if(!first || !last || !klass || !gender) return alert("Tafadhali jaza First name, Last name, class na gender.");

  // create voter object and ID (used to prevent duplicate votes)
  const voterID = `${first}_${middle}_${last}_${klass}`.toLowerCase().replace(/\s+/g,"_");
  currentVoter = { first, middle, last, class: klass, gender, id: voterID };

  // check whether voter has already voted (by reading /voters/{voterID})
  const db = window.firebaseDB;
  const votersRef = window.fbRef(db, `voters/${voterID}`);

  try {
    const snapshot = await window.fbGet? window.fbGet(window.fbRef(db), `voters/${voterID}`) : null;
    // note: older SDK usage: use get(child(ref(db), `voters/${voterID}`))
    // we'll attempt get via fbGet + fbChild for compatibility if provided
  } catch(e){
    // ignore here, we'll check below by onValue once render, but better to use a direct read
  }

  // simpler: read voters node once using onValue + immediate unsubscribe
  // but modular onValue is subscription; we'll use fbGet & fbChild if present
  try {
    const dbRef = window.fbRef(window.firebaseDB);
    const snap = await window.fbGet(window.fbChild(dbRef, `voters/${voterID}`));
    if(snap && snap.exists && snap.exists()){
      alert("Umeshatokea umevota tayari. Hauruhusiwi kupiga kura mara mbili.");
      return;
    }
  } catch(err){
    // if fbGet not available in exported object, fall back to loading all voters (not optimal)
    // but we will proceed and allow; for robust setup make sure fbGet exported from index.html
    console.warn("Could not check voters node (fbGet missing). Proceeding — ensure firebase read rules allow reads.");
  }

  // render voting page
  el("loginSection").style.display = "none";
  el("votingSection").style.display = "block";
  renderAllCandidates();
}

/* --------------------------
   Validations: require 1 male headboy and 1 female headgirl selection
   -------------------------- */
function validateHeadSelections(){
  // head boy (male) must have one selected
  const hb = document.querySelector('input[name="headBoyCandidates"]:checked');
  const hg = document.querySelector('input[name="headGirlCandidates"]:checked');

  if(!hb){
    alert("Tafadhali chagua Head Boy mmoja upande wa kushoto.");
    return false;
  }
  if(!hg){
    alert("Tafadhali chagua Head Girl mmoja upande wa kulia.");
    return false;
  }
  return true;
}

/* --------------------------
   Submit vote (write to Firebase)
   Writes:
     /votes/{pushId} => vote object
     /voters/{voterID} => { voteId, timestamp }
   -------------------------- */
async function submitVote(){
  if(!currentVoter) return alert("Tafadhali jaza details kwanza.");

  // validate head selections
  if(!validateHeadSelections()) return;

  // gather votes
  const headBoy = document.querySelector('input[name="headBoyCandidates"]:checked')?.value || null;
  const headGirl = document.querySelector('input[name="headGirlCandidates"]:checked')?.value || null;
  const genSec = document.querySelector('input[name="generalSecretaryCandidates"]:checked')?.value || null;

  if(!headBoy || !headGirl || !genSec){
    alert("Tafadhali chagua kwa ajili ya Head Boy, Head Girl na General Secretary.");
    return;
  }

  // other positions
  const otherVotes = {};
  CANDIDATES.otherPositions.forEach(pos=>{
    const pid = sanitizeId(pos.position);
    const val = document.querySelector(`input[name="${pid}"]:checked`)?.value || null;
    if(val) otherVotes[pos.position] = val;
  });

  // final votes object
  const votesObj = {
    headBoy,
    headGirl,
    generalSecretary: genSec,
    ...otherVotes
  };

  // create payload
  const payload = {
    voter: currentVoter,
    votes: votesObj,
    timestamp: new Date().toISOString()
  };

  const db = window.firebaseDB;
  const votesRef = window.fbRef(db, "votes");

  try {
    // check again whether voter exists
    const voterRef = window.fbRef(db, `voters/${currentVoter.id}`);
    const snap = await window.fbGet ? await window.fbGet(window.fbChild(window.fbRef(db), `voters/${currentVoter.id}`)) : null;
    if(snap && snap.exists && snap.exists()){
      alert("Umeshatokea umafanya kura tayari — system haikuruhusu kupiga tena.");
      return;
    }

    // push vote
    const newVoteRef = await window.fbPush(votesRef, payload);
    // register voter to prevent double vote
    await window.fbSet(window.fbRef(db, `voters/${currentVoter.id}`), { voteId: newVoteRef.key || null, timestamp: new Date().toISOString() });

    // Success message uses MR/MRS + firstname: example "MR Juma ume piga kura kikamilifu!"
    const title = currentVoter.gender === "male" ? "MR" : "MRS";
    const msg = `${title} ${currentVoter.first} ume piga kura kikamilifu!`;
    el("voteMessage").textContent = msg;
    alert(msg);

    // optionally show a thank-you screen
    el("votingSection").style.display = "none";
    el("loginSection").style.display = "none";

  } catch(err){
    console.error(err);
    alert("Kuna tatizo katika kuhifadhi kura: " + (err.message || err));
  }
}

/* Cancel voting (go back) */
function cancelVoting(){
  el("votingSection").style.display = "none";
  el("loginSection").style.display = "block";
}

/* --------------------------
   Auto-run: render candidates (if someone opens voting directly)
   -------------------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  // just render initial candidates in case admin opens page directly
  renderAllCandidates();
});

/* --------------------------
   Admin login redirect (simple)
   -------------------------- */
function adminLogin(){
  const pwd = prompt("Enter Admin Password:");
  if(!pwd) return;
  // change password here if needed
  if(pwd === "ukss2025"){
    window.location.href = "admin.html";
  } else {
    alert("Password sio sahihi.");
  }
}

// expose adminLogin globally (index.html calls it)
window.startVoting = startVoting;
window.submitVote = submitVote;
window.cancelVoting = cancelVoting;
window.adminLogin = adminLogin;
