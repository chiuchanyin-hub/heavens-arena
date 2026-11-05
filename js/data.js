// js/data.js - 自動封裝最新雲端題庫與挑戰者名單
const AVATAR_CONFIG = [
    {
        "id": "star",
        "name": "全能巨星",
        "nen": "強化系",
        "nenClass": "nen-enhancer",
        "attackName": "猜猜拳・石頭",
        "img": "assets/avatars/全能巨星.jpg"
    },
    {
        "id": "doctor",
        "name": "好奇博士",
        "nen": "具現化系",
        "nenClass": "nen-conjurer-doc",
        "attackName": "具現化・審判鎖鏈",
        "img": "assets/avatars/好奇博士.jpg"
    },
    {
        "id": "monkey",
        "name": "百變大聖",
        "nen": "變化系",
        "nenClass": "nen-transmuter",
        "attackName": "變化系・紫電奇術斬",
        "img": "assets/avatars/百變大聖.jpg"
    },
    {
        "id": "elf",
        "name": "活潑精靈",
        "nen": "放出系",
        "nenClass": "nen-emitter",
        "attackName": "放出系・雷電擊",
        "img": "assets/avatars/活潑精靈.jpg"
    },
    {
        "id": "angel",
        "name": "暖陽天使",
        "nen": "特質系",
        "nenClass": "nen-specialist",
        "attackName": "特質系・爆龍拳",
        "img": "assets/avatars/暖陽天使.jpg"
    },
    {
        "id": "agent",
        "name": "獨行探員",
        "nen": "操作系",
        "nenClass": "nen-manipulator",
        "attackName": "操作系・紫霧鎖定支配",
        "img": "assets/avatars/獨行探員.jpg"
    },
    {
        "id": "walker",
        "name": "隨和行者",
        "nen": "具現化系",
        "nenClass": "nen-conjurer-walk",
        "attackName": "具現化・束縛鎖鏈",
        "img": "assets/avatars/隨和行者.jpg"
    }
];

const DEFAULT_FLOOR_MASTERS = {
    "50": {
        "name": "50F 守門關主・雲古",
        "title": "心源流拳法師範",
        "avatar": "assets/avatars/全能巨星.jpg",
        "requiredScore": 80
    },
    "100": {
        "name": "100F 鋼鐵關主・華石鬥郎",
        "title": "雙重具現化高手",
        "avatar": "assets/avatars/好奇博士.jpg",
        "requiredScore": 85
    },
    "150": {
        "name": "150F 奇術關主・西索",
        "title": "變化系不敗魔術師",
        "avatar": "assets/avatars/百變大聖.jpg",
        "requiredScore": 90
    },
    "200": {
        "name": "200F 巔峰樓主・庫洛洛",
        "title": "天空競技場最高殿堂",
        "avatar": "assets/avatars/獨行探員.jpg",
        "requiredScore": 100
    }
};

const DEFAULT_QUESTIONS = [
    {
        "id": "q1",
        "floor": 1,
        "floorName": "自由配一年定期住院日額",
        "question": "自由配一年定期住院日額(外溢型)之繳費年期與繳費方式為何？",
        "options": [
            "A. 1年期，限年繳",
            "B. 1年期，可月繳或年繳",
            "C. 10年期，限轉帳繳",
            "D. 隨喜按月投幣繳"
        ],
        "answer": "A",
        "explanation": "商品摘要與投保規定明確載明：繳費年期為 1 年期，繳費方法「限年繳」。"
    },
    {
        "id": "q2",
        "floor": 1,
        "floorName": "自由配一年定期住院日額",
        "question": "自由配一年定期住院日額(外溢型)之保障期間為多久？",
        "options": [
            "A. 10年期",
            "B. 至80歲終身",
            "C. 1年期",
            "D. 只要不生病就一直保障下去"
        ],
        "answer": "C",
        "explanation": "本險為一年定期保險，保障期間為 1 年期（保證續保至保險年齡80歲屆滿）。"
    },
    {
        "id": "q3",
        "floor": 1,
        "floorName": "自由配一年定期住院日額",
        "question": "自由配一年定期住院日額(外溢型)的投保年齡範圍為何？",
        "options": [
            "A. 只要會呼吸皆可投保",
            "B. 0歲~65歲（保證續保至75歲）",
            "C. 18歲~60歲（非保證續保）",
            "D. 0歲~54歲（保證續保至保險年齡80歲屆滿）"
        ],
        "answer": "D",
        "explanation": "承保年齡為 0 歲~54 歲，保證續保至保險年齡 80 歲之保險單年度屆滿日為止。"
    }
];

const DEFAULT_USERS = [
    {
        "username": "00902201",
        "password": "650906",
        "nickname": "子旭",
        "roleId": "monkey",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00797149",
        "password": "630410",
        "nickname": "秀玲",
        "roleId": "agent",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00839879",
        "password": "630318",
        "nickname": "永淕",
        "roleId": "walker",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00917458",
        "password": "920818",
        "nickname": "昊軒",
        "roleId": "agent",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00771158",
        "password": "571108",
        "nickname": "秋雲",
        "roleId": "monkey",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00767848",
        "password": "571114",
        "nickname": "永盛",
        "roleId": "monkey",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00906117",
        "password": "721122",
        "nickname": "謹廷",
        "roleId": "walker",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00886604",
        "password": "770819",
        "nickname": "嘉峰",
        "roleId": "agent",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    },
    {
        "username": "00719463",
        "password": "660315",
        "nickname": "李副理",
        "roleId": "agent",
        "floor": 1,
        "customAvatar": "",
        "wins": 0
    }
];

const DataStore = {
    init() {
        const DATA_VERSION = '1793851390458';
        if (localStorage.getItem('ha_data_version') !== DATA_VERSION) {
            localStorage.setItem('ha_questions', JSON.stringify(DEFAULT_QUESTIONS));
            if (!localStorage.getItem('ha_users')) {
                localStorage.setItem('ha_users', JSON.stringify(DEFAULT_USERS));
            }
            localStorage.setItem('ha_data_version', DATA_VERSION);
        }
        if (!localStorage.getItem('ha_admin_pwd')) {
            localStorage.setItem('ha_admin_pwd', '8888');
        }
    },
    getUsers() { return JSON.parse(localStorage.getItem('ha_users') || '[]'); },
    saveUsers(users) { localStorage.setItem('ha_users', JSON.stringify(users)); },
    getQuestions() { return JSON.parse(localStorage.getItem('ha_questions') || '[]'); },
    saveQuestions(questions) { localStorage.setItem('ha_questions', JSON.stringify(questions)); },
    getCurrentUser() {
        const username = localStorage.getItem('ha_current_user');
        if (!username) return null;
        return this.getUsers().find(u => u.username === username) || null;
    },
    updateUser(updatedUser) {
        const users = this.getUsers().map(u => u.username === updatedUser.username ? updatedUser : u);
        this.saveUsers(users);
    },
    getAvatarInfo(user) {
        const base = AVATAR_CONFIG.find(a => a.id === user.roleId) || AVATAR_CONFIG[0];
        return {
            ...base,
            displayImg: (user.floor >= 30 && user.customAvatar) ? user.customAvatar : base.img
        };
    }
};

DataStore.init();
