// ======================================================
// 1. 게임 상태 변수 초기화
// 모든 게임 데이터는 초기 상태로 정확하게 설정됩니다.
// ======================================================
let currentMoney = 0;
let currentSubscribers = 0;
let currentContent = 0;

let subPerSecond = 1; // 1초당 구독자 기본값
let canClickViewer = true; // 기본 시청자 클릭 쿨타임 관리 변수 (게임 시작 시 항상 true)
let isGameEnded = false; // 게임 종료 상태를 추적하는 변수

// --- 시청자별 상태 ---
// isUnlocked: 해금 여부, level: 현재 레벨 (0: 구매 전, 1부터 시작), maxLevel: 최대 레벨
// intervalId: 자동 보상 setInterval ID (clearInterval을 위해 필요)
const viewers = {
    basic: {
        level: 1, // 기본 시청자는 항상 레벨 1부터 시작
        maxLevel: 30,
        isUnlocked: true, // 기본 시청자는 항상 해금
        clickAmounts: [
            5, 10, 15, 25, 40, 60, 90, 130, 180, 250, // 1~10
            350, 480, 650, 850, 1100, 1400, 1750, 2150, 2600, 3100, // 11~20
            3700, 4400, 5200, 6100, 7100, 8200, 9400, 10700, 12100, 13600 // 21~30
        ],
        upgradeCosts: [
            150, 300, 500, 800, 1200, 1800, 2600, 3600, 4800, 6200, // 1~10 (1.5배 적용)
            8000, 10000, 12500, 15500, 19000, 23000, 27500, 32500, 38000, 44000, // 11~20
            51000, 59000, 68000, 78000, 89000, 101000, 114000, 128000, 143000, 160000 // 21~30
        ],
        contentChances: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, // 1~10
            10, 11, 12, 13, 14, 15, 16, 17, 18, 19, // 11~20
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30 // 21~30
        ],
        subPerSecondAmounts: [
            1, 1, 1, 2, 2, 2, 3, 3, 3, 4, // 1~10 (초반 미미한 증가)
            4, 4, 5, 5, 10, 20, 35, 55, 80, 110, // 11~20 (15단계부터 증가 시작)
            145, 185, 200, 220, 250, 260, 300, 330, 360, 400 // 21~30 (최종 301)
        ]
    },
    fanart: {
        isUnlocked: false, // 해금 안 된 상태로 시작
        level: 0, // 레벨 0 (구매 전)
        maxLevel: 10,
        unlockCost: { subscribers: 50, money: 1000 },
        intervalSeconds: [30, 27, 24, 21, 18, 15, 12, 9, 7, 5],
        itemChancesByLevel: {
            1: { common: 67, uncommon: 33, rare: 0, legend: 0, mythic: 0, doomdoom: 0 },
            2: { common: 50, uncommon: 50, rare: 0, legend: 0, mythic: 0, doomdoom: 0 },
            3: { common: 30, uncommon: 60, rare: 10, legend: 0, mythic: 0, doomdoom: 0 },
            4: { common: 10, uncommon: 50, rare: 40, legend: 0, mythic: 0, doomdoom: 0 },
            5: { common: 0, uncommon: 10, rare: 70, legend: 20, mythic: 0, doomdoom: 0 },
            6: { common: 0, uncommon: 0, rare: 50, legend: 40, mythic: 10, doomdoom: 0 },
            7: { common: 0, uncommon: 0, rare: 30, legend: 60, mythic: 10, doomdoom: 0 },
            8: { common: 0, uncommon: 0, rare: 10, legend: 70, mythic: 20, doomdoom: 0 },
            9: { common: 0, uncommon: 0, rare: 0, legend: 80, mythic: 20, doomdoom: 0 },
            10: { common: 0, uncommon: 0, rare: 0, legend: 60, mythic: 30, doomdoom: 10 }
        },
        upgradeCosts: [
            1500, 7500, 20000, 40000, 90000, 150000, 600000, 1500000, 1950000, 3000000
        ],
        intervalId: null
    },
    developer: {
        isUnlocked: false,
        level: 0,
        maxLevel: 5,
        unlockCost: { subscribers: 1000, money: 100000 },
        intervalSeconds: 20,
        rewardAmount: [1, 2, 3, 5, 8],
        upgradeCosts: [
            150000, 300000, 450000, 600000, 750000 // 레벨 5 업그레이드 비용 추가
        ],
        intervalId: null
    },
    donator: {
        isUnlocked: false,
        level: 0,
        maxLevel: 10,
        unlockCost: { subscribers: 200, money: 1000 },
        intervalSeconds: 5,
        rewardAmount: [1000, 1500, 2000, 2500, 5000, 10000, 20000, 40000, 80000, 100000],
        upgradeCosts: [
            1500, 3000, 6000, 12000, 24000, 48000, 96000, 192000, 384000, 768000
        ],
        intervalId: null
    },
    vip: {
        isUnlocked: false,
        level: 0,
        maxLevel: 10,
        unlockCost: { subscribers: 20000, money: 100000 },
        intervalSeconds: 0, // 자동 보상 없음, 즉시 적용
        boostAmount: [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.10],
        upgradeCosts: [
            150000, 300000, 600000, 1200000, 2400000, 3000000, 3500000, 4000000, 4500000, 5000000
        ],
        intervalId: null
    },
    youtube: {
        isUnlocked: false,
        level: 0,
        maxLevel: 10,
        unlockCost: { subscribers: 500, money: 0 },
        intervalSeconds: [5, 5, 5, 5, 5, 10, 10, 10, 15, 15],
        rewardAmount: [10, 30, 60, 100, 200, 400, 800, 1200, 1600, 2000],
        upgradeCosts: [
            3000, 6000, 12000, 24000, 48000, 96000, 192000, 384000, 768000, 1500000
        ],
        intervalId: null
    }
};

