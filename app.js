// 初始化資料庫
let salesData = JSON.parse(localStorage.getItem('nini_sales')) || [];

// 切換頁面
function switchTab(pageId, element) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  element.classList.add('active');
  
  updateDashboard();
  if(pageId === 'sales') renderSales();
}

// 彈窗控制
function showForm(id) { document.getElementById(id).style.display = 'flex'; }
function hideForm(id) { document.getElementById(id).style.display = 'none'; }

// 手續費計算邏輯
function calcFee(payment, amount) {
  if (payment === 'linepay') return Math.round(amount * 0.022);
  if (payment === 'credit') return Math.round(amount * 0.028) + 5;
  return 0; // cash
}

// 儲存銷售資料
function saveSale() {
  const id = document.getElementById('sale-id').value || `ORD-${Date.now().toString().slice(-4)}`;
  const type = document.getElementById('sale-type').value;
  const amount = parseInt(document.getElementById('sale-amount').value) || 0;
  const payment = document.getElementById('sale-payment').value;
  const shipping = parseInt(document.getElementById('sale-shipping').value) || 0;

  const fee = calcFee(payment, amount);
  
  let profit = 0;
  let payable = 0;

  if (type === 'affiliate') {
    // 經銷模式：淨利是 15%，剩下的要給廠商
    profit = Math.round(amount * 0.15) - shipping; 
    payable = amount - Math.round(amount * 0.15) - fee;
  } else {
    // 自營模式：目前先算毛利 (之後可擴充扣除進貨成本)
    profit = amount - fee - shipping;
  }

  const newSale = {
    date: new Date().toISOString(),
    id, type, amount, payment, fee, shipping, profit, payable
  };

  salesData.push(newSale);
  localStorage.setItem('nini_sales', JSON.stringify(salesData));
  
  // 清空並關閉
  document.getElementById('sale-id').value = '';
  document.getElementById('sale-amount').value = '';
  document.getElementById('sale-shipping').value = '';
  hideForm('sale-form');
  updateDashboard();
}

// 更新儀表板數據
function updateDashboard() {
  let todayRev = 0, todayProfit = 0;
  let monthSelf = 0, monthAffiliate = 0, totalPayable = 0;
  
  const todayStr = new Date().toISOString().split('T')[0];

  salesData.forEach(sale => {
    // 今日數據
    if (sale.date.startsWith(todayStr)) {
      todayRev += sale.amount;
      todayProfit += sale.profit;
    }
    
    // 全局累積
    if (sale.type === 'affiliate') {
      monthAffiliate += sale.profit;
      totalPayable += sale.payable;
    } else {
      monthSelf += sale.profit;
    }
  });

  document.getElementById('today-revenue').innerText = `$${todayRev.toLocaleString()}`;
  document.getElementById('today-profit').innerText = `$${todayProfit.toLocaleString()}`;
  document.getElementById('month-self-profit').innerText = `$${monthSelf.toLocaleString()}`;
  document.getElementById('month-affiliate-profit').innerText = `$${monthAffiliate.toLocaleString()}`;
  document.getElementById('pending-payable').innerText = `$${totalPayable.toLocaleString()}`;
}

// 渲染銷售清單
function renderSales() {
  const container = document.getElementById('sales-list');
  container.innerHTML = '';
  
  const reversed = [...salesData].reverse();
  reversed.forEach(sale => {
    const isAff = sale.type === 'affiliate';
    container.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${sale.id}</strong> 
          <span class="tag ${isAff ? 'affiliate' : ''}">${isAff ? '經銷' : '自營'}</span>
          <div style="font-size:0.8rem; color:#888; margin-top:5px;">總額 $${sale.amount} | 手續費 $${sale.fee}</div>
        </div>
        <div style="text-align:right; font-weight:bold; color: ${isAff ? '#2962FF' : '#00BFA5'}">
          +$${sale.profit}
        </div>
      </div>
    `;
  });
}

// 初始化
updateDashboard();
