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
            // 為了在 400 高度上可見，讓初速度更快一點
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
        
        console.log("新的分數已接收:", scoreText); 
        
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟三：p5.js 核心設定與繪圖
// -----------------------------------------------------------------

function setup() { 
    // !!! 關鍵調整 1: 鎖定 Canvas 尺寸，確保可見性 !!!
    createCanvas(600, 400); 
    
    gravity = createVector(0, 0.2); 
    colorMode(HSB, 360, 100, 100, 1); 
} 

function draw() { 
    // 使用帶有低透明度 (0.1) 的背景，創造粒子拖尾效果
    background(255, 0.1); 
    
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    // *** 觸發條件：100% 滿分 ***
    if (percentage >= 100 && maxScore > 0) { 
        fill(120, 100, 70); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 關鍵調整 2: 提高發射機率到 20% !!!
        if (random(1) < 0.2) { 
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        fill(45, 100, 80); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        fill(0, 100, 80); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        fill(0, 0, 60); 
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 20); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) { 
        fill(120, 100, 70, 0.5); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        fill(45, 100, 80, 0.5); 
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 更新並繪製煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
}
