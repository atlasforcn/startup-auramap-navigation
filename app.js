const nodeCatalog = {
  entrance: {
    code: "A1",
    label: "入口信標",
    area: "入口大廳",
    x: 17,
    y: 78,
    instruction: "前方 6 公尺直行，沿觸覺引導線進入大廳。"
  },
  lobby: {
    code: "L2",
    label: "大廳定位點",
    area: "入口大廳",
    x: 31,
    y: 67,
    instruction: "抵達大廳中央，請面向 1 點鐘方向。"
  },
  serviceDesk: {
    code: "S3",
    label: "服務台前緣",
    area: "服務區",
    x: 27,
    y: 28,
    instruction: "左前方 4 公尺為服務台，請減速並伸手確認桌緣。"
  },
  corridor: {
    code: "C4",
    label: "主走廊",
    area: "主走廊",
    x: 47,
    y: 56,
    instruction: "進入主走廊，請靠右側保持直行。"
  },
  corner: {
    code: "T5",
    label: "轉角避讓點",
    area: "主走廊",
    x: 63,
    y: 45,
    instruction: "前方轉角，請轉向 2 點鐘方向並等待半秒。"
  },
  elevator: {
    code: "E6",
    label: "A 棟電梯",
    area: "垂直動線",
    x: 78,
    y: 33,
    instruction: "電梯門在正前方 2 公尺，按鈕位於右側牆面。"
  },
  exit: {
    code: "X7",
    label: "無障礙出口 B",
    area: "出口區",
    x: 84,
    y: 76,
    instruction: "出口在正前方，門檻前有緩坡，請放慢速度。"
  },
  meeting: {
    code: "M8",
    label: "二樓會議室",
    area: "會議區",
    x: 86,
    y: 20,
    instruction: "會議室門口在左前方，門牌位於左側牆面。"
  }
};

const destinations = {
  elevator: {
    label: "A 棟電梯",
    route: ["entrance", "lobby", "corridor", "corner", "elevator"]
  },
  desk: {
    label: "一樓服務台",
    route: ["entrance", "lobby", "serviceDesk"]
  },
  exit: {
    label: "無障礙出口 B",
    route: ["entrance", "lobby", "corridor", "exit"]
  },
  meeting: {
    label: "二樓會議室",
    route: ["entrance", "lobby", "corridor", "corner", "elevator", "meeting"]
  }
};

const obstacles = [
  {
    id: "cart",
    label: "走廊手推車",
    node: "corridor",
    x: 42,
    y: 60,
    severity: "alert",
    message: "前方 2.5 公尺左側有手推車，請靠右慢行。"
  },
  {
    id: "wet",
    label: "地面濕滑",
    node: "corner",
    x: 58,
    y: 47,
    severity: "alert",
    message: "轉角附近地面濕滑，請縮短步幅並降低速度。"
  },
  {
    id: "door",
    label: "門扇開啟",
    node: "exit",
    x: 72,
    y: 67,
    severity: "weak",
    message: "右側門扇開啟，請保持左側 1 公尺距離。"
  },
  {
    id: "crowd",
    label: "人流密集",
    node: "serviceDesk",
    x: 34,
    y: 34,
    severity: "weak",
    message: "服務台前方人流密集，建議暫停並等待通行空隙。"
  }
];

const beacons = [
  {
    id: "a1",
    label: "A1 入口信標",
    area: "入口大廳",
    status: "online",
    battery: 94
  },
  {
    id: "c4",
    label: "C4 主走廊信標",
    area: "主走廊",
    status: "online",
    battery: 88
  },
  {
    id: "t5",
    label: "T5 轉角信標",
    area: "主走廊",
    status: "weak",
    battery: 52
  },
  {
    id: "e6",
    label: "E6 電梯信標",
    area: "垂直動線",
    status: "online",
    battery: 76
  }
];

const statusText = {
  pending: "待抵達",
  current: "目前",
  visited: "已完成",
  online: "正常",
  weak: "訊號弱",
  offline: "離線",
  alert: "警示"
};

let selectedDestination = "elevator";
let currentIndex = 0;
let navigationActive = false;
let activeObstacleIds = new Set();

