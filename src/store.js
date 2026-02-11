// store.js - เก็บสถานะปัจจุบันของแอปพลิเคชัน
export const store = {
    currentEventId: null,
    currentBoothId: null,
    allProducts: [], // โหลดเก็บไว้จะได้ไม่ต้องดึงใหม่บ่อยๆ
    
    // ฟังก์ชันช่วยอัปเดตข้อมูล (ตัวอย่าง)
    setEvent(id) {
        this.currentEventId = id;
        console.log(`Event changed to: ${id}`);
    },

    setBooth(id) {
        this.currentBoothId = id;
    }
};