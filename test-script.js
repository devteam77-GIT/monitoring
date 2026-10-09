    /* ==========================================================================
       1. STATE MANAGEMENT & DATA MODEL
       ========================================================================== */
    const state = {
      simMode: true,
      serverHost: 'https://hitachi.master-bom.com',
      lastSync: new Date(),
      pollInterval: 3000,
      nextPollSec: 3,
      n8nWebhookUrl: 'https://fms.n8n.lexisolution.com/webhook/fms-live-dashboard',
      hasSpike: true,
      alert: {
        active: true,
        title: "LATENCY SPIKE DETECTED: 50.2 ms / Call",
        desc: "Heavy calculation or unindexed sort on field 'Spend' in procurement tables.",
        metric: 50.2
      },
      metrics: {
        elapsed: 50.2,
        elapsedThreshold: 20.0,
        cacheHit: 99.2,
        unsavedCache: 1.2,
        remoteCalls: 171,
        ioTime: 0.8,
        sessions: 38,
        sessionsMax: 100,
        breakdown: { pro: 20, web: 12, api: 6 },
        cpu: 65.4,
        cores: "12 Cores / 24 Threads",
        ramUsed: 22.8,
        ramTotal: 64.0,
        diskUsed: 412,
        diskTotal: 1024,
        netTotal: 32.4,
        netIn: 10.2,
        netOut: 22.2
      },
      databases: [
        { name: "Master_BOM_Prod.fmp12", size: "142 GB", clients: 18, status: "NORMAL" },
        { name: "Hitachi_Orders.fmp12", size: "88 GB", clients: 10, status: "NORMAL" },
        { name: "Inventory_Control.fmp12", size: "64 GB", clients: 6, status: "NORMAL" },
        { name: "Procurement_Data.fmp12", size: "51 GB", clients: 4, status: "NORMAL" }
      ],
      connectedUsers: [
        { name: "host-proxy-east-2", cpu: 23.62, color: "#3b82f6" },
        { name: "host-proxy-east-0", cpu: 18.79, color: "#10b981" },
        { name: "ip-172-20-37-165.internal", cpu: 12.45, color: "#8b5cf6" },
        { name: "ip-172-20-62-216.internal", cpu: 7.98, color: "#f59e0b" },
        { name: "host-proxy-east-1", cpu: 1.12, color: "#00e5ff" }
      ],
      userHistory: {
        timestamps: [],
        cpu: [
          [20, 22, 25, 23, 21, 28, 30, 25, 24, 23, 23, 22, 23.62],
          [15, 17, 18, 16, 17, 20, 22, 19, 18, 17, 18, 18, 18.79],
          [10, 11, 10, 12, 11, 14, 15, 13, 12, 11, 12, 12, 12.45],
          [5, 6, 5, 7, 6, 8, 9, 7, 6, 5, 6, 7, 7.98],
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.12]
        ],
        mem: [
          [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
          [10, 15, 20, 25, 30, 40, 50, 60, 65, 70, 75, 80, 85],
          [2, 5, 10, 15, 25, 35, 45, 55, 65, 70, 75, 85, 95],
          [40, 42, 43, 44, 45, 43, 42, 41, 42, 43, 44, 45, 46],
          [50, 51, 50, 51, 50, 50, 50, 51, 50, 51, 50, 50, 50]
        ]
      },
      // History for time-series canvas graph (24 datapoints)
      history: {
        timestamps: [],
        elapsed: [12, 14, 11, 15, 13, 14, 16, 15, 14, 16, 15, 18, 14, 13, 15, 16, 17, 25, 42, 52, 48, 50, 49, 50.2],
        cpu:     [25, 28, 22, 26, 24, 25, 27, 26, 25, 28, 26, 30, 26, 25, 28, 30, 32, 45, 58, 68, 62, 64, 63, 65.4],
        sessions:[38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38]
      },
      visibleSeries: {
        elapsed: true,
        cpu: true,
        sessions: true
      }
    };

    // Pre-populate timestamps backward from now
    function initTimestamps() {
      const now = Date.now();
      state.history.timestamps = [];
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now - i * 5000);
        state.history.timestamps.push(d.toTimeString().split(' ')[0]);
      }
    }
    initTimestamps();

    /* ==========================================================================
       2. CANVAS REAL-TIME TELEMETRY GRAPH
       ========================================================================== */
    const canvas = document.getElementById('telemetryCanvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('chartTooltip');

    function resizeCanvas() {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform && ctx.resetTransform();
      ctx.scale(dpr, dpr);
      renderChart();
      renderSmallChart('userCpuCanvas', state.userHistory.cpu, 40);
      renderSmallChart('userMemCanvas', state.userHistory.mem, 100);
    }

    function renderChart() {
      const container = canvas.parentElement;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      ctx.clearRect(0, 0, w, h);

      const padLeft = 45;
      const padRight = 45;
      const padTop = 20;
      const padBottom = 30;
      const graphW = w - padLeft - padRight;
      const graphH = h - padTop - padBottom;

      // Draw Grid Lines (Horizontal)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      const yTicks = 5; // 0, 20, 40, 60, 80, 100
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "10px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "right";

      for (let i = 0; i <= yTicks; i++) {
        const y = padTop + (graphH / yTicks) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();

        // Left Axis: Latency ms (0 to 60)
        const msVal = Math.round(60 - (60 / yTicks) * i);
        ctx.fillText(msVal, padLeft - 8, y + 3);

        // Right Axis: Percent / Sessions (0 to 100)
        ctx.textAlign = "left";
        const pctVal = Math.round(100 - (100 / yTicks) * i);
        ctx.fillText(pctVal, w - padRight + 8, y + 3);
        ctx.textAlign = "right";
      }

      // Axis Titles
      ctx.save();
      ctx.fillStyle = "#00e5ff";
      ctx.font = "9px ui-monospace, Menlo, monospace";
      ctx.translate(12, padTop + graphH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("Elapsed Latency (ms)", 0, 0);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px ui-monospace, Menlo, monospace";
      ctx.translate(w - 12, padTop + graphH / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("CPU % / Active Users", 0, 0);
      ctx.restore();

      const n = state.history.elapsed.length;
      if (n === 0) return;
      const stepX = graphW / (n - 1);

      // Helper function to plot a line series
      function drawSeries(data, color, maxScale, isDashed = false, fillGradient = null) {
        const points = data.map((val, idx) => {
          const x = padLeft + idx * stepX;
          const ratio = Math.min(Math.max(val / maxScale, 0), 1);
          const y = padTop + graphH - ratio * graphH;
          return { x, y, val };
        });

        // Fill area under curve if requested
        if (fillGradient) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, padTop + graphH);
          points.forEach((pt, idx) => {
            if (idx === 0) ctx.lineTo(pt.x, pt.y);
            else {
              const prev = points[idx - 1];
              const cx = (prev.x + pt.x) / 2;
              ctx.bezierCurveTo(cx, prev.y, cx, pt.y, pt.x, pt.y);
            }
          });
          ctx.lineTo(points[points.length - 1].x, padTop + graphH);
          ctx.closePath();
          ctx.fillStyle = fillGradient;
          ctx.fill();
        }

        // Draw Line
        ctx.beginPath();
        if (isDashed) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;

        points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else {
            const prev = points[idx - 1];
            const cx = (prev.x + pt.x) / 2;
            ctx.bezierCurveTo(cx, prev.y, cx, pt.y, pt.x, pt.y);
          }
        });
        ctx.stroke();

        // Draw Points
        ctx.setLineDash([]);
        points.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#0c121e";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        return points;
      }

      // 1. Elapsed Call (ms) - Cyan (Scale: 60ms)
      if (state.visibleSeries.elapsed) {
        const gradElapsed = ctx.createLinearGradient(0, padTop, 0, padTop + graphH);
        gradElapsed.addColorStop(0, "rgba(0, 229, 255, 0.22)");
        gradElapsed.addColorStop(1, "rgba(0, 229, 255, 0.0)");
        drawSeries(state.history.elapsed, "#00e5ff", 60, false, gradElapsed);
      }

      // 2. CPU Load (%) - Blue Dashed (Scale: 100%)
      if (state.visibleSeries.cpu) {
        drawSeries(state.history.cpu, "#3b82f6", 100, true);
      }

      // 3. Active Sessions - Amber (Scale: 100)
      if (state.visibleSeries.sessions) {
        drawSeries(state.history.sessions, "#f59e0b", 100, false);
      }
    }

    // Interactive Hover on Canvas
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const containerW = rect.width;
      const padLeft = 45;
      const padRight = 45;
      const graphW = containerW - padLeft - padRight;
      const n = state.history.elapsed.length;

      if (mouseX < padLeft || mouseX > containerW - padRight) {
        tooltip.style.display = 'none';
        return;
      }

      const ratio = (mouseX - padLeft) / graphW;
      const idx = Math.min(Math.max(Math.round(ratio * (n - 1)), 0), n - 1);

      const time = state.history.timestamps[idx] || "Recent";
      const elap = state.history.elapsed[idx];
      const cpu = state.history.cpu[idx];
      const sess = state.history.sessions[idx];

      document.getElementById('tooltipTime').innerText = `${time} UTC`;
      document.getElementById('tooltipElapsed').innerText = `${elap} ms`;
      document.getElementById('tooltipCpu').innerText = `${cpu}%`;
      document.getElementById('tooltipSessions').innerText = `${sess}`;

      tooltip.style.display = 'block';
      let tooltipX = mouseX + 15;
      if (tooltipX + 160 > containerW) tooltipX = mouseX - 160;
      tooltip.style.left = `${tooltipX}px`;
      tooltip.style.top = `${Math.max(10, e.clientY - rect.top - 40)}px`;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    window.addEventListener('resize', resizeCanvas);

    /* ==========================================================================
       3. DOM UPDATING & DATA RENDERING
       ========================================================================== */
    
    /* ==========================================================================
       USER USAGE CHARTS & LIST
       ========================================================================== */
    function renderUserList() {
      const container = document.getElementById('usersListContainer');
      if (!container) return;
      container.innerHTML = state.connectedUsers.map(user => `
        <div class="user-list-row">
          <div class="user-entity-col">
            <div class="status-check"></div>
            <div class="user-color-dot" style="background: ${user.color}; box-shadow: 0 0 6px ${user.color}"></div>
            <div class="user-name" title="${user.name}">${user.name}</div>
          </div>
          <div class="user-metric-col">${user.cpu.toFixed(2)} %</div>
        </div>
      `).join('');
    }

    function renderSmallChart(canvasId, dataMatrix, maxVal) {
      const cvs = document.getElementById(canvasId);
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      const rect = cvs.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      ctx.resetTransform && ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const padLeft = 30;
      const padRight = 10;
      const padTop = 35;
      const padBottom = 20;
      const graphW = w - padLeft - padRight;
      const graphH = h - padTop - padBottom;

      // Draw Y grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "right";

      const yTicks = 4;
      for (let i = 0; i <= yTicks; i++) {
        const y = padTop + (graphH / yTicks) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();
        
        const val = Math.round(maxVal - (maxVal / yTicks) * i);
        ctx.fillText(val, padLeft - 6, y + 3);
      }
      
      // Draw time labels (X axis mock)
      ctx.textAlign = "center";
      ctx.fillText("01:30 PM", padLeft + graphW*0.33, h - 5);
      ctx.fillText("02:00 PM", padLeft + graphW*0.83, h - 5);

      const n = dataMatrix[0].length;
      if (n === 0) return;
      const stepX = graphW / (n - 1);

      dataMatrix.forEach((series, sIdx) => {
        const color = state.connectedUsers[sIdx].color;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        series.forEach((val, idx) => {
          const x = padLeft + idx * stepX;
          const ratio = Math.min(Math.max(val / maxVal, 0), 1);
          const y = padTop + graphH - ratio * graphH;
          if (idx === 0) ctx.moveTo(x, y);
          else {
            const prevX = padLeft + (idx - 1) * stepX;
            const prevVal = series[idx - 1];
            const prevRatio = Math.min(Math.max(prevVal / maxVal, 0), 1);
            const prevY = padTop + graphH - prevRatio * graphH;
            const cx = (prevX + x) / 2;
            ctx.bezierCurveTo(cx, prevY, cx, y, x, y);
          }
        });
        ctx.stroke();
      });
    }

    function updateUserUsage() {
      // simulate new data
      state.connectedUsers.forEach((u, i) => {
        u.cpu = Math.max(0, u.cpu + (Math.random() * 4 - 2));
        
        state.userHistory.cpu[i].shift();
        state.userHistory.cpu[i].push(u.cpu);

        let lastMem = state.userHistory.mem[i][state.userHistory.mem[i].length - 1];
        let newMem = Math.min(100, Math.max(0, lastMem + (Math.random() * 2 - 1)));
        if (i === 1 && newMem > 90) newMem = 5; // drop simulated
        state.userHistory.mem[i].shift();
        state.userHistory.mem[i].push(newMem);
      });
      renderUserList();
      renderSmallChart('userCpuCanvas', state.userHistory.cpu, 40);
      renderSmallChart('userMemCanvas', state.userHistory.mem, 100);
    }

    function updateDomMetrics() {
      const m = state.metrics;

      // Elapsed Time
      document.getElementById('valElapsed').innerText = m.elapsed.toFixed(1);
      const fillElapPct = Math.min((m.elapsed / 60) * 100, 100);
      document.getElementById('fillElapsed').style.width = `${fillElapPct}%`;

      const cardElapsed = document.getElementById('cardElapsed');
      const tagElapsed = document.getElementById('tagElapsed');
      if (m.elapsed > m.elapsedThreshold) {
        cardElapsed.classList.add('card-alert');
        tagElapsed.className = 'metric-tag tag-danger';
        tagElapsed.innerText = 'SPIKE DETECTED';
      } else {
        cardElapsed.classList.remove('card-alert');
        tagElapsed.className = 'metric-tag tag-success';
        tagElapsed.innerText = 'NORMAL';
      }

      // Cache Hit Ratio
      document.getElementById('valCache').innerText = m.cacheHit.toFixed(1);
      document.getElementById('fillCache').style.width = `${m.cacheHit}%`;
      document.getElementById('valUnsavedCache').innerText = `${m.unsavedCache}%`;

      // Remote Calls / sec
      document.getElementById('valRemoteCalls').innerText = m.remoteCalls;
      document.getElementById('fillRemoteCalls').style.width = `${Math.min((m.remoteCalls / 250) * 100, 100)}%`;
      document.getElementById('subIoTime').innerText = `I/O Time/Call: ${m.ioTime} ms`;

      // Active Sessions
      document.getElementById('valSessions').innerText = m.sessions;
      document.getElementById('valSessionsMax').innerText = `/ ${m.sessionsMax}`;
      
      const proPct = (m.breakdown.pro / m.sessionsMax) * 100;
      const webPct = (m.breakdown.web / m.sessionsMax) * 100;
      const apiPct = (m.breakdown.api / m.sessionsMax) * 100;
      document.getElementById('segPro').style.width = `${proPct}%`;
      document.getElementById('segWeb').style.width = `${webPct}%`;
      document.getElementById('segApi').style.width = `${apiPct}%`;
      document.getElementById('cntPro').innerText = m.breakdown.pro;
      document.getElementById('cntWeb').innerText = m.breakdown.web;
      document.getElementById('cntApi').innerText = m.breakdown.api;

      // CPU
      document.getElementById('valCpu').innerText = m.cpu.toFixed(1);
      document.getElementById('fillCpu').style.width = `${m.cpu}%`;
      const tagCpu = document.getElementById('tagCpu');
      if (m.cpu > 85) {
        tagCpu.className = 'metric-tag tag-danger';
        tagCpu.innerText = 'HIGH LOAD';
      } else {
        tagCpu.className = 'metric-tag tag-success';
        tagCpu.innerText = 'HEALTHY';
      }

      // RAM
      document.getElementById('valRam').innerText = m.ramUsed.toFixed(1);
      const ramPct = ((m.ramUsed / m.ramTotal) * 100).toFixed(1);
      document.getElementById('fillRam').style.width = `${ramPct}%`;
      document.getElementById('tagRamPercent').innerText = `${ramPct}%`;
      document.getElementById('subRamCapacity').innerText = `Capacity: ${m.ramTotal} GB`;

      // Disk
      document.getElementById('valDisk').innerText = m.diskUsed;
      const diskPct = ((m.diskUsed / m.diskTotal) * 100).toFixed(1);
      document.getElementById('fillDisk').style.width = `${diskPct}%`;
      document.getElementById('tagDiskPercent').innerText = `${diskPct}%`;
      document.getElementById('subDiskFree').innerText = `Free: ${(m.diskTotal - m.diskUsed).toFixed(2)} GB`;

      // Network
      document.getElementById('valNetwork').innerText = ((m.netIn || 0) + (m.netOut || 0)).toFixed(1);
      document.getElementById('subNetIn').innerText = `In: ${m.netIn.toFixed(1)} MB/s`;
      document.getElementById('subNetOut').innerText = `Out: ${m.netOut.toFixed(1)} MB/s`;

      // Alert Banner
      const banner = document.getElementById('alertBanner');
      const alertTitle = document.getElementById('alertTitle');
      const alertDesc = document.getElementById('alertDesc');
      const btnAck = document.getElementById('btnAcknowledge');

      if (state.alert.active) {
        banner.classList.remove('resolved');
        alertTitle.innerText = state.alert.title;
        alertDesc.innerHTML = state.alert.desc;
        btnAck.innerText = "ACKNOWLEDGE";
        btnAck.onclick = acknowledgeAlert;
      } else {
        banner.classList.add('resolved');
        alertTitle.innerHTML = `<span style="color:#34d399;">✓ SYSTEM ALL CLEAR: Optimal Latency &lt; 20 ms</span>`;
        alertDesc.innerHTML = `All database engines and n8n pipelines operating within SLA parameters.`;
        btnAck.innerText = "VIEW LOGS";
        btnAck.onclick = fetchAndShowLogs;
      }

      // Hosted Databases List
      renderDatabaseList();

      // Clients List
      if (state.connectedUsersData) {
          const tbody = document.getElementById('clientsTableBody');
          if (state.connectedUsersData.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-dim);">No active clients connected.</td></tr>';
          } else {
              tbody.innerHTML = state.connectedUsersData.map(c => `
                  <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                      <td style="padding: 10px 8px; color: #fff;">${c.sessionIdentifier}</td>
                      <td style="padding: 10px 8px; color: var(--text-muted);">${c.accountName}</td>
                      <td style="padding: 10px 8px; color: var(--cyan-bright);">${c.database}</td>
                      <td style="padding: 10px 8px; color: var(--text-muted);">${c.ipAddress}</td>
                      <td style="padding: 10px 8px;">
                          <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                              ${c.clientType}
                          </span>
                      </td>
                  </tr>
              `).join('');
          }
      }
    }

    function renderDatabaseList() {
      const dbListContainer = document.getElementById('databaseList');
      document.getElementById('dbCountBadge').innerText = `${state.databases.length} Files`;

      dbListContainer.innerHTML = state.databases.map(db => `
        <div class="db-card-item" onclick="onDatabaseClick('${db.name}')" title="Click to inspect in FileMaker / n8n">
          <div class="db-info-left">
            <div class="db-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div class="db-details">
              <div class="db-filename">${db.name}</div>
              <div class="db-meta">
                <span>${db.size}</span>
                <span>•</span>
                <span>${db.clients} Clients</span>
              </div>
            </div>
          </div>
          <div class="db-status-badge ${db.status.toLowerCase().includes('backup') ? 'backup' : 'normal'}">
            ${db.status}
          </div>
        </div>
      `).join('');
    }

    /* ==========================================================================
       4. SIMULATION & DYNAMIC TELEMETRY ENGINE
       ========================================================================== */
    function runSimulationStep() {
      if (!state.simMode) return;

      // Small jitter around realistic values
      if (state.hasSpike) {
        // High spike jitter
        state.metrics.elapsed = +(48 + Math.random() * 5).toFixed(1);
        state.metrics.cpu = +(62 + Math.random() * 6).toFixed(1);
      } else {
        // Normal smooth jitter
        state.metrics.elapsed = +(13 + Math.random() * 4).toFixed(1);
        state.metrics.cpu = +(24 + Math.random() * 5).toFixed(1);
      }

      state.metrics.remoteCalls = Math.round(165 + Math.random() * 15);
      state.metrics.ioTime = +(0.7 + Math.random() * 0.3).toFixed(1);
      state.metrics.netTotal = +(30 + Math.random() * 4).toFixed(1);
      state.metrics.netIn = +(9 + Math.random() * 2).toFixed(1);
      state.metrics.netOut = +(21 + Math.random() * 2).toFixed(1);

      // Push to history
      const now = new Date();
      state.history.timestamps.shift();
      state.history.timestamps.push(now.toTimeString().split(' ')[0]);

      state.history.elapsed.shift();
      state.history.elapsed.push(state.metrics.elapsed);

      state.history.cpu.shift();
      state.history.cpu.push(state.metrics.cpu);

      state.history.sessions.shift();
      state.history.sessions.push(state.metrics.sessions);

      state.lastSync = now;
      document.getElementById('lastSyncTime').innerText = now.toTimeString().split(' ')[0];

      updateDomMetrics();
      renderChart();
      updateUserUsage();
      renderSmallChart('userCpuCanvas', state.userHistory.cpu, 40);
      renderSmallChart('userMemCanvas', state.userHistory.mem, 100);
    }

    // Main Clock & Simulation Loop
    setInterval(() => {
      const now = new Date();
      const utcString = now.toUTCString().split(' ')[4] + " UTC";
      document.getElementById('utcClock').innerText = utcString;

      // Countdown poll timer
      state.nextPollSec--;
      if (state.nextPollSec <= 0) {
        state.nextPollSec = 3;
        runSimulationStep();
      }
      document.getElementById('nextPollCountdown').innerText = `${state.nextPollSec}s`;
    }, 1000);

    /* ==========================================================================
       5. BI-DIRECTIONAL FILEMAKER & N8N BRIDGE
       ========================================================================== */
    
    /**
     * FileMaker calls this function via:
     * "Perform JavaScript in Web Viewer [ Object Name: \"FMS_Viewer\"; Function Name: \"window.setFMSData\"; Parameters: $jsonPayload ]"
     */
    window.setFMSData = function(dataInput) {
      try {
        const payload = typeof dataInput === 'string' ? JSON.parse(dataInput) : dataInput;
        console.log("FMS Dashboard received payload:", payload);

        if (payload.serverHost) state.serverHost = payload.serverHost;
        if (payload.metrics) {
            state.metrics.elapsed = payload.metrics.elapsed !== undefined ? parseFloat(payload.metrics.elapsed) : state.metrics.elapsed;
            state.metrics.cacheHit = payload.metrics.cacheHit !== undefined ? parseFloat(payload.metrics.cacheHit) : state.metrics.cacheHit;
            state.metrics.unsavedCache = payload.metrics.unsavedCache !== undefined ? parseFloat(payload.metrics.unsavedCache) : state.metrics.unsavedCache;
            state.metrics.cpu = payload.metrics.cpu !== undefined ? parseFloat(payload.metrics.cpu) : state.metrics.cpu;
            state.metrics.sessions = payload.metrics.sessions !== undefined ? parseInt(payload.metrics.sessions, 10) : state.metrics.sessions;
            state.metrics.sessionsMax = payload.metrics.sessionsMax !== undefined ? parseInt(payload.metrics.sessionsMax, 10) : state.metrics.sessionsMax;
            state.metrics.remoteCalls = payload.metrics.remoteCalls !== undefined ? parseInt(payload.metrics.remoteCalls, 10) : state.metrics.remoteCalls;
            state.metrics.ioTime = payload.metrics.ioTime !== undefined ? parseFloat(payload.metrics.ioTime) : state.metrics.ioTime;
            state.metrics.ramUsed = payload.metrics.ramUsed !== undefined ? parseFloat(payload.metrics.ramUsed) : state.metrics.ramUsed;
            state.metrics.ramTotal = payload.metrics.ramTotal !== undefined ? parseFloat(payload.metrics.ramTotal) : state.metrics.ramTotal;
            state.metrics.diskUsed = payload.metrics.diskUsed !== undefined ? parseFloat(payload.metrics.diskUsed) : state.metrics.diskUsed;
            state.metrics.diskTotal = payload.metrics.diskTotal !== undefined ? parseFloat(payload.metrics.diskTotal) : state.metrics.diskTotal;
            state.metrics.ramTotal = payload.metrics.ramTotal !== undefined ? parseFloat(payload.metrics.ramTotal) : state.metrics.ramTotal;
            state.metrics.diskUsed = payload.metrics.diskUsed !== undefined ? parseFloat(payload.metrics.diskUsed) : state.metrics.diskUsed;
            state.metrics.diskTotal = payload.metrics.diskTotal !== undefined ? parseFloat(payload.metrics.diskTotal) : state.metrics.diskTotal;
            state.metrics.netIn = payload.metrics.netIn !== undefined ? parseFloat(payload.metrics.netIn) : state.metrics.netIn;
            state.metrics.netOut = payload.metrics.netOut !== undefined ? parseFloat(payload.metrics.netOut) : state.metrics.netOut;
            if (payload.metrics.breakdown) {
                state.metrics.breakdown = payload.metrics.breakdown;
            }
        } else {
            if (payload.elapsed !== undefined) state.metrics.elapsed = parseFloat(payload.elapsed);
            if (payload.cacheHit !== undefined) state.metrics.cacheHit = parseFloat(payload.cacheHit);
            if (payload.cpu !== undefined) state.metrics.cpu = parseFloat(payload.cpu);
            if (payload.sessions !== undefined) state.metrics.sessions = parseInt(payload.sessions, 10);
        }
        if (payload.databases) state.databases = payload.databases;
        if (payload.connectedUsers) state.connectedUsersData = payload.connectedUsers;
        if (payload.alert) {
          state.alert.active = payload.alert.active;
          state.alert.title = payload.alert.title || "ALERT DETECTED";
          state.alert.desc = payload.alert.desc || "";
        }

        // Update history
        const now = new Date();
        state.history.timestamps.shift();
        state.history.timestamps.push(now.toTimeString().split(' ')[0]);
        state.history.elapsed.shift();
        state.history.elapsed.push(state.metrics.elapsed);
        state.history.cpu.shift();
        state.history.cpu.push(state.metrics.cpu);
        state.history.sessions.shift();
        state.history.sessions.push(state.metrics.sessions);

        state.lastSync = now;
        document.getElementById('lastSyncTime').innerText = now.toTimeString().split(' ')[0];

        updateDomMetrics();
        renderChart();
        showToast("Telemetry synced from FileMaker / n8n");
        return JSON.stringify({ status: "success", timestamp: Date.now() });
      } catch (err) {
        console.error("Error parsing FMS data:", err);
        showToast("Error updating telemetry: " + err.message);
        return JSON.stringify({ status: "error", error: err.message });
      }
    };

    /**
     * Sends action back to FileMaker script or n8n webhook
     */
    function sendActionToFileMaker(actionName, payload = {}) {
      const fullPayload = {
        action: actionName,
        env: state.currentEnv,
        timestamp: new Date().toISOString(),
        ...payload
      };

      // Check if inside FileMaker WebViewer
      if (window.FileMaker && typeof window.FileMaker.PerformScriptWithOption === 'function') {
        window.FileMaker.PerformScriptWithOption(
          "FMS_HandleDashboardAction", 
          JSON.stringify(fullPayload), 
          0
        );
        showToast(`FileMaker script triggered: ${actionName}`);
      } else {
        console.log("[DEV / BROWSER] FileMaker.PerformScript simulated:", fullPayload);
        showToast(`[Simulated FM Script] ${actionName}`);
      }

      // Optional: Post to n8n webhook if configured
      if (state.n8nWebhookUrl) {
        fetch(state.n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload)
        })
        .then(res => showToast(`n8n Webhook replied: ${res.status}`))
        .catch(err => console.error("n8n Webhook error:", err));
      }
    }

    /* ==========================================================================
       6. USER ACTIONS & CONTROLS
       ========================================================================== */
    function acknowledgeAlert() {
      if (state.alert.active) {
        state.alert.active = false;
        state.hasSpike = false;
        state.metrics.elapsed = 14.8;
        state.metrics.cpu = 28.2;
        updateDomMetrics();
        renderChart();
        sendActionToFileMaker("ACKNOWLEDGE_LATENCY_SPIKE", {
          resolvedLatency: 14.8,
          message: "Latency spike acknowledged by NOC operator"
        });
        showToast("Alert Acknowledged & Resolved");
      } else {
        showToast("Viewing event history logs...");
        sendActionToFileMaker("VIEW_EVENT_LOGS");
      }
    }

    function simulateSpike() {
      state.hasSpike = true;
      state.alert.active = true;
      state.alert.title = "LATENCY SPIKE DETECTED: 50.2 ms / Call";
      state.alert.desc = "Heavy calculation or unindexed sort on field <mark>'Spend'</mark> in procurement tables.";
      state.metrics.elapsed = 50.2;
      state.metrics.cpu = 65.4;
      updateDomMetrics();
      renderChart();
      updateUserUsage();
      sendActionToFileMaker("SIMULATE_SPIKE_TRIGGERED");
      showToast("Triggered simulated latency spike");
    }

    function toggleSimMode() {
      state.simMode = !state.simMode;
      const btn = document.getElementById('btnSimMode');
      const text = document.getElementById('simModeText');
      if (state.simMode) {
        btn.classList.remove('off');
        text.innerText = "ON";
        showToast("Simulation mode: ACTIVE");
      } else {
        btn.classList.add('off');
        text.innerText = "OFF";
        showToast("Simulation mode: PAUSED (Waiting for live FM/n8n data)");
      }
    }

    function triggerManualSync() {
      showToast("Polling FileMaker Admin API & n8n...");
      sendActionToFileMaker("POLL_FMS_TELEMETRY");
      runSimulationStep();
    }

    function switchEnv(envName) {
      state.currentEnv = envName;
      document.querySelectorAll('.env-pill').forEach(pill => {
        if (pill.innerText === envName) {
          pill.className = "env-pill active";
        } else {
          pill.className = "env-pill inactive";
        }
      });
        document.getElementById('serverHostDisplay').innerText = state.serverHost;
      showToast(`Switched active environment to: ${envName}`);
      sendActionToFileMaker("SWITCH_ENVIRONMENT", { environment: envName });
    }

    function toggleSeries(seriesName) {
      state.visibleSeries[seriesName] = !state.visibleSeries[seriesName];
      renderChart();
      showToast(`Toggled ${seriesName} chart series: ${state.visibleSeries[seriesName] ? 'Visible' : 'Hidden'}`);
    }

    function onDatabaseClick(dbName) {
      sendActionToFileMaker("INSPECT_DATABASE", { filename: dbName });
      showToast(`Selected database: ${dbName}`);
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    function exportDataJson() {
      const exportObj = {
        meta: {
          serverHost: state.serverHost,
          environment: state.currentEnv,
          exportedAt: new Date().toISOString()
        },
        metrics: state.metrics,
        databases: state.databases,
        history: state.history
      };
      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonStr);
      downloadAnchor.setAttribute("download", `FMS_Telemetry_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Telemetry JSON exported");
    }

    // Modal controls

    // Restart Services logic
    function toggleRestartMenu() {
      const menu = document.getElementById('restartMenu');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }

    // Hide menu when clicking outside
    document.addEventListener('click', function(event) {
      const menu = document.getElementById('restartMenu');
      const btn = event.target.closest('button');
      if (menu && menu.style.display === 'block' && (!btn || btn.getAttribute('onclick') !== 'toggleRestartMenu()')) {
        menu.style.display = 'none';
      }
    });

    async function restartFMService(serviceName) {
      document.getElementById('restartMenu').style.display = 'none';
      if (!confirm(`Are you sure you want to hard-restart '${serviceName}'? This may briefly disrupt active operations.`)) return;
      
      showToast(`Initiating restart for ${serviceName}...`);
      
      try {
        const res = await fetch('https://fms.n8n.lexisolution.com/webhook/fms-service-restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: serviceName })
        });
        
        if (res.ok) {
          const data = await res.json();
          showToast(`Successfully executed restart command for ${serviceName}!`);
          console.log("Restart output:", data);
        } else {
          showToast(`Failed to restart ${serviceName}. HTTP ${res.status}`);
        }
      } catch (err) {
        showToast(`Network error triggering restart: ${err.message}`);
      }
    }

    // Toast helper
    
    function closeLogsModal() {
      document.getElementById('logsModal').classList.remove('active');
    }

    async function fetchAndShowLogs() {
      document.getElementById('logsModal').classList.add('active');
      document.getElementById('logsContainer').innerText = "Fetching logs securely via SSH...";
      
      try {
        const res = await fetch('https://fms.n8n.lexisolution.com/webhook/fms-logs');
        if (res.ok) {
          const data = await res.json();
          let logsText = Array.isArray(data.logs) ? data.logs.map(l => typeof l === 'object' ? l.value : l).join('\n') : data.logs;
          document.getElementById('logsContainer').innerText = logsText || "No logs found.";
        } else {
          document.getElementById('logsContainer').innerText = "Failed to fetch logs. HTTP " + res.status;
        }
      } catch (e) {
        document.getElementById('logsContainer').innerText = "Error: " + e.message;
      }
    }

    function showToast(msg) {
      const t = document.getElementById('toastNotice');
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
      }, 2500);
    }

    /* ==========================================================================
       7. REAL-TIME N8N WEBHOOK POLLING & URL PARAMS
       ========================================================================== */
    async function pollLiveN8nWebhook() {
      if (!state.n8nWebhookUrl) return;
      try {
        const res = await fetch(state.n8nWebhookUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const liveData = await res.json();
          window.setFMSData(liveData);
          if (state.simMode) {
            state.simMode = false;
            document.getElementById('btnSimMode').classList.add('off');
            document.getElementById('simModeText').innerText = "OFF (Live)";
          }
          document.getElementById('bridgeStatus').innerText = "n8n Live Webhook 200 OK";
          document.getElementById('bridgeStatus').style.color = "#34d399";
        } else {
          document.getElementById('bridgeStatus').innerText = `n8n HTTP ${res.status}`;
          document.getElementById('bridgeStatus').style.color = "#fbbf24";
        }
      } catch (err) {
        console.warn("Live webhook poll error:", err);
        document.getElementById('bridgeStatus').innerText = "n8n Webhook Offline";
        document.getElementById('bridgeStatus').style.color = "#f87171";
      }
    }

    function initUrlParamsAndStorage() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const webhookParam = urlParams.get('webhook');
        const hostParam = urlParams.get('host');
        const simParam = urlParams.get('sim');

        const savedWebhook = localStorage.getItem('fms_n8n_webhook');
        if (webhookParam) {
          state.n8nWebhookUrl = webhookParam;
          localStorage.setItem('fms_n8n_webhook', webhookParam);
        } else if (savedWebhook) {
          state.n8nWebhookUrl = savedWebhook;
        }

        if (state.n8nWebhookUrl) {
          document.getElementById('n8nWebhookInput').value = state.n8nWebhookUrl;
          document.getElementById('bridgeStatus').innerText = "n8n Poller Active";
          // Trigger immediate fetch
          pollLiveN8nWebhook();
          // Poll every 5 seconds
          setInterval(pollLiveN8nWebhook, 5000);
        }

        if (hostParam) {
          state.serverHost = hostParam;
          document.getElementById('serverHostDisplay').innerText = hostParam;
        }

        if (simParam === 'false' || simParam === 'off' || state.n8nWebhookUrl) {
          state.simMode = false;
          const btn = document.getElementById('btnSimMode');
          btn.classList.add('off');
          document.getElementById('simModeText').innerText = "OFF (Live)";
        }
      } catch (e) {
        console.error("Storage / URL init error:", e);
      }
    }

    function saveSettings() {
      const val = document.getElementById('n8nWebhookInput').value.trim();
      state.n8nWebhookUrl = val;
      if (val) {
        localStorage.setItem('fms_n8n_webhook', val);
        pollLiveN8nWebhook();
        if (state.simMode) toggleSimMode();
      } else {
        localStorage.removeItem('fms_n8n_webhook');
      }
      closeIntegrationModal();
      showToast("Integration settings saved!");
    }

    // Initial paint
    window.addEventListener('DOMContentLoaded', () => {
      initUrlParamsAndStorage();
      resizeCanvas();
      updateDomMetrics();
      updateUserUsage();
    });