// 영상 제작 관련 상수
const VIDEO_CONTENT_CONSUMPTION = 2;
const VIDEO_MAKE_COSTS_BY_LEVEL = [
    10000, 15000, 20000, 30000, 40000, 60000, 80000, 120000, 180000, 250000,
    300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000, 700000, 750000,
    800000, 850000, 900000, 950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000
];
const VIDEO_REWARD_RANGES_BY_LEVEL = [
    [3000, 30000], [5000, 50000], [10000, 100000], [20000, 200000], [40000, 400000],
    [70000, 700000], [100000, 1000000], [150000, 1500000], [200000, 2000000], [300000, 3000000],
    [350000, 3500000], [400000, 4000000], [450000, 4500000], [500000, 5000000], [550000, 5500000],
    [600000, 6000000], [650000, 6500000], [700000, 7000000], [750000, 7500000], [800000, 8000000],
    [850000, 8500000], [900000, 9000000], [950000, 9500000], [1000000, 10000000], [1050000, 10500000],
    [1100000, 11000000], [1150000, 11500000], [1200000, 12000000], [1250000, 12500000], [1300000, 13000000]
];
const SUBSCRIBER_INCREASE_RANGES = [
    [10, 20], [15, 25], [20, 30], [25, 35], [30, 40],
    [35, 45], [40, 50], [45, 55], [50, 60], [55, 65],
    [60, 70], [65, 75], [70, 80], [75, 85], [80, 90],
    [85, 95], [90, 100], [95, 105], [100, 110], [105, 115],
    [110, 120], [115, 125], [120, 130], [125, 135], [130, 140],
    [135, 145], [140, 150], [145, 155], [150, 160], [155, 165]
];

// 아이템 관련 데이터
const itemGrades = {
    'common': { name: '커먼 팬아트', min: 100, max: 500, class: 'item-common' },
    'uncommon': { name: '언커먼 팬아트', min: 200, max: 1000, class: 'item-uncommon' },
    'rare': { name: '레어 팬아트', min: 400, max: 3000, class: 'item-rare' },
    'legend': { name: '레전드 팬아트', min: 1000, max: 10000, class: 'item-legend' },
    'mythic': { name: '신화 팬아트', min: 10000, max: 50000, class: 'item-mythic' },
    'doomdoom': { name: '듐듐 팬아트', min: 300000, max: 1000000, class: 'item-doomdoom' }
};
const specialItem = { name: '슈퍼짱짱삐까뻔적 카페 배너', class: 'item-banner' };

let inventory = {}; // 인벤토리 초기화
let collectedFanartGrades = new Set(); // 획득한 팬아트 등급 초기화
let hasSpecialBanner = false; // 특별 배너 획득 여부 초기화

// ======================================================
// 2. DOM 요소 참조
// ======================================================
const gameStartModal = document.getElementById('gameStartModal');
const startGameButton = document.getElementById('startGameButton');
const gameContainer = document.getElementById('gameContainer');

const moneyDisplay = document.getElementById('moneyDisplay');
const subscribersDisplay = document.getElementById('subscribersDisplay');
const contentDisplay = document.getElementById('contentDisplay');
const fanartGradesCollectedDisplay = document.getElementById('fanartGradesCollected');

const viewerLevelDisplay = document.getElementById('viewerLevelDisplay');
const viewerClickAmountDisplay = document.getElementById('viewerClickAmountDisplay');
const contentChanceDisplay = document.getElementById('contentChanceDisplay');
const subPerSecondDisplay = document.getElementById('subPerSecondDisplay');

const clickViewerButton = document.getElementById('clickViewerButton');
const upgradeViewerButton = document.getElementById('upgradeViewerButton');
const viewerUpgradeCostDisplay = document.getElementById('viewerUpgradeCostDisplay');

const makeVideoButton = document.getElementById('makeVideoButton');
const videoMakeCostDisplay = document.getElementById('videoMakeCostDisplay');
const videoExpectedRewardDisplay = document.getElementById('videoExpectedRewardDisplay');
const videoSubIncreaseDisplay = document.getElementById('videoSubIncreaseDisplay');

const inventoryItemsDisplay = document.getElementById('inventoryItems');

const gameEndMessage = document.getElementById('gameEndMessage');
const endingReasonDisplay = document.getElementById('endingReason');
const restartGameButton = document.getElementById('restartGameButton');

// 새로 추가된 UI 요소들
const showPassiveViewersButton = document.getElementById('showPassiveViewersButton');
const viewEndingButton = document.getElementById('viewEndingButton');
const showShopButton = document.getElementById('showShopButton');
const passiveViewersModal = document.getElementById('passiveViewersModal');
const closeModalButtons = document.querySelectorAll('.close-modal-btn'); // 모든 닫기 버튼

// 각 시청자 모달 내의 DOM 요소 (기존 id 그대로 사용)
// 예: const fanartViewerCard = document.getElementById('fanartViewerCard');

// ======================================================
// 3. 게임 로직 함수
// ======================================================

function getBoostMultiplier() {
    if (viewers.vip.isUnlocked && viewers.vip.level > 0) {
        return viewers.vip.boostAmount[viewers.vip.level - 1];
    }
    return 1.0;
}

function autoAddSubscribers() {
    if (isGameEnded) return;

    let boost = getBoostMultiplier();
    currentSubscribers += Math.floor(subPerSecond * boost);
    updateUI();
}

function clickBasicViewer() {
    if (isGameEnded) return;

    if (!canClickViewer) return;

    canClickViewer = false;
    clickViewerButton.disabled = true;

    setTimeout(() => {
        canClickViewer = true;
        clickViewerButton.disabled = false;
        updateUI();
    }, 300);

    const basicViewer = viewers.basic;
    const clickAmountIndex = Math.min(basicViewer.level - 1, basicViewer.clickAmounts.length - 1);
    currentMoney += Math.floor(basicViewer.clickAmounts[clickAmountIndex] * getBoostMultiplier());

    const contentChanceIndex = Math.min(basicViewer.level - 1, basicViewer.contentChances.length - 1);
    const randomValue = Math.random() * 100;
    if (randomValue < basicViewer.contentChances[contentChanceIndex]) {
        currentContent += Math.floor(1 * getBoostMultiplier());
    }
    updateUI();
    checkGameEndCondition();
}

function addItemToInventory(itemName, itemGrade = null) {
    if (inventory[itemName]) {
        inventory[itemName].count++;
    } else {
        inventory[itemName] = {
            count: 1,
            grade: itemGrade
        };
    }
    if (itemGrade && itemGrades[itemGrade]) {
        collectedFanartGrades.add(itemGrade);
    }
    updateInventoryUI();
    updateUI();
    checkGameEndCondition();
}

function sellItem(itemName, element) {
    if (isGameEnded) return;

    if (inventory[itemName] && inventory[itemName].count > 0) {
        const itemInfo = itemGrades[itemName] || specialItem;

        if (itemInfo.name === specialItem.name) {
            alert("이 아이템은 판매할 수 없습니다!");
            return;
        }

        const sellPrice = Math.floor(Math.random() * (itemInfo.max - itemInfo.min + 1)) + itemInfo.min;

        currentMoney += sellPrice;
        inventory[itemName].count--;

        if (inventory[itemName].count === 0) {
            delete inventory[itemName];
            element.remove();
        } else {
            element.querySelector('.item-count').textContent = inventory[itemName].count;
        }
        updateUI();
    }
}

function areAllViewersMaxLevel() {
    for (const key in viewers) {
        if (viewers[key].isUnlocked && viewers[key].level < viewers[key].maxLevel) {
            return false;
        }
    }
    return true;
}

function checkGameEndCondition() {
    if (isGameEnded) return;

    const allViewersMaxed = areAllViewersMaxLevel();
    const allFanartGradesCollected = (collectedFanartGrades.size === Object.keys(itemGrades).length);

    if (allViewersMaxed && hasSpecialBanner && allFanartGradesCollected) {
        const endingMessage = "10만 축하드립니다 디순 그리고 디리나님! 앞으로도 재밌는 컨텐츠를 보여주십쇼!" +
                              "- 모든 시청자 만렙 달성\n" +
                              "- 슈퍼짱짱삐까뻔적 카페 배너 획득\n" +
                              "- 모든 팬아트 등급 수집 완료";
        endGame(endingMessage);
    }
}

// ======================================================
// 4. UI 업데이트 함수
// ======================================================
function updateUI() {
    moneyDisplay.textContent = currentMoney.toLocaleString() + '원';
    subscribersDisplay.textContent = currentSubscribers.toLocaleString() + '명';
    contentDisplay.textContent = currentContent.toLocaleString() + '개';
    fanartGradesCollectedDisplay.textContent = `${collectedFanartGrades.size}/${Object.keys(itemGrades).length}`;

    const basicViewer = viewers.basic;
    viewerLevelDisplay.textContent = basicViewer.level;

    const basicClickAmountIndex = Math.min(basicViewer.level - 1, basicViewer.clickAmounts.length - 1);
    viewerClickAmountDisplay.textContent = basicViewer.clickAmounts[basicClickAmountIndex].toLocaleString() + '원';

    const basicContentChanceIndex = Math.min(basicViewer.level - 1, basicViewer.contentChances.length - 1);
    contentChanceDisplay.textContent = basicViewer.contentChances[basicContentChanceIndex] + '%';

    const basicSubPerSecondIndex = Math.min(basicViewer.level - 1, basicViewer.subPerSecondAmounts.length - 1);
    subPerSecond = basicViewer.subPerSecondAmounts[basicSubPerSecondIndex];
    subPerSecondDisplay.textContent = subPerSecond.toLocaleString() + '명';

    clickViewerButton.disabled = !canClickViewer || isGameEnded;

    if (basicViewer.level < basicViewer.maxLevel) {
        const nextUpgradeCost = basicViewer.upgradeCosts[basicViewer.level - 1];
        viewerUpgradeCostDisplay.textContent = nextUpgradeCost.toLocaleString();
        upgradeViewerButton.disabled = currentMoney < nextUpgradeCost || isGameEnded;
        upgradeViewerButton.textContent = `기본 시청자 업그레이드 (${nextUpgradeCost.toLocaleString()}원)`;
    } else {
        viewerUpgradeCostDisplay.textContent = '최대 레벨';
        upgradeViewerButton.disabled = true;
        upgradeViewerButton.textContent = '기본 시청자 업그레이드 (최대)';
    }

    const videoStatsLevelIndex = Math.min(basicViewer.level - 1, VIDEO_MAKE_COSTS_BY_LEVEL.length - 1);
    const currentVideoMakeCost = VIDEO_MAKE_COSTS_BY_LEVEL[videoStatsLevelIndex];
    const currentVideoRewardRange = VIDEO_REWARD_RANGES_BY_LEVEL[videoStatsLevelIndex];
    const currentSubIncreaseRange = SUBSCRIBER_INCREASE_RANGES[videoStatsLevelIndex];

    videoMakeCostDisplay.textContent = currentVideoMakeCost.toLocaleString();
    videoExpectedRewardDisplay.textContent = `${currentVideoRewardRange[0].toLocaleString()} ~ ${currentVideoRewardRange[1].toLocaleString()}`;
    videoSubIncreaseDisplay.textContent = `${currentSubIncreaseRange[0]} ~ ${currentSubIncreaseRange[1]}명`;
    makeVideoButton.disabled = currentMoney < currentVideoMakeCost || currentContent < VIDEO_CONTENT_CONSUMPTION || isGameEnded;

    // 다른 시청자 UI 업데이트
    updateOtherViewerUI(
        viewers.fanart, 'fanart', 'fanartViewerCard', 'buyFanartViewerButton', 'upgradeFanartViewerButton',
        'fanartViewerLevelDisplay', 'fanartViewerRewardDisplay', 'fanartViewerIntervalDisplay', 'fanartViewerUpgradeCostDisplay'
    );
    updateOtherViewerUI(
        viewers.developer, 'dev', 'devViewerCard', 'buyDevViewerButton', 'upgradeDevViewerButton',
        'devViewerLevelDisplay', 'devViewerRewardDisplay', 'devViewerIntervalDisplay', 'devViewerUpgradeCostDisplay'
    );
    updateOtherViewerUI(
        viewers.donator, 'donate', 'donateViewerCard', 'buyDonateViewerButton', 'upgradeDonateViewerButton',
        'donateViewerLevelDisplay', 'donateViewerRewardDisplay', 'donateViewerIntervalDisplay', 'donateViewerUpgradeCostDisplay'
    );
    updateOtherViewerUI(
        viewers.vip, 'vip', 'vipViewerCard', 'buyVipViewerButton', 'upgradeVipViewerButton',
        'vipViewerLevelDisplay', 'vipViewerRewardDisplay', null, 'vipViewerUpgradeCostDisplay'
    );
    updateOtherViewerUI(
        viewers.youtube, 'yt', 'ytViewerCard', 'buyYtViewerButton', 'upgradeYtViewerButton',
        'ytViewerLevelDisplay', 'ytViewerRewardDisplay', 'ytViewerIntervalDisplay', 'ytViewerUpgradeCostDisplay'
    );

    // 하단 내비게이션 버튼 활성화/비활성화 (게임 종료 시 비활성화)
    showPassiveViewersButton.disabled = isGameEnded;
    viewEndingButton.disabled = isGameEnded;
    showShopButton.disabled = isGameEnded;
}

