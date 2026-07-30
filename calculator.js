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

export function calculateCompoundLiquid({
  mode,
  amount,
  dropsPerMl = null,
  targetComponentIndex = 0,
  preparation = 'direct',
  sourceVolumeMl = null,
  finalVolumeMl = null,
  components = []
}) {
  const diluted = preparation === 'diluted';
  const sourceVolume = Number(sourceVolumeMl);
  const finalVolume = Number(finalVolumeMl);
  if (diluted && (!finite(sourceVolume, finalVolume) || sourceVolume <= 0 || finalVolume <= 0 || finalVolume < sourceVolume)) {
    return { ok: false, code: 'invalid_dilution' };
  }
  const dilutionFactor = diluted ? sourceVolume / finalVolume : 1;
  const activeComponents = components
    .map((component, index) => {
      const originalConcentrationPerMl = Number(component.concentrationPerMl ?? component.concentrationMgMl);
      const concentrationPerMl = originalConcentrationPerMl * dilutionFactor;
      return {
        ...component,
        index,
        unit: component.unit || 'mg',
        originalConcentrationPerMl,
        concentrationPerMl,
        concentrationMgMl: concentrationPerMl
      };
    })
    .filter(component => component.name && Number.isFinite(component.concentrationPerMl) && component.concentrationPerMl > 0);
  if (!finite(amount) || amount <= 0 || activeComponents.length === 0) return { ok: false, code: 'invalid_range' };
  if ((mode === 'drops' || mode === 'target') && (!Number.isFinite(dropsPerMl) || dropsPerMl <= 0)) return { ok: false, code: 'invalid_range' };

  let volumeMl = amount;
  if (mode === 'drops') volumeMl = amount / dropsPerMl;
  if (mode === 'target') {
    const target = activeComponents.find(component => component.index === targetComponentIndex) || activeComponents[0];
    volumeMl = amount / target.concentrationPerMl;
  }
  if (!Number.isFinite(volumeMl) || volumeMl <= 0) return { ok: false, code: 'invalid_range' };

  const drops = Number.isFinite(dropsPerMl) && dropsPerMl > 0 ? volumeMl * dropsPerMl : null;
  const delivered = activeComponents.map(component => ({
    name: component.name,
    unit: component.unit,
    originalConcentrationPerMl: component.originalConcentrationPerMl,
    concentrationPerMl: component.concentrationPerMl,
    concentrationMgMl: component.concentrationPerMl,
    dose: component.concentrationPerMl * volumeMl,
    doseMg: component.concentrationPerMl * volumeMl
  }));
  return {
    ok: true,
    mode,
    preparation: diluted ? 'diluted' : 'direct',
    dilutionFactor,
    sourceVolumeMl: diluted ? sourceVolume : null,
    finalVolumeMl: diluted ? finalVolume : null,
    volumeMl,
    drops,
    delivered
  };
}

export function formatPt(value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits }).format(value);
}
