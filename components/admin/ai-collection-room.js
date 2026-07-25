import React, { useState, useEffect } from 'react';

function App() {
  // लोकल स्टोरेजबाट डाटा लोड गर्ने
  const [rooms, setRooms] = useState(() => {
    const savedRooms = localStorage.getItem('marketplace_rooms');
    return savedRooms ? JSON.parse(savedRooms) : [];
  });

  const [activeTab, setActiveTab] = useState('marketplace');
  
  // फार्म स्टेटहरू
  const [editId, setEditId] = useState(null);
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [roomType, setRoomType] = useState('Single');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');

  // फिल्टर स्टेटहरू
  const [searchLocation, setSearchLocation] = useState('');
  const [filterType, setFilterType] = useState('');

  // डाटा लोकल स्टोरेजमा सेभ गर्ने
  useEffect(() => {
    localStorage.setItem('marketplace_rooms', JSON.stringify(rooms));
  }, [rooms]);

  // फोटोलाई Base64 मा रूपान्तरण गर्ने
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // कोठा थप्ने वा अपडेट गर्ने
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location || !budget || !phone) return;

    if (editId) {
      // एडिट गर्ने (Update)
      setRooms(rooms.map(room => 
        room.id === editId 
          ? { ...room, location, budget, type: roomType, phone, photo: photo || room.photo } 
          : room
      ));
      setEditId(null);
    } else {
      // नयाँ थप्ने (Create)
      const newRoom = {
        id: Date.now(),
        location,
        budget,
        type: roomType,
        phone,
        photo: photo || 'https://via.placeholder.com/400x250?text=No+Image'
      };
      setRooms([...rooms, newRoom]);
    }

    resetForm();
    alert('सफलतापूर्वक सेभ भयो!');
  };

  // फारम रिसेट गर्ने
  const resetForm = () => {
    setLocation('');
    setBudget('');
    setRoomType('Single');
    setPhone('');
    setPhoto('');
    setEditId(null);
  };

  // एडिट गर्नको लागि डाटा फारममा लोड गर्ने
  const handleEdit = (room) => {
    setEditId(room.id);
    setLocation(room.location);
    setBudget(room.budget);
    setRoomType(room.type);
    setPhone(room.phone);
    setPhoto(room.photo);
    setActiveTab('admin');
  };

  // कोठा डिलिट गर्ने
  const handleDelete = (id) => {
    if (window.confirm('के तपाइँ यो कोठा डिलिट गर्न चाहनुहुन्छ?')) {
      setRooms(rooms.filter(room => room.id !== id));
    }
  };

  // फिल्टर गरिएको कोठाहरू
  const filteredRooms = rooms.filter(room => {
    const matchLocation = room.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchType = filterType === '' || room.type === filterType;
    return matchLocation && matchType;
  });

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      {/* नेभिगेसन बार */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏡 रुम फाइन्डर मार्केटप्लेस (React)</h1>
          <div>
            <button 
              onClick={() => setActiveTab('marketplace')} 
              className={`px-4 py-2 rounded mr-2 font-semibold transition ${activeTab === 'marketplace' ? 'bg-blue-700' : 'bg-blue-500'}`}
            >
              मार्केटप्लेस
            </button>
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`px-4 py-2 rounded font-semibold transition ${activeTab === 'admin' ? 'bg-blue-700' : 'bg-blue-500'}`}
            >
              एडमिन पोर्टल
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* ================= MARKETPLACE SECTION ================= */}
        {activeTab === 'marketplace' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-700">उपलब्ध कोठाहरू</h2>
            
            {/* फिल्टर बक्स */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center">
              <input 
                type="text" 
                placeholder="स्थानद्वारा खोज्नुहोस्..." 
                value={searchLocation} 
                onChange={(e) => setSearchLocation(e.target.value)}
                className="border p-2 rounded flex-1 min-w-[200px]" 
              />
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">सबै प्रकार (Types)</option>
                <option value="Single">Single Room</option>
                <option value="1BHK">1BHK</option>
                <option value="Flat">Flat</option>
              </select>
            </div>

            {/* कोठा सूची ग्रिड */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.length === 0 ? (
                <p className="text-gray-500 col-span-full">कुनै कोठा उपलब्ध छैन।</p>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 flex flex-col justify-between">
                    <img src={room.photo} alt="Room" className="w-full h-48 object-cover" />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold">{room.type}</span>
                        <h3 className="text-lg font-bold mt-2 text-gray-800">{room.location}</h3>
                        <p className="text-green-600 font-bold text-xl mt-1">रु. {room.budget} / महिना</p>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-sm text-gray-600">सम्पर्क: <strong>{room.phone}</strong></span>
                        <a href={`tel:${room.phone}`} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700">कल गर्नुहोस्</a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= ADMIN PORTAL SECTION ================= */}
        {activeTab === 'admin' && (
          <div>
            <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-700">
                {editId ? 'कोठा सम्पादन गर्नुहोस् (Edit Room)' : 'नयाँ कोठा थप्नुहोस् (Admin Portal)'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1">स्थान (Exact Location):</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    required 
                    className="w-full border p-2 rounded" 
                    placeholder="जस्तै: नयाँबजार, पोखरा" 
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">मासिक भाडा (Budget/Price - रू):</label>
                  <input 
                    type="number" 
                    value={budget} 
                    onChange={(e) => setBudget(e.target.value)} 
                    required 
                    className="w-full border p-2 rounded" 
                    placeholder="जस्तै: 8500" 
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">कोठाको प्रकार (Type):</label>
                  <select 
                    value={roomType} 
                    onChange={(e) => setRoomType(e.target.value)} 
                    className="w-full border p-2 rounded"
                  >
                    <option value="Single">Single Room</option>
                    <option value="1BHK">1BHK</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">सम्पर्क नम्बर (Phone Number):</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                    className="w-full border p-2 rounded" 
                    placeholder="जस्तै: 9812345678" 
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">कोठाको फोटो (Photo):</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="w-full border p-2 rounded" 
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    className={`text-white px-6 py-2 rounded font-semibold transition ${editId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {editId ? 'अपडेट गर्नुहोस्' : 'कोठा थप्नुहोस्'}
                  </button>
                  {editId && (
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      className="bg-gray-400 text-white px-6 py-2 rounded font-semibold hover:bg-gray-500 transition"
                    >
                      रद्द गर्नुहोस्
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* एडमिन टेबल */}
            <div className="mt-8 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4 text-gray-700">सुचीकृत कोठाहरू व्यवस्थापन गर्नुहोस्</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">फोटो</th>
                      <th className="border border-gray-300 p-2">स्थान</th>
                      <th className="border border-gray-300 p-2">भाडा</th>
                      <th className="border border-gray-300 p-2">प्रकार</th>
                      <th className="border border-gray-300 p-2">सम्पर्क</th>
                      <th className="border border-gray-300 p-2">कार्य</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500">कुनै डाटा छैन।</td>
                      </tr>
                    ) : (
                      rooms.map(room => (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-center">
                            <img src={room.photo} alt="Room" className="w-16 h-12 object-cover mx-auto rounded" />
                          </td>
                          <td className="border border-gray-300 p-2">{room.location}</td>
                          <td className="border border-gray-300 p-2">रु. {room.budget}</td>
                          <td className="border border-gray-300 p-2">{room.type}</td>
                          <td className="border border-gray-300 p-2">{room.phone}</td>
                          <td className="border border-gray-300 p-2 text-center space-x-2">
                            <button 
                              onClick={() => handleEdit(room)} 
                              className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                            >
                              सम्पादन
                            </button>
                            <button 
                              onClick={() => handleDelete(room.id)} 
                              className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            >
                              डिलिट
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
