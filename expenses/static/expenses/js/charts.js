/* ========================================
   SPENDWISE — Chart renderers (pure SVG, no deps)
   - renderBarChart(targetId, data, options)
   - renderDonutChart(targetId, data, options)
   Data shape: [{ label, value }] or [{ label, income, expense }]
======================================== */

(() => {
    'use strict';

    /* ---------- Shared helpers ---------- */
    function maxValue(arr, key = 'value') {
        return Math.max(...arr.map(d => d[key] || 0), 1);
    }

    function niceRound(max) {
        const exp = Math.floor(Math.log10(max));
        const step = Math.pow(10, exp);
        const leading = Math.ceil(max / step);
        return leading * step;
    }

    /* ---------- 1. Bar Chart (vertical bars, grouped optional) ---------- */
    window.renderBarChart = function(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            grouped = false,
            maxOverride = null,
            yTicks = 5,
            animate = true,
            barClass = '',
            labelKey = 'label',
            valueKey = 'value',
            colorFn = null,
        } = options;

        container.innerHTML = '';

        const maxVal = maxOverride || niceRound(maxValue(data, grouped ? 'expense' : valueKey));
        const step = maxVal / yTicks;

        // Build Y-axis labels if sibling .chart-y-axis exists
        const chartWrap = container.closest('.chart');
        if (chartWrap) {
            const yAxis = chartWrap.querySelector('.chart-y-axis');
            if (yAxis) {
                yAxis.innerHTML = '';
                for (let i = yTicks; i >= 0; i--) {
                    const val = step * i;
                    const span = document.createElement('span');
                    span.textContent = '৳' + (
                        val >= 1000
                            ? (val / 1000).toFixed(0) + 'k'
                            : val.toFixed(0)
                    );
                    yAxis.appendChild(span);
                }
            }
        }

        // Grid lines (handled by CSS .chart-grid-lines)

        // Bars
        data.forEach((d, i) => {
            const col = document.createElement('div');
            col.className = 'chart-column';
            col.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;';

            if (grouped) {
                // Two bars: income + expense
                const incomeVal = d.income || 0;
                const expenseVal = d.expense || 0;
                const groupMax = Math.max(incomeVal, expenseVal);
                const h = maxVal > 0 ? groupMax / maxVal * 100 : 0;

                const incomeBar = document.createElement('div');
                incomeBar.className = `bar income-bar ${barClass}`;
                incomeBar.style.height = animate ? '0%' : h + '%';
                incomeBar.title = `${d[labelKey]}: Income ${window.formatCurrency ? window.formatCurrency(incomeVal) : incomeVal}`;
                col.appendChild(incomeBar);

                const expenseBar = document.createElement('div');
                expenseBar.className = `bar expense-bar ${barClass}`;
                expenseBar.style.height = animate ? '0%' : h + '%';
                expenseBar.title = `${d[labelKey]}: Expense ${window.formatCurrency ? window.formatCurrency(expenseVal) : expenseVal}`;
                col.appendChild(expenseBar);
            } else {
                const val = d[valueKey] || 0;
                const h = maxVal > 0 ? val / maxVal * 100 : 0;
                const bar = document.createElement('div');
                bar.className = `bar ${barClass}`;
                bar.style.height = animate ? '0%' : h + '%';
                bar.style.background = colorFn ? colorFn(d, i) : '';
                bar.title = `${d[labelKey]}: ${window.formatCurrency ? window.formatCurrency(val) : val}`;
                col.appendChild(bar);

                const label = document.createElement('span');
                label.textContent = d[labelKey];
                col.appendChild(label);
            }

            container.appendChild(col);
        });

        // Animate
        if (animate) {
            requestAnimationFrame(() => {
                container.querySelectorAll('.bar').forEach((bar, i) => {
                    const col = bar.closest('.chart-column');
                    const idx = [...container.children].indexOf(col);
                    const d = data[idx];
                    let target = 0;
                    if (grouped) {
                        target = Math.max(d.income || 0, d.expense || 0) / maxVal * 100;
                    } else {
                        target = (d[valueKey] || 0) / maxVal * 100;
                    }
                    setTimeout(() => { bar.style.height = target + '%'; }, i * 60);
                });
            });
        }

        // Hover active state
        container.querySelectorAll('.chart-column').forEach(col => {
            col.addEventListener('mouseenter', () => col.querySelectorAll('.bar').forEach(b => b.classList.add('active-bar')));
            col.addEventListener('mouseleave', () => col.querySelectorAll('.bar').forEach(b => b.classList.remove('active-bar')));
        });

        return container;
    };

    /* ---------- 2. Donut Chart (SVG) ---------- */
    window.renderDonutChart = function(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { animate = true, strokeWidth = 16, gap = 2 } = options;

        const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
        const radius = 92;
        const circumference = 2 * Math.PI * radius;

        // SVG
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${radius * 2} ${radius * 2}`);
        svg.style.width = '100%';
        svg.style.height = '100%';

        // Track circle
        const track = document.createElementNS(svgNS, 'circle');
        track.setAttribute('class', 'track');
        track.setAttribute('cx', radius);
        track.setAttribute('cy', radius);
        track.setAttribute('r', radius);
        track.setAttribute('stroke-width', strokeWidth);
        svg.appendChild(track);

        // Segments
        let offset = 0;
        data.forEach((d, i) => {
            const val = d.value || 0;
            const pct = total > 0 ? val / total : 0;
            const dash = pct * circumference;
            const gapDash = gap * (Math.PI / 180) * radius; // convert deg to length approx

            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('class', 'segment');
            circle.setAttribute('cx', radius);
            circle.setAttribute('cy', radius);
            circle.setAttribute('r', radius);
            circle.setAttribute('stroke-width', strokeWidth);
            circle.setAttribute('stroke', d.color || '#94a3b8');
            circle.setAttribute('stroke-dasharray', `${dash} ${circumference}`);
            circle.setAttribute('stroke-dashoffset', -offset);
            circle.setAttribute('stroke-linecap', 'round');
            circle.style.transition = `stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`;
            if (animate) circle.setAttribute('stroke-dashoffset', circumference);
            svg.appendChild(circle);

            offset += dash + gapDash;
        });

        container.innerHTML = '';
        container.appendChild(svg);

        // Center text
        const center = document.createElement('div');
        center.className = 'donut-center';
        center.innerHTML = `
            <span class="total">${window.formatCurrency ? window.formatCurrency(total) : total}</span>
            <span class="label">Total Spent</span>
        `;
        container.appendChild(center);

        // Legend (if #donut-legend exists)
        const legend = document.getElementById('donut-legend');
        if (legend) {
            legend.innerHTML = '';
            data.forEach(d => {
                const li = document.createElement('li');
                const pct = total > 0 ? ((d.value || 0) / total * 100).toFixed(1) : '0';
                li.innerHTML = `
                    <span class="swatch" style="background:${d.color || '#94a3b8'}"></span>
                    <span class="legend-label">${d.label}</span>
                    <span class="legend-value">${window.formatCurrency ? window.formatCurrency(d.value) : d.value} (${pct}%)</span>
                `;
                legend.appendChild(li);
            });
        }

        // Animate segments in
        if (animate) {
            requestAnimationFrame(() => {
                svg.querySelectorAll('.segment').forEach((seg, i) => {
                    const d = data[i];
                    const val = d.value || 0;
                    const pct = total > 0 ? val / total : 0;
                    const dash = pct * circumference;
                    setTimeout(() => { seg.setAttribute('stroke-dashoffset', -offset + dash + (gap * (Math.PI/180) * radius * i)); }, i * 80);
                });
            });
        }

        return container;
    };

   
/* ---------- 3. Auto-init from JSON blocks (dashboard + reports) ---------- */

document.addEventListener('DOMContentLoaded', () => {

    // Dashboard bar chart
    const dashData = document.getElementById('dashboard-data');

    if (dashData) {
        try {
            const { daily, six_month, twelve_month } =
                JSON.parse(dashData.textContent);

            const chartRange = document.getElementById('chart-range');

            const chartDatasets = {
                '30': daily,
                '6': six_month,
                '12': twelve_month,
            };

            if (chartRange) {

                // Render the initially selected dataset
                window.renderBarChart(
                    'chart-bars',
                    chartDatasets[chartRange.value],
                    { barClass: 'dash-bar', yTicks: 4 }
                );

                // Redraw when the dropdown selection changes
                chartRange.addEventListener('change', () => {
                    const selectedData = chartDatasets[chartRange.value];

                    window.renderBarChart(
                        'chart-bars',
                        selectedData,
                        { barClass: 'dash-bar', yTicks: 4 }
                    );
                });
            }

        } catch (e) {
            console.warn('Dashboard chart data parse failed', e);
        }
    }


    // Reports donut + trend
    const reportsData = document.getElementById('reports-data');

    if (reportsData) {
        try {
            const { donut, trend } = JSON.parse(reportsData.textContent);

            if (donut) {
                window.renderDonutChart('donut-chart', donut);
            }

            if (trend) {
                window.renderBarChart(
                    'trend-bars',
                    trend,
                    {
                        grouped: true,
                        yTicks: 4,
                        barClass: 'trend-bar'
                    }
                );
            }

        } catch (e) {
            console.warn('Reports chart data parse failed', e);
        }
    }

});
})();
