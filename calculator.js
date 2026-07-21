const finite = (...values) => values.every(Number.isFinite);
const positive = (...values) => values.every(value => value > 0);
const onIncrement = (value, increment) => Math.abs(value / increment - Math.round(value / increment)) < 1e-9;

export function calculateReconstitution({ vialMg, finalVolumeMl, doseMg, scalePerMl, syringeCapacity, syringeIncrement }) {
  if (!finite(vialMg, finalVolumeMl, doseMg, scalePerMl, syringeCapacity, syringeIncrement)) return { ok: false, code: 'invalid_number' };
  if (!positive(vialMg, finalVolumeMl, scalePerMl, syringeCapacity, syringeIncrement) || doseMg < 0) return { ok: false, code: 'invalid_range' };

  const concentrationMgMl = vialMg / finalVolumeMl;
  const volumeMl = doseMg / concentrationMgMl;
  const scaleValue = volumeMl * scalePerMl;
  const capacityPercent = scaleValue / syringeCapacity * 100;
  const warnings = [];
  if (doseMg > vialMg) warnings.push('dose_exceeds_vial');
  if (scaleValue > syringeCapacity + 1e-9) warnings.push('exceeds_syringe');
  if (volumeMl > 0 && volumeMl < 0.01) warnings.push('very_small_volume');
  if (doseMg > 0 && !onIncrement(scaleValue, syringeIncrement)) warnings.push('not_measurable');
  return { ok: true, concentrationMgMl, volumeMl, scaleValue, capacityPercent, warnings };
}

// Compatibilidade com a versão anterior.
export function calculateDose({ vialMg, finalVolumeMl, doseMg, syringeCapacityUnits, syringeIncrementUnits }) {
  const result = calculateReconstitution({ vialMg, finalVolumeMl, doseMg, scalePerMl: 100, syringeCapacity: syringeCapacityUnits, syringeIncrement: syringeIncrementUnits });
  return result.ok ? { ...result, syringeUnits: result.scaleValue, measurable: !result.warnings.includes('not_measurable') } : result;
}

export function calculateDrip({ volumeMl, hours, minutes = 0, dropFactor }) {
  if (!finite(volumeMl, hours, minutes, dropFactor)) return { ok: false, code: 'invalid_number' };
  const totalMinutes = hours * 60 + minutes;
  if (!positive(volumeMl, totalMinutes, dropFactor) || hours < 0 || minutes < 0) return { ok: false, code: 'invalid_range' };
  const dropsPerMinuteExact = volumeMl * dropFactor / totalMinutes;
  return {
    ok: true,
    totalMinutes,
    dropsPerMinuteExact,
    dropsPerMinute: Math.round(dropsPerMinuteExact),
    mlPerHour: volumeMl / (totalMinutes / 60)
  };
}

export function calculatePump({ volumeMl, rateMlHour }) {
  if (!finite(volumeMl, rateMlHour)) return { ok: false, code: 'invalid_number' };
  if (!positive(volumeMl, rateMlHour)) return { ok: false, code: 'invalid_range' };
  const durationHours = volumeMl / rateMlHour;
  const totalMinutes = durationHours * 60;
  return { ok: true, durationHours, totalMinutes, wholeHours: Math.floor(totalMinutes / 60), remainingMinutes: Math.round(totalMinutes % 60) };
}

export function calculateWeightDose({ prescribedMgKg, weightKg, availableMg, availableVolumeMl, maxDoseMg = null }) {
  if (!finite(prescribedMgKg, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_number' };
  if (!positive(prescribedMgKg, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_range' };
  const doseMg = prescribedMgKg * weightKg;
  const concentrationMgMl = availableMg / availableVolumeMl;
  const volumeMl = doseMg / concentrationMgMl;
  const warnings = [];
  if (maxDoseMg !== null && Number.isFinite(maxDoseMg) && maxDoseMg > 0 && doseMg > maxDoseMg) warnings.push('exceeds_max_dose');
  return { ok: true, doseMg, concentrationMgMl, volumeMl, warnings };
}

export function calculateOxygenDuration({ pressureBar, reserveBar, cylinderWaterVolumeL, flowLMin }) {
  if (!finite(pressureBar, reserveBar, cylinderWaterVolumeL, flowLMin)) return { ok: false, code: 'invalid_number' };
  if (!positive(pressureBar, cylinderWaterVolumeL, flowLMin) || reserveBar < 0 || reserveBar >= pressureBar) return { ok: false, code: 'invalid_range' };
  const usablePressureBar = pressureBar - reserveBar;
  const usableOxygenL = usablePressureBar * cylinderWaterVolumeL;
  const totalMinutes = usableOxygenL / flowLMin;
  const warnings = [];
  if (totalMinutes < 30) warnings.push('critical_duration');
  else if (totalMinutes < 60) warnings.push('short_duration');
  return { ok: true, usablePressureBar, usableOxygenL, totalMinutes, wholeHours: Math.floor(totalMinutes / 60), remainingMinutes: Math.floor(totalMinutes % 60), warnings };
}

export function formatPt(value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits }).format(value);
}
