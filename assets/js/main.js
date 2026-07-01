const dialogOpener = document.getElementById("dialog-opener");
const dialogCloser = document.getElementById("dialog-closer");
const dialog = document.getElementById("dialog");
const overlay = document.getElementById("overlay");

const openUrlButton = document.getElementById("openUrl");
const searchYtButton = document.getElementById("searchYt");

const searchYtSection = document.getElementById("searchYtSection");

const globalSpinner = document.getElementById("global-loader");
const showGlobalSpinner = () => globalSpinner.style.display = "flex";
const hideGlobalSpinner = () => globalSpinner.style.display = "none";

const searchResultsDiv = document.getElementsByClassName("search-results")[0];

const hideDialog = () => {
    dialog.classList.remove("open");
    dialog.classList.add("closed");
}

const hideOverlay = () => {
    overlay.classList.remove("open");
    overlay.classList.add("closed");
}

dialogOpener.addEventListener('click', () => {
    dialog.classList.add("open");
    dialog.classList.remove("closed");

    overlay.classList.add("open");
    overlay.classList.remove("closed");
})

const closeDialog = () => {
    hideDialog();

    hideOverlay();

    openUrlButton.classList.add("active");
    searchYtButton.classList.remove("active");

    openUrlSection.classList.remove("closed");
    searchYtSection.classList.add("closed");
    searchResultsDiv.style.display = "none";

    // clear search results section
    searchResultsDiv.innerHTML = "";
}

document.addEventListener('click', e => {
    // click outside the dialog
    if (e.target != dialogOpener && !(e.target == dialog || dialog.contains(e.target))) {
        closeDialog();
    }
})

const addItemServer = async (video) => {
    const result = await fetch("http://localhost:8080/extract", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: video })
    })
    .then(res => res.json())
    .catch(_ => alert("Error getting video info"));

    const response = await fetch(`http://localhost:8080/extract/${result.id}`).catch(_ => alert("Error downloading file"));
    const total = result.filesize;

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        received += value.length;

        // const percent = Math.round((received / total) * 100);
        const percent = Math.round(received / total * 100);
        document.getElementById("progress").textContent = percent + "%";
    }

    const blob = new Blob(chunks, { type: "audio/mpeg" });

    // ui stuff
    hideGlobalSpinner();
    hideOverlay();
    document.getElementById("progress").textContent = "";

    const db = await openDatabase();
    const song = {
        id: result.id,
        title: result.title,
        size: (received / 1024 / 1024).toFixed(1),
        duration: result.duration
    }
    const file = {
        songId: result.id,
        blob: blob
    }
    const tx = db.transaction(['song', 'file'], "readwrite");
    const songStore = tx.objectStore('song');
    songStore.put(song);
    const fileStore = tx.objectStore('file');
    fileStore.put(file);

    document.querySelector(".playlist").innerHTML += `
        <div class="playlist-item" id="${result.id}">
            <div class="playlist-start">
                <img src="./assets/images/play.png" style="cursor: pointer;" onclick="javascript:openSong('${result.id}')" width="50" />
                <div class="details">
                    <h3>${result.title}</h3>
                    <span class="subtitle">${(received / 1024 / 1024).toFixed(1)}MB</span>
                </div>
            </div>
            <div>
                <span class="subtitle">${result.duration}</span>
                <div class="delete-icon" onclick="javascript:deleteSong('${result.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 1.2rem; height: 1.2rem">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </div>
            </div>
        </div>
    `;
}


// submit the inputted url
const openUrlSection = document.getElementById("openUrlSection");
openUrlSection.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get("url");
    if (url == "") {
        alert("Url is empty")
        return;
    }
    const videoId = url.split("=")[1];
    hideDialog();
    showGlobalSpinner();

    addItemServer("https://www.youtube.com/watch?v=" + videoId);
});


// search youtube
const performSearchYtButton = document.getElementById("searchYtBtn")
const searchInput = document.getElementById("searchInput")
const loadingImg = document.querySelector(".searchYtSection img");
performSearchYtButton.addEventListener('click', async e => {
    if (searchInput.value.length == 0) return;

    // start loading
    loadingImg.classList.add("loading");
    const searchResult = await fetch("http://localhost:8080/search?term=" + searchInput.value)
        .then(res => {
            // stop loading
            searchResultsDiv.style.display = "flex";
            loadingImg.classList.remove("loading");
            return res.json();
        })
        .catch(_ => {
            searchResultsDiv.style.display = "none";
            loadingImg.classList.remove("loading");
            alert("Error searching youtube or on server")
        })

    console.log(searchResult)

    searchResult.results.forEach(item => {
        searchResultsDiv.innerHTML += `
        <div class="playlist-item" onClick="javascript:downloadVideo(\`${item.id}\`, \`${item.title}\`)">
            <div class="playlist-start search">
                <img src="${item.thumbnail}" class="search-img" width="75" />
                <div class="details">
                    <h3>${item.title}</h3>
                    <span class="subtitle">${item.channel}</span>
                </div>
            </div>
            <div>
                <span class="subtitle">${item.duration}</span>
            </div>
        </div>
        `;
    });
})

const downloadVideo = async (videoId, title) => {
    if (confirm(`You wanna add ${title}?`)) {
        hideDialog();
        showGlobalSpinner();

        addItemServer("https://www.youtube.com/watch?v=" + videoId);
    }
}




/** TABS */

openUrlButton.addEventListener('click', () => {
    openUrlButton.classList.add("active");
    searchYtButton.classList.remove("active");

    openUrlSection.classList.remove("closed");
    searchYtSection.classList.add("closed");
})

searchYtButton.addEventListener('click', () => {
    openUrlButton.classList.remove("active");
    searchYtButton.classList.add("active");

    openUrlSection.classList.add("closed");
    searchYtSection.classList.remove("closed");
})
