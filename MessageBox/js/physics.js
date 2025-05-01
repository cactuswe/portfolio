const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies;

const engine = Engine.create();
engine.world.gravity.y = 0;
engine.timing.timeScale = 1;
engine.enableSleeping = false;
Matter.Engine.update(engine, 1000 / 60);
const world = engine.world;

// Create renderer
const render = Render.create({
    element: document.getElementById('physics-container'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
    }
});

// Update collision categories
const CATEGORIES = {
    WALLS: 0x0001,
    MESSAGES: 0x0002,
    INPUT: 0x0004
};

// Create invisible walls extending beyond viewport
const WALL_OFFSET = 1000;
const walls = [
    Bodies.rectangle(-WALL_OFFSET/2, window.innerHeight/2, WALL_OFFSET, window.innerHeight + WALL_OFFSET, { 
        isStatic: true,
        restitution: 0.6,
        render: { visible: false },
        collisionFilter: { 
            category: CATEGORIES.WALLS,
            mask: CATEGORIES.MESSAGES
        }
    }),
    Bodies.rectangle(window.innerWidth + WALL_OFFSET/2, window.innerHeight/2, WALL_OFFSET, window.innerHeight + WALL_OFFSET, { 
        isStatic: true,
        restitution: 0.6,
        render: { visible: false },
        collisionFilter: { 
            category: CATEGORIES.WALLS,
            mask: CATEGORIES.MESSAGES
        }
    }),
    Bodies.rectangle(window.innerWidth/2, -WALL_OFFSET/2, window.innerWidth + WALL_OFFSET, WALL_OFFSET, { 
        isStatic: true,
        restitution: 0.6,
        render: { visible: false },
        collisionFilter: { 
            category: CATEGORIES.WALLS,
            mask: CATEGORIES.MESSAGES
        }
    }),
    Bodies.rectangle(window.innerWidth/2, window.innerHeight + WALL_OFFSET/2, window.innerWidth + WALL_OFFSET, WALL_OFFSET, { 
        isStatic: true,
        restitution: 0.6,
        render: { visible: false },
        collisionFilter: { 
            category: CATEGORIES.WALLS,
            mask: CATEGORIES.MESSAGES
        }
    })
];
World.add(world, walls);

// Add input barrier
const inputBarrier = Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight - 60,
    window.innerWidth,
    20,
    {
        isStatic: true,
        render: { visible: false },
        collisionFilter: {
            category: CATEGORIES.INPUT,
            mask: CATEGORIES.MESSAGES
        }
    }
);

World.add(world, inputBarrier);

// Create and start runner
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { month: 'long', day: 'numeric' }) + 
               ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) +
               ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

const MAX_MESSAGES = 15;
const FADE_DURATION = 1000;
let activeMessages = [];