const addObstacleBtn = document.querySelector("#addObstacleBtn");
const beaconGrid = document.querySelector("#beaconGrid");
const beaconHealth = document.querySelector("#beaconHealth");
const clearLogBtn = document.querySelector("#clearLogBtn");
const clearObstaclesBtn = document.querySelector("#clearObstaclesBtn");
const currentNodeStatus = document.querySelector("#currentNodeStatus");
const destinationSelect = document.querySelector("#destinationSelect");
const destinationStatus = document.querySelector("#destinationStatus");
const eventLog = document.querySelector("#eventLog");
const liveRegion = document.querySelector("#liveRegion");
const mapNodes = document.querySelector("#mapNodes");
const mapObstacles = document.querySelector("#mapObstacles");
const navState = document.querySelector("#navState");
const nextBtn = document.querySelector("#nextBtn");
const obstacleList = document.querySelector("#obstacleList");
const obstacleSelect = document.querySelector("#obstacleSelect");
const pingBeaconsBtn = document.querySelector("#pingBeaconsBtn");
const promptText = document.querySelector("#promptText");
const repeatBtn = document.querySelector("#repeatBtn");
const resetBtn = document.querySelector("#resetBtn");
const riskStatus = document.querySelector("#riskStatus");
const routeBase = document.querySelector("#routeBase");
const routeList = document.querySelector("#routeList");
const routeProgress = document.querySelector("#routeProgress");
const speechToggle = document.querySelector("#speechToggle");
const startBtn = document.querySelector("#startBtn");
const vibrationToggle = document.querySelector("#vibrationToggle");
const voiceCommand = document.querySelector("#voiceCommand");
const voiceForm = document.querySelector("#voiceForm");

function getRoute() {
  return destinations[selectedDestination].route;
}

function getCurrentNode() {
  return nodeCatalog[getRoute()[currentIndex]];
}

function getDestinationNode() {
  const route = getRoute();
  return nodeCatalog[route[route.length - 1]];
}

