(async () => {
    const db = await openDatabase();

    const tx = db.transaction(["song"], "readonly");
    const store = tx.objectStore("song");

    const req = store.getAll();

    req.onsuccess = (e) => {
        let htmlList = '';
        e.target.result.forEach(item => {
            htmlList += `<div class="playlist-item" id="${item.id}">
                    <div class="playlist-start">
                        <img src="./assets/images/play.png" style="cursor: pointer;" onclick="javascript:openSong('${item.id}')" width="50" />
                        <div class="details">
                            <h3>${item.title}</h3>
                            <span class="subtitle">${item.size}MB</span>
                        </div>
                    </div>
                    <div>
                        <div class="subtitle">${item.duration}</div>
                        <div class="delete-icon" onclick="javascript:deleteSong('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 1.2rem; height: 1.2rem">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </div>
                    </div>
                </div>
            `;
        });
        document.getElementById("playlist").innerHTML = htmlList;
    };
})();

const openSong = async (songId) => {
    const db = await openDatabase();

    const tx = db.transaction(['song', 'file'], "readonly");
    const fileStore = tx.objectStore("file");
    const songStore = tx.objectStore("song");

    const req = fileStore.get(songId);
    req.onsuccess = (e) => {
        document.getElementById("audio-player").src = URL.createObjectURL(e.target.result.blob);
    };

    const songReq = songStore.get(songId);
    songReq.onsuccess = (e) => {
        document.getElementById("player-title").innerHTML = e.target.result.title;
    };
}

const deleteSong = async (songId) => {
    if (confirm("Are you sure you want to remove this song?")) {
        const db = await openDatabase();

        const tx = db.transaction(['song', 'file'], "readwrite");
        const fileStore = tx.objectStore("file");
        const songStore = tx.objectStore("song");

        songStore.delete(songId);
        fileStore.delete(songId);

        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
            tx.onabort = reject;
        });

        document.getElementById(songId).remove();
    }
}
