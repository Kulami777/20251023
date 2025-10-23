// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 【新增】儲存所有煙火物件的陣列
let gravity; // 【新增】用於模擬重力的向量

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    //noLoop(); // 【註釋掉或刪除】因為煙火需要連續繪製
    gravity = createVector(0, 0.2); // 【新增】定義重力向量
    colorMode(HSB, 360, 100, 100, 1); // 【新增】使用 HSB 顏色模式，更適合粒子顏色變化
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 【修改】使用帶透明度的背景，製造粒子拖尾效果
    background(255, 0.2); // 清除背景，並保留一點點拖尾

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(120, 100, 70); // HSB 綠色，代替 fill(0, 200, 50);
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 【新增】觸發煙火特效
        if (random(1) < 0.03) { // 約 3% 的機率發射新煙花
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色
        fill(45, 100, 80); // HSB 黃色，代替 fill(255, 181, 35);
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色
        fill(0, 100, 80); // HSB 紅色，代替 fill(200, 0, 0);
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(0, 0, 60); // HSB 灰色，代替 fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 20); // HSB 深灰
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 
        fill(120, 100, 70, 0.5); // HSB 綠色帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(45, 100, 80, 0.5); // HSB 黃色帶透明度
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 【新增】更新並繪製煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        if (fireworks[i].done()) {
            // 如果煙火燃放完畢，從陣列中移除
            fireworks.splice(i, 1);
        }
    }
}

// =================================================================
// 步驟三：煙火與粒子系統的類別定義 【新增】
// -----------------------------------------------------------------

// 粒子類別 - 構成煙火爆炸後的碎片
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hue;
        this.acc = createVector(0, 0);

        if (this.firework) {
            // 這是煙火發射的火箭階段
            this.vel = createVector(0, random(-12, -8));
        } else {
            // 這是爆炸後的碎片階段
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
            this.vel.mult(0.9); // 模擬空氣阻力
            this.lifespan -= 4; // 減少壽命 (逐漸透明)
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            // 爆炸碎片
            strokeWeight(2);
            stroke(this.hu, 100, 100, this.lifespan / 255); // 帶透明度的顏色
        } else {
            // 火箭
            strokeWeight(4);
            stroke(this.hu, 100, 100);
        }

        point(this.pos.x, this.pos.y);
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
        this.firework = new Particle(random(width), height, this.hu, true); // 火箭
        this.exploded = false;
        this.particles = []; // 爆炸碎片
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 檢查火箭是否達到最高點 (速度為正表示開始下落)
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
        // 產生大量粒子
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    done() {
        // 判斷煙火是否燃放完畢 (火箭已爆炸且所有碎片都消失)
        return this.exploded && this.particles.length === 0;
    }
}
