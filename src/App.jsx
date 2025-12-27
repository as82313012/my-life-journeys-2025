import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Calendar as CalendarIcon, CloudRain, Sun, Camera, Star, Plus, ArrowRight, ArrowLeft, Plane, CreditCard, Ticket, Wallet, Trash2, Hotel, ClipboardCheck, CheckSquare, Square, Link as LinkIcon, Train, Utensils, Gift, X, ChevronLeft, ChevronRight, Cloud, Umbrella, Clock } from 'lucide-react';

// ==========================================
// 🎨 風格設定 (修正背景滿版問題)
// ==========================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&display=swap');
  
  /* 1. 強制全域背景色 (解決手機回彈露白底問題) */
  html, body, #root {
    background-color: #F9F8F6;
    margin: 0;
    padding: 0;
    font-family: 'Shippori Mincho', serif !important;
    min-height: 100vh;
  }

  body, button, input, textarea, select {
    font-family: 'Shippori Mincho', serif !important;
  }

  .vertical-text {
    writing-mode: vertical-rl;
    text-orientation: upright;
    letter-spacing: 0.25em;
  }

  .poster-card-body {
    background-color: white;
    border-top-left-radius: 3rem; 
    position: relative;
    z-index: 10;
    margin-top: -3rem;
    box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
  }

  .edit-input {
    background: transparent;
    border: none;
    border-bottom: 1px dashed #999;
    outline: none;
    width: 100%;
    min-width: 20px;
    font-family: inherit;
    color: inherit;
    padding: 0;
    margin: 0;
    text-align: inherit;
  }
  .edit-input:focus {
    border-bottom: 1px solid #000;
    background: rgba(255,255,255,0.5);
  }
  
  .editable:hover {
    background-color: rgba(0,0,0,0.03);
    border-radius: 4px;
    cursor: text;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .modal-content {
    animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  input[type="time"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.5;
    filter: invert(0);
  }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ==========================================
// 🌦️ 模擬天氣邏輯
// ==========================================
const getOutfitRecommendation = (temp) => {
  if (temp < 10) return "建議穿著厚大衣、圍巾，注意保暖。";
  if (temp < 15) return "適合風衣或夾克，洋蔥式穿搭。";
  if (temp < 22) return "舒適涼爽，薄長袖或針織衫即可。";
  if (temp < 28) return "短袖搭配薄外套，注意防曬。";
  return "炎熱天氣，建議穿著透氣短袖與墨鏡。";
};

const fetchMockWeather = (city, dateStr) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const month = new Date(dateStr.replace(/\./g, '-')).getMonth() + 1; 
      let baseTemp = 20;
      let type = 'sun';
      if (month <= 2 || month === 12) { baseTemp = 8; type = 'cloud'; } 
      else if (month >= 6 && month <= 9) { baseTemp = 30; type = 'sun'; } 
      else { baseTemp = 18; type = 'rain'; } 
      const randomVar = Math.floor(Math.random() * 5) - 2;
      resolve({
        temp: baseTemp + randomVar,
        icon: type, 
        desc: type === 'sun' ? 'Sunny' : type === 'cloud' ? 'Cloudy' : 'Rainy',
        pop: type === 'rain' ? 60 : 10
      });
    }, 300);
  });
};

// ==========================================
// 🛠️ 日期工具
// ==========================================
const formatDateStr = (dateObj) => { 
  return dateObj.toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr) => { 
  const date = new Date(dateStr.replace(/\./g, '-'));
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return `${year}.${month}.${day} ${weekdays[date.getDay()]}`;
};

const getDaysLeft = (startDateStr) => {
  if (!startDateStr) return 0;
  const today = new Date();
  const target = new Date(startDateStr.replace(/\./g, '-'));
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getMonthName = (monthNum) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[parseInt(monthNum) - 1] || "";
};

