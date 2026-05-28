// =======================================
// FIXED APP.JS
// Reason:
// Failed to load videos because API key not added
// Paste your real API key below
// =======================================

const YT_API_KEY = "AIzaSyDv5Mq9HOjHhmDlUU689g6FfFVAZllGD9Y";
const API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_RESULTS = 12;
const DEFAULT_REGION = "IN";

const videoGrid = document.querySelector(".video-grid");
const searchInput = document.querySelector(".search-bar");
const searchButton = document.querySelector(".search-button");
const categoryButtons = document.querySelectorAll(".category");
const sidebarButtons = document.querySelectorAll(".sidebar-link");
const shortsRow = document.querySelector("#shorts-row");

let nextPageToken = "";
let currentMode = "trending";
let currentSearch = "";


// ---------------- STATUS ----------------

function showStatus(msg, type="info"){
  videoGrid.innerHTML = `
    <div class="status-banner ${type}">
      ${msg}
    </div>
  `;
}


// ---------------- API FETCH ----------------

async function getData(url){

  const response = await fetch(url);
  const data = await response.json();

  if(!response.ok || data.error){
    console.log(data);
    throw new Error("API Error");
  }

  return data;
}


// ---------------- FORMAT ----------------

function formatViews(num){

  num = Number(num);

  if(num >= 1000000){
    return (num/1000000).toFixed(1) + "M views";
  }

  if(num >= 1000){
    return (num/1000).toFixed(1) + "K views";
  }

  return num + " views";
}

function timeAgo(date){

  const old = new Date(date);
  const now = new Date();

  const days = Math.floor((now-old)/86400000);

  if(days > 365) return Math.floor(days/365)+" years ago";
  if(days > 30) return Math.floor(days/30)+" months ago";
  if(days > 0) return days+" days ago";

  return "Today";
}

function duration(iso){

  const match = iso.match(/PT(\d+M)?(\d+S)?/);

  if(!match) return "";

  let m = match[1] ? match[1].replace("M","") : "0";
  let s = match[2] ? match[2].replace("S","") : "00";

  return `${m}:${s.padStart(2,"0")}`;
}


// ---------------- VIDEO CARD ----------------

function createCard(video){

  const title = video.snippet.title;
  const channel = video.snippet.channelTitle;
  const views = formatViews(video.statistics.viewCount);
  const date = timeAgo(video.snippet.publishedAt);
  const thumb = video.snippet.thumbnails.high.url;
  const time = duration(video.contentDetails.duration);
  const id = video.id;

  return `

  <div class="video-preview">

    <div class="thumbnail-row">

      <a href="https://www.youtube.com/watch?v=${id}" target="_blank">
        <img class="thumbnail" src="${thumb}">
      </a>

      <div class="video-time">${time}</div>

    </div>

    <div class="video-info-grid">

      <div>
        <img class="profile"
        src="Images/headericons/YouTubprofile.jpg">
      </div>

      <div>
        <p class="video-title">${title}</p>
        <p class="video-author">${channel}</p>
        <p class="video-stats">${views} • ${date}</p>
      </div>

    </div>

  </div>

  `;
}


// ---------------- SHOW VIDEOS ----------------

function showVideos(videos, append=false){

  if(!append){
    videoGrid.innerHTML = "";
  }

  videos.forEach(video=>{
    videoGrid.innerHTML += createCard(video);
  });
}


// ---------------- TRENDING ----------------

async function loadTrending(append=false){

  try{

    if(!YT_API_KEY.includes("AIza")){
      showStatus("Add real YouTube API key in app.js", "error");
      return;
    }

    if(!append){
      showStatus("Loading videos...");
    }

    let url =
      `${API_BASE}/videos?part=snippet,contentDetails,statistics` +
      `&chart=mostPopular` +
      `&regionCode=${DEFAULT_REGION}` +
      `&maxResults=${MAX_RESULTS}` +
      `&key=${YT_API_KEY}`;

    if(nextPageToken){
      url += `&pageToken=${nextPageToken}`;
    }

    const data = await getData(url);

    nextPageToken = data.nextPageToken || "";

    showVideos(data.items, append);

  }catch(error){

    showStatus("Failed to load videos", "error");
  }
}