function formatTime() {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

function addLog(message, type = "info") {
  const item = document.createElement("li");
  item.dataset.type = type;
  item.innerHTML = `<time>${formatTime()}</time>${message}`;
  eventLog.prepend(item);
}

function activeObstacles() {
  return obstacles.filter((obstacle) => activeObstacleIds.has(obstacle.id));
}

function obstaclesNearNode(nodeId) {
  return activeObstacles().filter((obstacle) => obstacle.node === nodeId);
}

function routePoints(nodeIds) {
  return nodeIds.map((nodeId) => {
    const node = nodeCatalog[nodeId];
    return `${node.x},${node.y}`;
  });
}

function updatePrompt(message, urgency = "normal") {
  promptText.textContent = message;
  liveRegion.textContent = message;

  if (speechToggle.checked && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "zh-TW";
    utterance.rate = urgency === "alert" ? 0.9 : 1;
    window.speechSynthesis.speak(utterance);
  }

  if (vibrationToggle.checked && "vibrate" in navigator) {
    const pattern = urgency === "alert" ? [220, 80, 220, 80, 380] : [140, 70, 140];
    navigator.vibrate(pattern);
  }
}

function currentInstruction() {
  const route = getRoute();
  const nodeId = route[currentIndex];
  const node = nodeCatalog[nodeId];
  const nearby = obstaclesNearNode(nodeId);
  const prefix = currentIndex === route.length - 1 ? "已抵達目的地。" : node.instruction;

  if (nearby.length === 0) {
    return prefix;
  }

  return `${prefix} 障礙提醒：${nearby[0].message}`;
}

function renderMap() {
  const route = getRoute();
  const routeSet = new Set(route);
  const visitedSet = new Set(route.slice(0, currentIndex));
  const currentNodeId = route[currentIndex];
  const destinationNodeId = route[route.length - 1];

  routeBase.setAttribute("points", routePoints(route).join(" "));
  routeProgress.setAttribute("points", routePoints(route.slice(0, currentIndex + 1)).join(" "));

  mapNodes.innerHTML = Object.entries(nodeCatalog)
    .map(([nodeId, node]) => {
      const classes = ["node-button"];
      const status = nodeId === currentNodeId ? "current" : visitedSet.has(nodeId) ? "visited" : "pending";

      if (!routeSet.has(nodeId)) {
        classes.push("out-of-route");
      }

      if (nodeId === currentNodeId) {
        classes.push("current");
      }

      if (visitedSet.has(nodeId)) {
        classes.push("visited");
      }

      if (nodeId === destinationNodeId) {
        classes.push("destination");
      }

      return `
        <button
          class="${classes.join(" ")}"
          type="button"
          style="--x: ${node.x}%; --y: ${node.y}%"
          data-node="${nodeId}"
          aria-label="${node.label}，${statusText[status]}"
        >${node.code}</button>
      `;
    })
    .join("");

  mapObstacles.innerHTML = activeObstacles()
    .map((obstacle) => {
      return `
        <button
          class="obstacle-marker"
          type="button"
          style="--x: ${obstacle.x}%; --y: ${obstacle.y}%"
          data-obstacle-marker="${obstacle.id}"
          aria-label="${obstacle.label}：${obstacle.message}"
        ><span>!</span></button>
      `;
    })
    .join("");

  document.querySelectorAll("[data-node]").forEach((button) => {
    button.addEventListener("click", () => inspectNode(button.dataset.node));
  });

  document.querySelectorAll("[data-obstacle-marker]").forEach((button) => {
    button.addEventListener("click", () => inspectObstacle(button.dataset.obstacleMarker));
  });
}

function renderRouteList() {
  const route = getRoute();

  routeList.innerHTML = route
    .map((nodeId, index) => {
      const node = nodeCatalog[nodeId];
      const state = index < currentIndex ? "visited" : index === currentIndex ? "current" : "pending";
      const nearby = obstaclesNearNode(nodeId);
      const alertText = nearby.length > 0 ? `<p>障礙：${nearby[0].label}</p>` : "";

      return `
        <article class="route-item ${state}">
          <div>
            <h3>${node.code} ${node.label}</h3>
            <p>${node.area}｜${node.instruction}</p>
            ${alertText}
          </div>
          <span class="tag ${state}">${statusText[state]}</span>
        </article>
      `;
    })
    .join("");
}

function renderObstacles() {
  obstacleList.innerHTML = obstacles
    .map((obstacle) => {
      const active = activeObstacleIds.has(obstacle.id);
      const node = nodeCatalog[obstacle.node];

      return `
        <article class="obstacle-item ${active ? "" : "inactive"}">
          <div>
            <h3>${obstacle.label}</h3>
            <p>${node.label}｜${active ? obstacle.message : "尚未出現在場域中"}</p>
          </div>
          <button type="button" data-toggle-obstacle="${obstacle.id}">${active ? "移除" : "加入"}</button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-toggle-obstacle]").forEach((button) => {
    button.addEventListener("click", () => toggleObstacle(button.dataset.toggleObstacle));
  });
}

function renderBeacons() {
  beaconGrid.innerHTML = beacons
    .map((beacon) => {
      return `
        <article class="beacon-item">
          <div>
            <h3>${beacon.label}</h3>
            <p>${beacon.area}｜電量 ${beacon.battery}%</p>
          </div>
          <div>
            <span class="tag ${beacon.status}">${statusText[beacon.status]}</span>
            <button type="button" data-beacon="${beacon.id}">校正</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-beacon]").forEach((button) => {
    button.addEventListener("click", () => calibrateBeacon(button.dataset.beacon));
  });
}

