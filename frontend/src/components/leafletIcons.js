import L from "leaflet";

export function bankIcon() {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    html: `<div style="width:28px;height:36px;display:flex;align-items:flex-end;justify-content:center"><svg viewBox="0 0 28 36" width="28" height="36"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="#dc2626"/><circle cx="14" cy="13" r="6" fill="#fff" opacity="0.9"/><text x="14" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#dc2626">B</text></svg></div>`,
  });
}

export function donorIcon() {
  return L.divIcon({
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
    html: `<div style="width:24px;height:32px;display:flex;align-items:flex-end;justify-content:center"><svg viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="#2563eb"/><circle cx="12" cy="11" r="5" fill="#fff" opacity="0.9"/><text x="12" y="14" text-anchor="middle" font-size="8" font-weight="700" fill="#2563eb">D</text></svg></div>`,
  });
}

export function driveIcon() {
  return L.divIcon({
    className: "",
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -34],
    html: `<div style="width:26px;height:34px;display:flex;align-items:flex-end;justify-content:center"><svg viewBox="0 0 26 34" width="26" height="34"><path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.82 20.18 0 13 0z" fill="#16a34a"/><circle cx="13" cy="12" r="5.5" fill="#fff" opacity="0.9"/><text x="13" y="15" text-anchor="middle" font-size="8" font-weight="700" fill="#16a34a">\u2665</text></svg></div>`,
  });
}