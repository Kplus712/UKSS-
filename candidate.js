// ==========================
// UKSS VOTING CANDIDATES DATA
// ==========================

// Taarifa za wagombea (utaweza kubadilisha majina, picha, bio baadaye)
export const candidates = [
  {
    id: "headboy1",
    name: "John Mwasiti",
    position: "Head Boy",
    image: "images/headboy1.jpg",
    bio: "A responsible and disciplined student aiming to improve student communication and unity.",
  },
  {
    id: "headboy2",
    name: "Peter Mwenda",
    position: "Head Boy",
    image: "images/headboy2.jpg",
    bio: "Dedicated to promoting academic excellence and leadership among students.",
  },
  {
    id: "headgirl1",
    name: "Aisha Komba",
    position: "Head Girl",
    image: "images/headgirl1.jpg",
    bio: "Focused on ensuring the voices of all female students are heard and respected.",
  },
  {
    id: "headgirl2",
    name: "Neema Lusekelo",
    position: "Head Girl",
    image: "images/headgirl2.jpg",
    bio: "Passionate about student welfare, teamwork, and cleanliness in the school compound.",
  },
  {
    id: "sec_male",
    name: "David Mwakalinga",
    position: "General Secretary",
    image: "images/sec_male.jpg",
    bio: "Ready to coordinate school programs efficiently and enhance communication flow.",
  },
  {
    id: "sec_female",
    name: "Maria Andrew",
    position: "General Secretary",
    image: "images/sec_female.jpg",
    bio: "Determined to promote transparency, responsibility, and collaboration among students.",
  },
  {
    id: "discipline_male",
    name: "Jonas Mollel",
    position: "Discipline Prefect",
    image: "images/discipline_male.jpg",
    bio: "Firm yet fair, ensuring discipline and respect among students while upholding school values.",
  },
  {
    id: "discipline_female",
    name: "Grace Mwita",
    position: "Discipline Prefect",
    image: "images/discipline_female.jpg",
    bio: "Encouraging positive behaviour and unity within all school activities.",
  }
];

// ==========================
// MODAL LOGIC - VIEW PROFILE
// ==========================
export function openProfile(id) {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return;

  const modal = document.getElementById("profileModal");
  const content = document.getElementById("profileContent");

  content.innerHTML = `
    <img src="${candidate.image}" alt="${candidate.name}">
    <h2>${candidate.name}</h2>
    <h4>${candidate.position}</h4>
    <p>${candidate.bio}</p>
    <div class="admin-upload" id="upload_${candidate.id}">
      <p>🔒 Admin only: Upload new photo/bio here (coming soon)</p>
    </div>
    <button class="close-btn" onclick="closeModal()">Close</button>
  `;

  modal.style.display = "flex";
}

// ==========================
// CLOSE MODAL FUNCTION
// ==========================
export function closeModal() {
  document.getElementById("profileModal").style.display = "none";
}

// ==========================
// AUTO-CLOSE WHEN CLICK OUTSIDE
// ==========================
window.addEventListener("click", function (event) {
  const modal = document.getElementById("profileModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
