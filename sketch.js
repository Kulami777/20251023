// =================================================================
// 步驟一：煙火與粒子系統的類別定義 
// (這部分已在前一步檢查並確保定義於頂部，無需修改)
// =================================================================

// 粒子類別 - 構成煙火爆炸後的碎片或火箭本身
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // true 表示是火箭，false 表示是爆炸碎片
        this.lifespan = 255;
        this.hu = hue; // 顏色
        this.acc = createVector(0, 0);

        if (this.firework) {
            // 這是煙火發射的火箭階段：只有向上的初速度
            this.vel = createVector(0, random(-15, -10)); 
        } else {
            // 這是爆炸後的碎片階段：隨機方向的初速度
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 賦予隨機爆炸速度
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 爆炸碎片受重力影響，並逐漸消失
            this.applyForce(gravity);
            this.vel.mult(0.9); // 模擬空氣阻力，讓碎片速度減慢
            this.lifespan -= 4; // 減少壽命 (逐漸透明)
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    show() {
        // 設定 HSB 模式下繪製
        colorMode(HSB);
        
        if (!this.firework) {
            // 爆炸碎片：使用圓形，隨著壽命變透明
            strokeWeight(3);
            stroke(this.hu, 100, 100, this.lifespan / 255); 
            point(this.pos.x, this.pos.y);
            
        } else {
            // 火箭：使用較粗的點
            strokeWeight(4);
            stroke(this.hu, 100, 100);
            point(this.pos.x, this.pos.y);
        }
    }
    
    isFinished() {
        // 判斷粒子是否可以被移除
        return this.lifespan < 0;
    }
}


// 煙火類別 - 管理一個從發射到爆炸的完整過程
class Firework {
    constructor() {
        this.hu = random(360); // 隨機顏色
        // 火箭從畫布底部隨機位置發射
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = []; // 爆炸碎片
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 檢查火箭是否達到最高點 (速度變正，表示開始下落)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }
        
        // 更新爆炸碎片
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 爆炸時產生 100 個碎片
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            // 繪製火箭
            this.firework.show();
        }
        
        // 繪製碎片
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    done() {
        // 判斷煙火是否燃放完畢 (火箭已爆炸且所有碎片都消失)
        return this.exploded && this.particles.length === 0;
    }
}


// =================================================================
// 步驟二：成績數據接收與全域變數
// -----------------------------------------------------------------


let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 
let fireworks = []; 
let gravity; 


window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 【除錯日誌 1】 確認分數是否正確收到
        console.log("新的分數已接收:", scoreText); 
        
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// ... (保留 Particle, Firework 類別及全域變數和 postMessage 監聽器) ...

// =================================================================
// 步驟三：p5.js 核心設定與繪圖
// -----------------------------------------------------------------

function setup() { 
    // 獲取 H5P 容器元素
    const h5pContainer = document.getElementById('h5pContainer');
    let canvasWidth = 600; 
    let canvasHeight = 400;

    // 關鍵調整 1: 嘗試匹配 H5P 容器的當前尺寸
    if (h5pContainer) {
        // 由於 H5P 內容是動態載入的，在 setup 時容器尺寸可能還不準確
        // 我們先預設一個較大的尺寸，並將畫布附加到容器內。
        canvasWidth = h5pContainer.offsetWidth || 800;
        // 為了確保覆蓋整個 H5P 內容區，我們將高度設置得足夠大
        // 如果 H5P 內容載入後會撐開容器，這裡應取其最終高度
        canvasHeight = h5pContainer.offsetHeight || 600; 
    }
    
    // 關鍵調整 2: 創建 Canvas
    const canvas = createCanvas(canvasWidth, canvasHeight); 
    
    // 關鍵調整 3: 將 Canvas 附加到 H5P 容器內
    if (h5pContainer) {
        canvas.parent('h5pContainer');
    }

    gravity = createVector(0, 0.2); 
    colorMode(HSB, 360, 100, 100, 1); 
    // 註冊窗口大小改變事件，確保 H5P 內容調整大小時 Canvas 也跟著調整
    window.addEventListener('resize', windowResized);
} 

function draw() { 
    // ... (保留 draw 函數的其餘邏輯，包括煙火更新和繪製) ...
}

// 關鍵調整 4: 新增窗口大小調整函數，用於響應式設計
function windowResized() {
    const h5pContainer = document.getElementById('h5pContainer');
    if (h5pContainer) {
        // 重新調整 canvas 尺寸以匹配容器
        resizeCanvas(h5pContainer.offsetWidth, h5pContainer.offsetHeight);
    }
}