// ==========================================
// 📚 資料庫
// ==========================================
const initialTrips = [
  {
    id: 1, city: "Osaka", cityJP: "大阪", date: "2025.02.10", endDate: "2025.02.14",
    coverImage: "https://images.unsplash.com/photo-1590559899731-a3828395a574?q=80&w=1000&auto=format&fit=crop",
    flights: [{ id: 1, type: "去程", code: "JX820", date: "2025.02.10", time: "08:30", from: "TPE", to: "KIX", terminal: "2", seat: "12A" }],
    budget: { total: 50000, currency: "TWD", records: [{ id: 1, item: "機票", cost: 13500, type: "transport" }] },
    hotels: [{ id: 1, name: "OMO7 Osaka", address: "大阪府大阪市浪速区", checkIn: "2025.02.10 15:00", checkOut: "2025.02.14 11:00", note: "Booking ID: 12345", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop" }],
    packingList: [{ id: 1, item: "護照", checked: false }, { id: 2, item: "日幣", checked: false }],
    days: [
      {
        id: 'd1', date: "2025-02-10", 
        events: [
          { 
            id: 101, type: "transport", time: "11:00", title: "南海電鐵 Rapi:t", jpTitle: "移動", rating: 4.5, location: "Kansai Airport", customLink: "",
            image: "https://images.unsplash.com/photo-1495535327293-1896d87e074d?q=80&w=800&auto=format&fit=crop", note: "搭乘帥氣的鐵人 28 號前往難波！" 
          }
        ]
      }
    ]
  }
];

// ==========================================
// 🧩 UI 組件
// ==========================================
const EditableText = ({ value, onSave, className, multiline = false, placeholder = "...", stopProp = true, type = "text" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  useEffect(() => { setTempValue(value); }, [value]);
  const handleClick = (e) => { if (stopProp) e.stopPropagation(); setIsEditing(true); };
  const handleBlur = () => { setIsEditing(false); onSave(tempValue); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !multiline) handleBlur(); };

  if (isEditing) {
    return multiline ? (
      <textarea autoFocus value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleBlur} className={`edit-input resize-none ${className}`} onClick={(e) => e.stopPropagation()} />
    ) : (
      <input autoFocus type={type} value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className={`edit-input ${className}`} onClick={(e) => e.stopPropagation()} />
    );
  }
  return <span onClick={handleClick} className={`editable transition-colors duration-200 ${className} ${!value ? 'text-gray-400 italic' : ''}`} title="Click to edit">{value || placeholder}</span>;
};

const RatingStars = ({ count }) => (
  <div className="flex gap-1 items-center">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={10} fill={i < Math.floor(count) ? "#1a1a1a" : "none"} className={i < Math.floor(count) ? "text-[#1a1a1a]" : "text-gray-300"} />
    ))}
  </div>
);

