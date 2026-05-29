import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import {
  User,
  MapPin,
  Route,
  Loader2,
  ClipboardList,
  Phone,
  Calendar,
} from "lucide-react";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const getMarkerIcon = (status, isUnassigned) => {
  let color = "#3b82f6"; // Default Blue
  if (status === "Positive") color = "#10b981"; // Green
  else if (status === "Needs Revisit") color = "#ef4444"; // Red
  else if (status === "Shop Not Found") color = "#64748b"; // Gray
  else if (status === "Do Not Visit") color = "#78350f"; // Brown
  else if (isUnassigned === 1) color = "#a855f7"; // Purple

  return L.divIcon({
    className: "custom-status-icon",
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const LiveMapModule = () => {
  const [reps, setReps] = useState([]);
  const [selectedRep, setSelectedRep] = useState("all");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [mapData, setMapData] = useState({ targets: [], routes: [] });
  const [repHistory, setRepHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReps = async () => {
      try {
        const res = await axios.get("http://157.230.244.87:5000/api/reps");
        setReps(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchReps();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const mapRes = await axios.get(
          `http://157.230.244.87:5000/api/map-data/${selectedRep}?date=${filterDate}`,
        );
        setMapData(mapRes.data);

        if (selectedRep !== "all") {
          const histRes = await axios.get(
            `http://157.230.244.87:5000/api/reps/${selectedRep}/history?date=${filterDate}`,
          );
          setRepHistory(histRes.data);
        } else {
          setRepHistory([]);
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedRep, filterDate]);

  const mapCenter =
    mapData.targets.length > 0 && mapData.targets[0].latitude
      ? [mapData.targets[0].latitude, mapData.targets[0].longitude]
      : [6.9271, 79.8612];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[calc(100vh-120px)]">
      
      {/* Filter Controls (Responsive Flex) */}
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Live Route & Locations
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          {/* Date Picker Section */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-600 flex items-center shrink-0">
              <Calendar className="w-4 h-4 mr-1" /> Date:
            </label>
            <div className="flex gap-1.5 w-full sm:w-auto items-center">
              <input
                type="date"
                value={filterDate === "all" ? "" : filterDate}
                onChange={(e) => setFilterDate(e.target.value || "all")}
                className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm flex-1 sm:flex-none"
              />
              <button
                onClick={() => setFilterDate("all")}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors border-2 shrink-0 ${filterDate === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-300"></div>

          {/* Rep Selection Section */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-600 flex items-center shrink-0">
              <User className="w-4 h-4 mr-1" /> Rep:
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="border-2 border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer w-full sm:w-auto"
            >
              <option value="all">🌐 All Reps & Locations</option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.first_name} {rep.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Loader State */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center h-40">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          
          {/* MAPS SECTION */}
          <div className={`grid grid-cols-1 ${selectedRep === "all" ? "lg:grid-cols-1" : "lg:grid-cols-2"} gap-6`}>
            
            {/* Map 1: Targets */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[320px] sm:h-[400px]">
              <div className="bg-[#0A192F] text-white p-3 flex justify-between items-center text-sm sm:text-base">
                <span className="font-semibold flex items-center truncate mr-2">
                  <MapPin className="w-4 h-4 mr-2 text-blue-400 shrink-0" />{" "}
                  {selectedRep === "all"
                    ? "All Registered Locations in DB"
                    : "Assigned/Visited Targets"}
                </span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full shrink-0">
                  {mapData.targets.length} Locs
                </span>
              </div>
              <div className="flex-1 z-0">
                <MapContainer
                  key={`target-${selectedRep}-${filterDate}-${mapData.targets.length}`}
                  center={mapCenter}
                  zoom={selectedRep === "all" ? 8 : 12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  {mapData.targets.map(
                    (loc) =>
                      loc.latitude &&
                      loc.longitude && (
                        <Marker
                          key={`target-${loc.id || loc.name}`}
                          position={[loc.latitude, loc.longitude]}
                          icon={getMarkerIcon(
                            loc.latest_status,
                            loc.is_unassigned,
                          )}
                        >
                          <Popup>
                            <div className="text-sm">
                              <strong className="block text-base mb-1">
                                {loc.name}
                              </strong>
                              {loc.contact && (
                                <span className="text-slate-600 block">
                                  📞 {loc.contact}
                                </span>
                              )}
                              {loc.assigned_date && (
                                <span className="text-slate-500 text-xs block mt-1">
                                  Assigned: {loc.assigned_date}
                                </span>
                              )}
                              {loc.latest_status && (
                                <span className="mt-2 block font-bold text-xs px-2 py-1 bg-slate-100 rounded inline-block">
                                  {loc.latest_status}
                                </span>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      ),
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Map 2: Actual Route */}
            {selectedRep !== "all" && (
              <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[320px] sm:h-[400px]">
                <div className="bg-slate-100 text-slate-800 border-b border-slate-200 p-3 flex justify-between items-center text-sm sm:text-base">
                  <span className="font-semibold flex items-center">
                    <Route className="w-4 h-4 mr-2 text-green-600 shrink-0" /> Actual Travel Route
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full max-w-[150px] truncate">
                    {filterDate === "all" ? "All Time" : filterDate}
                  </span>
                </div>
                <div className="flex-1 z-0">
                  {!mapData.routes || mapData.routes.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-slate-400 bg-slate-50">
                      <Route className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">No tracking data for this selection.</p>
                    </div>
                  ) : (
                    <MapContainer
                      key={`route-${selectedRep}-${filterDate}`}
                      center={mapCenter}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                      {mapData.routes.map((r, index) => (
                        <Polyline
                          key={`path-${index}`}
                          positions={r.path}
                          pathOptions={{
                            color: r.isToday ? "#16a34a" : "#94a3b8",
                            weight: r.isToday ? 5 : 3,
                            opacity: r.isToday ? 0.9 : 0.4,
                            dashArray: r.isToday ? null : "5, 5",
                          }}
                          eventHandlers={{
                            click: (e) => {
                              L.popup()
                                .setLatLng(e.latlng)
                                .setContent(
                                  `
                                    <div style="font-family: sans-serif; padding: 5px;">
                                      <strong style="color: ${r.isToday ? "#16a34a" : "#64748b"}">
                                        📅 Date: ${r.date}
                                      </strong>
                                      <br/>
                                      <span style="font-size: 12px;">Rep traveled here on this date.</span>
                                    </div>
                                  `,
                                )
                                .openOn(e.target._map);
                            },
                          }}
                        />
                      ))}
                    </MapContainer>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FULL STATUS REPORT SECTION */}
          {selectedRep !== "all" && repHistory.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#0A192F] text-white p-4 flex justify-between items-center">
                <span className="font-semibold flex items-center text-base sm:text-lg">
                  <ClipboardList className="w-5 h-5 mr-2 text-blue-400" /> Full Status Report
                </span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                  {repHistory.length} Locations
                </span>
              </div>

              {/* DESKTOP TABLE VIEW (Visible on tablet & desktop) */}
              <div className="hidden md:block overflow-x-auto bg-white">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-4 font-semibold w-1/3">Location Info & Assigned Date</th>
                      <th className="p-4 font-semibold w-1/4">Status & Action</th>
                      <th className="p-4 font-semibold">Latest Visit Details & Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repHistory.map((row) => {
                      const latestLog = row.logs.length > 0 ? row.logs[0] : null;

                      return (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 align-top">
                            <div className="flex items-start">
                              <MapPin className={`w-5 h-5 mt-0.5 mr-2 ${row.is_unassigned ? "text-purple-500" : "text-blue-500"}`} />
                              <div>
                                <strong className="block text-slate-800 text-base">{row.location_name}</strong>
                                <span className="text-xs text-slate-500 block mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded">
                                  Assigned On: {row.assigned_date}
                                </span>
                                {row.is_unassigned === 1 && (
                                  <span className="block mt-2 text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200 max-w-max">
                                    Spontaneous Visit
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 align-top">
                            {latestLog ? (
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                                latestLog.status === "Positive" ? "bg-green-50 text-green-700 border-green-200" : 
                                latestLog.status === "Needs Revisit" ? "bg-red-50 text-red-700 border-red-200" : 
                                latestLog.status === "Shop Not Found" ? "bg-slate-100 text-slate-700 border-slate-300" : 
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {latestLog.status}
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="p-4 align-top">
                            {latestLog ? (
                              <div className="space-y-1">
                                <div className="font-bold text-slate-800 text-sm">👤 {latestLog.met_person}</div>
                                <div className="text-xs font-semibold text-blue-600 flex items-center mt-1">
                                  <Calendar className="w-3 h-3 mr-1" /> Visited On: {new Date(latestLog.created_at).toLocaleString()}
                                </div>
                                {latestLog.contact_number && (
                                  <div className="text-xs text-slate-500 flex items-center mt-1">
                                    <Phone className="w-3 h-3 mr-1" /> {latestLog.contact_number}
                                  </div>
                                )}
                                {latestLog.notes && (
                                  <div className="text-xs text-slate-600 italic bg-slate-50 p-2 mt-2 rounded border border-slate-100">
                                    "{latestLog.notes}"
                                  </div>
                                )}
                                {latestLog.log_lat && latestLog.log_lng && (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <a
                                      href={`https://www.google.com/maps?q=${latestLog.log_lat},${latestLog.log_lng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                    >
                                      📍 View Submitted GPS
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No details recorded yet.</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW (Visible only on mobile screens) */}
              <div className="block md:hidden bg-slate-50 p-3 space-y-4">
                {repHistory.map((row) => {
                  const latestLog = row.logs.length > 0 ? row.logs[0] : null;

                  return (
                    <div key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                      {/* Top Header Card Info */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start">
                          <MapPin className={`w-5 h-5 mt-0.5 mr-2 shrink-0 ${row.is_unassigned ? "text-purple-500" : "text-blue-500"}`} />
                          <div>
                            <h4 className="font-bold text-slate-800 text-base leading-snug">{row.location_name}</h4>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Assigned: {row.assigned_date}</span>
                          </div>
                        </div>
                        {/* Status Badge */}
                        <div className="shrink-0">
                          {latestLog ? (
                            <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                              latestLog.status === "Positive" ? "bg-green-50 text-green-700 border-green-200" : 
                              latestLog.status === "Needs Revisit" ? "bg-red-50 text-red-700 border-red-200" : 
                              latestLog.status === "Shop Not Found" ? "bg-slate-100 text-slate-700 border-slate-300" : 
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {latestLog.status}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Spontaneous Tag */}
                      {row.is_unassigned === 1 && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200 self-start">
                          Spontaneous Visit
                        </span>
                      )}

                      {/* Log details wrapper */}
                      {latestLog ? (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 space-y-1.5 mt-1">
                          <div className="font-bold text-slate-800 text-sm">👤 Met: {latestLog.met_person}</div>
                          <div className="text-blue-600 font-medium flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(latestLog.created_at).toLocaleString()}
                          </div>
                          {latestLog.contact_number && (
                            <div className="flex items-center text-slate-500">
                              <Phone className="w-3.5 h-3.5 mr-1" /> {latestLog.contact_number}
                            </div>
                          )}
                          {latestLog.notes && (
                            <div className="text-slate-600 bg-white border border-slate-200/60 p-2 rounded italic mt-1">
                              "{latestLog.notes}"
                            </div>
                          )}
                          {latestLog.log_lat && latestLog.log_lng && (
                            <div className="pt-2">
                              <a
                                href={`https://www.google.com/maps?q=${latestLog.log_lat},${latestLog.log_lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full text-center block font-semibold bg-blue-50 text-blue-600 px-2 py-2 rounded border border-blue-100 transition-colors"
                              >
                                📍 Open in Google Maps
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-2 border-t border-slate-100">No details recorded yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMapModule;