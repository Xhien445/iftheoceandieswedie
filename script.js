gsap.registerPlugin(MotionPathPlugin);

/* =========================================
   INTRO ANIMATION (LOADING PAGE)
   ========================================= */
window.addEventListener("load", () => {
    const tl = gsap.timeline();

    // Reset trạng thái ban đầu để đảm bảo không bị lỗi cache style
    gsap.set(".loading-logo", { opacity: 0 });
    gsap.set(".loading-text-wrapper", { width: 0, opacity: 0 });
    gsap.set(".loading-text", { x: -30 }); // Text thụt lùi một chút để lát trượt ra

    tl
    // 1. Logo hiện ra giữa màn hình (0.8s)
    .to(".loading-logo", { 
        opacity: 1, 
        duration: 0.8, 
        ease: "power2.out" 
    })
    
    // 2. Mở rộng Text Wrapper (Logo sẽ tự bị đẩy sang trái, Text hiện ra)
    .to(".loading-text-wrapper", { 
        width: "auto", // Tự động mở rộng theo độ dài chữ
        opacity: 1,    // Hiện wrapper
        duration: 1.2, 
        ease: "power3.inOut" // Dùng power3 cho cảm giác trượt mượt hơn
    }, "+=0.2")

    // 3. Cùng lúc đó, Text bên trong trượt nhẹ từ trái sang cho có động lực
    .to(".loading-text", { 
        x: 0, 
        duration: 1.2, 
        ease: "power3.inOut" 
    }, "<") // Dấu "<" chạy cùng lúc với animation trên

    // 4. Dừng lại chút (0.5s) để user đọc
    .to({}, { duration: 0.5 })

    // 5. Fade out overlay
    .to("#loading-overlay", { 
        opacity: 0, 
        duration: 0.8, 
        ease: "power2.inOut",
        onComplete: () => {
            document.getElementById("loading-overlay").style.display = "none";
        }
    });
});

/* =========================================
   PHẦN 1: GỢN SÓNG NỀN (GIỮ NGUYÊN)
   ========================================= */
const rippleContainer = document.getElementById('ripple-container');

function createRippleCluster() {
    const cluster = document.createElement('div');
    cluster.classList.add('ripple-cluster');
    
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    cluster.style.left = x + '%';
    cluster.style.top = y + '%';
    
    rippleContainer.appendChild(cluster);
    const ringCount = Math.floor(Math.random() * 2) + 2; 

    for (let i = 0; i < ringCount; i++) {
        const ring = document.createElement('div');
        ring.classList.add('ripple-ring');
        cluster.appendChild(ring);
        const baseDuration = 6 + Math.random() * 3;
        const delay = i * 1.0; 
        ring.style.animation = `rippleEffect ${baseDuration}s linear ${delay}s forwards`;
    }
    setTimeout(() => { cluster.remove(); }, 15000);
}
setInterval(createRippleCluster, 1500);
createRippleCluster();


/* =========================================
   PHẦN 2: BLOBS & INTERACTIONS (GIỮ NGUYÊN)
   ========================================= */
function getInnerPoint() {
    const padding = 100; 
    return { x: gsap.utils.random(padding, window.innerWidth - padding), y: gsap.utils.random(padding, window.innerHeight - padding) };
}

function getOuterPoint() {
    const buffer = 300; 
    return { x: gsap.utils.random(-buffer, window.innerWidth + buffer), y: gsap.utils.random(-buffer, window.innerHeight + buffer) };
}

function isOffScreen(point) {
    return point.x < 0 || point.x > window.innerWidth || point.y < 0 || point.y > window.innerHeight;
}

function swim(element) {
    if (element.classList.contains('is-hovered')) return;
    let currentX = gsap.getProperty(element, "x");
    let currentY = gsap.getProperty(element, "y");
    let pathPoints = [];
    let lastPoint = { x: currentX, y: currentY };

    for (let i = 0; i < 3; i++) {
        let nextPoint;
        if (isOffScreen(lastPoint)) { nextPoint = getInnerPoint(); } 
        else { nextPoint = getOuterPoint(); }
        pathPoints.push(nextPoint);
        lastPoint = nextPoint; 
    }

    const duration = gsap.utils.random(15, 25); 
    element.currentTween = gsap.to(element, {
        duration: duration,
        motionPath: { path: pathPoints, curviness: 1.5, autoRotate: true, alignOrigin: [0.5, 0.5] },
        ease: "sine.inOut",
        onComplete: () => swim(element)
    });
}