// ---------------- SEARCH ----------------

async function searchVideos(text, append=false){

  try{

    if(!append){
      showStatus("Searching...");
    }

    let url =
      `${API_BASE}/search?part=snippet&type=video` +
      `&maxResults=${MAX_RESULTS}` +
      `&q=${text}` +
      `&key=${YT_API_KEY}`;

    if(nextPageToken){
      url += `&pageToken=${nextPageToken}`;
    }

    const searchData = await getData(url);

    nextPageToken = searchData.nextPageToken || "";

    const ids = searchData.items.map(item=>item.id.videoId).join(",");

    const details =
      `${API_BASE}/videos?part=snippet,contentDetails,statistics` +
      `&id=${ids}` +
      `&key=${YT_API_KEY}`;

    const full = await getData(details);

    showVideos(full.items, append);

  }catch{
    showStatus("Search failed", "error");
  }
}


// ---------------- SEARCH CLICK ----------------

function doSearch(){

  const text = searchInput.value.trim();

  nextPageToken = "";

  if(text===""){
    currentMode = "trending";
    loadTrending();
  }else{
    currentMode = "search";
    currentSearch = text;
    searchVideos(text);
  }
}

searchButton.addEventListener("click", doSearch);

searchInput.addEventListener("keydown", function(e){
  if(e.key==="Enter"){
    doSearch();
  }
});


// ---------------- CATEGORY ----------------

categoryButtons.forEach(btn=>{

  btn.addEventListener("click", function(){

    categoryButtons.forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");

    const text = btn.textContent.trim();

    nextPageToken = "";

    if(text==="All"){
      loadTrending();
    }else{
      searchInput.value = text;
      currentSearch = text;
      currentMode = "search";
      searchVideos(text);
    }

  });

});


// ---------------- SIDEBAR ----------------

sidebarButtons.forEach(btn=>{

  btn.addEventListener("click", function(){

    sidebarButtons.forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");

    const page = btn.dataset.page;

    nextPageToken = "";

    if(page==="home") loadTrending();
    if(page==="explore") searchVideos("Trending");
    if(page==="subscriptions") searchVideos("Technology");
    if(page==="music") searchVideos("Music");
    if(page==="library") searchVideos("Coding");

    if(page==="shorts"){
      document.querySelector(".shorts-section")
      .scrollIntoView({behavior:"smooth"});
    }

  });

});


// ---------------- SHORTS ----------------

function loadShorts(){

  if(!shortsRow) return;

  shortsRow.innerHTML = `

  <div class="short-card">
    <img class="short-thumb"
    src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg">
    <p class="short-title">Funny Short Video</p>
  </div>

  <div class="short-card">
    <img class="short-thumb"
    src="https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg">
    <p class="short-title">Travel Short</p>
  </div>

  <div class="short-card">
    <img class="short-thumb"
    src="https://i.ytimg.com/vi/tgbNymZ7vqY/hqdefault.jpg">
    <p class="short-title">Gaming Short</p>
  </div>

  `;
}


// ---------------- INFINITE SCROLL ----------------

let loading = false;

window.addEventListener("scroll", async function(){

  if(loading) return;

  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 500){

    loading = true;

    if(currentMode==="trending"){
      await loadTrending(true);
    }

    if(currentMode==="search"){
      await searchVideos(currentSearch,true);
    }

    loading = false;
  }

});


// ---------------- START ----------------

loadTrending();

// ==========================================
// ADD THIS TO YOUR app.js
// Features:
// ✅ Shorts at top
// ✅ Horizontal side scroll shorts
// ✅ Show more shorts button
// ✅ 3 lines menu expands sidebar
// ==========================================


