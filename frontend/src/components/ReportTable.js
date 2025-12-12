import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button
} from '@mui/material';

export default function ReportTable({ reports, filters, setFilters }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <form style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <TextField
          label="Filter by Date"
          type="date"
          name="date"
          value={filters.date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Çalışana Göre Filtrele"
          name="calisan"
          value={filters.calisan}
          onChange={handleChange}
        />
        <Button
          variant="outlined"
          onClick={() => setFilters({ date: '', calisan: '' })}
        >
          Clear
        </Button>
      </form>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Çalışan</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.calisan}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
} 