const blobs = document.querySelectorAll('.blob');
blobs.forEach((blob, index) => {
    const startPos = getInnerPoint(); 
    gsap.set(blob, { x: startPos.x, y: startPos.y });
    setTimeout(() => { swim(blob); }, index * 800); 

    const textSpan = blob.querySelector('.blob-text');
    
    blob.addEventListener('mouseenter', () => {
        if (blob.currentTween) blob.currentTween.pause();
        gsap.killTweensOf(textSpan);
        gsap.to(textSpan, { duration: 0.15, opacity: 0, onComplete: () => {
            textSpan.innerText = blob.dataset.name;
            blob.classList.add('is-hovered');
            gsap.to(textSpan, { duration: 0.15, opacity: 1 });
        }});
    });

    blob.addEventListener('mouseleave', () => {
        gsap.killTweensOf(textSpan);
        gsap.to(textSpan, { duration: 0.15, opacity: 0, onComplete: () => {
            textSpan.innerText = blob.dataset.original;
            blob.classList.remove('is-hovered');
            gsap.to(textSpan, { duration: 0.15, opacity: 1 });
            if (blob.currentTween) blob.currentTween.resume();
            else swim(blob);
        }});
    });

    blob.addEventListener('click', () => {
        const link = blob.dataset.link;
        if (link) window.open(link, '_blank'); 
    });
});
window.addEventListener('resize', () => { gsap.set(".container", { width: window.innerWidth, height: window.innerHeight }); });


/* =========================================
   PHẦN 3: CLICK SOUND & BUBBLE TRAIL (CẬP NHẬT)
   ========================================= */

// --- A. CLICK SOUND ---
const bubbleSound = new Audio('sounds/bubble.wav');
bubbleSound.volume = 0.5; 

window.addEventListener('click', () => {
    const soundClone = bubbleSound.cloneNode();
    soundClone.play().catch(e => console.log(e));
});

// --- B. CURSOR BUBBLE TRAIL ---

// Hàm tạo 1 bong bóng tại vị trí x, y
function createBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.classList.add('cursor-bubble');
    document.body.appendChild(bubble);

    // Random kích thước bong bóng
    const size = gsap.utils.random(10, 25);
    
    // Set vị trí ban đầu (có chút random offset cho tự nhiên)
    gsap.set(bubble, {
        x: x + gsap.utils.random(-5, 5),
        y: y,
        width: size,
        height: size,
        opacity: 1
    });

    // Animation bay lên
    gsap.to(bubble, {
        y: y - gsap.utils.random(60, 120), // Bay lên cao hơn xíu
        scale: 1.2,
        opacity: 0,
        duration: gsap.utils.random(1, 2), // Bay chậm rãi hơn
        ease: "power1.out",
        onComplete: () => bubble.remove()
    });
}

// Biến lưu vị trí chuột hiện tại
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Biến để kiểm soát tốc độ tạo bong bóng khi di chuyển (Throttle)
let lastBubbleTime = 0;
const BUBBLE_INTERVAL = 50; // Đơn vị ms: Cứ 100ms mới tạo 1 bong bóng (tăng số này nếu muốn ít hơn nữa)

// 1. Logic khi Di chuyển chuột
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const now = Date.now();
    // Chỉ tạo bong bóng nếu đã qua khoảng thời gian quy định (giảm số lượng)
    if (now - lastBubbleTime > BUBBLE_INTERVAL) {
        createBubble(mouseX, mouseY);
        lastBubbleTime = now;
    }
});

// 2. Logic khi Đứng yên (Idle)
// Tự động tạo bong bóng mỗi 800ms tại vị trí chuột hiện tại
setInterval(() => {
    // Có thể thêm logic: Chỉ tạo nếu chuột nằm trong màn hình
    if (mouseX > 0 && mouseX < window.innerWidth && mouseY > 0 && mouseY < window.innerHeight) {
        createBubble(mouseX, mouseY);
    }
}, 800); // 800ms = 0.8 giây một cái