// ---------------- SELECT ----------------

const menuBtn = document.querySelector(".menu");
const sidebar = document.querySelector(".sidebar");

// ==========================================
// 1. SHORTS TOP MOVE
// ==========================================

const shortsSection = document.querySelector(".shorts-section");

if(shortsSection){
  const mainContent = document.querySelector(".main-content");
  if(mainContent){
    mainContent.insertBefore(shortsSection, mainContent.firstChild);
  }
}

// ==========================================
// 2. LOAD MANY SHORTS
// ==========================================

function loadShorts(){

  if(!shortsRow) return;

  let html = "";

  const shorts = [

    ["https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg","Travel Short"],
    ["https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg","Funny Short"],
    ["https://i.ytimg.com/vi/tgbNymZ7vqY/hqdefault.jpg","Gaming Short"],
    ["https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg","Nature Short"],
    ["https://i.ytimg.com/vi/oHg5SJYRHA0/hqdefault.jpg","Music Short"],
    ["https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg","Dance Short"],
    ["https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg","Live Short"],
    ["https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg","Trend Short"]

  ];

  shorts.forEach(item => {

    html += `

    <div class="short-card">

      <img class="short-thumb"
      src="${item[0]}">

      <p class="short-title">${item[1]}</p>

    </div>

    `;

  });

  shortsRow.innerHTML = html;
}

loadShorts();


// ==========================================
// 3. SHOW MORE SHORTS BUTTON
// ==========================================

const shortsSectionDiv = document.querySelector(".shorts-section");

if(shortsSectionDiv){

  const btn = document.createElement("button");

  btn.innerText = "More Shorts";
  btn.className = "more-shorts-btn";

  shortsSectionDiv.appendChild(btn);

  btn.addEventListener("click", function(){

    loadShorts();

    shortsRow.scrollBy({
      left: 500,
      behavior: "smooth"
    });

  });

}


// ==========================================
// 4. SIDEBAR EXPAND COLLAPSE
// ==========================================

let openMenu = false;

menuBtn.addEventListener("click", function(){

  openMenu = !openMenu;

  if(openMenu){

    sidebar.style.width = "220px";

    document.querySelectorAll(".sidebar-link div")
    .forEach(text => {
      text.style.display = "block";
      text.style.fontSize = "14px";
    });

    document.querySelectorAll(".sidebar-link")
    .forEach(link => {
      link.style.flexDirection = "row";
      link.style.justifyContent = "flex-start";
      link.style.gap = "18px";
      link.style.paddingLeft = "20px";
    });

  }else{

    sidebar.style.width = "72px";

    document.querySelectorAll(".sidebar-link div")
    .forEach(text => {
      text.style.display = "block";
      text.style.fontSize = "10px";
    });

    document.querySelectorAll(".sidebar-link")
    .forEach(link => {
      link.style.flexDirection = "column";
      link.style.justifyContent = "center";
      link.style.gap = "0px";
      link.style.paddingLeft = "0px";
    });

  }

});


// ==========================================
// CSS AUTO ADD
// ==========================================

const style = document.createElement("style");

style.innerHTML = `

.shorts-row{
  display:flex;
  gap:16px;
  overflow-x:auto;
  scroll-behavior:smooth;
  padding-bottom:10px;
}

.shorts-row::-webkit-scrollbar{
  display:none;
}

.short-card{
  min-width:220px;
  cursor:pointer;
}

.short-thumb{
  width:100%;
  height:390px;
  object-fit:cover;
  border-radius:16px;
}

.short-title{
  margin-top:8px;
  font-size:14px;
  font-weight:600;
}

.more-shorts-btn{
  margin-top:16px;
  padding:10px 18px;
  border:none;
  border-radius:22px;
  background:#000;
  color:#fff;
  cursor:pointer;
}

.sidebar{
  transition:0.3s ease;
}

`;

document.head.appendChild(style);