function updateInventoryUI() {
    inventoryItemsDisplay.innerHTML = '';
    for (const itemName in inventory) {
        if (inventory[itemName].count > 0) {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('inventory-item');

            let itemInfo = itemGrades[itemName] || specialItem;
            itemDiv.classList.add(itemInfo.class);

            itemDiv.textContent = itemInfo.name;
            const itemCountSpan = document.createElement('span');
            itemCountSpan.classList.add('item-count');
            itemCountSpan.textContent = inventory[itemName].count;
            itemDiv.appendChild(itemCountSpan);

            if (itemInfo.name !== specialItem.name) {
                itemDiv.addEventListener('click', () => sellItem(itemName, itemDiv));
            } else {
                itemDiv.title = "게임 엔딩 조건 아이템입니다.";
            }
            inventoryItemsDisplay.appendChild(itemDiv);
        }
    }
}

function updateOtherViewerUI(viewerObj, prefix, cardId, buyBtnId, upgradeBtnId, levelId, rewardId, intervalId, costId) {
    const cardEl = document.getElementById(cardId);
    const buyBtnEl = document.getElementById(buyBtnId);
    const upgradeBtnEl = document.getElementById(upgradeBtnId);
    const levelEl = document.getElementById(levelId);
    const rewardEl = document.getElementById(rewardId);
    const intervalEl = intervalId ? document.getElementById(intervalId) : null;
    const costEl = document.getElementById(costId);

    const gameIsEnded = isGameEnded;

    if (viewerObj.isUnlocked) {
        if(buyBtnEl) buyBtnEl.classList.add('hidden');
        if(upgradeBtnEl) upgradeBtnEl.classList.remove('hidden');

        levelEl.textContent = viewerObj.level;

        if (prefix === 'fanart') {
            const currentChances = viewerObj.itemChancesByLevel[viewerObj.level];
            let chancesText = '';
            for (const grade in currentChances) {
                if (currentChances[grade] > 0) {
                    chancesText += `${itemGrades[grade].name.replace(' 팬아트', '')} ${currentChances[grade]}%, `;
                }
            }
            rewardEl.textContent = chancesText.slice(0, -2);
        } else if (prefix === 'developer' || prefix === 'donator' || prefix === 'youtube') {
            rewardEl.textContent = `${viewerObj.rewardAmount[viewerObj.level - 1].toLocaleString()}${prefix === 'developer' ? '개' : (prefix === 'youtube' ? '명' : '원')}`;
        } else if (prefix === 'vip') {
            rewardEl.textContent = `${viewerObj.boostAmount[viewerObj.level - 1].toFixed(2)}배`;
        }

        if (intervalEl) {
            const currentInterval = Array.isArray(viewerObj.intervalSeconds) ? viewerObj.intervalSeconds[viewerObj.level - 1] : viewerObj.intervalSeconds;
            intervalEl.textContent = `${currentInterval}초`;
        }

        if (viewerObj.level < viewerObj.maxLevel) {
            const nextCost = viewerObj.upgradeCosts[viewerObj.level - 1];
            costEl.textContent = nextCost.toLocaleString();
            if(upgradeBtnEl) upgradeBtnEl.disabled = currentMoney < nextCost || gameIsEnded;
            if(upgradeBtnEl) upgradeBtnEl.textContent = `업그레이드 (${nextCost.toLocaleString()}원)`;
        } else {
            costEl.textContent = '최대 레벨';
            if(upgradeBtnEl) upgradeBtnEl.disabled = true;
            if(upgradeBtnEl) upgradeBtnEl.textContent = '업그레이드 (최대)';
        }

    } else {
        levelEl.textContent = 'N/A';
        rewardEl.textContent = 'N/A';
        if (intervalEl) intervalEl.textContent = 'N/A';
        costEl.textContent = 'N/A';
        if(buyBtnEl) buyBtnEl.classList.remove('hidden');
        if(upgradeBtnEl) upgradeBtnEl.classList.add('hidden');

        if(buyBtnEl) buyBtnEl.disabled = currentSubscribers < viewerObj.unlockCost.subscribers || currentMoney < viewerObj.unlockCost.money || gameIsEnded;
    }
}


