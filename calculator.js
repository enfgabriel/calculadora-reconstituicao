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

export function calculateWeightDose({ prescribedMgKg, weightKg, availableMg, availableVolumeMl, maxDoseMg = null, regimen = 'single', dosesPerDay = 1 }) {
  if (!finite(prescribedMgKg, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_number' };
  if (!positive(prescribedMgKg, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_range' };
  const divisions = Number(dosesPerDay);
  if (regimen === 'daily' && (!Number.isFinite(divisions) || divisions <= 0)) return { ok: false, code: 'invalid_range' };
  const dailyDoseMg = prescribedMgKg * weightKg;
  const doseMg = regimen === 'daily' ? dailyDoseMg / divisions : dailyDoseMg;
  const concentrationMgMl = availableMg / availableVolumeMl;
  const volumeMl = doseMg / concentrationMgMl;
  const warnings = [];
  if (maxDoseMg !== null && Number.isFinite(maxDoseMg) && maxDoseMg > 0 && doseMg > maxDoseMg) warnings.push('exceeds_max_dose');
  if (volumeMl > 0 && volumeMl < 0.1) warnings.push('very_small_volume');
  return { ok: true, regimen, doseMg, dailyDoseMg, dosesPerDay: regimen === 'daily' ? divisions : 1, concentrationMgMl, volumeMl, warnings };
}

export function calculateWeightInfusion({ prescribedMcgKgMin, weightKg, availableMg, availableVolumeMl }) {
  if (!finite(prescribedMcgKgMin, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_number' };
  if (!positive(prescribedMcgKgMin, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_range' };
  const doseMcgMin = prescribedMcgKgMin * weightKg;
  const doseMgHour = doseMcgMin * 60 / 1000;
  const concentrationMgMl = availableMg / availableVolumeMl;
  const mlHour = doseMgHour / concentrationMgMl;
  const warnings = [];
  if (mlHour > 0 && mlHour < 0.1) warnings.push('very_low_rate');
  return { ok: true, doseMcgMin, doseMgHour, concentrationMgMl, mlHour, warnings };
}

export function calculateOxygenDuration({ pressureBar, reserveBar, cylinderWaterVolumeL, flowLMin, plannedMinutes = null, safetyMarginPercent = 0 }) {
  if (!finite(pressureBar, reserveBar, cylinderWaterVolumeL, flowLMin)) return { ok: false, code: 'invalid_number' };
  if (!positive(pressureBar, cylinderWaterVolumeL, flowLMin) || reserveBar < 0 || reserveBar >= pressureBar) return { ok: false, code: 'invalid_range' };
  const plan = Number(plannedMinutes);
  const margin = Number(safetyMarginPercent);
  if (plannedMinutes !== null && plannedMinutes !== '' && (!Number.isFinite(plan) || plan < 0)) return { ok: false, code: 'invalid_range' };
  if (!Number.isFinite(margin) || margin < 0) return { ok: false, code: 'invalid_range' };
  const usablePressureBar = pressureBar - reserveBar;
  const usableOxygenL = usablePressureBar * cylinderWaterVolumeL;
  const totalMinutes = usableOxygenL / flowLMin;
  const requiredMinutes = Number.isFinite(plan) && plan > 0 ? plan * (1 + margin / 100) : null;
  const requiredOxygenL = requiredMinutes === null ? null : requiredMinutes * flowLMin;
  const remainingAfterPlanMinutes = requiredMinutes === null ? null : totalMinutes - requiredMinutes;
  const warnings = [];
  if (totalMinutes < 30) warnings.push('critical_duration');
  else if (totalMinutes < 60) warnings.push('short_duration');
  if (requiredMinutes !== null && remainingAfterPlanMinutes < 0) warnings.push('insufficient_for_plan');
  return { ok: true, usablePressureBar, usableOxygenL, totalMinutes, wholeHours: Math.floor(totalMinutes / 60), remainingMinutes: Math.floor(totalMinutes % 60), plannedMinutes: Number.isFinite(plan) ? plan : null, safetyMarginPercent: margin, requiredMinutes, requiredOxygenL, remainingAfterPlanMinutes, warnings };
}

export function calculateCompoundReconstitution({ vialMg, diluentMl, prescribedMg }) {
  if (!finite(vialMg, diluentMl, prescribedMg)) return { ok: false, code: 'invalid_number' };
  if (!positive(vialMg, diluentMl) || prescribedMg < 0) return { ok: false, code: 'invalid_range' };
  const concentrationMgMl = vialMg / diluentMl;
  const volumeMl = prescribedMg / concentrationMgMl;
  const vialPercent = vialMg > 0 ? prescribedMg / vialMg * 100 : 0;
  const warnings = [];
  if (prescribedMg > vialMg) warnings.push('dose_exceeds_vial');
  if (volumeMl > 0 && volumeMl < 0.01) warnings.push('very_small_volume');
  return { ok: true, concentrationMgMl, volumeMl, vialPercent, warnings };
}

export function formatPt(value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits }).format(value);
}
