// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_BLOCK_SIZE = 30;

// 方块形状定义
const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
};

// 方块颜色
const COLORS = {
    I: '#00f5ff',
    J: '#0066ff',
    L: '#ff9900',
    O: '#ffff00',
    S: '#00ff66',
    T: '#cc00ff',
    Z: '#ff0033'
};

// 游戏类
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highScore = localStorage.getItem('tetrisHighScore') || 0;

        this.gameRunning = false;
        this.gamePaused = false;
        this.dropInterval = 1000;
        this.lastDrop = 0;

        this.init();
    }

    init() {
        // 初始化面板
        this.clearBoard();

        // 绑定事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

        // 显示最高分
        document.getElementById('highScore').textContent = this.highScore;

        // 绘制初始画面
        this.draw();
        this.drawNext();
    }

    clearBoard() {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    startGame() {
        this.clearBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.gameRunning = true;
        this.gamePaused = false;

        this.updateDisplay();
        this.hideModal('gameOver');
        this.hideModal('pauseModal');

        this.currentPiece = this.randomPiece();
        this.nextPiece = this.randomPiece();

        document.getElementById('startBtn').textContent = '重新开始';

        this.lastDrop = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    randomPiece() {
        const keys = Object.keys(SHAPES);
        const type = keys[Math.floor(Math.random() * keys.length)];
        return {
            type: type,
            shape: SHAPES[type].map(row => [...row]),
            x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
            y: 0,
            color: COLORS[type]
        };
    }

    gameLoop(time) {
        if (!this.gameRunning) return;

        if (!this.gamePaused) {
            if (time - this.lastDrop > this.dropInterval) {
                this.moveDown();
                this.lastDrop = time;
            }
            this.draw();
            this.drawNext();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.drawGrid();

        // 绘制已固定的方块
        this.drawBoard();

        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx, 0, 0);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    drawBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(this.ctx, x, y, this.board[y][x]);
                }
            }
        }
    }

    drawPiece(piece, context, offsetX, offsetY) {
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.drawBlock(context, piece.x + dx + offsetX, piece.y + dy + offsetY, piece.color);
                }
            });
        });
    }

    drawBlock(context, x, y, color) {
        const padding = 1;
        const innerPadding = 3;

        // 主色块
        context.fillStyle = color;
        context.fillRect(
            x * BLOCK_SIZE + padding,
            y * BLOCK_SIZE + padding,
            BLOCK_SIZE - padding * 2,
            BLOCK_SIZE - padding * 2
        );

        // 高光效果
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(
            x * BLOCK_SIZE + padding + innerPadding,
            y * BLOCK_SIZE + padding + innerPadding,
            (BLOCK_SIZE - padding * 2) / 2,
            innerPadding
        );
        context.fillRect(
            x * BLOCK_SIZE + padding + innerPadding,
            y * BLOCK_SIZE + padding + innerPadding,
            innerPadding,
            (BLOCK_SIZE - padding * 2) / 2
        );

        // 阴影效果
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(
            x * BLOCK_SIZE + padding + innerPadding,
            y * BLOCK_SIZE + BLOCK_SIZE - padding - innerPadding * 2,
            (BLOCK_SIZE - padding * 2) / 2,
            innerPadding
        );
        context.fillRect(
            x * BLOCK_SIZE + BLOCK_SIZE - padding - innerPadding * 2,
            y * BLOCK_SIZE + padding + innerPadding,
            innerPadding,
            (BLOCK_SIZE - padding * 2) / 2
        );
    }

    drawNext() {
        this.nextCtx.fillStyle = '#0a0a1a';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const blockSize = NEXT_BLOCK_SIZE;
        const shape = this.nextPiece.shape;
        const offsetX = (this.nextCanvas.width / blockSize - shape[0].length) / 2;
        const offsetY = (this.nextCanvas.height / blockSize - shape.length) / 2;

        shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        (offsetX + dx) * blockSize + 1,
                        (offsetY + dy) * blockSize + 1,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            });
        });
    }

    moveDown() {
        if (this.isValidMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        } else {
            this.lockPiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.randomPiece();

            if (!this.isValidMove(this.currentPiece, 0, 0)) {
                this.gameOver();
            }
        }
    }

    moveLeft() {
        if (this.isValidMove(this.currentPiece, -1, 0)) {
            this.currentPiece.x--;
        }
    }

    moveRight() {
        if (this.isValidMove(this.currentPiece, 1, 0)) {
            this.currentPiece.x++;
        }
    }

    rotate() {
        const rotated = this.rotatePiece(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;

        // 墙踢检测
        if (!this.isValidMove(this.currentPiece, 0, 0)) {
            if (this.isValidMove(this.currentPiece, 1, 0)) {
                this.currentPiece.x++;
            } else if (this.isValidMove(this.currentPiece, -1, 0)) {
                this.currentPiece.x--;
            } else if (this.isValidMove(this.currentPiece, 2, 0)) {
                this.currentPiece.x += 2;
            } else if (this.isValidMove(this.currentPiece, -2, 0)) {
                this.currentPiece.x -= 2;
            } else {
                this.currentPiece.shape = originalShape;
            }
        }
    }

    rotatePiece(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = shape[y][x];
            }
        }
        return rotated;
    }

    hardDrop() {
        while (this.isValidMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            this.score += 2;
        }
        this.moveDown();
        this.updateDisplay();
    }

    isValidMove(piece, offsetX, offsetY) {
        const shape = piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }
                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const y = this.currentPiece.y + dy;
                    const x = this.currentPiece.x + dx;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;

            // 计分规则
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;

            // 升级
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.updateDisplay();
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    handleKeyPress(e) {
        if (!this.gameRunning) return;

        switch (e.key) {
            case 'ArrowLeft':
                if (!this.gamePaused) this.moveLeft();
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (!this.gamePaused) this.moveRight();
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (!this.gamePaused) {
                    this.moveDown();
                    this.score += 1;
                    this.updateDisplay();
                }
                e.preventDefault();
                break;
            case 'ArrowUp':
                if (!this.gamePaused) this.rotate();
                e.preventDefault();
                break;
            case ' ':
                if (!this.gamePaused) this.hardDrop();
                e.preventDefault();
                break;
            case 'p':
            case 'P':
                this.togglePause();
                e.preventDefault();
                break;
        }
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.showModal('pauseModal');
        } else {
            this.hideModal('pauseModal');
            this.lastDrop = performance.now();
        }
    }

    showModal(id) {
        document.getElementById(id).classList.add('show');
    }

    hideModal(id) {
        document.getElementById(id).classList.remove('show');
    }

    gameOver() {
        this.gameRunning = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }

        document.getElementById('finalScore').textContent = this.score;
        this.showModal('gameOver');
    }
}

// 启动游戏
const game = new TetrisGame();
