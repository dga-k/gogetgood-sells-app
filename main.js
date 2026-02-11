import { supabase } from './src/supabase'
import { store } from './src/store'

// Selectors
const eventSelect = document.querySelector('#event-select')
const boothContainer = document.querySelector('#booth-container')

// --- Modal Controls ---
window.openModal = (id) => document.getElementById(id).classList.remove('hidden')
window.closeModal = (id) => document.getElementById(id).classList.add('hidden')

// --- Initial Load ---
async function init() {
    await loadEvents()
    await loadAllProducts()
}

// --- Data Fetching ---
async function loadEvents() {
    const { data } = await supabase.from('events').select('*')
    if (data) {
        eventSelect.innerHTML = '<option value="">-- กรุณาเลือกรายการอีเวนต์ --</option>' + 
            data.map(ev => `<option value="${ev.id}">${ev.event_name}</option>`).join('')
    }
}

async function loadAllProducts() {
    const { data } = await supabase.from('products').select('*')
    store.allProducts = data || []
    document.querySelector('#stock-product-select').innerHTML = 
        store.allProducts.map(p => `<option value="${p.id}">${p.name} (฿${p.price})</option>`).join('')
}

// --- Render Functions ---
async function renderBooths(eventId) {
    boothContainer.innerHTML = '<p class="text-indigo-500 animate-pulse font-bold">กำลังโหลดบูท...</p>'
    
    const { data: booths } = await supabase.from('booths').select('*').eq('event_id', eventId)
    
    if (!booths || booths.length === 0) {
        boothContainer.innerHTML = '<p class="text-gray-400">ยังไม่มีบูทในงานนี้</p>'
        return
    }

    boothContainer.innerHTML = ''
    for (const booth of booths) {
        // ดึงสต็อกของบูทนี้
        const { data: stock } = await supabase
            .from('booth_inventory')
            .select('stock_qty, product_id, products(name)')
            .eq('booth_id', booth.id)

        const card = document.createElement('div')
        card.className = "bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
        
        const stockItemsHtml = stock?.map(s => `
            <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span class="text-sm font-medium text-gray-600">${s.products.name}</span>
                <span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">${s.stock_qty}</span>
            </div>
        `).join('') || '<p class="text-xs text-gray-400">ไม่มีสินค้า</p>'

        card.innerHTML = `
            <h3 class="text-xl font-black text-gray-800 mb-4">${booth.booth_name}</h3>
            <div class="bg-gray-50 rounded-2xl p-4 mb-4 space-y-1">${stockItemsHtml}</div>
            <div class="grid grid-cols-2 gap-2">
                <button onclick="openStockModal('${booth.id}', '${booth.booth_name}')" class="bg-green-50 text-green-700 py-3 rounded-xl text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors">+ เติมสต็อก</button>
                <button class="bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md">🛒 ขายของ</button>
            </div>
        `
        boothContainer.appendChild(card)
    }
}

// --- Event Listeners ---
eventSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        store.setEvent(e.target.value)
        renderBooths(e.target.value)
    }
})

// บันทึก Event ใหม่
document.querySelector('#save-event-btn').addEventListener('click', async () => {
    const name = document.querySelector('#new-event-name').value
    if (!name) return
    const { error } = await supabase.from('events').insert([{ event_name: name }])
    if (!error) location.reload()
})

// บันทึก สินค้าใหม่
document.querySelector('#save-product-btn').addEventListener('click', async () => {
    const name = document.querySelector('#new-product-name').value
    const price = document.querySelector('#new-product-price').value
    const pack = document.querySelector('#new-product-price').value
    if (!name || !price) return
    const { error } = await supabase.from('products').insert([{ name, price: price ,items_per_pack:pack}])
    if (!error) { closeModal('product-modal'); loadAllProducts(); }
})

// บันทึก บูทใหม่
document.querySelector('#save-booth-btn').addEventListener('click', async () => {
    if (!store.currentEventId) return alert('กรุณาเลือกอีเวนต์ก่อน')
    const name = document.querySelector('#new-booth-name').value
    if (!name) return
    const { error } = await supabase.from('booths').insert([{ event_id: store.currentEventId, booth_name: name }])
    if (!error) { closeModal('booth-modal'); renderBooths(store.currentEventId); }
})

// เติมสต็อก
window.openStockModal = (id, name) => {
    store.setBooth(id)
    document.querySelector('#target-booth-name').innerText = `บูท: ${name}`
    openModal('stock-modal')
}

document.querySelector('#confirm-stock-btn').addEventListener('click', async () => {
    const productId = document.querySelector('#stock-product-select').value
    const qty = parseInt(document.querySelector('#stock-qty').value)
    
    const { data: current } = await supabase.from('booth_inventory')
        .select('stock_qty').eq('booth_id', store.currentBoothId).eq('product_id', productId).single()
    
    const newQty = (current?.quantity || 0) + qty
    const { error } = await supabase.from('booth_inventory').upsert({
        booth_id: store.currentBoothId,
        product_id: productId,
        stock_qty: newQty
    }, { onConflict: 'booth_id, product_id' })

    if (!error) { closeModal('stock-modal'); renderBooths(store.currentEventId); }
})

init()