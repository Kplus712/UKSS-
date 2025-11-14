/* offline-queue.js
   Responsibilities:
   - store tasks (register / vote) in localforage queue when offline or when write fails
   - sync the queue to Realtime DB when online
   - basic retry + dedupe by generated key where possible
*/

(function(){
  if (!window.localforage) {
    console.warn("localforage not found — include it before offline-queue.js");
  }

  // init localforage
  localforage.config({
    name: "ukss_offline",
    storeName: "queue"
  });

  const QUEUE_KEY = "offline_tasks_v1";

  async function readQueue(){
    const q = await localforage.getItem(QUEUE_KEY);
    return Array.isArray(q) ? q : [];
  }
  async function writeQueue(arr){
    await localforage.setItem(QUEUE_KEY, arr || []);
  }

  // Enqueue a task
  // task = { type: "register"|"vote", payload: {...}, firstName?:string, createdAt: ISOString }
  async function enqueueOfflineTask(task){
    try {
      task.createdAt = new Date().toISOString();
      const q = await readQueue();
      q.push(task);
      await writeQueue(q);
      console.log("Task queued offline:", task);
      // attempt immediate sync if we are online
      if (navigator.onLine) {
        setTimeout(()=> window.syncOfflineQueue && window.syncOfflineQueue(window.db), 700);
      }
      return true;
    } catch(err){
      console.error("enqueue failed", err);
      return false;
    }
  }

  // Sync queue: attempts to push each task to Realtime DB using provided db instance
  async function syncOfflineQueue(dbInstance){
    if (!navigator.onLine) return;
    if (!dbInstance) console.warn("syncOfflineQueue: db instance not provided. Pass Firebase DB object.");

    try {
      const q = await readQueue();
      if (!q || q.length === 0) {
        console.log("Offline queue empty.");
        return;
      }
      console.log("Syncing offline queue, tasks:", q.length);

      // We'll process FIFO
      for (let i = 0; i < q.length; i++){
        const task = q[i];
        try {
          if (!dbInstance) throw new Error("No DB instance");

          if (task.type === "register") {
            // generate an ID and write. Use the same approach as server — a best-effort unique key
            // create a key: firstname_lower + random
            const fname = (task.firstName||"user").toLowerCase().replace(/\s+/g,"");
            const key = fname + Math.floor(100 + Math.random() * 900) + "_" + Date.now().toString().slice(-4);
            // write to /voters/<key>
            await window.firebaseSet(dbInstance, "voters/" + key, task.payload);
            // optionally set localStorage for convenience if this device uses that user
            try {
              localStorage.setItem("voterID", key);
              localStorage.setItem("firstName", task.payload.firstName || "");
              localStorage.setItem("lastName", task.payload.lastName || "");
              localStorage.setItem("classSelect", task.payload.classSelect || "");
              localStorage.setItem("gender", task.payload.gender || "");
            } catch(e){}
          } else if (task.type === "vote") {
            // votes: write to /votes/<voterID> where voterID is expected in payload.voterID
            const v = task.payload || {};
            const vid = v.voterID;
            if (!vid) throw new Error("missing voterID for vote queue item");
            await window.firebaseSet(dbInstance, "votes/" + vid, v);
            // mark voter as voted
            await window.firebaseUpdate(dbInstance, "voters/" + vid, { hasVoted: true });
          } else {
            console.warn("Unknown offline task type:", task.type);
          }
          // If success, remove this task from queue by marking processed (we rebuild queue)
          q[i]._done = true;
        } catch(err){
          console.warn("Failed to process queued task:", err);
          // leave it in queue for next attempt
        }
      }

      // filter done tasks
      const remaining = q.filter(t => !t._done);
      await writeQueue(remaining);
      console.log("Offline sync done — remaining:", remaining.length);
      if (remaining.length === 0) {
        // notify UI
        try {
          const badge = document.getElementById("netStatus");
          if (badge) badge.textContent = "ONLINE";
        } catch(e){}
      }
    } catch(err){
      console.error("syncOfflineQueue failed:", err);
    }
  }

  // helper wrappers to use Realtime DB set/update without importing firebase again
  // We expect the calling page to pass `db` instance; these wrappers require that window has firebase functions
  async function firebaseSet(dbInstance, path, value){
    // attempt dynamic import of set/ref functions if not provided
    if (!window._firebase_wrappers_loaded) {
      // create wrappers that use the same version of firebase already loaded by page
      // assume getDatabase/set/ref are available via imports in page; else require caller to set window.firebaseSet
      if (typeof window.firebaseSet !== 'function') {
        // try to create using imported firebase on page (module scope); fall back to throw
        // The page that includes this script should also set window.firebaseSet and window.firebaseUpdate to wrappers
        throw new Error("firebaseSet not available. Ensure your page sets window.firebaseSet(db, path, value) wrapper.");
      }
    }
    return window.firebaseSet(dbInstance, path, value);
  }

  async function firebaseUpdate(dbInstance, path, value){
    if (typeof window.firebaseUpdate !== 'function') throw new Error("firebaseUpdate not available. Ensure your page sets window.firebaseUpdate(db, path, value) wrapper.");
    return window.firebaseUpdate(dbInstance, path, value);
  }

  // Expose functions
  window.enqueueOfflineTask = enqueueOfflineTask;
  window.syncOfflineQueue = syncOfflineQueue;

  // on network back online try to sync (if page provided db)
  window.addEventListener("online", () => {
    if (window.db && typeof window.syncOfflineQueue === "function") {
      setTimeout(()=> window.syncOfflineQueue(window.db), 800);
    }
  });

})();