// ======================================================
// 5. 이벤트 핸들러 등록 함수 (중복 등록 방지)
// ======================================================

function attachEventListeners() {
    // 게임 시작 버튼
    startGameButton.onclick = () => {
        gameStartModal.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initGame();
    };

    // 게임 다시 시작 버튼
    restartGameButton.onclick = () => {
        gameEndMessage.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initGame();
    };

    // 기본 시청자 클릭 및 업그레이드
    clickViewerButton.onclick = clickBasicViewer;
    upgradeViewerButton.onclick = () => {
        if (isGameEnded) return;
        const basicViewer = viewers.basic;
        if (basicViewer.level < basicViewer.maxLevel) {
            const upgradeCost = basicViewer.upgradeCosts[basicViewer.level - 1];
            if (currentMoney >= upgradeCost) {
                currentMoney -= upgradeCost;
                basicViewer.level++;
            }
        }
        updateUI();
        checkGameEndCondition();
    };

    // 영상 제작
    makeVideoButton.onclick = () => {
        if (isGameEnded) return;

        const basicViewer = viewers.basic;
        const videoStatsLevelIndex = Math.min(basicViewer.level - 1, VIDEO_MAKE_COSTS_BY_LEVEL.length - 1);

        const currentVideoMakeCost = VIDEO_MAKE_COSTS_BY_LEVEL[videoStatsLevelIndex];
        const currentVideoRewardRange = VIDEO_REWARD_RANGES_BY_LEVEL[videoStatsLevelIndex];
        const currentSubIncreaseRange = SUBSCRIBER_INCREASE_RANGES[videoStatsLevelIndex];

        if (currentMoney >= currentVideoMakeCost && currentContent >= VIDEO_CONTENT_CONSUMPTION) {
            currentMoney -= currentVideoMakeCost;
            currentContent -= VIDEO_CONTENT_CONSUMPTION;

            const boost = getBoostMultiplier();

            const videoReward = Math.floor((Math.random() * (currentVideoRewardRange[1] - currentVideoRewardRange[0] + 1) + currentVideoRewardRange[0]) * boost);
            currentMoney += videoReward;

            const subIncrease = Math.floor((Math.random() * (currentSubIncreaseRange[1] - currentSubIncreaseRange[0] + 1) + currentSubIncreaseRange[0]) * boost);
            currentSubscribers += subIncrease;
        }
        updateUI();
        checkGameEndCondition();
    };

    // 다른 시청자 해금/업그레이드 버튼 (모달 내에 있는 버튼들)
    for (const key in viewers) {
        if (key === 'basic') continue;

        const viewerObj = viewers[key];
        const buyButton = document.getElementById(`buy${key.charAt(0).toUpperCase() + key.slice(1)}ViewerButton`);
        const upgradeButton = document.getElementById(`upgrade${key.charAt(0).toUpperCase() + key.slice(1)}ViewerButton`);

        if (buyButton) {
            buyButton.onclick = () => {
                if (isGameEnded) return;

                if (currentSubscribers >= viewerObj.unlockCost.subscribers && currentMoney >= viewerObj.unlockCost.money) {
                    currentMoney -= viewerObj.unlockCost.money;
                    viewerObj.isUnlocked = true;
                    viewerObj.level = 1;

                    if (viewerObj.intervalSeconds > 0 || (Array.isArray(viewerObj.intervalSeconds) && viewerObj.intervalSeconds[0] !== undefined)) {
                        const initialInterval = Array.isArray(viewerObj.intervalSeconds) ? viewerObj.intervalSeconds[0] : viewerObj.intervalSeconds;
                        viewerObj.intervalId = setInterval(() => autoRewardViewer(key), initialInterval * 1000);
                    }
                    updateUI();
                    alert(`${key.charAt(0).toUpperCase() + key.slice(1)} 시청자를 해금했습니다!`);
                    checkGameEndCondition();
                } else {
                    alert(`해금 조건이 부족합니다: 구독자 ${viewerObj.unlockCost.subscribers.toLocaleString()}명, ${viewerObj.unlockCost.money.toLocaleString()}원 필요.`);
                }
            };
        }

        if (upgradeButton) {
            upgradeButton.onclick = () => {
                if (isGameEnded) return;

                if (viewerObj.level < viewerObj.maxLevel) {
                    const upgradeCost = viewerObj.upgradeCosts[viewerObj.level - 1];
                    if (currentMoney >= upgradeCost) {
                        currentMoney -= upgradeCost;
                        viewerObj.level++;

                        if (viewerObj.intervalId) {
                            clearInterval(viewerObj.intervalId);
                            viewerObj.intervalId = null;
                        }

                        if (viewerObj.intervalSeconds > 0 || (Array.isArray(viewerObj.intervalSeconds) && viewerObj.intervalSeconds[viewerObj.level - 1] !== undefined)) {
                            const newInterval = Array.isArray(viewerObj.intervalSeconds) ? viewerObj.intervalSeconds[viewerObj.level - 1] : viewerObj.intervalSeconds;
                            viewerObj.intervalId = setInterval(() => autoRewardViewer(key), newInterval * 1000);
                        }
                    }
                }
                updateUI();
                checkGameEndCondition();
            };
        }
    }

    // 하단 내비게이션 버튼 이벤트
    showPassiveViewersButton.onclick = () => {
        if (isGameEnded) return;
        passiveViewersModal.classList.remove('hidden');
        updateUI(); // 모달이 열릴 때도 UI 업데이트를 한 번 더 해줘서 최신 상태 반영
    };

    viewEndingButton.onclick = () => {
        if (isGameEnded) {
            gameEndMessage.classList.remove('hidden');
        } else {
            alert("아직 엔딩 조건을 달성하지 못했습니다!\n\n엔딩 조건:\n- 모든 시청자 만렙 달성\n- 슈퍼짱짱삐까뻔적 카페 배너 획득\n- 모든 팬아트 등급 수집 완료");
        }
    };

    showShopButton.onclick = () => {
        if (isGameEnded) return;
        alert("상점 기능은 아직 구현되지 않았습니다!");
    };

    // 모달 닫기 버튼 이벤트
    closeModalButtons.forEach(button => {
        button.onclick = (event) => {
            // 이벤트 버블링을 막아 모달 오버레이 클릭 시 닫히는 동작 방지
            event.stopPropagation();
            passiveViewersModal.classList.add('hidden');
            // 만약 다른 모달도 동일 클래스를 쓴다면, 조건 추가 필요
        };
    });

    // 인벤토리 탭 버튼 (기능 없음, 활성 클래스만 토글)
    const inventoryTabButtons = document.querySelectorAll('.inventory-tabs .tab-btn');
    inventoryTabButtons.forEach(tabBtn => {
        tabBtn.onclick = () => {
            inventoryTabButtons.forEach(btn => btn.classList.remove('active'));
            tabBtn.classList.add('active');
            // 실제 탭 전환 로직은 여기에 추가
        };
    });
}


