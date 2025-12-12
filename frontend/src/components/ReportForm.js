import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { uploadReport } from "../services/reportService";

export default function ReportForm({ onUpload }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await uploadReport(file, notes, user.id);
      setFile(null);
      setNotes("");
      if (onUpload) onUpload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={e => setFile(e.target.files[0])} required />
      <textarea
        placeholder="Notlar"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <button type="submit">Rapor Yükle</button>
      {error && <div>{error}</div>}
    </form>
  );
} 