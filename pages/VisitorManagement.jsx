import { useState, useEffect, useRef } from "react";
import { FiMenu, FiFilter } from "react-icons/fi";
import { FaSearch, FaPlus } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VisitorManagement() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [addVisitorModal, setAddVisitorModal] = useState(false);
  const navigate = useNavigate();

  const userRole = localStorage.getItem("role");
  const userName = localStorage.getItem("name"); // ✅ moved here

  const [visitors, setVisitors] = useState([]);
  const [newVisitor, setNewVisitor] = useState({
    name: "",
    resident: userName || "", // ✅ autofill resident
    datetime: "",
    purpose: "",
    status: "Pending",
    createdAt: "",
  });

  const qrRef = useRef(null);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/visitors");
        setVisitors(res.data);
      } catch (err) {
        console.error("Failed to load visitors:", err);
      }
    };
    fetchVisitors();
  }, []);

  const filteredVisitors = visitors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openVisitorDetails = (visitor) => setSelectedVisitor(visitor);
  const closeVisitorDetails = () => setSelectedVisitor(null);

  const openAddVisitor = () => {
    setNewVisitor({
      name: "",
      resident: userName || "", // ✅ ensure it's always fetched fresh
      datetime: "",
      purpose: "",
      status: "Pending",
      createdAt: new Date().toISOString(),
    });
    setAddVisitorModal(true);
  };

  const closeAddVisitor = () => setAddVisitorModal(false);

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedVisitor.name}-qr.png`;
      a.click();
    }
  };

  const handleAddVisitor = async () => {
    const { name, resident, datetime, purpose, createdAt } = newVisitor;
    if (name && resident && datetime && purpose) {
      try {
        const response = await axios.post("http://localhost:5000/api/visitors", {
          name, resident, datetime, purpose, createdAt
        });
        setVisitors((prev) => [...prev, response.data]);
        setAddVisitorModal(false);
        setNewVisitor({
          name: "",
          resident: userName || "", // ✅ reapply after reset
          datetime: "",
          purpose: "",
          status: "Pending",
          createdAt: "",
        });
      } catch (err) {
        console.error("Error saving to DB:", err);
        alert("Failed to save visitor to database.");
      }
    } else {
      alert("Please complete all fields!");
    }
  };

  const updateVisitorStatus = async (status) => {
    try {
      const updated = await axios.put(
        `http://localhost:5000/api/visitors/${selectedVisitor._id}/status`,
        { status }
      );
      setVisitors((prev) =>
        prev.map((v) =>
          v._id === selectedVisitor._id ? { ...v, status: updated.data.status } : v
        )
      );
      setSelectedVisitor({ ...selectedVisitor, status: updated.data.status });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const isQRValid = (datetimeStr) => {
    const visitDate = new Date(datetimeStr);
    const expiryDate = new Date(visitDate);
    expiryDate.setDate(visitDate.getDate() + 1);
    return new Date() < expiryDate;
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className={`w-64 bg-white border-r p-4 ${drawerOpen ? "" : "hidden"} md:block`}>
        <h2 className="text-lg font-bold mb-6">Menu</h2>
        <nav className="space-y-2 text-sm font-medium">
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer hover:text-green-600">Dashboard</div>
          <div onClick={() => navigate("/announcements")} className="cursor-pointer hover:text-green-600">Community Announcements</div>
          <div onClick={() => navigate("/flood-tracker")} className="cursor-pointer hover:text-green-600">Flood Tracker</div>
          <div onClick={() => navigate("/incidentreport")} className="cursor-pointer hover:text-green-600">Incident Report</div>
          <a className="block text-green-600 font-bold">Visitor Management</a>

        </nav>
      </div>

      <div className="flex-1 p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-green-600">Visitor Logs Management</h1>
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded overflow-hidden">
              <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1 outline-none" />
              <button className="px-2 bg-black text-white"><FaSearch /></button>
            </div>
            <button className="text-gray-600"><FiFilter size={20} /></button>
            <button onClick={openAddVisitor} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center">
              <FaPlus className="mr-2" /> Add Visitor
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left font-semibold">
              <tr>
                <th className="px-4 py-3">Visitor's Name</th>
                <th className="px-4 py-3">Resident's Name</th>
                <th className="px-4 py-3">Visit Date</th>
                <th className="px-4 py-3">Date Added</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((visitor, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3">{visitor.name}</td>
                  <td className="px-4 py-3">{visitor.resident}</td>
                  <td className="px-4 py-3">{new Date(visitor.datetime).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(visitor.createdAt).toLocaleString()}</td> 
                  <td className="px-4 py-3">{visitor.purpose}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      visitor.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                      visitor.status === "Accepted" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {visitor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openVisitorDetails(visitor)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVisitors.length === 0 && (
                <tr><td colSpan="6" className="text-center text-gray-500 py-4">No visitors found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedVisitor && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white px-6 py-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
              <h2 className="text-2xl font-extrabold text-green-600 mb-4 leading-snug">{selectedVisitor.name}</h2>
              <div className="text-left mb-4 space-y-1">
                <p><strong>Purpose:</strong> {selectedVisitor.purpose}</p>
                <p><strong>Resident:</strong> {selectedVisitor.resident}</p>
                <p><strong>Visit Date:</strong> {new Date(selectedVisitor.datetime).toLocaleString()}</p>
                <p><strong>Added On:</strong> {selectedVisitor.createdAt ? new Date(selectedVisitor.createdAt).toLocaleString() : "Not available"}</p>
                <p><strong>Status:</strong>{" "}
                  <span className={
                    selectedVisitor.status === "Pending" ? "text-yellow-500" :
                    selectedVisitor.status === "Accepted" ? "text-green-600" :
                    "text-red-500"
                  }>{selectedVisitor.status}</span>
                </p>
              </div>

              {selectedVisitor.status === "Pending" && userRole === "official" && (
                <div className="flex justify-center gap-4 mb-4">
                  <button onClick={() => updateVisitorStatus("Accepted")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">Accept</button>
                  <button onClick={() => updateVisitorStatus("Rejected")} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded">Reject</button>
                </div>
              )}

              {selectedVisitor.status === "Accepted" && isQRValid(selectedVisitor.datetime) && (
                <div className="flex flex-col items-center mb-4" ref={qrRef}>
                  <QRCodeCanvas value={JSON.stringify(selectedVisitor)} size={160} level="H" includeMargin />
                  <button onClick={handleDownloadQR} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded">Download QR</button>
                </div>
              )}

              {selectedVisitor.status === "Accepted" && !isQRValid(selectedVisitor.datetime) && (
                <p className="text-red-500 font-medium">QR Code expired after visit date.</p>
              )}

              <button onClick={closeVisitorDetails} className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium px-6 py-2 rounded shadow">Close</button>
            </div>
          </div>
        )}

        {addVisitorModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Visitor</h2>
              <input type="text" placeholder="Visitor's Name" value={newVisitor.name} onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })} className="w-full mb-3 px-3 py-2 border rounded" />
              <div className="w-full mb-3 px-3 py-2 border rounded bg-gray-100 text-gray-700">{newVisitor.resident}</div>
              <input type="text" readOnly value={new Date(newVisitor.createdAt).toLocaleString()} className="w-full mb-3 px-3 py-2 border rounded bg-gray-100 cursor-not-allowed" placeholder="Date Added"/>
              <input type="datetime-local" value={newVisitor.datetime} onChange={(e) => setNewVisitor({ ...newVisitor, datetime: e.target.value })} className="w-full mb-3 px-3 py-2 border rounded" />
              <input type="text" placeholder="Purpose of Visit" value={newVisitor.purpose} onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })} className="w-full mb-3 px-3 py-2 border rounded" />
              
              <div className="flex justify-end space-x-2">
                <button onClick={closeAddVisitor} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded">Cancel</button>
                <button onClick={handleAddVisitor} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