function autoRewardViewer(viewerKey) {
    if (isGameEnded) {
        const viewerObj = viewers[viewerKey];
        if (viewerObj.intervalId) {
            clearInterval(viewerObj.intervalId);
            viewerObj.intervalId = null;
        }
        return;
    }

    const viewerObj = viewers[viewerKey];
    const boost = getBoostMultiplier();

    switch (viewerKey) {
        case 'fanart':
            if (viewerObj.isUnlocked && viewerObj.level > 0) {
                const currentChances = viewerObj.itemChancesByLevel[viewerObj.level];
                const rand = Math.random() * 100;
                let cumulativeChance = 0;
                let acquiredGrade = null;

                for (const grade in currentChances) {
                    cumulativeChance += currentChances[grade];
                    if (rand < cumulativeChance) {
                        acquiredGrade = grade;
                        break;
                    }
                }
                if (acquiredGrade) {
                    addItemToInventory(acquiredGrade, acquiredGrade);
                }

                if (viewerObj.level === viewerObj.maxLevel) {
                    if (!hasSpecialBanner && Math.random() * 100 < 25) {
                        addItemToInventory(specialItem.name);
                        hasSpecialBanner = true;
                        alert("★ 특별 아이템 획득! 슈퍼짱짱삐까뻔적 카페 배너를 얻었습니다!");
                        checkGameEndCondition();
                    }
                }
            }
            break;
        case 'developer':
            if (viewerObj.isUnlocked && viewerObj.level > 0) {
                currentContent += Math.floor(viewerObj.rewardAmount[viewerObj.level - 1] * boost);
            }
            break;
        case 'donator':
            if (viewerObj.isUnlocked && viewerObj.level > 0) {
                currentMoney += Math.floor(viewerObj.rewardAmount[viewerObj.level - 1] * boost);
            }
            break;
        case 'youtube':
            if (viewerObj.isUnlocked && viewerObj.level > 0) {
                currentSubscribers += Math.floor(viewerObj.rewardAmount[viewerObj.level - 1] * boost);
            }
            break;
    }
    updateUI();
}