function updateStatus() {
  const route = getRoute();
  const currentNode = getCurrentNode();
  const destination = destinations[selectedDestination];
  const healthyBeacons = beacons.filter((beacon) => beacon.status !== "offline").length;
  const activeRisk = activeObstacles().length;
  const reachedEnd = currentIndex === route.length - 1;

  destinationStatus.textContent = destination.label;
  currentNodeStatus.textContent = currentNode.label;
  riskStatus.textContent = `${activeRisk} 項`;
  beaconHealth.textContent = `${healthyBeacons}/${beacons.length}`;

  navState.classList.remove("active", "complete", "alert");

  if (activeRisk > 0 && navigationActive) {
    navState.textContent = "導航中｜障礙監測";
    navState.classList.add("alert");
  } else if (reachedEnd && navigationActive) {
    navState.textContent = "已抵達";
    navState.classList.add("complete");
  } else if (navigationActive) {
    navState.textContent = "導航中";
    navState.classList.add("active");
  } else {
    navState.textContent = "尚未導航";
  }

  startBtn.textContent = navigationActive ? "暫停導航" : "啟動導航";
  nextBtn.disabled = reachedEnd && navigationActive;
}

function render() {
  renderMap();
  renderRouteList();
  renderObstacles();
  renderBeacons();
  updateStatus();
}

function setDestination(destinationId, shouldLog = true) {
  selectedDestination = destinationId;
  destinationSelect.value = destinationId;
  currentIndex = 0;
  navigationActive = false;

  if (shouldLog) {
    addLog(`目的地設定為「${destinations[destinationId].label}」。`);
  }

  updatePrompt(`目的地已設定為 ${destinations[destinationId].label}。請按下啟動導航。`);
  render();
}

function startNavigation() {
  navigationActive = !navigationActive;

  if (navigationActive) {
    const destination = destinations[selectedDestination];
    const destinationNode = getDestinationNode();
    addLog(`導航啟動：前往「${destination.label}」，終點節點 ${destinationNode.code}。`);
    updatePrompt(currentInstruction(), obstaclesNearNode(getRoute()[currentIndex]).length > 0 ? "alert" : "normal");
  } else {
    addLog("導航已暫停，保留目前路線與節點位置。");
    updatePrompt("導航已暫停。若要繼續，請再次按下啟動導航。");
  }

  render();
}

function goNextNode() {
  const route = getRoute();

  if (!navigationActive) {
    navigationActive = true;
    addLog("導航啟動，系統開始追蹤下一個節點。");
  }

  if (currentIndex < route.length - 1) {
    currentIndex += 1;
    const node = getCurrentNode();
    const nearby = obstaclesNearNode(route[currentIndex]);
    addLog(`已抵達節點 ${node.code}「${node.label}」。`);

    if (nearby.length > 0) {
      addLog(`AI 視覺辨識觸發障礙提醒：「${nearby[0].label}」。`, "alert");
    }

    updatePrompt(currentInstruction(), nearby.length > 0 ? "alert" : "normal");
  } else {
    const destination = destinations[selectedDestination];
    addLog(`已完成前往「${destination.label}」的導航。`);
    updatePrompt(`已抵達 ${destination.label}。導航完成。`);
  }

  render();
}

function repeatPrompt() {
  const nearby = obstaclesNearNode(getRoute()[currentIndex]);
  addLog("使用者要求重複目前語音提示。");
  updatePrompt(currentInstruction(), nearby.length > 0 ? "alert" : "normal");
}

function resetDemo() {
  selectedDestination = "elevator";
  currentIndex = 0;
  navigationActive = false;
  activeObstacleIds = new Set();
  beacons[0].status = "online";
  beacons[1].status = "online";
  beacons[2].status = "weak";
  beacons[3].status = "online";
  destinationSelect.value = selectedDestination;
  eventLog.innerHTML = "";
  addLog("Demo 已重置，回到入口信標與預設目的地。");
  updatePrompt("請設定目的地後啟動導航。");
  render();
}

function toggleObstacle(obstacleId) {
  const obstacle = obstacles.find((item) => item.id === obstacleId);

  if (!obstacle) {
    return;
  }

  if (activeObstacleIds.has(obstacleId)) {
    activeObstacleIds.delete(obstacleId);
    addLog(`已移除障礙：「${obstacle.label}」。`);
  } else {
    activeObstacleIds.add(obstacleId);
    addLog(`場域新增障礙：「${obstacle.label}」。AI 視覺辨識已更新路線風險。`, "alert");

    if (obstacle.node === getRoute()[currentIndex]) {
      updatePrompt(`障礙提醒：${obstacle.message}`, "alert");
    }
  }

  render();
}

