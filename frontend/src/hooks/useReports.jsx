/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";

export const useReports = () => {
  const [reportesOficina, setReportesOficina] = useState([]);
  const [reportesSemaforo, setReportesSemaforo] = useState([]);

  // Cargar desde localStorage
  useEffect(() => {
    const ofi = JSON.parse(localStorage.getItem("reportes_oficina")) || [];
    const sem = JSON.parse(localStorage.getItem("reportes_semaforo")) || [];
    setReportesOficina(ofi);
    setReportesSemaforo(sem);
  }, []);

  // Guardar cambios
  useEffect(() => {
    localStorage.setItem("reportes_oficina", JSON.stringify(reportesOficina));
  }, [reportesOficina]);

  useEffect(() => {
    localStorage.setItem("reportes_semaforo", JSON.stringify(reportesSemaforo));
  }, [reportesSemaforo]);

  // Agregar
  const agregarOficina = (nuevo) => setReportesOficina(prev => [...prev, nuevo]);
  const agregarSemaforo = (nuevo) => setReportesSemaforo(prev => [...prev, nuevo]);

  // Eliminar
  const eliminarOficina = (id) => setReportesOficina(prev => prev.filter(r => r.id !== id));
  const eliminarSemaforo = (id) => setReportesSemaforo(prev => prev.filter(r => r.id !== id));

  // Cambiar estado
  const cambiarEstadoOficina = (id, estado) => setReportesOficina(prev => prev.map(r => r.id === id ? {...r, estado} : r));
  const cambiarEstadoSemaforo = (id, estado) => setReportesSemaforo(prev => prev.map(r => r.id === id ? {...r, estado} : r));

  return {
    reportesOficina,
    reportesSemaforo,
    agregarOficina,
    agregarSemaforo,
    eliminarOficina,
    eliminarSemaforo,
    cambiarEstadoOficina,
    cambiarEstadoSemaforo
  };
};