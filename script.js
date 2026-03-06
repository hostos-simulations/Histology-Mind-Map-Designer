let nodes = [];
let links = [];
let nextId = 1;
let linkSource = null;
let isLinkMode = false;
let draggingNode = null;
let dragOffset = { x: 0, y: 0 };

window.onload = () => {
    const viewport = document.getElementById('viewport');
    viewport.scrollLeft = 2500 - (viewport.clientWidth / 2);
    viewport.scrollTop = 2500 - (viewport.clientHeight / 2);
    
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('drawer-overlay').classList.add('active');

    createNode(2500, 2500, "TISSUES");
};

function closeSplash() { document.getElementById('splash-screen').style.display = 'none'; }
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('drawer-overlay').classList.toggle('active');
}

function createNode(x, y, title) {
    const node = { id: nextId++, x, y, title, desc: '', img: '', alt: '' };
    nodes.push(node);
    render();
    return node;
}

function addFromMenu(val) {
    if (!val) return;
    const v = document.getElementById('viewport');
    const x = v.scrollLeft + (v.clientWidth / 2) - 110 + (Math.random()*40);
    const y = v.scrollTop + (v.clientHeight / 2) - 40 + (Math.random()*40);
    createNode(x, y, val);
    document.getElementById('suggestion-menu').value = '';
}

function render() {
    const canvas = document.getElementById('canvas');
    canvas.querySelectorAll('.node').forEach(n => n.remove());

    nodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'node';
        div.id = `node-${node.id}`;
        div.tabIndex = 0;
        div.style.transform = `translate(${node.x}px, ${node.y}px)`;

        if (linkSource && linkSource.id === node.id) div.classList.add('linking-source');

        div.innerHTML = `
            <button class="del-btn" onclick="removeNode(event, ${node.id})">✕</button>
            <div class="node-header">${node.title}</div>
            <div class="node-body">
                ${node.desc ? `<div style="margin-bottom:4px; font-weight:500;">${node.desc}</div>` : ''}
                ${node.img ? `<img src="${node.img}" class="node-img" alt="${node.alt || node.title}">` : ''}
            </div>
        `;

        div.onmousedown = (e) => {
            if (isLinkMode || e.target.classList.contains('del-btn')) return;
            draggingNode = node;
            dragOffset.x = e.pageX - node.x;
            dragOffset.y = e.pageY - node.y;
            window.onmousemove = doDrag;
            window.onmouseup = stopDrag;
            e.preventDefault();
        };

        div.onclick = () => { if(isLinkMode) handleLinking(node); };
        div.ondblclick = () => { if(!isLinkMode) openModal(node.id); };

        div.onkeydown = (e) => {
            const step = 20;
            if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) {
                if (e.key === 'ArrowRight') node.x += step;
                else if (e.key === 'ArrowLeft') node.x -= step;
                else if (e.key === 'ArrowUp') node.y -= step;
                else if (e.key === 'ArrowDown') node.y += step;
                e.preventDefault();
                div.style.transform = `translate(${node.x}px, ${node.y}px)`;
                updateLinks();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isLinkMode) handleLinking(node); else openModal(node.id);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                removeNode(null, node.id);
            }
        };
        canvas.appendChild(div);
    });
    updateLinks();
}

function doDrag(e) {
    if (!draggingNode) return;
    draggingNode.x = e.pageX - dragOffset.x;
    draggingNode.y = e.pageY - dragOffset.y;
    const el = document.getElementById(`node-${draggingNode.id}`);
    if(el) el.style.transform = `translate(${draggingNode.x}px, ${draggingNode.y}px)`;
    updateLinks();
}

function stopDrag() { draggingNode = null; window.onmousemove = null; }

function updateLinks() {
    const svg = document.getElementById('svg-canvas');
    svg.innerHTML = '';
    links.forEach((link, idx) => {
        const n1 = nodes.find(n => n.id === link.from);
        const n2 = nodes.find(n => n.id === link.to);
        if (!n1 || !n2) return;
        const x1 = n1.x + 110, y1 = n1.y + 35;
        const x2 = n2.x + 110, y2 = n2.y + 35;
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1); line.setAttribute("y1", y1);
        line.setAttribute("x2", x2); line.setAttribute("y2", y2);
        line.setAttribute("stroke", "#475569"); line.setAttribute("stroke-width", "3");
        svg.appendChild(line);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", (x1 + x2) / 2); circle.setAttribute("cy", (y1 + y2) / 2);
        circle.setAttribute("r", "12"); circle.setAttribute("class", "line-del");
        circle.onclick = () => { links.splice(idx, 1); render(); };
        svg.appendChild(circle);
    });
}

function toggleLinkMode() {
    isLinkMode = !isLinkMode;
    linkSource = null;
    const btn = document.getElementById('link-btn');
    const status = document.getElementById('link-status');
    if (isLinkMode) {
        btn.innerText = "Cancel"; btn.className = "btn btn-outline"; 
        btn.style.color = "var(--primary)"; btn.style.borderColor = "var(--primary)";
        status.style.display = "block"; status.innerText = "Select start node";
    } else {
        btn.innerText = "🔗 Link Nodes"; btn.className = "btn btn-link"; 
        btn.style.color = "white"; status.style.display = "none";
        render();
    }
}

function handleLinking(node) {
    if (!linkSource) {
        linkSource = node;
        document.getElementById('link-status').innerText = "Select target node";
        render();
    } else {
        if (linkSource.id !== node.id) links.push({ from: linkSource.id, to: node.id });
        toggleLinkMode();
    }
}

function removeNode(e, id) {
    if(e) e.stopPropagation();
    nodes = nodes.filter(n => n.id !== id);
    links = links.filter(l => l.from !== id && l.to !== id);
    render();
}

function openModal(id = null) {
    const node = nodes.find(n => n.id === id);
    document.getElementById('edit-id').value = id || '';
    document.getElementById('node-name').value = node ? node.title : '';
    document.getElementById('node-desc').value = node ? node.desc : '';
    document.getElementById('node-img-data').value = node ? node.img : '';
    document.getElementById('node-alt').value = node ? node.alt : '';
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('node-name').focus();
}

function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

function saveNode() {
    const id = parseInt(document.getElementById('edit-id').value);
    const name = document.getElementById('node-name').value || "New Node";
    if (id) {
        const n = nodes.find(x => x.id === id);
        n.title = name; n.desc = document.getElementById('node-desc').value; n.img = document.getElementById('node-img-data').value; n.alt = document.getElementById('node-alt').value;
    } else {
        const v = document.getElementById('viewport');
        const newNode = createNode(v.scrollLeft + 100, v.scrollTop + 100, name);
        newNode.desc = document.getElementById('node-desc').value; newNode.img = document.getElementById('node-img-data').value; newNode.alt = document.getElementById('node-alt').value;
    }
    closeModal();
    render();
}

function processFile(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('node-img-data').value = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}

function exportAsImage() {
    if (nodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x + 220 > maxX) maxX = n.x + 220;
        if (n.y + 300 > maxY) maxY = n.y + 300;
    });
    minX -= 50; minY -= 50; maxX += 50; maxY += 50;
    const canvasElement = document.getElementById('canvas');
    html2canvas(canvasElement, {
        x: minX, y: minY, width: maxX - minX, height: maxY - minY,
        scale: 2, useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Histology-Mind-Map.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}