function addSelectedObstacle() {
  toggleObstacle(obstacleSelect.value);
}

function clearObstacles() {
  activeObstacleIds = new Set();
  addLog("已清除所有模擬障礙，路線恢復正常監測。");
  updatePrompt("目前路線沒有已知障礙。");
  render();
}

function inspectNode(nodeId) {
  const node = nodeCatalog[nodeId];

  if (!node) {
    return;
  }

  addLog(`檢視節點 ${node.code}「${node.label}」：${node.instruction}`);
  updatePrompt(`${node.label}。${node.instruction}`);
}

function inspectObstacle(obstacleId) {
  const obstacle = obstacles.find((item) => item.id === obstacleId);

  if (!obstacle) {
    return;
  }

  addLog(`檢視障礙：「${obstacle.label}」位於 ${nodeCatalog[obstacle.node].label}。`);
  updatePrompt(`障礙提醒：${obstacle.message}`, "alert");
}

function calibrateBeacon(beaconId) {
  const beacon = beacons.find((item) => item.id === beaconId);

  if (!beacon) {
    return;
  }

  beacon.status = "online";
  beacon.battery = Math.min(100, beacon.battery + 3);
  addLog(`信標校正完成：「${beacon.label}」狀態恢復正常。`);
  render();
}

function pingBeacons() {
  beacons.forEach((beacon) => {
    if (beacon.status === "offline") {
      beacon.status = "weak";
    } else if (beacon.status === "weak") {
      beacon.status = "online";
    }
  });

  addLog("已執行全域信標校正，場域定位網格完成同步。");
  render();
}

function clearLog() {
  eventLog.innerHTML = "";
  addLog("事件紀錄已清空。");
}

function applyVoiceCommand(command) {
  const normalized = command.trim();

  if (!normalized) {
    updatePrompt("沒有收到語音指令，請再試一次。");
    return;
  }

  addLog(`收到模擬語音指令：「${normalized}」。`);

  if (normalized.includes("服務台")) {
    setDestination("desk", false);
    addLog("語音指令已切換目的地為「一樓服務台」。");
    return;
  }

  if (normalized.includes("出口")) {
    setDestination("exit", false);
    addLog("語音指令已切換目的地為「無障礙出口 B」。");
    return;
  }

  if (normalized.includes("會議")) {
    setDestination("meeting", false);
    addLog("語音指令已切換目的地為「二樓會議室」。");
    return;
  }

  if (normalized.includes("電梯")) {
    setDestination("elevator", false);
    addLog("語音指令已切換目的地為「A 棟電梯」。");
    return;
  }

  if (normalized.includes("下一步") || normalized.includes("前進")) {
    goNextNode();
    return;
  }

  if (normalized.includes("重複")) {
    repeatPrompt();
    return;
  }

  if (normalized.includes("暫停") || normalized.includes("停止")) {
    if (navigationActive) {
      startNavigation();
    } else {
      updatePrompt("導航目前已暫停。");
    }
    return;
  }

  if (normalized.includes("障礙")) {
    addSelectedObstacle();
    return;
  }

  updatePrompt("指令已收到，但 demo 尚未設定對應動作。可以試試：帶我去電梯、下一步、重複提示。");
}

destinationSelect.addEventListener("change", () => setDestination(destinationSelect.value));
startBtn.addEventListener("click", startNavigation);
nextBtn.addEventListener("click", goNextNode);
repeatBtn.addEventListener("click", repeatPrompt);
resetBtn.addEventListener("click", resetDemo);
addObstacleBtn.addEventListener("click", addSelectedObstacle);
clearObstaclesBtn.addEventListener("click", clearObstacles);
pingBeaconsBtn.addEventListener("click", pingBeacons);
clearLogBtn.addEventListener("click", clearLog);

voiceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyVoiceCommand(voiceCommand.value);
  voiceCommand.value = "";
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => applyVoiceCommand(button.dataset.command));
});

addLog("AuraMap demo 已載入，入口信標等待導航啟動。");
render();