const ImageUploader = ({ onUpload, customClass = "", iconSize = 20 }) => {
  const fileInputRef = useRef(null);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onUpload(imageUrl);
    }
  };
  return (
    <div className={`absolute ${customClass} z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current.click(); }} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center border border-gray-200 hover:bg-black hover:text-white transition-all shadow-xl hover:scale-110 active:scale-95"><Camera size={iconSize} /></button>
    </div>
  );
};

const PosterEventCard = ({ event, onUpdate, onDelete }) => {
  const updateField = (field, value) => { onUpdate({ ...event, [field]: value }); };
  const handleLinkEdit = () => {
    const url = prompt("Google Maps 連結:", event.customLink || "");
    if (url !== null) updateField('customLink', url);
  };
  const finalLink = event.customLink ? event.customLink : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  const getTypeIcon = () => {
      if(event.type === 'transport') return <Train size={12}/>;
      if(event.type === 'food') return <Utensils size={12}/>;
      if(event.type === 'shop') return <Gift size={12}/>;
      return <Camera size={12}/>;
  };

  return (
    <div className="mb-12 relative group filter drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative h-72 w-full overflow-hidden rounded-t-[2rem] bg-gray-900">
         <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
         <ImageUploader onUpload={(url) => updateField('image', url)} customClass="top-4 right-4" iconSize={18} />
         <button onClick={() => onDelete(event.id)} className="absolute top-4 left-4 z-20 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"><Trash2 size={14} /></button>
         <div className="absolute top-0 left-0 bg-white px-4 py-3 rounded-br-[1.5rem] z-10 flex flex-col items-center shadow-sm">
            <EditableText value={event.time.split(':')[0]} onSave={(val) => updateField('time', `${val}:${event.time.split(':')[1]||'00'}`)} className="text-xl font-bold leading-none w-8 text-center" />
            <EditableText value={event.time.split(':')[1]} onSave={(val) => updateField('time', `${event.time.split(':')[0]||'00'}:${val}`)} className="text-xs text-gray-400 leading-none w-8 text-center mt-1" />
         </div>
      </div>
      <div className="poster-card-body p-8 pb-6">
         <div className="flex justify-between items-start">
            <div className="pr-4 flex-1">
               <div className="inline-flex items-center gap-1 border border-black px-2 py-0.5 text-[10px] tracking-widest uppercase mb-3">{getTypeIcon()}<EditableText value={event.type} onSave={(val) => updateField('type', val)} /></div>
               <h3 className="text-3xl font-bold text-[#1a1a1a] mb-2 leading-tight"><EditableText value={event.title} onSave={(val) => updateField('title', val)} /></h3>
               <RatingStars count={event.rating} />
               <div className="mt-4 text-sm text-gray-600 leading-loose border-l-2 border-gray-200 pl-4"><EditableText value={event.note} onSave={(val) => updateField('note', val)} multiline={true} className="w-full block" /></div>
            </div>
            <div className="vertical-text text-sm font-bold text-gray-300 select-none cursor-pointer hover:text-gray-500"><EditableText value={event.jpTitle} onSave={(val) => updateField('jpTitle', val)} /></div>
         </div>
         <div className="mt-8 flex justify-between items-end border-t border-dashed border-gray-200 pt-4">
            <div className="flex items-center gap-2 group/link">
               <MapPin size={12} className="text-gray-400" />
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-blue-600"><EditableText value={event.location} onSave={(val) => updateField('location', val)} /></div>
               <button onClick={handleLinkEdit} className="opacity-0 group-hover/link:opacity-100 transition-opacity ml-2 text-gray-400 hover:text-black"><LinkIcon size={12} /></button>
            </div>
            <a href={finalLink} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"><Navigation size={20} /></a>
         </div>
      </div>
    </div>
  );
};

const MiniCalendar = ({ selectedDate, onSelect }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={16}/></button>
        <span className="font-bold text-lg">{year}.{String(month + 1).padStart(2, '0')}</span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={16}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-[10px] text-gray-400 font-bold">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = formatDateStr(d);
          const isSelected = dateStr === selectedDate;
          return (
            <button key={i} onClick={() => onSelect(dateStr)} className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${isSelected ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AddEventModal = ({ isOpen, onClose, onConfirm, initialDate }) => {
  const [type, setType] = useState('spot');
  const [selectedDateStr, setSelectedDateStr] = useState(initialDate);
  const [time, setTime] = useState('10:00');

  useEffect(() => { 
      if (isOpen) {
          setSelectedDateStr(initialDate); 
          setTime('10:00');
      }
  }, [isOpen, initialDate]);
  
  if (!isOpen) return null;
  const categories = [{ id: 'transport', label: '交通', icon: Train }, { id: 'spot', label: '景點', icon: Camera }, { id: 'food', label: '餐廳', icon: Utensils }, { id: 'shop', label: '伴手禮', icon: Gift }];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="modal-content bg-[#F9F8F6] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"><X size={18}/></button>
        <div className="p-8 pb-10">
           <h3 className="text-2xl font-bold mb-6 text-center tracking-tight">Add New Plan</h3>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Category</p>
           <div className="grid grid-cols-4 gap-3 mb-6">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setType(cat.id)} className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all duration-300 ${type === cat.id ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-xl scale-105' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                  <cat.icon size={20} className="mb-2"/><span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
           </div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Time</p>
           <div className="relative mb-6 bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center shadow-sm">
               <Clock size={18} className="text-gray-400 mr-3" />
               <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full font-bold text-lg outline-none bg-transparent font-serif text-[#1a1a1a]" />
           </div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Date</p>
           <MiniCalendar selectedDate={selectedDateStr} onSelect={setSelectedDateStr} />
           <button onClick={() => { onConfirm(selectedDateStr, type, time); onClose(); }} className="w-full py-4 bg-[#1a1a1a] text-white rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"><Plus size={20} /> Add to Itinerary</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📄 分頁視圖
// ==========================================
const WeatherWidget = ({ city, date }) => {
  const [weather, setWeather] = useState(null);
  useEffect(() => { fetchMockWeather(city, date).then(data => setWeather(data)); }, [city, date]);
  if (!weather) return <div className="text-xs text-gray-400 animate-pulse">Loading weather...</div>;
  const outfit = getOutfitRecommendation(weather.temp);
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center gap-4 mb-2">
       <div className="flex flex-col items-center pr-4 border-r border-gray-100 min-w-[60px]">
          {weather.icon === 'sun' && <Sun size={28} className="text-orange-400 mb-1" />}
          {weather.icon === 'cloud' && <Cloud size={28} className="text-gray-400 mb-1" />}
          {weather.icon === 'rain' && <CloudRain size={28} className="text-blue-400 mb-1" />}
          <span className="text-2xl font-bold font-serif leading-none">{weather.temp}°</span>
       </div>
       <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1"><span>{weather.desc}</span>{weather.pop > 0 && <span className="flex items-center text-blue-500"><Umbrella size={10} className="mr-1"/>{weather.pop}%</span>}</div>
          <p className="text-xs text-gray-700 leading-tight">{outfit}</p>
       </div>
    </div>
  );
};

const ItineraryView = ({ trip, onUpdateEvent, onOpenAddModal, onDeleteEvent }) => (
  <div className="px-5 pb-32">
    {trip.days.sort((a,b) => new Date(a.date) - new Date(b.date)).map((day, dayIndex) => {
        const dateDisplay = formatDisplayDate(day.date);
        return (
      <div key={day.date} className="mb-12">
         <div className="flex items-end justify-between mb-4 px-2">
            <div>
               <h2 className="text-4xl font-bold text-[#1a1a1a] mb-1">{dateDisplay.split(' ')[0]}</h2>
               <span className="text-sm font-bold text-gray-400 tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">{dateDisplay.split(' ')[1]}</span>
            </div>
         </div>
         <WeatherWidget city={trip.city} date={day.date} />
         <div className="mt-6">
            {day.events.sort((a,b) => a.time.localeCompare(b.time)).map((event) => (<PosterEventCard key={event.id} event={event} onUpdate={(updatedEvent) => onUpdateEvent(day.date, updatedEvent)} onDelete={onDeleteEvent} />))}
         </div>
         <button onClick={() => onOpenAddModal(day.date)} className="w-full py-5 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all flex items-center justify-center gap-2 group mt-4"><Plus size={16} /><span className="text-sm font-bold tracking-widest uppercase">Add New Plan</span></button>
      </div>
    )})}
  </div>
);

const HotelView = ({ hotels, onUpdateHotel, onAddHotel, onDeleteHotel }) => (
    <div className="px-5 pb-32">
        <h2 className="text-3xl font-bold mb-8 px-2">Accommodation</h2>
        {hotels.map((hotel) => (
            <div key={hotel.id} className="mb-12 relative group filter drop-shadow-xl">
                 <div className="relative h-64 w-full overflow-hidden rounded-t-[2rem] bg-gray-900">
                    <img src={hotel.image} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" alt="Hotel" />
                    <ImageUploader onUpload={(url) => onUpdateHotel(hotel.id, 'image', url)} customClass="top-4 right-4" iconSize={18} />
                    <button onClick={() => onDeleteHotel(hotel.id)} className="absolute top-4 left-4 z-20 w-8 h-8 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"><Trash2 size={14} /></button>
                 </div>
                 <div className="poster-card-body p-8 pb-6">
                    <h3 className="text-2xl font-bold mb-2 text-[#1a1a1a]"><EditableText value={hotel.name} onSave={val => onUpdateHotel(hotel.id, 'name', val)} /></h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6"><MapPin size={12}/><EditableText value={hotel.address} onSave={val => onUpdateHotel(hotel.id, 'address', val)} /></div>
                    <div className="grid grid-cols-2 gap-4 mb-6 border-t border-b border-gray-100 py-4">
                        <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Check-in</p><p className="text-lg font-bold"><EditableText value={hotel.checkIn} onSave={val => onUpdateHotel(hotel.id, 'checkIn', val)}/></p></div>
                        <div className="text-right"><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Check-out</p><p className="text-lg font-bold"><EditableText value={hotel.checkOut} onSave={val => onUpdateHotel(hotel.id, 'checkOut', val)}/></p></div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed"><span className="font-bold text-black mr-2">Note:</span><EditableText value={hotel.note} onSave={val => onUpdateHotel(hotel.id, 'note', val)} multiline={true} /></div>
                    <div className="mt-6 flex justify-end"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.address)}`} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Navigation size={20}/></a></div>
                 </div>
            </div>
        ))}
        <button onClick={onAddHotel} className="w-full py-6 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all flex items-center justify-center gap-2 group"><Plus size={16} /><span className="text-sm font-bold tracking-widest uppercase">Add New Hotel</span></button>
    </div>
);