// Create physics message
function createPhysicsMessage(text, x, y, messageId, savedPosition = null, timestamp = null, isNew = false) {
    if (activeMessages.length >= MAX_MESSAGES) {
        const oldestMessage = activeMessages.shift();
        fadeOutAndRemove(oldestMessage);
    }

    const existingMessage = document.querySelector(`[data-message-id="${messageId}"]`);
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <span>${text}</span>
        <span class="message-meta">${formatMessageTime(timestamp || Date.now())}</span>
    `;
    messageDiv.dataset.messageId = messageId;
    document.body.appendChild(messageDiv);

    const messageWidth = messageDiv.offsetWidth;
    const messageHeight = messageDiv.offsetHeight;

    const message = Bodies.rectangle(
        savedPosition ? savedPosition.x : x,
        savedPosition ? savedPosition.y : y,
        messageWidth,
        messageHeight,
        {
            render: { visible: false },
            chamfer: { radius: 5 },
            restitution: 0.7,   
            friction: 0.01,     
            frictionAir: 0.001,  
            density: 0.001,     
            isStatic: false,
            element: messageDiv,
            messageId: messageId,
            collisionFilter: {
                group: 0,        
                category: CATEGORIES.MESSAGES,
                mask: CATEGORIES.WALLS | CATEGORIES.MESSAGES | CATEGORIES.INPUT
            }
        }
    );

    activeMessages.push({ body: message, div: messageDiv, timestamp: timestamp });

    const updateMessage = () => {
        const maxAngle = Math.PI / 16;
        if (Math.abs(message.angle) > maxAngle) {
            Matter.Body.setAngle(message, Math.sign(message.angle) * maxAngle);
            Matter.Body.setAngularVelocity(message, 0);
        }

        if (Math.abs(message.angularVelocity) > 0.01) {
            Matter.Body.setAngularVelocity(message, message.angularVelocity * 0.95);
        }

        messageDiv.style.transform = `translate(${message.position.x - messageWidth/2}px, ${message.position.y - messageHeight/2}px) rotate(${message.angle}rad)`;
    };

    Matter.Events.on(engine, 'afterUpdate', updateMessage);
    message.updateFunction = updateMessage;

    World.add(world, message);
    return message;
}

function fadeOutAndRemove(messageObj) {
    const { body, div } = messageObj;
    
    if (body.updateFunction) {
        Matter.Events.off(engine, 'afterUpdate', body.updateFunction);
    }
    
    div.style.transition = `all ${FADE_DURATION}ms ease`;
    div.style.opacity = '0';
    div.style.transform += ' scale(0.8) rotate(10deg)';
    
    setTimeout(() => {
        World.remove(world, body);
        div.remove();
    }, FADE_DURATION);
}

// Function to update message positions in Firebase
function updateMessagePosition(messageId, position, angle) {
    return {
        x: position.x,
        y: position.y,
        angle: angle
    };
}

function updatePhysicsSize() {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    
    walls.forEach(wall => World.remove(world, wall));
    walls.length = 0;
    
    const newWalls = [
        Bodies.rectangle(-WALL_OFFSET/2, window.innerHeight/2, WALL_OFFSET, window.innerHeight + WALL_OFFSET, { 
            isStatic: true,
            restitution: 0.6,
            render: { visible: false },
            collisionFilter: { 
                category: CATEGORIES.WALLS,
                mask: CATEGORIES.MESSAGES
            }
        }),
        Bodies.rectangle(window.innerWidth + WALL_OFFSET/2, window.innerHeight/2, WALL_OFFSET, window.innerHeight + WALL_OFFSET, { 
            isStatic: true,
            restitution: 0.6,
            render: { visible: false },
            collisionFilter: { 
                category: CATEGORIES.WALLS,
                mask: CATEGORIES.MESSAGES
            }
        }),
        Bodies.rectangle(window.innerWidth/2, -WALL_OFFSET/2, window.innerWidth + WALL_OFFSET, WALL_OFFSET, { 
            isStatic: true,
            restitution: 0.6,
            render: { visible: false },
            collisionFilter: { 
                category: CATEGORIES.WALLS,
                mask: CATEGORIES.MESSAGES
            }
        }),
        Bodies.rectangle(window.innerWidth/2, window.innerHeight + WALL_OFFSET/2, window.innerWidth + WALL_OFFSET, WALL_OFFSET, { 
            isStatic: true,
            restitution: 0.6,
            render: { visible: false },
            collisionFilter: { 
                category: CATEGORIES.WALLS,
                mask: CATEGORIES.MESSAGES
            }
        })
    ];
    
    World.add(world, newWalls);
    walls.push(...newWalls);

    activeMessages.forEach(({ body }) => {
        const x = Math.min(Math.max(body.position.x, 50), window.innerWidth - 50);
        const y = Math.min(Math.max(body.position.y, 50), window.innerHeight - 100);
        Matter.Body.setPosition(body, { x, y });
    });

    Matter.Body.setPosition(inputBarrier, {
        x: window.innerWidth / 2,
        y: window.innerHeight - 60
    });
    Matter.Body.setVertices(inputBarrier, [
        { x: 0, y: window.innerHeight - 60 },
        { x: window.innerWidth, y: window.innerHeight - 60 },
        { x: window.innerWidth, y: window.innerHeight - 40 },
        { x: 0, y: window.innerHeight - 40 }
    ]);
}

window.addEventListener('orientationchange', () => {
    setTimeout(updatePhysicsSize, 100);
});

export { engine, render, createPhysicsMessage, updateMessagePosition, updatePhysicsSize };