// ======================================================
// 6. 게임 종료 함수
// ======================================================
function endGame(reason) {
    if (isGameEnded) return;
    isGameEnded = true;

    gameEndMessage.classList.remove('hidden');
    endingReasonDisplay.textContent = reason;

    clickViewerButton.disabled = true;
    upgradeViewerButton.disabled = true;
    makeVideoButton.disabled = true;

    showPassiveViewersButton.disabled = true;
    viewEndingButton.disabled = true;
    showShopButton.disabled = true;


    for (const key in viewers) {
        const buyBtn = document.getElementById(`buy${key.charAt(0).toUpperCase() + key.slice(1)}ViewerButton`);
        const upgradeBtn = document.getElementById(`upgrade${key.charAt(0).toUpperCase() + key.slice(1)}ViewerButton`);
        if (buyBtn) buyBtn.disabled = true;
        if (upgradeBtn) upgradeBtn.disabled = true;

        if (viewers[key].intervalId) {
            clearInterval(viewers[key].intervalId);
            viewers[key].intervalId = null;
        }
    }
    clearInterval(subscriberIntervalId);
}

// ======================================================
// 7. 초기화 및 게임 시작
// ======================================================
let subscriberIntervalId;

function initGame() {
    isGameEnded = false;

    currentMoney = 0;
    currentSubscribers = 0;
    currentContent = 0;
    subPerSecond = 1;
    canClickViewer = true;
    inventory = {};
    collectedFanartGrades = new Set();
    hasSpecialBanner = false;

    for (const key in viewers) {
        viewers[key].level = (key === 'basic' ? 1 : 0);
        viewers[key].isUnlocked = (key === 'basic' ? true : false);
        if (viewers[key].intervalId) {
            clearInterval(viewers[key].intervalId);
            viewers[key].intervalId = null;
        }
    }

    if (subscriberIntervalId) {
        clearInterval(subscriberIntervalId);
    }
    subscriberIntervalId = setInterval(autoAddSubscribers, 1000);

    gameEndMessage.classList.add('hidden');
    passiveViewersModal.classList.add('hidden'); // 추가 시청자 모달도 숨김

    updateUI();
    updateInventoryUI();

    console.log("게임이 시작되었습니다. 유튜브 채널을 성장시켜 보세요!");
}

document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();

    gameStartModal.classList.remove('hidden');
    gameContainer.classList.add('hidden');
});