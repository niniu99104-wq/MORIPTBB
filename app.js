// 初始化資料庫
let data = JSON.parse(localStorage.getItem('anni_data')) || { sales: [] };

// 1. 底部導覽列切換邏輯 (修復按鈕失效問題)
function switchTab(tabId) {
  // 隱藏所有頁面
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active', 'hidden'));
  document.querySelectorAll('.page').forEach(page => {
    if(page.id !== 'view-' + tabId) page.classList.add('hidden');
  });
  
  // 顯示選中的頁面
  document.getElementById('view-' + tabId).classList.add('active');
  document.getElementById('view-' + tabId).classList.remove('hidden');

  // 更新導覽列顏色
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // 切換時重新渲染數據
  renderData();
}

// 2. 彈窗控制
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// 3. 表單欄位動態切換 (自營 vs 經銷)
function toggleFields() {
  const type = document.getElementById('type').value;
  document.getElementById('self-fields').classList.toggle('hidden', type === 'affiliate');
  document.getElementById('affiliate-fields').classList.toggle('hidden', type !== 'affiliate');
}

// 4. 運費計算機 (解決國際運費攤提問題)
function calculateShipping() {
  const totalShip = parseFloat(document.getElementById('calc-total-shipping').value) || 0;
  const totalItems = parseFloat(document.getElementById('calc-total-items').value) || 0;
  
  if(totalItems > 0) {
    const costPerItem = Math.ceil(totalShip / totalItems); // 無條件進位比較保險
    document.getElementById('calc-result-num').innerText = '$' + costPerItem;
    document.getElementById('calc-result').style.display = 'block';
  } else {
    alert("總件數不能為 0 哦！");
  }
}

// 5. 儲存交易與淨利計算 (核心金流邏輯)
function saveTransaction() {
  const type = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const payment = document.getElementById('payment').value;
  
  // 金流手續費計算
  let fee = 0;
  if(payment === 'linepay') fee = Math.round(amount * 0.022);
  if(payment === 'credit') fee = Math.round(amount * 0.028) + 5;

  let netProfit = 0;
  let payable = 0; // 要給廠商的錢

  if(type === 'self') {
    // 自營：售價 - 進價 - 單件國際運費 - 手續費
    const cost = parseFloat(document.getElementById('cost').value) || 0;
    const shipping = parseFloat(document.getElementById('shipping').value) || 0;
    netProfit = amount - cost - shipping - fee;
  } else {
    // 經銷：售價 * 分潤趴數 - 手續費
    const percent = parseFloat(document.getElementById('percent').value) || 15;
    netProfit = Math.round(amount * (percent/100)) - fee;
    payable = amount - Math.round(amount * (percent/100)); // 總額扣掉妳賺的，就是要匯給廠商的
  }

  // 寫入資料庫
  data.sales.push({
    id: 'ORD-' + Math.floor(Math.random()*9000 + 1000),
    date: new Date().toLocaleDateString(),
    type, amount, fee, netProfit, payable
  });
  
  localStorage.setItem('anni_data', JSON.stringify(data));
  
  // 清空表單
  document.getElementById('amount').value = '';
  document.getElementById('cost').value = '';
  document.getElementById('shipping').value = '';
  
  closeModal('sale-modal');
  renderData(); // 重新整理畫面
}

// 6. 渲染畫面數據 (把數字更新到畫面上)
function renderData() {
  const salesList = document.getElementById('sales-list');
  salesList.innerHTML = '';
  
  let todayRev = 0, todayProfit = 0;
  let totalRev = 0, totalFee = 0, totalProfit = 0, totalPayable = 0;
  const todayStr = new Date().toLocaleDateString();

  // 跑迴圈把訂單印出來
  [...data.sales].reverse().forEach(s => {
    // 加總儀表板數據
    totalRev += s.amount;
    totalFee += s.fee;
    totalProfit += s.netProfit;
    if(s.type === 'affiliate') totalPayable += s.payable;

    // 加總今日數據
    if(s.date === todayStr) {
      todayRev += s.amount;
      todayProfit += s.netProfit;
    }
    
    // 產生銷售清單卡片
    salesList.innerHTML += `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${s.id} <span style="font-size:0.7rem; color:var(--text-dim); font-weight:normal;">(${s.date})</span></div>
          <div class="card-tag ${s.type === 'affiliate' ? 'affiliate' : ''}">${s.type === 'self' ? '自營童裝' : '經銷分潤'}</div>
        </div>
        <div class="card-row"><label>實收金額</label><span>$${s.amount}</span></div>
        <div class="card-row"><label>金流成本</label><span>-$${s.fee}</span></div>
        ${s.type === 'affiliate' ? `<div class="card-row"><label>應付貨款</label><span style="color:#4fc3f7;">-$${s.payable}</span></div>` : ''}
        <div class="card-profit">實賺淨利 +$${s.netProfit}</div>
      </div>
    `;
  });

  // 更新首頁數字
  document.getElementById('today-rev').innerText = '$' + todayRev.toLocaleString();
  document.getElementById('today-profit').innerText = '$' + todayProfit.toLocaleString();
  const margin = todayRev > 0 ? Math.round((todayProfit / todayRev) * 100) : 0;
  document.getElementById('today-margin').innerText = margin + '%';

  // 更新儀表板數字
  document.getElementById('dash-rev').innerText = '$' + totalRev.toLocaleString();
  document.getElementById('dash-fee').innerText = totalFee.toLocaleString();
  document.getElementById('dash-profit').innerText = totalProfit.toLocaleString();
  document.getElementById('dash-payable').innerText = totalPayable.toLocaleString();
}

// 網頁載入時執行一次
renderData();
