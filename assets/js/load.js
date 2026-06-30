(async () => {
    const db = await openDatabase();

    const tx = db.transaction(["song"], "readonly");
    const store = tx.objectStore("song");

    const req = await store.getAll();

    req.onsuccess = (e) => {
        let htmlList = '';
        e.target.result.forEach(item => {
            htmlList += `<div class="playlist-item" onclick="javascript:openSong('${item.id}')">
                    <div class="playlist-start">
                        <img src="./assets/images/play.png" width="50" />
                        <div class="details">
                            <h3>${item.title}</h3>
                            <span class="subtitle">${item.size}MB</span>
                        </div>
                    </div>
                    <div>
                        <span class="subtitle">${item.duration}</span>
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

    const req = await fileStore.get(songId);
    req.onsuccess = (e) => {
        document.getElementById("audio-player").src = URL.createObjectURL(e.target.result.blob);
    };

    const songReq = await songStore.get(songId);
    songReq.onsuccess = (e) => {
        document.getElementById("player-title").innerHTML = e.target.result.title;
    };
}