const PackingView = ({ list, onToggle, onUpdateItem, onAdd, onDelete }) => (
    <div className="px-5 pb-32">
        <h2 className="text-3xl font-bold mb-8 px-2">Packing List</h2>
        <div className="space-y-4">
            {list.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 border-b border-dashed border-gray-300 group">
                    <button onClick={() => onToggle(item.id)} className="text-[#1a1a1a] hover:scale-110 transition-transform">{item.checked ? <CheckSquare size={24} /> : <Square size={24} />}</button>
                    <div className={`flex-1 font-bold text-lg ${item.checked ? 'text-gray-400 line-through' : 'text-[#1a1a1a]'}`}><EditableText value={item.item} onSave={(val) => onUpdateItem(item.id, val)} /></div>
                    <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                </div>
            ))}
            <button onClick={onAdd} className="w-full py-4 mt-8 flex items-center justify-center gap-2 text-gray-400 hover:text-black border border-transparent hover:border-black rounded-xl transition-all"><Plus size={18}/><span className="font-bold uppercase tracking-widest text-sm">Add Item</span></button>
        </div>
    </div>
);

const BudgetView = ({ budget, onUpdateBudget, onAddRecord, onDeleteRecord }) => {
  const spent = budget.records.reduce((acc, curr) => acc + curr.cost, 0);
  const percent = budget.total > 0 ? Math.min((spent / budget.total) * 100, 100) : 0;
  const updateRecord = (id, field, val) => {
      const finalVal = field === 'cost' ? (Number(val) || 0) : val;
      const newRecords = budget.records.map(r => r.id === id ? { ...r, [field]: finalVal } : r);
      onUpdateBudget('records', newRecords);
  };
  return (
    <div className="px-5 pb-32">
      <h2 className="text-3xl font-bold mb-8 px-2">Budget</h2>
      <div className="bg-[#1a1a1a] text-[#F9F8F6] p-8 rounded-[2rem] shadow-xl mb-10 relative overflow-hidden">
         <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Total Budget</p>
         <p className="text-4xl font-bold mb-6">$<EditableText value={budget.total} onSave={val => onUpdateBudget('total', Number(val)||0)} className="hover:border-b hover:border-gray-500"/></p>
         <div className="w-full bg-gray-700 h-1 mb-2"><div className="bg-white h-full transition-all duration-1000" style={{width: `${percent}%`}}></div></div>
         <div className="flex justify-between text-xs opacity-80"><span>Spent: ${spent.toLocaleString()}</span><span>Left: ${(budget.total - spent).toLocaleString()}</span></div>
      </div>
      <div className="space-y-4">
         {budget.records.map((rec) => (
            <div key={rec.id} className="flex justify-between items-center py-4 border-b border-dashed border-gray-300 group">
               <div className="flex items-center gap-4">
                   <button onClick={() => onDeleteRecord(rec.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                   <span className="font-bold text-gray-800"><EditableText value={rec.item} onSave={val => updateRecord(rec.id, 'item', val)} /></span>
               </div>
               <span className="font-bold text-lg">-$<EditableText value={rec.cost} onSave={val => updateRecord(rec.id, 'cost', val)} className="w-16 text-right inline-block"/></span>
            </div>
         ))}
         <button onClick={onAddRecord} className="w-full py-4 mt-4 flex items-center justify-center gap-2 text-gray-400 hover:text-black border border-transparent hover:border-black rounded-xl transition-all"><Plus size={18}/><span className="font-bold uppercase tracking-widest text-sm">Add Expense</span></button>
      </div>
    </div>
  );
};

const FlightView = ({ flights, onUpdateFlights, onAddFlight, onDeleteFlight }) => {
    const updateFlight = (id, field, val) => { const newFlights = flights.map(f => f.id === id ? { ...f, [field]: val } : f); onUpdateFlights(newFlights); };
    return (
    <div className="px-5 pb-32">
        <h2 className="text-3xl font-bold mb-8 px-2">Boarding Pass</h2>
        {flights.map((f) => (
          <div key={f.id} className="bg-white rounded-[1.5rem] shadow-lg mb-6 overflow-hidden border border-gray-100 p-6 relative group">
             <button onClick={() => onDeleteFlight(f.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20"><Trash2 size={16}/></button>
             <div className="flex justify-between text-2xl font-bold mb-4 items-center">
                 <EditableText value={f.from} onSave={val => updateFlight(f.id, 'from', val)} className="text-center min-w-[3rem]"/><Plane className="rotate-90 text-gray-400"/><EditableText value={f.to} onSave={val => updateFlight(f.id, 'to', val)} className="text-center min-w-[3rem]"/>
             </div>
             <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Flight</p><p className="text-xl font-bold"><EditableText value={f.code} onSave={val => updateFlight(f.id, 'code', val)}/></p></div>
                <div className="text-right"><p className="text-[10px] text-gray-400 uppercase tracking-widest">Date</p><p className="text-xl font-bold"><EditableText value={f.date} onSave={val => updateFlight(f.id, 'date', val)}/></p></div>
                <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Time</p><p className="text-xl font-bold"><EditableText value={f.time} onSave={val => updateFlight(f.id, 'time', val)}/></p></div>
                <div className="text-right"><p className="text-[10px] text-gray-400 uppercase tracking-widest">Seat</p><p className="text-xl font-bold"><EditableText value={f.seat} onSave={val => updateFlight(f.id, 'seat', val)}/></p></div>
             </div>
          </div>
        ))}
        <button onClick={onAddFlight} className="w-full py-6 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all flex items-center justify-center gap-2 group"><Plus size={16} /><span className="text-sm font-bold tracking-widest uppercase">Add New Flight</span></button>
    </div>
    );
};

// ==========================================
// 🏠 主程式
// ==========================================
export default function TravelApp() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [detailTab, setDetailTab] = useState('itinerary');
  const [trips, setTrips] = useState(initialTrips);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState("");

  const activeTrip = trips.find(t => t.id === selectedTripId);

  // Handlers
  const updateTripInfo = (id, field, value) => setTrips(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateEvent = (dateStr, updatedEvent) => {
    setTrips(prev => prev.map(trip => {
      if (trip.id === activeTrip.id) {
        return { ...trip, days: trip.days.map(d => d.date === dateStr ? { ...d, events: d.events.map(e => e.id === updatedEvent.id ? updatedEvent : e) } : d) };
      }
      return trip;
    }));
  };
  const handleAddTrip = () => {
    const newTrip = {
      id: Date.now(), city: "New Trip", cityJP: "新しい旅", date: "2025.12.31", endDate: "2026.01.05",
      coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop",
      flights: [], budget: { total: 0, currency: "TWD", records: [] }, hotels: [], packingList: [], days: [{ date: "2025-12-31", events: [] }]
    };
    setTrips([...trips, newTrip]);
  };
  
  const handleOpenAddModal = (dateStr) => { setModalDefaultDate(dateStr); setIsModalOpen(true); };
  
  const handleConfirmAddEvent = (targetDateStr, type, time) => {
    if (!selectedTripId) return;
    const defaults = {
      transport: { title: "交通移動", jpTitle: "移動", img: "https://images.unsplash.com/photo-1495535327293-1896d87e074d?q=80&w=800" },
      spot: { title: "新景點", jpTitle: "観光", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800" },
      food: { title: "餐廳名稱", jpTitle: "食事", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800" },
      shop: { title: "伴手禮店", jpTitle: "買い物", img: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800" },
    };
    const config = defaults[type];
    const newEvent = { 
        id: Date.now(), 
        type, 
        time: time || "10:00", 
        title: config.title, 
        jpTitle: config.jpTitle, 
        rating: 0, 
        location: "輸入地點", 
        customLink: "", 
        image: config.img, 
        note: "Click to edit note..." 
    };
    
    setTrips(prev => prev.map(trip => {
       if (trip.id === selectedTripId) {
         const existingDay = trip.days.find(d => d.date === targetDateStr);
         if (existingDay) {
            return { ...trip, days: trip.days.map(d => d.date === targetDateStr ? { ...d, events: [...d.events, newEvent] } : d) };
         } else {
            return { ...trip, days: [...trip.days, { date: targetDateStr, events: [newEvent] }] };
         }
       }
       return trip;
    }));
  };

  const handleCoverImageUpdate = (tripId, newUrl) => setTrips(prev => prev.map(t => t.id === tripId ? { ...t, coverImage: newUrl } : t));
  const handleEventImageUpdate = (eventId, newUrl) => {
    setTrips(prev => prev.map(trip => {
      if (trip.id === selectedTripId) return { ...trip, days: trip.days.map(day => ({ ...day, events: day.events.map(event => event.id === eventId ? { ...event, image: newUrl } : event) })) };
      return trip;
    }));
  };
  const handleDeleteEvent = (eventId) => {
    if(!window.confirm("Delete?")) return;
    setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, days: t.days.map(d => ({ ...d, events: d.events.filter(e => e.id !== eventId) })) } : t));
  };
  
  const updateHotel = (hotelId, field, value) => { setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, hotels: trip.hotels.map(h => h.id === hotelId ? { ...h, [field]: value } : h) }; return trip; })); };
  const addHotel = () => {
      const newHotel = { id: Date.now(), name: "New Hotel", address: "Address", checkIn: "2025.01.01 15:00", checkOut: "2025.01.05 11:00", note: "Booking ID", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop" };
      setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, hotels: [...trip.hotels, newHotel] }; return trip; }));
  };
  const deleteHotel = (id) => {
      if(!window.confirm("Delete?")) return;
      setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, hotels: trip.hotels.filter(h => h.id !== id) }; return trip; }));
  };

  const togglePackingItem = (itemId) => { setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, packingList: trip.packingList.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item) }; return trip; })); };
  const updatePackingItem = (itemId, val) => { setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, packingList: trip.packingList.map(item => item.id === itemId ? { ...item, item: val } : item) }; return trip; })); };
  const addPackingItem = () => { setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, packingList: [...trip.packingList, { id: Date.now(), item: "New Item", checked: false }] }; return trip; })); };
  const deletePackingItem = (itemId) => { setTrips(prev => prev.map(trip => { if(trip.id === selectedTripId) return { ...trip, packingList: trip.packingList.filter(item => item.id !== itemId) }; return trip; })); };
  const handleUpdateBudget = (field, value) => { setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, budget: { ...t.budget, [field]: value } } : t)); };
  const handleAddBudgetRecord = () => { const newRecord = { id: Date.now(), item: "New Item", cost: 0, type: "misc" }; setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, budget: { ...t.budget, records: [...t.budget.records, newRecord] } } : t)); };
  const handleDeleteBudgetRecord = (id) => { if(!window.confirm("Delete?")) return; setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, budget: { ...t.budget, records: t.budget.records.filter(r => r.id !== id) } } : t)); };
  const handleUpdateFlights = (newFlights) => { setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, flights: newFlights } : t)); };
  const handleAddFlight = () => { const newFlight = { id: Date.now(), type: "去程", code: "JX000", date: "2025.01.01", time: "00:00", from: "TPE", to: "DEST", terminal: "1", seat: "1A" }; setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, flights: [...t.flights, newFlight] } : t)); };
  const handleDeleteFlight = (id) => { if(!window.confirm("Delete?")) return; setTrips(prev => prev.map(t => t.id === selectedTripId ? { ...t, flights: t.flights.filter(f => f.id !== id) } : t)); };

  return (
    <div className="bg-[#F9F8F6] min-h-screen text-[#1a1a1a]">
      <style>{styles}</style>
      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmAddEvent} initialDate={modalDefaultDate} />
      {currentView === 'home' && (
        <div className="p-8 pb-20 max-w-lg mx-auto">
           <header className="mb-12 pt-8 border-b border-gray-300 pb-6"><h1 className="text-5xl font-bold mb-2">MY LIFE JOURNEYS</h1><p className="text-sm text-gray-500 tracking-widest">COLLECTION OF JOURNEYS</p></header>
           <div className="space-y-16">
              {trips.map(trip => { const daysLeft = getDaysLeft(trip.date); return (
                 <div key={trip.id} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl transition-transform hover:-translate-y-2 duration-500 bg-gray-200">
                       <img src={trip.coverImage} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" alt={trip.city} />
                       <ImageUploader onUpload={(newUrl) => handleCoverImageUpdate(trip.id, newUrl)} customClass="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" iconSize={24} />
                       <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent"><h2 className="text-6xl font-bold text-white mb-1"><EditableText value={trip.city} onSave={(val) => updateTripInfo(trip.id, 'city', val)} className="hover:bg-white/10 px-2 rounded" /></h2><p className="text-white font-medium tracking-widest text-lg"><EditableText value={trip.cityJP} onSave={(val) => updateTripInfo(trip.id, 'cityJP', val)} className="hover:bg-white/10 px-2 rounded" /></p></div>
                    </div>
                    <div onClick={() => { setSelectedTripId(trip.id); setCurrentView('detail'); setDetailTab('itinerary'); }} className="mt-5 flex justify-between items-end px-4 py-4 cursor-pointer hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100">
                       <div onClick={e => e.stopPropagation()}><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><CalendarIcon size={10} /><EditableText value={trip.date} onSave={val => updateTripInfo(trip.id, 'date', val)} /><span>—</span><EditableText value={trip.endDate} onSave={val => updateTripInfo(trip.id, 'endDate', val)} /></div>{daysLeft > 0 ? <div className="flex items-baseline gap-1 text-[#1a1a1a] pointer-events-none"><span className="text-4xl font-bold leading-none">{daysLeft}</span><span className="text-xs font-bold uppercase tracking-wider">Days Left</span></div> : <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full tracking-widest uppercase pointer-events-none">Completed</span>}</div>
                       <div className="w-12 h-12 rounded-full border border-[#1a1a1a] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-colors"><ArrowRight size={20}/></div>
                    </div>
                 </div>
              )})}
              <div onClick={handleAddTrip} className="relative aspect-[3/4] border-4 border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all cursor-pointer group bg-white/50"><div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Plus size={32} /></div><span className="font-bold tracking-widest uppercase">Create New Trip</span></div>
           </div>
        </div>
      )}
      {currentView === 'detail' && activeTrip && (
        <div>
           <div className="sticky top-0 z-50 bg-[#F9F8F6]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <button onClick={() => setCurrentView('home')} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-colors"><ArrowLeft size={18} /></button>
              <div className="text-center"><h2 className="text-lg font-bold">{activeTrip.cityJP}</h2><p className="text-[10px] uppercase tracking-widest text-gray-500">{activeTrip.city}</p></div>
              <div className="w-10"></div>
           </div>
           <div className="pt-6">
              {detailTab === 'itinerary' && <ItineraryView trip={activeTrip} onUpdateEvent={updateEvent} onOpenAddModal={handleOpenAddModal} onDeleteEvent={handleDeleteEvent} />}
              {detailTab === 'hotel' && <HotelView hotels={activeTrip.hotels || []} onUpdateHotel={updateHotel} onAddHotel={addHotel} onDeleteHotel={deleteHotel} />}
              {detailTab === 'packing' && <PackingView list={activeTrip.packingList || []} onToggle={togglePackingItem} onUpdateItem={updatePackingItem} onAdd={addPackingItem} onDelete={deletePackingItem} />}
              {detailTab === 'budget' && <BudgetView budget={activeTrip.budget} onUpdateBudget={handleUpdateBudget} onAddRecord={handleAddBudgetRecord} onDeleteRecord={handleDeleteBudgetRecord} />}
              {detailTab === 'flight' && <FlightView flights={activeTrip.flights} onUpdateFlights={handleUpdateFlights} onAddFlight={handleAddFlight} onDeleteFlight={handleDeleteFlight} />}
           </div>
           <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-white rounded-full px-8 py-4 shadow-2xl z-50 flex gap-6">
              <button onClick={() => setDetailTab('itinerary')} className={detailTab === 'itinerary' ? 'text-white' : 'text-gray-500'}><CalendarIcon size={20} /></button>
              <button onClick={() => setDetailTab('hotel')} className={detailTab === 'hotel' ? 'text-white' : 'text-gray-500'}><Hotel size={20} /></button>
              <button onClick={() => setDetailTab('packing')} className={detailTab === 'packing' ? 'text-white' : 'text-gray-500'}><ClipboardCheck size={20} /></button>
              <button onClick={() => setDetailTab('budget')} className={detailTab === 'budget' ? 'text-white' : 'text-gray-500'}><CreditCard size={20} /></button>
              <button onClick={() => setDetailTab('flight')} className={detailTab === 'flight' ? 'text-white' : 'text-gray-500'}><Ticket size={20} /></button>
           </div>
        </div>
      )}
    </div>
  );
}