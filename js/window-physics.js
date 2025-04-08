class WindowPhysics {
    constructor() {
        this.windows = [];
        this.gravity = 0.5;
        this.friction = 0.99;
        this.elasticity = 0.5;
        this.screenPadding = 20;
        this.velocities = new Map();
        this.angularVelocities = new Map();
        this.animationFrameId = null;
        
        // Start the animation loop
        this.startAnimation();
    }
    
    addWindow(windowEl) {
        this.windows.push(windowEl);
        this.velocities.set(windowEl, { x: 0, y: 0 });
        this.angularVelocities.set(windowEl, 0);
        
        // Add transform origin to center
        windowEl.style.transformOrigin = 'center';
    }
    
    removeWindow(windowEl) {
        const index = this.windows.indexOf(windowEl);
        if (index !== -1) {
            this.windows.splice(index, 1);
            this.velocities.delete(windowEl);
            this.angularVelocities.delete(windowEl);
        }
    }
    
    // Check for collision between two rectangles
    checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    // Resolve collision between two windows
    resolveCollision(window1, window2) {
        const rect1 = window1.getBoundingClientRect();
        const rect2 = window2.getBoundingClientRect();
        const velocity1 = this.velocities.get(window1);
        const velocity2 = this.velocities.get(window2);
        const angularVelocity1 = this.angularVelocities.get(window1);
        const angularVelocity2 = this.angularVelocities.get(window2);
        
        // Calculate overlap
        const overlapX = Math.min(rect1.right - rect2.left, rect2.right - rect1.left);
        const overlapY = Math.min(rect1.bottom - rect2.top, rect2.bottom - rect1.top);
        
        // Determine which axis has the smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (rect1.left < rect2.left) {
                window1.style.left = `${rect1.left - overlapX/2}px`;
                window2.style.left = `${rect2.left + overlapX/2}px`;
            } else {
                window1.style.left = `${rect1.left + overlapX/2}px`;
                window2.style.left = `${rect2.left - overlapX/2}px`;
            }
            
            // Exchange horizontal velocities and add rotation
            const tempVx = velocity1.x;
            velocity1.x = velocity2.x * this.elasticity;
            velocity2.x = tempVx * this.elasticity;
            
            // Add angular velocity based on collision
            this.angularVelocities.set(window1, angularVelocity1 + (velocity1.x - velocity2.x) * 0.01);
            this.angularVelocities.set(window2, angularVelocity2 + (velocity2.x - velocity1.x) * 0.01);
        } else {
            // Vertical collision
            if (rect1.top < rect2.top) {
                window1.style.top = `${rect1.top - overlapY/2}px`;
                window2.style.top = `${rect2.top + overlapY/2}px`;
            } else {
                window1.style.top = `${rect1.top + overlapY/2}px`;
                window2.style.top = `${rect2.top - overlapY/2}px`;
            }
            
            // Exchange vertical velocities and add rotation
            const tempVy = velocity1.y;
            velocity1.y = velocity2.y * this.elasticity;
            velocity2.y = tempVy * this.elasticity;
            
            // Add angular velocity based on collision
            this.angularVelocities.set(window1, angularVelocity1 + (velocity1.y - velocity2.y) * 0.01);
            this.angularVelocities.set(window2, angularVelocity2 + (velocity2.y - velocity1.y) * 0.01);
        }
    }
    
    update() {
        for (let i = 0; i < this.windows.length; i++) {
            const window1 = this.windows[i];
            const velocity1 = this.velocities.get(window1);
            const angularVelocity1 = this.angularVelocities.get(window1);
            const rect1 = window1.getBoundingClientRect();
            
            // Apply gravity
            velocity1.y += this.gravity;
            
            // Apply friction
            velocity1.x *= this.friction;
            velocity1.y *= this.friction;
            
            // Apply angular friction
            this.angularVelocities.set(window1, angularVelocity1 * this.friction);
            
            // Update position
            const currentLeft = parseFloat(window1.style.left) || 0;
            const currentTop = parseFloat(window1.style.top) || 0;
            const currentRotation = parseFloat(window1.style.transform?.replace('rotate(', '').replace('deg)', '')) || 0;
            
            let newLeft = currentLeft + velocity1.x;
            let newTop = currentTop + velocity1.y;
            let newRotation = currentRotation + angularVelocity1;
            
            // Screen boundary collision
            if (newLeft < this.screenPadding) {
                newLeft = this.screenPadding;
                velocity1.x = -velocity1.x * this.elasticity;
                this.angularVelocities.set(window1, angularVelocity1 + velocity1.x * 0.01);
            }
            if (newLeft + rect1.width > window.innerWidth - this.screenPadding) {
                newLeft = window.innerWidth - rect1.width - this.screenPadding;
                velocity1.x = -velocity1.x * this.elasticity;
                this.angularVelocities.set(window1, angularVelocity1 - velocity1.x * 0.01);
            }
            if (newTop < this.screenPadding) {
                newTop = this.screenPadding;
                velocity1.y = -velocity1.y * this.elasticity;
                this.angularVelocities.set(window1, angularVelocity1 + velocity1.y * 0.01);
            }
            if (newTop + rect1.height > window.innerHeight - this.screenPadding) {
                newTop = window.innerHeight - rect1.height - this.screenPadding;
                velocity1.y = -velocity1.y * this.elasticity;
                this.angularVelocities.set(window1, angularVelocity1 - velocity1.y * 0.01);
            }
            
            // Update position and rotation
            window1.style.left = `${newLeft}px`;
            window1.style.top = `${newTop}px`;
            window1.style.transform = `rotate(${newRotation}deg)`;
            
            // Check for collisions with other windows
            for (let j = i + 1; j < this.windows.length; j++) {
                const window2 = this.windows[j];
                const rect2 = window2.getBoundingClientRect();
                
                if (this.checkCollision(rect1, rect2)) {
                    this.resolveCollision(window1, window2);
                }
            }
        }
    }
    
    startAnimation() {
        const animate = () => {
            this.update();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

// Create a single instance of WindowPhysics
const windowPhysics = new WindowPhysics(); 